import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/kanban/my-tasks - Get tasks assigned to current user across all workgroups
export async function GET(request: NextRequest) {
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

  // Parse query params
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '5')))
  const includeCompleted = searchParams.get('include_completed') === 'true'

  // Get task IDs assigned to user
  const { data: assignments, error: assignError } = await supabase
    .from('kanban_task_assignees')
    .select('task_id')
    .eq('profile_id', profile.id)

  if (assignError) {
    console.error('Error fetching assignments:', assignError)
    return NextResponse.json({ error: assignError.message }, { status: 500 })
  }

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ tasks: [] })
  }

  const taskIds = assignments.map(a => a.task_id)

  // Get tasks with column and workgroup info
  let query = supabase
    .from('kanban_tasks')
    .select(`
      id,
      title,
      priority,
      deadline,
      sort_order,
      created_at,
      column:kanban_columns!kanban_tasks_column_id_fkey(
        id,
        name,
        workgroup:workgroups!kanban_columns_workgroup_id_fkey(
          id,
          name,
          status
        )
      )
    `)
    .in('id', taskIds)

  // Exclude tasks from archived workgroups - we'll filter this client-side
  // since we can't filter on nested relations directly

  // Order by deadline (nulls last), then by created_at
  query = query.order('deadline', { ascending: true, nullsFirst: false })
    .limit(limit * 2) // Get more to account for filtering

  const { data: tasks, error: taskError } = await query

  if (taskError) {
    console.error('Error fetching tasks:', taskError)
    return NextResponse.json({ error: taskError.message }, { status: 500 })
  }

  // Filter out tasks from archived workgroups
  const filteredTasks = (tasks || [])
    .filter(task => {
      const column = task.column as {
        id: string
        name: string
        workgroup: { id: string; name: string; status: string } | null
      } | null
      return column?.workgroup?.status === 'active'
    })
    .slice(0, limit)

  // Format response
  const formattedTasks = filteredTasks.map(task => {
    const column = task.column as {
      id: string
      name: string
      workgroup: { id: string; name: string; status: string } | null
    } | null

    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      deadline: task.deadline,
      column_name: column?.name,
      workgroup_id: column?.workgroup?.id,
      workgroup_name: column?.workgroup?.name,
      is_overdue: task.deadline ? new Date(task.deadline) < new Date() : false,
      is_due_today: task.deadline
        ? new Date(task.deadline).toDateString() === new Date().toDateString()
        : false,
    }
  })

  // Calculate counts
  const total = assignments.length
  const overdue = formattedTasks.filter(t => t.is_overdue).length
  const dueToday = formattedTasks.filter(t => t.is_due_today).length

  return NextResponse.json({
    tasks: formattedTasks,
    total_count: total,
    counts: {
      total,
      overdue,
      due_today: dueToday,
    }
  })
}
