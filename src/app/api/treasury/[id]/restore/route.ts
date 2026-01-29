import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 30 Tage in Millisekunden
const RESTORE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

// POST /api/treasury/:id/restore - Gelöschte Buchung wiederherstellen
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

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 })
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

  // Check if transaction exists and is deleted
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('id, is_deleted, deleted_at, deletion_reason')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  if (!existing.is_deleted) {
    return NextResponse.json({ error: 'Buchung ist nicht gelöscht' }, { status: 400 })
  }

  // Check 30-day restore window
  if (existing.deleted_at) {
    const deletedAt = new Date(existing.deleted_at).getTime()
    const now = Date.now()
    if (now - deletedAt > RESTORE_WINDOW_MS) {
      return NextResponse.json({
        error: 'Wiederherstellung nicht möglich: Löschung ist älter als 30 Tage'
      }, { status: 400 })
    }
  }

  // Restore transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      deletion_reason: null,
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
      created_by_profile:profiles!transactions_created_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .single()

  if (error) {
    console.error('Error restoring transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Write audit log for restore
  const { error: auditError } = await supabase
    .from('transaction_audit_log')
    .insert({
      transaction_id: id,
      changed_by: profile.id,
      change_type: 'restore',
      changes: {
        restored_from: {
          deleted_at: existing.deleted_at,
          deletion_reason: existing.deletion_reason,
        },
      },
      changed_fields: ['is_deleted'],
    })

  if (auditError) {
    console.error('Error writing audit log:', auditError)
  }

  return NextResponse.json({ transaction })
}
