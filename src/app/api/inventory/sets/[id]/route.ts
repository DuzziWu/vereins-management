import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { setPatchSchema, setItemsSchema } from '@/lib/validations/inventory'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Helper to compute set status (worst status of all items)
function computeSetStatus(items: { status: string }[]): string {
  const statusPriority: Record<string, number> = {
    defective: 0,
    loaned: 1,
    in_cleaning: 2,
    reserved: 3,
    available: 4,
  }

  if (!items || items.length === 0) return 'available'

  let worstStatus = 'available'
  let worstPriority = statusPriority['available']

  for (const item of items) {
    const priority = statusPriority[item.status] ?? 4
    if (priority < worstPriority) {
      worstPriority = priority
      worstStatus = item.status
    }
  }

  return worstStatus
}

// GET /api/inventory/sets/[id] - Get a single set with items
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
    return NextResponse.json({ error: 'Invalid set ID format' }, { status: 400 })
  }

  const { data: set, error } = await supabase
    .from('inventory_sets')
    .select(`
      *,
      created_by_profile:profiles!inventory_sets_created_by_fkey(id, first_name, last_name),
      items:inventory_set_items(
        item:inventory_items(
          id, name, status, inventory_number, condition, size_info,
          category:inventory_categories(id, name, icon),
          current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name),
          images:inventory_item_images(id, storage_path, sort_order)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    console.error('Error fetching inventory set:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the response
  const items = (set.items
    ?.map((si: { item: unknown }) => si.item)
    .filter((item: unknown): item is { status: string } => item !== null && typeof item === 'object' && 'status' in item) ?? []) as { status: string }[]

  const response = {
    ...set,
    items,
    item_count: items.length,
    computed_status: computeSetStatus(items),
  }

  return NextResponse.json({ set: response })
}

// PATCH /api/inventory/sets/[id] - Update set metadata (Vorstand only)
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
    return NextResponse.json({ error: 'Invalid set ID format' }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = setPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Update set
  const { data: set, error: updateError } = await supabase
    .from('inventory_sets')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    console.error('Error updating inventory set:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ set })
}

// PUT /api/inventory/sets/[id] - Update set items (Vorstand only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    return NextResponse.json({ error: 'Invalid set ID format' }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = setItemsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { item_ids } = validation.data

  // Verify set exists
  const { data: existingSet, error: fetchError } = await supabase
    .from('inventory_sets')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    console.error('Error fetching inventory set:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Verify all items exist and are not archived
  const { data: items, error: itemsError } = await supabase
    .from('inventory_items')
    .select('id')
    .in('id', item_ids)
    .eq('is_archived', false)

  if (itemsError) {
    console.error('Error checking items:', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  if (!items || items.length !== item_ids.length) {
    return NextResponse.json({ error: 'Einige Items wurden nicht gefunden oder sind archiviert' }, { status: 400 })
  }

  // Delete existing set items
  const { error: deleteError } = await supabase
    .from('inventory_set_items')
    .delete()
    .eq('set_id', id)

  if (deleteError) {
    console.error('Error deleting set items:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Insert new set items
  const setItems = item_ids.map(item_id => ({
    set_id: id,
    item_id,
  }))

  const { error: insertError } = await supabase
    .from('inventory_set_items')
    .insert(setItems)

  if (insertError) {
    console.error('Error inserting set items:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Fetch the updated set
  const { data: set, error: setError } = await supabase
    .from('inventory_sets')
    .select(`
      *,
      items:inventory_set_items(
        item:inventory_items(
          id, name, status, inventory_number,
          category:inventory_categories(id, name, icon)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (setError) {
    console.error('Error fetching updated set:', setError)
    return NextResponse.json({ error: setError.message }, { status: 500 })
  }

  // Transform the response
  const transformedItems = (set.items
    ?.map((si: { item: unknown }) => si.item)
    .filter((item: unknown): item is { status: string } => item !== null && typeof item === 'object' && 'status' in item) ?? []) as { status: string }[]

  const response = {
    ...set,
    items: transformedItems,
    item_count: transformedItems.length,
    computed_status: computeSetStatus(transformedItems),
  }

  return NextResponse.json({ set: response })
}

// DELETE /api/inventory/sets/[id] - Delete a set (Vorstand only)
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
    return NextResponse.json({ error: 'Invalid set ID format' }, { status: 400 })
  }

  // Delete set (cascade will delete set_items)
  const { error: deleteError } = await supabase
    .from('inventory_sets')
    .delete()
    .eq('id', id)

  if (deleteError) {
    if (deleteError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    console.error('Error deleting inventory set:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
