import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTransactionSchema } from '@/lib/validations/treasury'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/treasury - Buchungen laden (gefiltert, paginiert)
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') // 'income' | 'expense' | null (all)
  const categoryId = searchParams.get('category_id')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const search = searchParams.get('search')
  const includeDeleted = searchParams.get('include_deleted') === 'true'
  const onlyDeleted = searchParams.get('only_deleted') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
  const sortOrder = searchParams.get('sort') === 'asc' ? true : false // default: desc
  const showPayments = searchParams.get('show_payments') === 'true'

  // Determine if payments should be included (only for non-trash, income-compatible views)
  const shouldIncludePayments = showPayments && !onlyDeleted && type !== 'expense'

  // Look up "Mitgliedsbeiträge" system category if needed
  let systemCategory: { id: string; name: string; type: string; icon: string | null; color: string | null } | null = null
  if (shouldIncludePayments) {
    const { data: cat } = await supabase
      .from('transaction_categories')
      .select('id, name, type, icon, color')
      .eq('name', 'Mitgliedsbeiträge')
      .eq('type', 'income')
      .eq('is_system', true)
      .single()
    systemCategory = cat
  }

  // Check if category filter excludes Mitgliedsbeiträge
  let includePaymentsAfterFilter = shouldIncludePayments
  if (shouldIncludePayments && categoryId) {
    const ids = categoryId.split(',').filter((id) => UUID_REGEX.test(id.trim()))
    if (ids.length > 0 && systemCategory && !ids.includes(systemCategory.id)) {
      includePaymentsAfterFilter = false
    }
  }

  // Build query
  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:transaction_categories (
        id,
        name,
        type,
        icon,
        color
      ),
      created_by_profile:profiles!transactions_created_by_fkey (
        id,
        first_name,
        last_name
      ),
      deleted_by_profile:profiles!transactions_deleted_by_fkey (
        id,
        first_name,
        last_name
      )
    `, { count: 'exact' })

  // Filter: Papierkorb (nur gelöschte) oder Standard (nur aktive) oder alle
  if (onlyDeleted) {
    query = query.eq('is_deleted', true)
  } else if (!includeDeleted) {
    query = query.eq('is_deleted', false)
  }

  // Filter: Typ
  if (type && (type === 'income' || type === 'expense')) {
    query = query.eq('type', type)
  }

  // Filter: Kategorie (supports comma-separated IDs for multi-select)
  if (categoryId) {
    const ids = categoryId.split(',').filter((id) => UUID_REGEX.test(id.trim()))
    if (ids.length === 1) {
      query = query.eq('category_id', ids[0])
    } else if (ids.length > 1) {
      query = query.in('category_id', ids)
    }
  }

  // Filter: Datum von
  if (dateFrom) {
    query = query.gte('transaction_date', dateFrom)
  }

  // Filter: Datum bis
  if (dateTo) {
    query = query.lte('transaction_date', dateTo)
  }

  // Filter: Suche in Beschreibung
  if (search && search.trim().length > 0) {
    query = query.ilike('description', `%${search.trim()}%`)
  }

  // When merging payments, we need all transactions (no DB pagination) to merge + sort + paginate in-memory
  if (includePaymentsAfterFilter) {
    query = query
      .order('transaction_date', { ascending: sortOrder })
      .order('created_at', { ascending: sortOrder })

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch payments
    const methodLabels: Record<string, string> = {
      cash: 'Bar',
      transfer: 'Überweisung',
      other: 'Sonstiges',
    }

    let paymentQuery = supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        note,
        created_at,
        fee:membership_fees!payments_fee_id_fkey (
          year,
          profile:profiles!membership_fees_profile_id_fkey (
            first_name,
            last_name
          ),
          family:families!membership_fees_family_id_fkey (
            name
          )
        )
      `)
      .eq('is_cancelled', false)

    if (dateFrom) paymentQuery = paymentQuery.gte('payment_date', dateFrom)
    if (dateTo) paymentQuery = paymentQuery.lte('payment_date', dateTo)

    const { data: payments } = await paymentQuery

    // Map payments to TransactionEntry format
    const searchLower = search?.trim().toLowerCase() || ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentEntries = (payments || []).map((p: any) => {
      const fee = p.fee
      const profile = fee?.profile
      const family = fee?.family
      const memberName = family?.name
        || (profile ? `${profile.first_name} ${profile.last_name}` : 'Unbekannt')
      const year = fee?.year ?? ''

      return {
        id: `payment-${p.id}`,
        type: 'income' as const,
        amount: Number(p.amount),
        transaction_date: p.payment_date,
        description: `Beitrag: ${memberName} (${year})`,
        category: systemCategory,
        category_id: systemCategory?.id ?? null,
        receipt_reference: methodLabels[p.payment_method] || p.payment_method,
        note: p.note,
        is_deleted: false,
        payment_id: p.id,
        created_by_profile: null,
        created_by: null,
        deleted_at: null,
        deletion_reason: null,
        deleted_by_profile: null,
        created_at: p.created_at,
        updated_at: null,
      }
    }).filter((entry: { description: string }) => {
      // Apply search filter to payment entries (transactions already filtered by DB)
      if (!searchLower) return true
      return entry.description.toLowerCase().includes(searchLower)
    })

    // Merge and sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allEntries = [...(transactions || []), ...paymentEntries].sort((a: any, b: any) => {
      const dateA = a.transaction_date
      const dateB = b.transaction_date
      const cmp = dateA.localeCompare(dateB)
      return sortOrder ? cmp : -cmp
    })

    const mergedTotal = allEntries.length
    const paginatedEntries = allEntries.slice(offset, offset + limit)

    return NextResponse.json({
      transactions: paginatedEntries,
      total: mergedTotal,
      limit,
      offset,
    })
  }

  // Standard path: no payment merging
  query = query
    .order('transaction_date', { ascending: sortOrder })
    .order('created_at', { ascending: sortOrder })
    .range(offset, offset + limit - 1)

  const { data: transactions, error, count } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    transactions,
    total: count,
    limit,
    offset,
  })
}

// POST /api/treasury - Buchung erstellen
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

  // Get user's profile ID for created_by
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = createTransactionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Verify category exists and matches type
  const { data: category, error: categoryError } = await supabase
    .from('transaction_categories')
    .select('id, type')
    .eq('id', data.category_id)
    .single()

  if (categoryError || !category) {
    return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
  }

  if (category.type !== data.type) {
    return NextResponse.json({
      error: `Kategorie ist vom Typ "${category.type}", Buchung ist vom Typ "${data.type}"`
    }, { status: 400 })
  }

  // Warn for very high amounts
  if (data.amount > 100000) {
    console.warn(`High transaction amount: ${data.amount}\u20AC, type: ${data.type}, user: ${user.id}`)
  }

  // Insert transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      type: data.type,
      amount: data.amount,
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category_id,
      receipt_reference: data.receipt_reference,
      note: data.note,
      created_by: profile.id,
    })
    .select(`
      *,
      category:transaction_categories (
        id,
        name,
        type,
        icon,
        color
      ),
      created_by_profile:profiles!transactions_created_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction }, { status: 201 })
}
