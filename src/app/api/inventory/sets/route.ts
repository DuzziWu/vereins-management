import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { setSchema, ITEM_STATUS } from '@/lib/validations/inventory'

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

// GET /api/inventory/sets - List all sets
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all sets with item count
  const { data: sets, error } = await supabase
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory sets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform sets to include item_count and computed_status
  const transformedSets = sets?.map(set => {
    const items = (set.items
      ?.map((si: { item: unknown }) => si.item)
      .filter((item: unknown): item is { status: string } => item !== null && typeof item === 'object' && 'status' in item) ?? []) as { status: string }[]

    return {
      ...set,
      items,
      item_count: items.length,
      computed_status: computeSetStatus(items),
    }
  })

  return NextResponse.json({ sets: transformedSets })
}

// POST /api/inventory/sets - Create a new set (Vorstand only)
export async function POST(request: NextRequest) {
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

  // Get profile_id for created_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = setSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Verify all items exist and are not archived
  const { data: items, error: itemsError } = await supabase
    .from('inventory_items')
    .select('id')
    .in('id', data.item_ids)
    .eq('is_archived', false)

  if (itemsError) {
    console.error('Error checking items:', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  if (!items || items.length !== data.item_ids.length) {
    return NextResponse.json({ error: 'Einige Items wurden nicht gefunden oder sind archiviert' }, { status: 400 })
  }

  // Create set
  const { data: set, error: insertError } = await supabase
    .from('inventory_sets')
    .insert({
      name: data.name,
      description: data.description || null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating inventory set:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Add items to set
  const setItems = data.item_ids.map(item_id => ({
    set_id: set.id,
    item_id,
  }))

  const { error: itemsInsertError } = await supabase
    .from('inventory_set_items')
    .insert(setItems)

  if (itemsInsertError) {
    console.error('Error adding items to set:', itemsInsertError)
    // Rollback: delete the set
    await supabase.from('inventory_sets').delete().eq('id', set.id)
    return NextResponse.json({ error: itemsInsertError.message }, { status: 500 })
  }

  // Fetch the complete set with items
  const { data: completeSet, error: fetchError } = await supabase
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
    .eq('id', set.id)
    .single()

  if (fetchError) {
    console.error('Error fetching complete set:', fetchError)
    return NextResponse.json({ set }, { status: 201 })
  }

  // Transform the response
  const transformedItems = (completeSet.items
    ?.map((si: { item: unknown }) => si.item)
    .filter((item: unknown): item is { status: string } => item !== null && typeof item === 'object' && 'status' in item) ?? []) as { status: string }[]

  const response = {
    ...completeSet,
    items: transformedItems,
    item_count: transformedItems.length,
    computed_status: computeSetStatus(transformedItems),
  }

  return NextResponse.json({ set: response }, { status: 201 })
}
