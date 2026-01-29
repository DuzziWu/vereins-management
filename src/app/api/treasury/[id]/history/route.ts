import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/treasury/:id/history - Änderungshistorie einer Buchung
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

  // Check if transaction exists
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .single()

  if (txError || !transaction) {
    return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
  }

  // Fetch audit log entries
  const { data: history, error } = await supabase
    .from('transaction_audit_log')
    .select(`
      id,
      change_type,
      changes,
      changed_fields,
      changed_at,
      changed_by_profile:profiles!transaction_audit_log_changed_by_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq('transaction_id', id)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('Error fetching audit history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ history })
}
