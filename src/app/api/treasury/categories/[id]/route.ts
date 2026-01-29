import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateCategorySchema } from '@/lib/validations/treasury'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/treasury/categories/:id - Kategorie bearbeiten
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  // Check if category exists
  const { data: existing, error: fetchError } = await supabase
    .from('transaction_categories')
    .select('id, is_system, type')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updateCategorySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.icon !== undefined) updateData.icon = data.icon
  if (data.color !== undefined) updateData.color = data.color

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Keine \u00C4nderungen angegeben' }, { status: 400 })
  }

  // Update category
  const { data: category, error } = await supabase
    .from('transaction_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({
        error: `Kategorie "${data.name}" existiert bereits f\u00FCr diesen Typ`
      }, { status: 409 })
    }
    console.error('Error updating category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}

// DELETE /api/treasury/categories/:id - Kategorie l\u00F6schen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  // Check if category exists
  const { data: existing, error: fetchError } = await supabase
    .from('transaction_categories')
    .select('id, is_system, name')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
  }

  // System categories cannot be deleted
  if (existing.is_system) {
    return NextResponse.json({
      error: 'Standard-Kategorien k\u00F6nnen nicht gel\u00F6scht werden'
    }, { status: 400 })
  }

  // Check if category has transactions
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countError) {
    console.error('Error checking transactions:', countError)
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if (count && count > 0) {
    return NextResponse.json({
      error: `Kategorie "${existing.name}" kann nicht gel\u00F6scht werden, da ${count} Buchung(en) zugeordnet sind`
    }, { status: 400 })
  }

  // Delete category
  const { error } = await supabase
    .from('transaction_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
