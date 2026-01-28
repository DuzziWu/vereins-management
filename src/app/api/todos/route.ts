import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createTodoSchema } from '@/lib/validations/todo'

// GET /api/todos - Get all todos for the current user
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (board member)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // BUG-3 FIX: Lazy cleanup - delete completed todos older than 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  await supabase
    .from('board_todos')
    .delete()
    .eq('is_completed', true)
    .lt('completed_at', sevenDaysAgo.toISOString())

  // Fetch todos (RLS automatically filters to user's own todos)
  const { data: todos, error } = await supabase
    .from('board_todos')
    .select('*')
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ todos })
}

// POST /api/todos - Create a new todo
export async function POST(request: Request) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (board member)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Check open todos limit (max 20)
  const { count: openCount } = await supabase
    .from('board_todos')
    .select('*', { count: 'exact', head: true })
    .eq('is_completed', false)

  if (openCount && openCount >= 20) {
    return NextResponse.json({
      error: 'Zu viele offene Aufgaben. Bitte erledige einige Aufgaben zuerst.'
    }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = createTodoSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Create todo (RLS ensures user_id is correct)
  const { data: todo, error } = await supabase
    .from('board_todos')
    .insert({
      user_id: user.id,
      content: validation.data.content
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ todo }, { status: 201 })
}
