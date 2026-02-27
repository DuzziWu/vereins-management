import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanTaskMoveSchema } from '@/lib/validations/kanban'

// POST /api/workgroups/[id]/kanban/tasks/[taskId]/move - Move task to another column
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

  // Verify task exists and belongs to workgroup
  const { data: existingTask } = await supabase
    .from('kanban_tasks')
    .select(`
      id,
      column_id,
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

  const validation = kanbanTaskMoveSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { column_id, sort_order } = validation.data

  // Verify target column belongs to same workgroup
  const { data: targetColumn } = await supabase
    .from('kanban_columns')
    .select('id, workgroup_id')
    .eq('id', column_id)
    .single()

  if (!targetColumn || targetColumn.workgroup_id !== workgroupId) {
    return NextResponse.json({ error: 'Invalid target column' }, { status: 400 })
  }

  // Update task position
  const { data: task, error: updateError } = await supabase
    .from('kanban_tasks')
    .update({
      column_id,
      sort_order,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (updateError) {
    console.error('Error moving task:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}
