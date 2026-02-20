import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { statusChangeSchema } from '@/lib/validations/inventory'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// GET /api/inventory/items/[id]/status - Get status history
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  // Fetch status log
  const { data: statusLog, error } = await supabase
    .from('inventory_status_log')
    .select(`
      *,
      changed_by_profile:profiles!inventory_status_log_changed_by_fkey(id, first_name, last_name),
      holder:profiles!inventory_status_log_holder_id_fkey(id, first_name, last_name)
    `)
    .eq('item_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching status log:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status_log: statusLog })
}

// PUT /api/inventory/items/[id]/status - Change item status (Vorstand only)
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

  // Get profile_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
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

  const validation = statusChangeSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Get current item status
  const { data: currentItem, error: fetchError } = await supabase
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

  // Validate holder_id exists if provided
  if (data.holder_id) {
    const { data: holder, error: holderError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', data.holder_id)
      .single()

    if (holderError || !holder) {
      return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 400 })
    }
  }

  // Prepare update data
  const updateData: {
    status: string
    current_holder_id: string | null
    loaned_at: string | null
  } = {
    status: data.status,
    current_holder_id: data.status === 'loaned' ? data.holder_id! : null,
    loaned_at: data.status === 'loaned' ? new Date().toISOString() : null,
  }

  // Update item status
  const { data: item, error: updateError } = await supabase
    .from('inventory_items')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:inventory_categories(id, name, icon),
      current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name)
    `)
    .single()

  if (updateError) {
    console.error('Error updating inventory item status:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Create status log entry
  const { error: logError } = await supabase
    .from('inventory_status_log')
    .insert({
      item_id: id,
      old_status: currentItem.status,
      new_status: data.status,
      changed_by: profile.id,
      holder_id: data.status === 'loaned' ? data.holder_id : null,
      note: data.note || null,
    })

  if (logError) {
    console.error('Error creating status log:', logError)
    // Don't fail the request, just log the error
  }

  return NextResponse.json({ item })
}
