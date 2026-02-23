import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanColumnSchema, kanbanColumnReorderSchema } from '@/lib/validations/kanban'

const MAX_COLUMNS = 10

// GET /api/workgroups/[id]/kanban/columns - List columns
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

  const { data: columns, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('workgroup_id', workgroupId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching columns:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ columns })
}

// POST /api/workgroups/[id]/kanban/columns - Create column (Vorstand only)
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

  // Check column limit
  const { count: columnCount } = await supabase
    .from('kanban_columns')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', workgroupId)

  if ((columnCount || 0) >= MAX_COLUMNS) {
    return NextResponse.json({ error: `Maximal ${MAX_COLUMNS} Spalten erlaubt` }, { status: 400 })
  }

  // Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanColumnSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from('kanban_columns')
    .select('sort_order')
    .eq('workgroup_id', workgroupId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newSortOrder = (maxSort?.sort_order ?? -1) + 1

  const { data: column, error: insertError } = await supabase
    .from('kanban_columns')
    .insert({
      workgroup_id: workgroupId,
      name: validation.data.name,
      color: validation.data.color || null,
      sort_order: newSortOrder,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating column:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ column }, { status: 201 })
}

// PATCH /api/workgroups/[id]/kanban/columns - Reorder columns (Vorstand only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workgroupId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanColumnReorderSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { column_ids } = validation.data

  // Verify all columns belong to this workgroup
  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('workgroup_id', workgroupId)
    .in('id', column_ids)

  if (!columns || columns.length !== column_ids.length) {
    return NextResponse.json({ error: 'Invalid column IDs' }, { status: 400 })
  }

  // Update sort_order for each column
  const updates = column_ids.map((id, index) =>
    supabase
      .from('kanban_columns')
      .update({ sort_order: index })
      .eq('id', id)
  )

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}
