import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { memberSchema } from '@/lib/validations/member'

// GET /api/members/[id] - Get a single member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 })
  }

  const { data: member, error } = await supabase
    .from('profiles')
    .select(`
      *,
      families!profiles_family_id_fkey (
        id,
        name,
        primary_member_id
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    console.error('Error fetching member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ member })
}

// PATCH /api/members/[id] - Update a member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 })
  }

  // Check if member exists
  const { data: existingMember, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existingMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Use partial validation for updates
  const partialSchema = memberSchema.partial()
  const validation = partialSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {}

  if (data.first_name !== undefined) updateData.first_name = data.first_name
  if (data.last_name !== undefined) updateData.last_name = data.last_name
  if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.role !== undefined) updateData.role = data.role
  if (data.address_street !== undefined) updateData.address_street = data.address_street || null
  if (data.address_zip !== undefined) updateData.address_zip = data.address_zip || null
  if (data.address_city !== undefined) updateData.address_city = data.address_city || null
  if (data.functional_tags !== undefined) updateData.functional_tags = data.functional_tags || []
  if (data.family_id !== undefined) updateData.family_id = data.family_id || null
  if (data.membership_type_id !== undefined) updateData.membership_type_id = data.membership_type_id || null
  if (data.notes !== undefined) updateData.notes = data.notes || null

  // Update timestamp
  updateData.updated_at = new Date().toISOString()

  const { data: member, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      families!profiles_family_id_fkey (
        id,
        name,
        primary_member_id
      )
    `)
    .single()

  if (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ member })
}
