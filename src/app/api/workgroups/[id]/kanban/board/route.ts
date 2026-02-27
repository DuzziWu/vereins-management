import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { KanbanBoardData } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/board - Get complete Kanban board for workgroup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workgroupId } = await params
  const supabase = await createClient()

  // Check authentication
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

  // Check if workgroup exists and get details
  const { data: workgroup, error: wgError } = await supabase
    .from('workgroups')
    .select('id, name, status')
    .eq('id', workgroupId)
    .single()

  if (wgError || !workgroup) {
    return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
  }

  // Check if user is member or Vorstand
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

  // Get columns with sort order
  const { data: columns, error: colError } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('workgroup_id', workgroupId)
    .order('sort_order', { ascending: true })

  if (colError) {
    console.error('Error fetching columns:', colError)
    return NextResponse.json({ error: colError.message }, { status: 500 })
  }

  // Get all tasks for these columns
  const columnIds = (columns || []).map(c => c.id)
  let tasks: Array<{
    id: string
    column_id: string
    title: string
    description: string | null
    priority: string
    deadline: string | null
    sort_order: number
    created_by: string
    created_at: string | null
    updated_at: string | null
    creator: { id: string; first_name: string; last_name: string } | null
  }> = []

  if (columnIds.length > 0) {
    const { data: tasksData, error: taskError } = await supabase
      .from('kanban_tasks')
      .select(`
        *,
        creator:profiles!kanban_tasks_created_by_fkey(id, first_name, last_name)
      `)
      .in('column_id', columnIds)
      .order('sort_order', { ascending: true })

    if (taskError) {
      console.error('Error fetching tasks:', taskError)
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    tasks = tasksData || []
  }

  // Get task IDs for related data
  const taskIds = tasks.map(t => t.id)

  // Fetch related data in parallel if we have tasks
  let assigneesByTask = new Map<string, Array<{ profile_id: string; first_name: string; last_name: string; assigned_at: string | null }>>()
  let labelsByTask = new Map<string, Array<{ id: string; name: string; color: string }>>()
  let checklistByTask = new Map<string, { total: number; completed: number }>()
  let attachmentCountByTask = new Map<string, number>()

  if (taskIds.length > 0) {
    const [assigneesRes, labelsRes, checklistRes, attachmentsRes] = await Promise.all([
      // Assignees
      supabase
        .from('kanban_task_assignees')
        .select(`
          task_id,
          assigned_at,
          profile:profiles!kanban_task_assignees_profile_id_fkey(id, first_name, last_name)
        `)
        .in('task_id', taskIds),
      // Labels
      supabase
        .from('kanban_task_label_assignments')
        .select(`
          task_id,
          label:kanban_labels!kanban_task_label_assignments_label_id_fkey(id, name, color)
        `)
        .in('task_id', taskIds),
      // Checklist counts
      supabase
        .from('kanban_checklist_items')
        .select('task_id, is_completed')
        .in('task_id', taskIds),
      // Attachment counts
      supabase
        .from('kanban_task_attachments')
        .select('task_id')
        .in('task_id', taskIds),
    ])

    // Process assignees
    for (const a of (assigneesRes.data || [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = a.profile as any
      if (!profile) continue
      if (!assigneesByTask.has(a.task_id)) {
        assigneesByTask.set(a.task_id, [])
      }
      assigneesByTask.get(a.task_id)!.push({
        profile_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        assigned_at: a.assigned_at,
      })
    }

    // Process labels
    for (const l of (labelsRes.data || [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const label = l.label as any
      if (!label) continue
      if (!labelsByTask.has(l.task_id)) {
        labelsByTask.set(l.task_id, [])
      }
      labelsByTask.get(l.task_id)!.push(label)
    }

    // Process checklist
    for (const c of (checklistRes.data || [])) {
      if (!checklistByTask.has(c.task_id)) {
        checklistByTask.set(c.task_id, { total: 0, completed: 0 })
      }
      const entry = checklistByTask.get(c.task_id)!
      entry.total++
      if (c.is_completed) entry.completed++
    }

    // Process attachments
    for (const att of (attachmentsRes.data || [])) {
      attachmentCountByTask.set(att.task_id, (attachmentCountByTask.get(att.task_id) || 0) + 1)
    }
  }

  // Get labels for the workgroup
  const { data: labels } = await supabase
    .from('kanban_labels')
    .select('*')
    .eq('workgroup_id', workgroupId)
    .order('name', { ascending: true })

  // Get workgroup members
  const { data: members } = await supabase
    .from('workgroup_members')
    .select(`
      profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name)
    `)
    .eq('workgroup_id', workgroupId)

  // Assemble tasks with related data
  const enrichedTasks = tasks.map(task => ({
    id: task.id,
    column_id: task.column_id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
    sort_order: task.sort_order,
    created_by: task.created_by,
    creator_name: task.creator
      ? `${task.creator.first_name} ${task.creator.last_name}`
      : undefined,
    created_at: task.created_at,
    updated_at: task.updated_at,
    assignees: assigneesByTask.get(task.id) || [],
    labels: labelsByTask.get(task.id) || [],
    checklist_total: checklistByTask.get(task.id)?.total ?? 0,
    checklist_completed: checklistByTask.get(task.id)?.completed ?? 0,
    attachment_count: attachmentCountByTask.get(task.id) ?? 0,
  }))

  // Group tasks by column
  const tasksByColumn = new Map<string, typeof enrichedTasks>()
  for (const task of enrichedTasks) {
    if (!tasksByColumn.has(task.column_id)) {
      tasksByColumn.set(task.column_id, [])
    }
    tasksByColumn.get(task.column_id)!.push(task)
  }

  // Assemble columns with tasks
  const columnsWithTasks = (columns || []).map(col => ({
    ...col,
    tasks: tasksByColumn.get(col.id) || [],
  }))

  const boardData: KanbanBoardData = {
    workgroup_id: workgroup.id,
    workgroup_name: workgroup.name,
    columns: columnsWithTasks,
    labels: labels || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (members || [])
      .map((m: any) => m.profile)
      .filter((p: any) => p !== null)
      .map((p: any) => ({ profile_id: p.id, first_name: p.first_name, last_name: p.last_name })),
  }

  return NextResponse.json({ board: boardData })
}
