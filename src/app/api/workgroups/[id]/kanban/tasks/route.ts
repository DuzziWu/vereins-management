import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanTaskSchema, kanbanFilterSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/tasks - List tasks with filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workgroupId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Parse filters
  const filters = kanbanFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    assignee_id: searchParams.get('assignee_id') || undefined,
    label_id: searchParams.get('label_id') || undefined,
    priority: searchParams.get('priority') || undefined,
    only_mine: searchParams.get('only_mine') === 'true',
    overdue: searchParams.get('overdue') === 'true',
  })

  // Get columns for this workgroup first
  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('workgroup_id', workgroupId)

  if (!columns || columns.length === 0) {
    return NextResponse.json({ tasks: [] })
  }

  const columnIds = columns.map(c => c.id)

  // Build query
  let query = supabase
    .from('kanban_tasks')
    .select(`
      *,
      creator:profiles!kanban_tasks_created_by_fkey(id, first_name, last_name)
    `)
    .in('column_id', columnIds)

  // Apply filters
  if (filters.success) {
    const f = filters.data

    if (f.search) {
      query = query.ilike('title', `%${f.search}%`)
    }

    if (f.priority) {
      query = query.eq('priority', f.priority)
    }

    if (f.overdue) {
      query = query.lt('deadline', new Date().toISOString())
    }
  }

  query = query.order('sort_order', { ascending: true })

  const { data: tasks, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let filteredTasks = tasks || []

  // Filter by assignee or only_mine (requires join)
  if (filters.success && (filters.data.assignee_id || filters.data.only_mine)) {
    const targetProfileId = filters.data.only_mine ? profile.id : filters.data.assignee_id

    if (targetProfileId) {
      const { data: assignedTasks } = await supabase
        .from('kanban_task_assignees')
        .select('task_id')
        .eq('profile_id', targetProfileId)
        .in('task_id', filteredTasks.map(t => t.id))

      const assignedTaskIds = new Set((assignedTasks || []).map(a => a.task_id))
      filteredTasks = filteredTasks.filter(t => assignedTaskIds.has(t.id))
    }
  }

  // Filter by label (requires join)
  if (filters.success && filters.data.label_id) {
    const { data: labeledTasks } = await supabase
      .from('kanban_task_label_assignments')
      .select('task_id')
      .eq('label_id', filters.data.label_id)
      .in('task_id', filteredTasks.map(t => t.id))

    const labeledTaskIds = new Set((labeledTasks || []).map(l => l.task_id))
    filteredTasks = filteredTasks.filter(t => labeledTaskIds.has(t.id))
  }

  return NextResponse.json({ tasks: filteredTasks })
}

// POST /api/workgroups/[id]/kanban/tasks - Create task
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

  const validation = kanbanTaskSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Verify column belongs to workgroup
  const { data: column } = await supabase
    .from('kanban_columns')
    .select('id, workgroup_id')
    .eq('id', data.column_id)
    .eq('workgroup_id', workgroupId)
    .single()

  if (!column) {
    return NextResponse.json({ error: 'Column not found in this workgroup' }, { status: 400 })
  }

  // Get max sort_order in column
  const { data: maxSort } = await supabase
    .from('kanban_tasks')
    .select('sort_order')
    .eq('column_id', data.column_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newSortOrder = (maxSort?.sort_order ?? -1) + 1

  // Insert task
  const { data: task, error: insertError } = await supabase
    .from('kanban_tasks')
    .insert({
      column_id: data.column_id,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      deadline: data.deadline || null,
      sort_order: newSortOrder,
      created_by: profile.id,
    })
    .select(`
      *,
      creator:profiles!kanban_tasks_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating task:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Add assignees if provided
  if (data.assignee_ids && data.assignee_ids.length > 0) {
    const assigneeRows = data.assignee_ids.map(profileId => ({
      task_id: task.id,
      profile_id: profileId,
    }))

    await supabase
      .from('kanban_task_assignees')
      .insert(assigneeRows)
  }

  // Add labels if provided
  if (data.label_ids && data.label_ids.length > 0) {
    const labelRows = data.label_ids.map(labelId => ({
      task_id: task.id,
      label_id: labelId,
    }))

    await supabase
      .from('kanban_task_label_assignments')
      .insert(labelRows)
  }

  return NextResponse.json({ task }, { status: 201 })
}
