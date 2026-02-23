import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanColumnPatchSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/columns/[columnId] - Get single column
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const { columnId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: column, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('id', columnId)
    .single()

  if (error || !column) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  }

  return NextResponse.json({ column })
}

// PATCH /api/workgroups/[id]/kanban/columns/[columnId] - Update column (Vorstand only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const { id: workgroupId, columnId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Verify column belongs to workgroup
  const { data: existingColumn } = await supabase
    .from('kanban_columns')
    .select('id, workgroup_id')
    .eq('id', columnId)
    .eq('workgroup_id', workgroupId)
    .single()

  if (!existingColumn) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanColumnPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (validation.data.name !== undefined) updateData.name = validation.data.name
  if (validation.data.color !== undefined) updateData.color = validation.data.color
  if (validation.data.sort_order !== undefined) updateData.sort_order = validation.data.sort_order

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: column, error } = await supabase
    .from('kanban_columns')
    .update(updateData)
    .eq('id', columnId)
    .select()
    .single()

  if (error) {
    console.error('Error updating column:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ column })
}

// DELETE /api/workgroups/[id]/kanban/columns/[columnId] - Delete column (Vorstand only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const { id: workgroupId, columnId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const moveToColumnId = searchParams.get('move_to')

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Verify column belongs to workgroup
  const { data: column } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('id', columnId)
    .eq('workgroup_id', workgroupId)
    .single()

  if (!column) {
    return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  }

  // Check if this is the last column
  const { count: columnCount } = await supabase
    .from('kanban_columns')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', workgroupId)

  if ((columnCount || 0) <= 1) {
    return NextResponse.json({ error: 'Mindestens eine Spalte muss existieren' }, { status: 400 })
  }

  // Check if column has tasks
  const { count: taskCount } = await supabase
    .from('kanban_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('column_id', columnId)

  if ((taskCount || 0) > 0) {
    if (!moveToColumnId) {
      return NextResponse.json({
        error: 'Diese Spalte enthält Tasks. Bitte geben Sie eine Ziel-Spalte an.',
        task_count: taskCount
      }, { status: 400 })
    }

    // Verify target column exists and belongs to same workgroup
    const { data: targetColumn } = await supabase
      .from('kanban_columns')
      .select('id')
      .eq('id', moveToColumnId)
      .eq('workgroup_id', workgroupId)
      .neq('id', columnId)
      .single()

    if (!targetColumn) {
      return NextResponse.json({ error: 'Target column not found' }, { status: 400 })
    }

    // Move tasks to target column
    const { error: moveError } = await supabase
      .from('kanban_tasks')
      .update({ column_id: moveToColumnId })
      .eq('column_id', columnId)

    if (moveError) {
      console.error('Error moving tasks:', moveError)
      return NextResponse.json({ error: moveError.message }, { status: 500 })
    }
  }

  // Delete column (CASCADE will handle any remaining related data)
  const { error: deleteError } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', columnId)

  if (deleteError) {
    console.error('Error deleting column:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
