import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentSchema } from '@/lib/validations/payment'

// PATCH /api/payments/:id - Zahlung bearbeiten (nur Notiz und Zahlungsart)
export async function PATCH(
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid payment ID format' }, { status: 400 })
  }

  // Check if payment exists and is not cancelled
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('id, is_cancelled')
    .eq('id', id)
    .single()

  if (fetchError || !existingPayment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (existingPayment.is_cancelled) {
    return NextResponse.json({
      error: 'Stornierte Zahlungen können nicht bearbeitet werden'
    }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updatePaymentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Build update object (only allowed fields)
  const updateData: Record<string, unknown> = {}
  if (data.payment_method !== undefined) {
    updateData.payment_method = data.payment_method
  }
  if (data.note !== undefined) {
    updateData.note = data.note
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Update payment
  const { data: payment, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
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
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payment })
}

// GET /api/payments/:id - Einzelne Zahlung laden
export async function GET(
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid payment ID format' }, { status: 400 })
  }

  const { data: payment, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  return NextResponse.json({ payment })
}
