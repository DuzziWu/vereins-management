import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { categoryPatchSchema } from '@/lib/validations/inventory'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// GET /api/inventory/categories/[id] - Get a single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  const { data: category, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error fetching inventory category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}

// PATCH /api/inventory/categories/[id] - Update a category (Vorstand only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

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

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = categoryPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check for duplicate name if name is being updated (case-insensitive)
  if (data.name) {
    const escapedName = data.name.replace(/[%_\\]/g, '\\$&')
    const { data: existingCategory } = await supabase
      .from('inventory_categories')
      .select('id')
      .ilike('name', escapedName)
      .neq('id', id)
      .maybeSingle()

    if (existingCategory) {
      return NextResponse.json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' }, { status: 409 })
    }
  }

  // Update category
  const { data: category, error: updateError } = await supabase
    .from('inventory_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error updating inventory category:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}

// DELETE /api/inventory/categories/[id] - Delete a category (Vorstand only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

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
  const { data: category, error: fetchError } = await supabase
    .from('inventory_categories')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error fetching inventory category:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Check if category has items
  const { count: itemCount, error: countError } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('is_archived', false)

  if (countError) {
    console.error('Error checking category items:', countError)
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  if (itemCount && itemCount > 0) {
    return NextResponse.json({
      error: `Diese Kategorie enthält ${itemCount} Items. Bitte zuerst alle Items löschen oder einer anderen Kategorie zuweisen.`
    }, { status: 409 })
  }

  // Delete category
  const { error: deleteError } = await supabase
    .from('inventory_categories')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting inventory category:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
