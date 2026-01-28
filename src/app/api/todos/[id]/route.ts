import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateTodoSchema } from '@/lib/validations/todo'

type RouteParams = { params: Promise<{ id: string }> }

// PATCH /api/todos/:id - Update a todo (toggle complete or edit content)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updateTodoSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  // Build update object
  const updateData: {
    content?: string
    is_completed?: boolean
    completed_at?: string | null
  } = {}

  if (validation.data.content !== undefined) {
    updateData.content = validation.data.content
  }

  if (validation.data.is_completed !== undefined) {
    updateData.is_completed = validation.data.is_completed
    updateData.completed_at = validation.data.is_completed
      ? new Date().toISOString()
      : null
  }

  // Update todo (RLS ensures user can only update own todos)
  const { data: todo, error } = await supabase
    .from('board_todos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Todo nicht gefunden' }, { status: 404 })
    }
    console.error('Error updating todo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ todo })
}

// DELETE /api/todos/:id - Delete a todo
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

  // Delete todo (RLS ensures user can only delete own todos)
  const { error } = await supabase
    .from('board_todos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
