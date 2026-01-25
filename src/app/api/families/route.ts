import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { familySchema } from '@/lib/validations/member'

// GET /api/families - List all families with their members
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
  const search = searchParams.get('search') || ''

  // Build query
  let query = supabase
    .from('families')
    .select(`
      *,
      primary_member:profiles!families_primary_member_id_fkey (
        id,
        first_name,
        last_name
      ),
      members:profiles!profiles_family_id_fkey (
        id,
        first_name,
        last_name,
        role,
        status
      )
    `)
    .order('name', { ascending: true })

  // Apply search filter
  if (search && search.length >= 2) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: families, error } = await query

  if (error) {
    console.error('Error fetching families:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add member count to each family
  const familiesWithCount = families?.map(family => ({
    ...family,
    member_count: family.members?.length || 0
  }))

  return NextResponse.json({ families: familiesWithCount })
}

// POST /api/families - Create a new family
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

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = familySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { name, primary_member_id, member_ids } = validation.data

  // Verify primary_member_id is in member_ids
  if (!member_ids.includes(primary_member_id)) {
    return NextResponse.json({
      error: 'Primary member must be one of the selected members'
    }, { status: 400 })
  }

  // Verify all member_ids exist
  const { data: existingMembers, error: memberCheckError } = await supabase
    .from('profiles')
    .select('id')
    .in('id', member_ids)

  if (memberCheckError) {
    console.error('Error checking members:', memberCheckError)
    return NextResponse.json({ error: memberCheckError.message }, { status: 500 })
  }

  if (!existingMembers || existingMembers.length !== member_ids.length) {
    return NextResponse.json({
      error: 'One or more selected members do not exist'
    }, { status: 400 })
  }

  // Create the family
  const { data: family, error: createError } = await supabase
    .from('families')
    .insert({
      name,
      primary_member_id
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating family:', createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Update all selected members to belong to this family
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, updated_at: new Date().toISOString() })
    .in('id', member_ids)

  if (updateError) {
    console.error('Error assigning members to family:', updateError)
    // Try to clean up the created family
    await supabase.from('families').delete().eq('id', family.id)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fetch the complete family with members
  const { data: completeFamily, error: fetchError } = await supabase
    .from('families')
    .select(`
      *,
      primary_member:profiles!families_primary_member_id_fkey (
        id,
        first_name,
        last_name
      ),
      members:profiles!profiles_family_id_fkey (
        id,
        first_name,
        last_name,
        role,
        status
      )
    `)
    .eq('id', family.id)
    .single()

  if (fetchError) {
    console.error('Error fetching created family:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json({
    family: {
      ...completeFamily,
      member_count: completeFamily.members?.length || 0
    }
  }, { status: 201 })
}
