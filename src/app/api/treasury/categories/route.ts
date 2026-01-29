import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createCategorySchema } from '@/lib/validations/treasury'

// GET /api/treasury/categories - Alle Kategorien laden
export async function GET(request: NextRequest) {
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

  // Optional: Filter by type
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  let query = supabase
    .from('transaction_categories')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (type && (type === 'income' || type === 'expense')) {
    query = query.eq('type', type)
  }

  const { data: categories, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories })
}

// POST /api/treasury/categories - Kategorie erstellen
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

  const validation = createCategorySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Insert category (is_system = false for user-created categories)
  const { data: category, error } = await supabase
    .from('transaction_categories')
    .insert({
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      is_system: false,
    })
    .select()
    .single()

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({
        error: `Kategorie "${data.name}" existiert bereits f\u00FCr diesen Typ`
      }, { status: 409 })
    }
    console.error('Error creating category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category }, { status: 201 })
}
