import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cancelPaymentSchema } from '@/lib/validations/payment'

// POST /api/payments/:id/cancel - Zahlung stornieren
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

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

  // Get user's profile ID for cancelled_by
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid payment ID format' }, { status: 400 })
  }

  // Check if payment exists and is not already cancelled
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('id, fee_id, amount, is_cancelled')
    .eq('id', id)
    .single()

  if (fetchError || !existingPayment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (existingPayment.is_cancelled) {
    return NextResponse.json({
      error: 'Zahlung ist bereits storniert'
    }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = cancelPaymentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { cancellation_reason } = validation.data

  // Cancel the payment
  const { data: payment, error } = await supabase
    .from('payments')
    .update({
      is_cancelled: true,
      cancellation_reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: profile.id,
    })
    .eq('id', id)
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
    .single()

  if (error) {
    console.error('Error cancelling payment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch updated fee info (trigger should have updated amount_paid)
  const { data: updatedFee } = await supabase
    .from('membership_fees')
    .select('amount_due, amount_paid')
    .eq('id', existingPayment.fee_id)
    .single()

  return NextResponse.json({
    payment,
    updatedFee
  })
}
