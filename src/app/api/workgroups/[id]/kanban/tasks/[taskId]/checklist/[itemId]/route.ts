import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanChecklistItemPatchSchema } from '@/lib/validations/kanban'

// PATCH /api/workgroups/[id]/kanban/tasks/[taskId]/checklist/[itemId] - Update item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const { id: workgroupId, taskId, itemId } = await params
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

  // Verify item exists and belongs to the task
  const { data: existingItem } = await supabase
    .from('kanban_checklist_items')
    .select('id, task_id, is_completed')
    .eq('id', itemId)
    .eq('task_id', taskId)
    .single()

  if (!existingItem) {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanChecklistItemPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (validation.data.text !== undefined) updateData.text = validation.data.text
  if (validation.data.sort_order !== undefined) updateData.sort_order = validation.data.sort_order

  // Handle completion state change
  if (validation.data.is_completed !== undefined) {
    updateData.is_completed = validation.data.is_completed
    if (validation.data.is_completed && !existingItem.is_completed) {
      // Just completed
      updateData.completed_by = profile.id
      updateData.completed_at = new Date().toISOString()
    } else if (!validation.data.is_completed && existingItem.is_completed) {
      // Uncompleted
      updateData.completed_by = null
      updateData.completed_at = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from('kanban_checklist_items')
    .update(updateData)
    .eq('id', itemId)
    .select(`
      *,
      completer:profiles!kanban_checklist_items_completed_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedItem = {
    ...item,
    completer_name: item.completer
      ? `${item.completer.first_name} ${item.completer.last_name}`
      : null,
  }

  return NextResponse.json({ item: formattedItem })
}

// DELETE /api/workgroups/[id]/kanban/tasks/[taskId]/checklist/[itemId] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const { id: workgroupId, taskId, itemId } = await params
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

  // Verify item exists and belongs to the task
  const { data: existingItem } = await supabase
    .from('kanban_checklist_items')
    .select('id')
    .eq('id', itemId)
    .eq('task_id', taskId)
    .single()

  if (!existingItem) {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('kanban_checklist_items')
    .delete()
    .eq('id', itemId)

  if (deleteError) {
    console.error('Error deleting checklist item:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
