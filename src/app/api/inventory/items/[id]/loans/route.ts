import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { loanSchema, returnSchema } from '@/lib/validations/inventory'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/items/[id]/loans - Get loan history for an item
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: itemId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Check if item exists
  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .select('id, name')
    .eq('id', itemId)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item nicht gefunden' }, { status: 404 })
  }

  // Fetch loan history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase
    .from('inventory_loans')
    .select(`
      *,
      borrower:profiles!inventory_loans_borrower_id_fkey(id, first_name, last_name),
      loaned_by_profile:profiles!inventory_loans_loaned_by_fkey(id, first_name, last_name),
      returned_by_profile:profiles!inventory_loans_returned_by_fkey(id, first_name, last_name),
      return_location:inventory_locations!inventory_loans_return_location_id_fkey(id, name, path)
    `, { count: 'exact' })
    .eq('item_id', itemId)
    .order('loaned_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loans, error, count } = await query as any

  if (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get total loan count for statistics
  const { data: activeLoans } = await supabase
    .from('inventory_loans')
    .select('id')
    .eq('item_id', itemId)
    .is('returned_at', null)

  return NextResponse.json({
    loans,
    stats: {
      total_loans: count || 0,
      active_loan: activeLoans && activeLoans.length > 0,
    },
    pagination: {
      total: count ?? 0,
      limit,
      offset,
    },
  })
}

// POST /api/inventory/items/[id]/loans - Create a new loan (Vorstand only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: itemId } = await params
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

  // Get profile_id for loaned_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check if item exists and is available
  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .select('id, name, status, current_holder_id')
    .eq('id', itemId)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item nicht gefunden' }, { status: 404 })
  }

  if (item.status === 'loaned') {
    // Get current holder info
    const { data: currentHolder } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', item.current_holder_id)
      .single()

    const holderName = currentHolder
      ? `${currentHolder.first_name} ${currentHolder.last_name}`
      : 'Unbekannt'

    return NextResponse.json({
      error: `Dieses Item ist bereits verliehen an ${holderName}. Bitte zuerst die Rückgabe erfassen.`
    }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Add item_id to body for validation
  body.item_id = itemId

  const validation = loanSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if borrower exists
  const { data: borrower, error: borrowerError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', data.borrower_id)
    .single()

  if (borrowerError || !borrower) {
    return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 400 })
  }

  // Create loan (trigger will update item status)
  const { data: loan, error: insertError } = await supabase
    .from('inventory_loans')
    .insert({
      item_id: itemId,
      borrower_id: data.borrower_id,
      loaned_by: profile.id,
      expected_return_date: data.expected_return_date || null,
      loan_note: data.loan_note || null,
    })
    .select(`
      *,
      borrower:profiles!inventory_loans_borrower_id_fkey(id, first_name, last_name),
      loaned_by_profile:profiles!inventory_loans_loaned_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating loan:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Create status log entry
  await supabase
    .from('inventory_status_log')
    .insert({
      item_id: itemId,
      old_status: item.status,
      new_status: 'loaned',
      changed_by: profile.id,
      holder_id: data.borrower_id,
      note: data.loan_note || `Verliehen an ${borrower.first_name} ${borrower.last_name}`,
    })

  return NextResponse.json({ loan }, { status: 201 })
}

// PATCH /api/inventory/items/[id]/loans - Record a return (Vorstand only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: itemId } = await params
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

  // Get profile_id for returned_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Find active loan for this item
  const { data: activeLoan, error: loanError } = await supabase
    .from('inventory_loans')
    .select(`
      *,
      borrower:profiles!inventory_loans_borrower_id_fkey(id, first_name, last_name)
    `)
    .eq('item_id', itemId)
    .is('returned_at', null)
    .single()

  if (loanError || !activeLoan) {
    return NextResponse.json({ error: 'Keine aktive Ausleihe für dieses Item gefunden' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = returnSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if return location exists (if specified)
  if (data.return_location_id) {
    const { data: location, error: locationError } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('id', data.return_location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Lagerort nicht gefunden' }, { status: 400 })
    }
  }

  // Update loan with return info (trigger will update item status)
  const { data: loan, error: updateError } = await supabase
    .from('inventory_loans')
    .update({
      returned_at: new Date().toISOString(),
      returned_by: profile.id,
      return_location_id: data.return_location_id || null,
      return_note: data.return_note || null,
      return_condition: data.return_condition || null,
    })
    .eq('id', activeLoan.id)
    .select(`
      *,
      borrower:profiles!inventory_loans_borrower_id_fkey(id, first_name, last_name),
      returned_by_profile:profiles!inventory_loans_returned_by_fkey(id, first_name, last_name),
      return_location:inventory_locations!inventory_loans_return_location_id_fkey(id, name)
    `)
    .single()

  if (updateError) {
    console.error('Error recording return:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Create status log entry
  const borrowerName = activeLoan.borrower
    ? `${activeLoan.borrower.first_name} ${activeLoan.borrower.last_name}`
    : 'Unbekannt'

  await supabase
    .from('inventory_status_log')
    .insert({
      item_id: itemId,
      old_status: 'loaned',
      new_status: 'available',
      changed_by: profile.id,
      note: data.return_note || `Zurückgegeben von ${borrowerName}`,
    })

  return NextResponse.json({ loan })
}
