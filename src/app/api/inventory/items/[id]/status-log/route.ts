import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// GET /api/inventory/items/[id]/status-log - Get status history for an item
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (only Vorstand can see full status log)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 })
  }

  // Fetch status log
  const { data: log, error } = await supabase
    .from('inventory_status_log')
    .select(`
      *,
      changed_by_profile:profiles!inventory_status_log_changed_by_fkey(first_name, last_name),
      holder:profiles!inventory_status_log_holder_id_fkey(first_name, last_name)
    `)
    .eq('item_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching status log:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log })
}
