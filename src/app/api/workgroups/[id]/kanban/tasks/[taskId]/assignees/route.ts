import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanTaskAssigneesSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/tasks/[taskId]/assignees
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

  const { data: assignees, error } = await supabase
    .from('kanban_task_assignees')
    .select(`
      assigned_at,
      profile:profiles!kanban_task_assignees_profile_id_fkey(id, first_name, last_name)
    `)
    .eq('task_id', taskId)

  if (error) {
    console.error('Error fetching assignees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedAssignees = (assignees || []).map((a: any) => {
    const profile = a.profile
    return {
      profile_id: profile?.id,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      assigned_at: a.assigned_at,
    }
  }).filter((a: any) => a.profile_id)

  return NextResponse.json({ assignees: formattedAssignees })
}

// PUT /api/workgroups/[id]/kanban/tasks/[taskId]/assignees - Replace all assignees
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

  const validation = kanbanTaskAssigneesSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { profile_ids } = validation.data

  // Verify all profiles are workgroup members
  if (profile_ids.length > 0) {
    const { data: members } = await supabase
      .from('workgroup_members')
      .select('profile_id')
      .eq('workgroup_id', workgroupId)
      .in('profile_id', profile_ids)

    const memberIds = new Set((members || []).map(m => m.profile_id))
    const invalidIds = profile_ids.filter(id => !memberIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json({
        error: 'Some profiles are not workgroup members',
        invalid_ids: invalidIds
      }, { status: 400 })
    }
  }

  // Delete existing assignees
  await supabase
    .from('kanban_task_assignees')
    .delete()
    .eq('task_id', taskId)

  // Insert new assignees
  if (profile_ids.length > 0) {
    const rows = profile_ids.map(profileId => ({
      task_id: taskId,
      profile_id: profileId,
    }))

    const { error: insertError } = await supabase
      .from('kanban_task_assignees')
      .insert(rows)

    if (insertError) {
      console.error('Error assigning profiles:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Return updated list
  const { data: assignees } = await supabase
    .from('kanban_task_assignees')
    .select(`
      assigned_at,
      profile:profiles!kanban_task_assignees_profile_id_fkey(id, first_name, last_name)
    `)
    .eq('task_id', taskId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedAssignees = (assignees || []).map((a: any) => {
    const p = a.profile
    return {
      profile_id: p?.id,
      first_name: p?.first_name,
      last_name: p?.last_name,
      assigned_at: a.assigned_at,
    }
  }).filter((a: any) => a.profile_id)

  return NextResponse.json({ assignees: formattedAssignees })
}
