import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanTaskPatchSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/tasks/[taskId] - Get task with all details
export async function GET(
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

  // Check membership if not Vorstand
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

  // Get task with creator
  const { data: task, error } = await supabase
    .from('kanban_tasks')
    .select(`
      *,
      creator:profiles!kanban_tasks_created_by_fkey(id, first_name, last_name),
      column:kanban_columns!kanban_tasks_column_id_fkey(workgroup_id)
    `)
    .eq('id', taskId)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Verify task belongs to workgroup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskColumn = task.column as any
  if (!taskColumn || taskColumn.workgroup_id !== workgroupId) {
    return NextResponse.json({ error: 'Task not found in this workgroup' }, { status: 404 })
  }

  // Fetch related data in parallel
  const [assigneesRes, labelsRes, checklistRes, attachmentsRes] = await Promise.all([
    supabase
      .from('kanban_task_assignees')
      .select(`
        assigned_at,
        profile:profiles!kanban_task_assignees_profile_id_fkey(id, first_name, last_name)
      `)
      .eq('task_id', taskId),
    supabase
      .from('kanban_task_label_assignments')
      .select(`
        label:kanban_labels!kanban_task_label_assignments_label_id_fkey(id, name, color)
      `)
      .eq('task_id', taskId),
    supabase
      .from('kanban_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('kanban_task_attachments')
      .select(`
        *,
        uploader:profiles!kanban_task_attachments_uploaded_by_fkey(id, first_name, last_name)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),
  ])

  const enrichedTask = {
    ...task,
    creator_name: task.creator
      ? `${task.creator.first_name} ${task.creator.last_name}`
      : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignees: (assigneesRes.data || []).map((a: any) => {
      const profile = a.profile
      return {
        profile_id: profile?.id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        assigned_at: a.assigned_at,
      }
    }).filter((a: any) => a.profile_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labels: (labelsRes.data || [])
      .map((l: any) => l.label)
      .filter((l: any) => l !== null),
    checklist_items: checklistRes.data || [],
    attachments: (attachmentsRes.data || []).map(att => ({
      ...att,
      uploader_name: att.uploader
        ? `${att.uploader.first_name} ${att.uploader.last_name}`
        : null,
    })),
  }

  return NextResponse.json({ task: enrichedTask })
}

// PATCH /api/workgroups/[id]/kanban/tasks/[taskId] - Update task
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

  // Check membership if not Vorstand
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

  // Verify task exists and belongs to workgroup
  const { data: existingTask } = await supabase
    .from('kanban_tasks')
    .select(`
      id,
      column:kanban_columns!kanban_tasks_column_id_fkey(workgroup_id)
    `)
    .eq('id', taskId)
    .single()

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskColumn = existingTask.column as any
  if (!taskColumn || taskColumn.workgroup_id !== workgroupId) {
    return NextResponse.json({ error: 'Task not found in this workgroup' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanTaskPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (validation.data.title !== undefined) updateData.title = validation.data.title
  if (validation.data.description !== undefined) updateData.description = validation.data.description
  if (validation.data.priority !== undefined) updateData.priority = validation.data.priority
  if (validation.data.deadline !== undefined) updateData.deadline = validation.data.deadline
  if (validation.data.sort_order !== undefined) updateData.sort_order = validation.data.sort_order

  // If changing column, verify it belongs to the same workgroup
  if (validation.data.column_id !== undefined) {
    const { data: newColumn } = await supabase
      .from('kanban_columns')
      .select('id, workgroup_id')
      .eq('id', validation.data.column_id)
      .single()

    if (!newColumn || newColumn.workgroup_id !== workgroupId) {
      return NextResponse.json({ error: 'Invalid target column' }, { status: 400 })
    }

    updateData.column_id = validation.data.column_id
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: task, error } = await supabase
    .from('kanban_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select(`
      *,
      creator:profiles!kanban_tasks_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}

// DELETE /api/workgroups/[id]/kanban/tasks/[taskId] - Delete task
export async function DELETE(
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

  // Get task with column info
  const { data: task } = await supabase
    .from('kanban_tasks')
    .select(`
      id,
      created_by,
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

  // Only creator or Vorstand can delete
  if (task.created_by !== profile.id && !isVorstand) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Delete attachments from storage first
  const { data: attachments } = await supabase
    .from('kanban_task_attachments')
    .select('storage_path')
    .eq('task_id', taskId)

  if (attachments && attachments.length > 0) {
    const paths = attachments.map(a => a.storage_path)
    await supabase.storage.from('kanban-attachments').remove(paths)
  }

  // Delete task (CASCADE will handle related records)
  const { error: deleteError } = await supabase
    .from('kanban_tasks')
    .delete()
    .eq('id', taskId)

  if (deleteError) {
    console.error('Error deleting task:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
