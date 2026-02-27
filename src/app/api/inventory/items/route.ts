import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { itemSchema, ITEM_STATUS, ITEM_CONDITION } from '@/lib/validations/inventory'

// GET /api/inventory/items - List items with filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const category_id = searchParams.get('category_id')
  const location_id = searchParams.get('location_id')
  const status = searchParams.get('status')
  const condition = searchParams.get('condition')
  const search = searchParams.get('search')
  const include_archived = searchParams.get('include_archived') === 'true'
  const no_location = searchParams.get('no_location') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Check if user is Vorstand (needed for archived items)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')

  // Build query
  let query = supabase
    .from('inventory_items')
    .select(`
      *,
      category:inventory_categories(id, name, icon),
      current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name),
      images:inventory_item_images(id, storage_path, sort_order),
      location:inventory_locations!inventory_items_location_id_fkey(id, name, path)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filter by archived status
  if (!include_archived || !isVorstand) {
    query = query.eq('is_archived', false)
  }

  // Apply filters
  if (category_id) {
    query = query.eq('category_id', category_id)
  }

  if (status && ITEM_STATUS.includes(status as typeof ITEM_STATUS[number])) {
    query = query.eq('status', status)
  }

  if (condition && ITEM_CONDITION.includes(condition as typeof ITEM_CONDITION[number])) {
    query = query.eq('condition', condition)
  }

  if (search) {
    // Search in name and inventory_number
    query = query.or(`name.ilike.%${search}%,inventory_number.ilike.%${search}%`)
  }

  if (location_id) {
    query = query.eq('location_id', location_id)
  }

  if (no_location) {
    query = query.is('location_id', null)
  }

  const { data: items, error, count } = await query

  if (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort images by sort_order and add public URLs
  const itemsWithSortedImages = items?.map(item => {
    const sortedImages = item.images
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      ?.map((img: { storage_path: string; id: string; sort_order: number }) => {
        const { data: publicUrl } = supabase.storage
          .from('inventory-images')
          .getPublicUrl(img.storage_path)
        return {
          ...img,
          public_url: publicUrl.publicUrl,
        }
      }) ?? []

    return {
      ...item,
      images: sortedImages,
    }
  })

  return NextResponse.json({
    items: itemsWithSortedImages,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
    },
  })
}

// POST /api/inventory/items - Create a new item (Vorstand only)
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

  const validation = itemSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if category exists
  const { data: category, error: categoryError } = await supabase
    .from('inventory_categories')
    .select('id')
    .eq('id', data.category_id)
    .single()

  if (categoryError || !category) {
    return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 400 })
  }

  // Check for duplicate inventory_number if provided
  if (data.inventory_number) {
    const { data: existingItem } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('inventory_number', data.inventory_number)
      .maybeSingle()

    if (existingItem) {
      return NextResponse.json({ error: 'Diese Inventarnummer ist bereits vergeben' }, { status: 409 })
    }
  }

  // Convert purchase_price from string to number
  const purchasePrice = data.purchase_price ? parseFloat(data.purchase_price) : null

  // Insert item
  const { data: item, error: insertError } = await supabase
    .from('inventory_items')
    .insert({
      name: data.name,
      description: data.description || null,
      category_id: data.category_id,
      inventory_number: data.inventory_number || null,
      status: data.status || 'available',
      condition: data.condition || 'good',
      size_info: data.size_info || null,
      purchase_date: data.purchase_date || null,
      purchase_price: purchasePrice,
      notes: data.notes || null,
      created_by: profile.id,
    })
    .select(`
      *,
      category:inventory_categories(id, name, icon)
    `)
    .single()

  if (insertError) {
    console.error('Error creating inventory item:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Create initial status log entry
  await supabase
    .from('inventory_status_log')
    .insert({
      item_id: item.id,
      old_status: null,
      new_status: item.status,
      changed_by: profile.id,
      note: 'Item erstellt',
    })

  return NextResponse.json({ item }, { status: 201 })
}
