import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanLabelSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/labels - List labels for workgroup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workgroupId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile and check membership
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isVorstand = profile.role === 'vorstand'

  if (!isVorstand) {
    const { data: membership } = await supabase
      .from('workgroup_members')
      .select('id')
      .eq('workgroup_id', workgroupId)
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  const { data: labels, error } = await supabase
    .from('kanban_labels')
    .select('*')
    .eq('workgroup_id', workgroupId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ labels })
}

// POST /api/workgroups/[id]/kanban/labels - Create label (Vorstand only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workgroupId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check Vorstand role
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Check workgroup exists
  const { data: workgroup } = await supabase
    .from('workgroups')
    .select('id, status')
    .eq('id', workgroupId)
    .single()

  if (!workgroup) {
    return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
  }

  if (workgroup.status === 'archived') {
    return NextResponse.json({ error: 'Workgroup is archived' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanLabelSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { data: label, error: insertError } = await supabase
    .from('kanban_labels')
    .insert({
      workgroup_id: workgroupId,
      name: validation.data.name,
      color: validation.data.color,
    })
    .select()
    .single()

  if (insertError) {
    // Check for unique constraint violation
    if (insertError.code === '23505') {
      return NextResponse.json({
        error: 'Ein Label mit diesem Namen existiert bereits'
      }, { status: 400 })
    }
    console.error('Error creating label:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ label }, { status: 201 })
}
