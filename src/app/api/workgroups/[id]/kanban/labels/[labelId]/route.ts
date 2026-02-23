import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanLabelPatchSchema } from '@/lib/validations/kanban'

// GET /api/workgroups/[id]/kanban/labels/[labelId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  const { id: workgroupId, labelId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: label, error } = await supabase
    .from('kanban_labels')
    .select('*')
    .eq('id', labelId)
    .eq('workgroup_id', workgroupId)
    .single()

  if (error || !label) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }

  return NextResponse.json({ label })
}

// PATCH /api/workgroups/[id]/kanban/labels/[labelId] - Update label (Vorstand only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  const { id: workgroupId, labelId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Verify label belongs to workgroup
  const { data: existingLabel } = await supabase
    .from('kanban_labels')
    .select('id')
    .eq('id', labelId)
    .eq('workgroup_id', workgroupId)
    .single()

  if (!existingLabel) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = kanbanLabelPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (validation.data.name !== undefined) updateData.name = validation.data.name
  if (validation.data.color !== undefined) updateData.color = validation.data.color

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: label, error } = await supabase
    .from('kanban_labels')
    .update(updateData)
    .eq('id', labelId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({
        error: 'Ein Label mit diesem Namen existiert bereits'
      }, { status: 400 })
    }
    console.error('Error updating label:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ label })
}

// DELETE /api/workgroups/[id]/kanban/labels/[labelId] - Delete label (Vorstand only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  const { id: workgroupId, labelId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Verify label belongs to workgroup
  const { data: label } = await supabase
    .from('kanban_labels')
    .select('id')
    .eq('id', labelId)
    .eq('workgroup_id', workgroupId)
    .single()

  if (!label) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }

  // Delete label (CASCADE will remove assignments)
  const { error: deleteError } = await supabase
    .from('kanban_labels')
    .delete()
    .eq('id', labelId)

  if (deleteError) {
    console.error('Error deleting label:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
