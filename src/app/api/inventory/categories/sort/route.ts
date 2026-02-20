import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { categorySortSchema } from '@/lib/validations/inventory'

// PUT /api/inventory/categories/sort - Update category sort order (Vorstand only)
export async function PUT(request: NextRequest) {
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

  const validation = categorySortSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { category_ids } = validation.data

  // Update sort_order for each category
  const updates = category_ids.map((id, index) =>
    supabase
      .from('inventory_categories')
      .update({ sort_order: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  // Check for errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error('Error updating category sort order:', errors)
    return NextResponse.json({ error: 'Failed to update sort order' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
