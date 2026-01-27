import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSchema } from '@/lib/validations/payment'

// GET /api/payments?fee_id= - Zahlungen für einen Beitrag laden
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
  const feeId = searchParams.get('fee_id')

  if (!feeId) {
    return NextResponse.json({ error: 'fee_id parameter required' }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(feeId)) {
    return NextResponse.json({ error: 'Invalid fee_id format' }, { status: 400 })
  }

  // Fetch payments for the fee with creator info
  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      created_by_profile:profiles!payments_created_by_fkey (
        id,
        first_name,
        last_name
      ),
      cancelled_by_profile:profiles!payments_cancelled_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq('fee_id', feeId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also fetch the fee details
  const { data: fee, error: feeError } = await supabase
    .from('membership_fees')
    .select(`
      id,
      year,
      amount_due,
      amount_paid,
      profile_id,
      family_id,
      profiles!membership_fees_profile_id_fkey (
        id,
        first_name,
        last_name
      ),
      families!membership_fees_family_id_fkey (
        id,
        name
      )
    `)
    .eq('id', feeId)
    .single()

  if (feeError) {
    console.error('Error fetching fee:', feeError)
    return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
  }

  return NextResponse.json({ payments, fee })
}

// POST /api/payments - Zahlung erfassen
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

  const validation = createPaymentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Verify fee exists
  const { data: fee, error: feeError } = await supabase
    .from('membership_fees')
    .select('id, year')
    .eq('id', data.fee_id)
    .single()

  if (feeError || !fee) {
    return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
  }

  // Validate payment date is not before fee year
  const paymentDate = new Date(data.payment_date)
  if (paymentDate.getFullYear() < fee.year) {
    return NextResponse.json({
      error: `Zahlungsdatum kann nicht vor dem Beitragsjahr ${fee.year} liegen`
    }, { status: 400 })
  }

  // Warn for very high amounts (but allow)
  if (data.amount > 10000) {
    console.warn(`High payment amount: ${data.amount}€ for fee ${data.fee_id}`)
  }

  // Insert payment
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      fee_id: data.fee_id,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      note: data.note,
      created_by: profile.id,
    })
    .select(`
      *,
      created_by_profile:profiles!payments_created_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .single()

  if (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch updated fee info
  const { data: updatedFee } = await supabase
    .from('membership_fees')
    .select('amount_due, amount_paid')
    .eq('id', data.fee_id)
    .single()

  return NextResponse.json({
    payment,
    updatedFee
  }, { status: 201 })
}
