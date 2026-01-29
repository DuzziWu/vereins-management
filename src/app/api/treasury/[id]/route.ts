import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateTransactionSchema, deleteTransactionSchema } from '@/lib/validations/treasury'
import type { Json } from '@/lib/database.types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Felder die im Audit-Log getrackt werden
const AUDITABLE_FIELDS = ['type', 'amount', 'transaction_date', 'description', 'category_id', 'receipt_reference', 'note'] as const

// GET /api/treasury/:id - Einzelne Buchung laden
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
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 })
  }

  const { data: transaction, error } = await supabase
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
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
    }
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction })
}

// PATCH /api/treasury/:id - Buchung bearbeiten
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
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 })
  }

  // Check if transaction exists and is not deleted (fetch all auditable fields for diff)
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('id, is_deleted, payment_id, type, amount, transaction_date, description, category_id, receipt_reference, note')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  if (existing.is_deleted) {
    return NextResponse.json({
      error: 'Gel\u00F6schte Buchungen k\u00F6nnen nicht bearbeitet werden'
    }, { status: 400 })
  }

  if (existing.payment_id) {
    return NextResponse.json({
      error: 'System-generierte Beitragsbuchungen k\u00F6nnen nicht bearbeitet werden'
    }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updateTransactionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // If category_id is being changed, verify it exists and matches type
  if (data.category_id) {
    const effectiveType = data.type || (await supabase
      .from('transactions')
      .select('type')
      .eq('id', id)
      .single()
    ).data?.type

    const { data: category, error: categoryError } = await supabase
      .from('transaction_categories')
      .select('id, type')
      .eq('id', data.category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
    }

    if (effectiveType && category.type !== effectiveType) {
      return NextResponse.json({
        error: `Kategorie ist vom Typ "${category.type}", Buchung ist vom Typ "${effectiveType}"`
      }, { status: 400 })
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.transaction_date !== undefined) updateData.transaction_date = data.transaction_date
  if (data.description !== undefined) updateData.description = data.description
  if (data.category_id !== undefined) updateData.category_id = data.category_id
  if (data.receipt_reference !== undefined) updateData.receipt_reference = data.receipt_reference
  if (data.note !== undefined) updateData.note = data.note

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Keine \u00C4nderungen angegeben' }, { status: 400 })
  }

  // Get user's profile ID for audit log
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // Build audit log: compare old vs new values
  const changes: Record<string, { old: Json; new: Json }> = {}
  const changedFields: string[] = []

  for (const field of AUDITABLE_FIELDS) {
    if (field in updateData) {
      const oldVal = existing[field as keyof typeof existing] as Json
      const newVal = updateData[field] as Json
      if (oldVal !== newVal) {
        changes[field] = { old: oldVal, new: newVal }
        changedFields.push(field)
      }
    }
  }

  // Update transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
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
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Write audit log entry (non-blocking, don't fail the request if audit fails)
  if (changedFields.length > 0) {
    const { error: auditError } = await supabase
      .from('transaction_audit_log')
      .insert({
        transaction_id: id,
        changed_by: profile.id,
        change_type: 'update',
        changes,
        changed_fields: changedFields,
      })

    if (auditError) {
      console.error('Error writing audit log:', auditError)
    }
  }

  return NextResponse.json({ transaction })
}

// DELETE /api/treasury/:id - Buchung soft-deleten
export async function DELETE(
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
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 })
  }

  // Get user's profile ID for deleted_by
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // Check if transaction exists and is not already deleted
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('id, is_deleted')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  if (existing.is_deleted) {
    return NextResponse.json({ error: 'Buchung ist bereits gel\u00F6scht' }, { status: 400 })
  }

  // Parse and validate request body (deletion reason)
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = deleteTransactionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Soft delete
  const { data: transaction, error } = await supabase
    .from('transactions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: profile.id,
      deletion_reason: data.deletion_reason,
    })
    .eq('id', id)
    .select(`
      *,
      category:transaction_categories (
        id,
        name,
        type,
        icon,
        color
      ),
      deleted_by_profile:profiles!transactions_deleted_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .single()

  if (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Write audit log for deletion
  const { error: auditError } = await supabase
    .from('transaction_audit_log')
    .insert({
      transaction_id: id,
      changed_by: profile.id,
      change_type: 'delete',
      changes: { deletion_reason: data.deletion_reason },
      changed_fields: ['is_deleted'],
    })

  if (auditError) {
    console.error('Error writing audit log:', auditError)
  }

  return NextResponse.json({ transaction })
}
