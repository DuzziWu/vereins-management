import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/membership-types - List all membership types
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (board member)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Fetch membership types
  const { data: membershipTypes, error } = await supabase
    .from('membership_types')
    .select('id, name, annual_fee')
    .order('name')

  if (error) {
    console.error('Error fetching membership types:', error)
    return NextResponse.json({ error: 'Failed to fetch membership types' }, { status: 500 })
  }

  return NextResponse.json({ membershipTypes: membershipTypes || [] })
}
