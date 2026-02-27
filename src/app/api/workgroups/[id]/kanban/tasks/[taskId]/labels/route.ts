import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanTaskLabelsSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/tasks/[taskId]/labels
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

  const { data: assignments, error } = await supabase
    .from('kanban_task_label_assignments')
    .select(`
      label:kanban_labels!kanban_task_label_assignments_label_id_fkey(id, name, color)
    `)
    .eq('task_id', taskId)

  if (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labels = (assignments || [])
    .map((a: any) => a.label)
    .filter((l: any) => l !== null)

  return NextResponse.json({ labels })
}

// PUT /api/workgroups/[id]/kanban/tasks/[taskId]/labels - Replace all labels
export async function PUT(
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

  const validation = kanbanTaskLabelsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { label_ids } = validation.data

  // Verify all labels belong to this workgroup
  if (label_ids.length > 0) {
    const { data: labels } = await supabase
      .from('kanban_labels')
      .select('id')
      .eq('workgroup_id', workgroupId)
      .in('id', label_ids)

    const validLabelIds = new Set((labels || []).map(l => l.id))
    const invalidIds = label_ids.filter(id => !validLabelIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json({
        error: 'Some labels do not belong to this workgroup',
        invalid_ids: invalidIds
      }, { status: 400 })
    }
  }

  // Delete existing assignments
  await supabase
    .from('kanban_task_label_assignments')
    .delete()
    .eq('task_id', taskId)

  // Insert new assignments
  if (label_ids.length > 0) {
    const rows = label_ids.map(labelId => ({
      task_id: taskId,
      label_id: labelId,
    }))

    const { error: insertError } = await supabase
      .from('kanban_task_label_assignments')
      .insert(rows)

    if (insertError) {
      console.error('Error assigning labels:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Return updated list
  const { data: assignments } = await supabase
    .from('kanban_task_label_assignments')
    .select(`
      label:kanban_labels!kanban_task_label_assignments_label_id_fkey(id, name, color)
    `)
    .eq('task_id', taskId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labels = (assignments || [])
    .map((a: any) => a.label)
    .filter((l: any) => l !== null)

  return NextResponse.json({ labels })
}
