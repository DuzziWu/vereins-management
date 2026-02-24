import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { workgroupPatchSchema } from '@/lib/validations/workgroups'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/workgroups/[id] - Get a single workgroup with members
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Fetch workgroup with category and creator
  const { data: workgroup, error } = await supabase
    .from('workgroups')
    .select(`
      *,
      category:workgroup_categories(id, name),
      created_by_profile:profiles!workgroups_created_by_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  const isVorstand = currentProfile?.role === 'vorstand'

  // Fetch all members
  const { data: members } = await supabase
    .from('workgroup_members')
    .select(`
      id,
      joined_at,
      profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name, role)
    `)
    .eq('workgroup_id', id)
    .order('joined_at', { ascending: true })

  return NextResponse.json({
    workgroup: {
      ...workgroup,
      member_count: members?.length ?? 0,
      members: members?.map(m => ({
        profile_id: m.profile?.id,
        first_name: m.profile?.first_name,
        last_name: m.profile?.last_name,
        role: m.profile?.role,
        joined_at: m.joined_at,
      })) ?? [],
    },
    is_vorstand: isVorstand,
    current_user_id: currentProfile?.id || "",
  })
}

// PATCH /api/workgroups/[id] - Update a workgroup (Vorstand only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = workgroupPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Build update object
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.category_id !== undefined) updateData.category_id = data.category_id
  if (data.status !== undefined) {
    updateData.status = data.status
    // Set archived_at when archiving
    if (data.status === 'archived') {
      updateData.archived_at = new Date().toISOString()
    } else {
      updateData.archived_at = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Update workgroup
  const { data: workgroup, error: updateError } = await supabase
    .from('workgroups')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:workgroup_categories(id, name),
      created_by_profile:profiles!workgroups_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error updating workgroup:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fetch member count
  const { count: memberCount } = await supabase
    .from('workgroup_members')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', id)

  return NextResponse.json({
    workgroup: {
      ...workgroup,
      member_count: memberCount || 0,
    }
  })
}

// DELETE /api/workgroups/[id] - Hard delete a workgroup (Vorstand only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Check if workgroup exists
  const { data: existingWorkgroup, error: fetchError } = await supabase
    .from('workgroups')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Delete workgroup (CASCADE will delete members)
  const { error: deleteError } = await supabase
    .from('workgroups')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting workgroup:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
