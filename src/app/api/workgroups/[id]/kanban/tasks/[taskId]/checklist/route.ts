import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanChecklistItemSchema, kanbanChecklistReorderSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/tasks/[taskId]/checklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: items, error } = await supabase
    .from('kanban_checklist_items')
    .select(`
      *,
      completer:profiles!kanban_checklist_items_completed_by_fkey(id, first_name, last_name)
    `)
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedItems = (items || []).map(item => ({
    ...item,
    completer_name: item.completer
      ? `${item.completer.first_name} ${item.completer.last_name}`
      : null,
  }))

  return NextResponse.json({ items: formattedItems })
}

// POST /api/workgroups/[id]/kanban/tasks/[taskId]/checklist - Add item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: workgroupId, taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isVorstand = profile.role === 'vorstand'

  // Check membership
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

  // Verify task belongs to workgroup
  const { data: task } = await supabase
    .from('kanban_tasks')
    .select(`
      id,
      column:kanban_columns!kanban_tasks_column_id_fkey(workgroup_id)
    `)
    .eq('id', taskId)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskColumn = task.column as any
  if (!taskColumn || taskColumn.workgroup_id !== workgroupId) {
    return NextResponse.json({ error: 'Task not found in this workgroup' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanChecklistItemSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from('kanban_checklist_items')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newSortOrder = (maxSort?.sort_order ?? -1) + 1

  const { data: item, error: insertError } = await supabase
    .from('kanban_checklist_items')
    .insert({
      task_id: taskId,
      text: validation.data.text,
      sort_order: newSortOrder,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating checklist item:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}

// PATCH /api/workgroups/[id]/kanban/tasks/[taskId]/checklist - Reorder items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: workgroupId, taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isVorstand = profile.role === 'vorstand'

  // Check membership
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

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanChecklistReorderSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { item_ids } = validation.data

  // Verify all items belong to this task
  const { data: items } = await supabase
    .from('kanban_checklist_items')
    .select('id')
    .eq('task_id', taskId)
    .in('id', item_ids)

  if (!items || items.length !== item_ids.length) {
    return NextResponse.json({ error: 'Invalid item IDs' }, { status: 400 })
  }

  // Update sort_order for each item
  const updates = item_ids.map((id, index) =>
    supabase
      .from('kanban_checklist_items')
      .update({ sort_order: index })
      .eq('id', id)
  )

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}
