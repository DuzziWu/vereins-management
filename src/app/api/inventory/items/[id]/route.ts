import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { itemPatchSchema } from '@/lib/validations/inventory'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// GET /api/inventory/items/[id] - Get a single item with details
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
    return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      category:inventory_categories(id, name, icon, prefix),
      current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name),
      created_by_profile:profiles!inventory_items_created_by_fkey(id, first_name, last_name),
      images:inventory_item_images(id, storage_path, sort_order),
      location:inventory_locations!inventory_items_location_id_fkey(id, name, path)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort images by sort_order
  if (item.images) {
    item.images.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  }

  return NextResponse.json({ item })
}

// PATCH /api/inventory/items/[id] - Update an item (Vorstand only)
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
    return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = itemPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if category exists when updating category_id
  if (data.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('inventory_categories')
      .select('id')
      .eq('id', data.category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 400 })
    }
  }

  // Check for duplicate inventory_number if being updated
  if (data.inventory_number) {
    const { data: existingItem } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('inventory_number', data.inventory_number)
      .neq('id', id)
      .maybeSingle()

    if (existingItem) {
      return NextResponse.json({ error: 'Diese Inventarnummer ist bereits vergeben' }, { status: 409 })
    }
  }

  // Check if location exists when updating location_id
  if (data.location_id) {
    const { data: location, error: locationError } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('id', data.location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Lagerort nicht gefunden' }, { status: 400 })
    }
  }

  // Convert purchase_price from string to number if needed
  const updateData = { ...data }
  if (typeof updateData.purchase_price === 'string') {
    updateData.purchase_price = updateData.purchase_price ? parseFloat(updateData.purchase_price) : null
  }

  // Update item
  const { data: item, error: updateError } = await supabase
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:inventory_categories(id, name, icon, prefix),
      current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name),
      location:inventory_locations!inventory_items_location_id_fkey(id, name, path)
    `)
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    console.error('Error updating inventory item:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ item })
}

// DELETE /api/inventory/items/[id] - Archive an item (soft delete, Vorstand only)
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
    return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 })
  }

  // Check if item exists and get its status
  const { data: existingItem, error: fetchError } = await supabase
    .from('inventory_items')
    .select('id, status, name')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    console.error('Error fetching inventory item:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Block deletion of loaned items
  if (existingItem.status === 'loaned') {
    return NextResponse.json({
      error: 'Dieses Item ist aktuell verliehen. Bitte zuerst die Rückgabe erfassen.'
    }, { status: 409 })
  }

  // Remove item from all sets
  const { error: setRemoveError } = await supabase
    .from('inventory_set_items')
    .delete()
    .eq('item_id', id)

  if (setRemoveError) {
    console.error('Error removing item from sets:', setRemoveError)
  }

  // Soft delete (archive) the item
  const { error: deleteError } = await supabase
    .from('inventory_items')
    .update({ is_archived: true })
    .eq('id', id)

  if (deleteError) {
    console.error('Error archiving inventory item:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
