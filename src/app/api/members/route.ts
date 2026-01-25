import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { memberSchema } from '@/lib/validations/member'

// GET /api/members - List all members with pagination, search, and filters
export async function GET(request: NextRequest) {
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const roles = searchParams.get('roles')?.split(',').filter(Boolean) || []
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
  const hasFamily = searchParams.get('hasFamily') // 'true', 'false', or null
  const sortBy = searchParams.get('sortBy') || 'last_name'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true

  // Calculate offset
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('profiles')
    .select(`
      *,
      families!profiles_family_id_fkey (
        id,
        name,
        primary_member_id
      )
    `, { count: 'exact' })

  // Apply search filter (name only - email is in auth.users, not accessible via RLS)
  if (search && search.length >= 2) {
    // Sanitize search input to prevent SQL injection via LIKE pattern characters
    const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.or(`first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%`)
  }

  // Apply role filter
  if (roles.length > 0) {
    query = query.in('role', roles)
  }

  // Apply status filter
  if (statuses.length > 0) {
    query = query.in('status', statuses)
  }

  // Apply family filter
  if (hasFamily === 'true') {
    query = query.not('family_id', 'is', null)
  } else if (hasFamily === 'false') {
    query = query.is('family_id', null)
  }

  // Apply sorting
  const validSortColumns = ['last_name', 'first_name', 'role', 'status', 'created_at']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'last_name'
  query = query.order(sortColumn, { ascending: sortOrder })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: members, error, count } = await query

  if (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    members,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/members - Create a new member (without user account)
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

  const validation = memberSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check for duplicate email if provided
  if (data.email) {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Check in auth.users would require service role
    // For now, we'll rely on the database constraint
  }

  // Create member profile without user_id (manual member without login)
  // Note: This creates a profile without an associated auth user
  // For members with login, use the invitation system
  const { data: member, error } = await supabase
    .from('profiles')
    .insert({
      user_id: crypto.randomUUID(), // Generate a placeholder UUID for manual members
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      phone: data.phone || null,
      role: data.role,
      address_street: data.address_street || null,
      address_zip: data.address_zip || null,
      address_city: data.address_city || null,
      functional_tags: data.functional_tags || [],
      family_id: data.family_id || null,
      notes: data.notes || null,
      status: 'active',
      is_active: true
    })
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
    console.error('Error creating member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ member }, { status: 201 })
}
