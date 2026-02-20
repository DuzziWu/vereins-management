import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { categorySchema } from '@/lib/validations/inventory'

// GET /api/inventory/categories - List all categories
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all categories with item count, ordered by sort_order
  const { data: categories, error } = await supabase
    .from('inventory_categories')
    .select(`
      *,
      inventory_items!inventory_items_category_id_fkey(count)
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching inventory categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the response to include item_count
  const transformedCategories = categories?.map(cat => ({
    ...cat,
    item_count: cat.inventory_items?.[0]?.count ?? 0,
    inventory_items: undefined,
  }))

  return NextResponse.json({ categories: transformedCategories })
}

// POST /api/inventory/categories - Create a new category (Vorstand only)
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

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = categorySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check for duplicate name (case-insensitive)
  const escapedName = data.name.replace(/[%_\\]/g, '\\$&')
  const { data: existingCategory } = await supabase
    .from('inventory_categories')
    .select('id')
    .ilike('name', escapedName)
    .maybeSingle()

  if (existingCategory) {
    return NextResponse.json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' }, { status: 409 })
  }

  // Get the max sort_order to append at the end
  const { data: maxSortOrder } = await supabase
    .from('inventory_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const newSortOrder = (maxSortOrder?.sort_order ?? 0) + 1

  // Insert category
  const { data: category, error: insertError } = await supabase
    .from('inventory_categories')
    .insert({
      name: data.name,
      description: data.description || null,
      icon: data.icon || null,
      sort_order: data.sort_order ?? newSortOrder,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating inventory category:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ category }, { status: 201 })
}
