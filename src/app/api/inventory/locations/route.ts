import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { locationSchema } from '@/lib/validations/inventory'

// GET /api/inventory/locations - List all locations with hierarchy
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const flat = searchParams.get('flat') === 'true' // Return flat list instead of tree
  const parent_id = searchParams.get('parent_id') // Filter by parent

  // Build query - simplified to avoid PostgREST issues
  let query = supabase
    .from('inventory_locations')
    .select('*')
    .order('name')

  if (parent_id) {
    query = query.eq('parent_id', parent_id)
  }

  const { data: locations, error } = await query

  if (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get item counts for each location
  const { data: itemCounts } = await supabase
    .from('inventory_items')
    .select('location_id')
    .not('location_id', 'is', null)
    .eq('is_archived', false)

  const countMap = new Map<string, number>()
  itemCounts?.forEach(item => {
    if (item.location_id) {
      countMap.set(item.location_id, (countMap.get(item.location_id) || 0) + 1)
    }
  })

  // Add item_count to each location
  const locationsWithCounts = locations?.map(loc => ({
    ...loc,
    item_count: countMap.get(loc.id) || 0,
  }))

  if (flat) {
    return NextResponse.json({ locations: locationsWithCounts })
  }

  // Build tree structure
  const buildTree = (items: typeof locationsWithCounts, parentId: string | null = null): typeof locationsWithCounts => {
    return items
      ?.filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id),
      })) || []
  }

  const tree = buildTree(locationsWithCounts || [])

  return NextResponse.json({ locations: tree })
}

// POST /api/inventory/locations - Create a new location (Vorstand only)
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

  const validation = locationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if parent exists (if specified)
  if (data.parent_id) {
    const { data: parent, error: parentError } = await supabase
      .from('inventory_locations')
      .select('id, depth')
      .eq('id', data.parent_id)
      .single()

    if (parentError || !parent) {
      return NextResponse.json({ error: 'Übergeordneter Lagerort nicht gefunden' }, { status: 400 })
    }

    // Check depth limit (parent depth must be < 4 to allow children)
    if (parent.depth >= 4) {
      return NextResponse.json({
        error: 'Maximale Lagerort-Tiefe erreicht (5 Ebenen). Bitte einen Lagerort weiter oben wählen.'
      }, { status: 400 })
    }
  }

  // Insert location (trigger will set path and depth)
  const { data: location, error: insertError } = await supabase
    .from('inventory_locations')
    .insert({
      name: data.name,
      description: data.description || null,
      notes: data.notes || null,
      parent_id: data.parent_id || null,
      created_by: profile.id,
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Error creating location:', insertError)
    // Check for unique constraint violation
    if (insertError.code === '23505') {
      return NextResponse.json({
        error: 'Ein Lagerort mit diesem Namen existiert bereits an dieser Position'
      }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ location }, { status: 201 })
}
