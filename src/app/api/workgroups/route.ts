import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { workgroupSchema } from '@/lib/validations/workgroups'

// GET /api/workgroups - List workgroups with pagination, search, and role-based filtering
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isVorstand = profile.role === 'vorstand'

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'active'
  const categoryId = searchParams.get('category_id') || ''
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('workgroups')
    .select(`
      *,
      category:workgroup_categories(id, name),
      created_by_profile:profiles!workgroups_created_by_fkey(id, first_name, last_name)
    `, { count: 'exact' })

  // Apply status filter (Vorstand can see archived, others only active)
  if (isVorstand && status === 'archived') {
    query = query.eq('status', 'archived')
  } else if (isVorstand && status === 'all') {
    // No status filter for Vorstand viewing all
  } else {
    query = query.eq('status', 'active')
  }

  // Apply category filter
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  // Apply search filter
  if (search && search.length >= 2) {
    const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('name', `%${sanitizedSearch}%`)
  }

  // Apply sorting
  const validSortColumns = ['name', 'created_at', 'updated_at']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name'
  query = query.order(sortColumn, { ascending: sortOrder })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: workgroups, error, count } = await query

  if (error) {
    console.error('Error fetching workgroups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich workgroups with member_count (batch query to avoid N+1)
  const workgroupIds = (workgroups || []).map(w => w.id)
  let enrichedWorkgroups = workgroups || []

  if (workgroupIds.length > 0) {
    const { data: allMembers } = await supabase
      .from('workgroup_members')
      .select('workgroup_id, profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name)')
      .in('workgroup_id', workgroupIds)

    const membersByWorkgroup = new Map<string, { count: number; members: Array<{ id: string; first_name: string; last_name: string }> }>()
    for (const member of (allMembers || [])) {
      const workgroupId = member.workgroup_id
      if (!membersByWorkgroup.has(workgroupId)) {
        membersByWorkgroup.set(workgroupId, { count: 0, members: [] })
      }
      const entry = membersByWorkgroup.get(workgroupId)!
      entry.count++
      const memberProfile = member.profile as { id: string; first_name: string; last_name: string } | null
      if (memberProfile) {
        entry.members.push({
          id: memberProfile.id,
          first_name: memberProfile.first_name,
          last_name: memberProfile.last_name,
        })
      }
    }

    enrichedWorkgroups = (workgroups || []).map((workgroup) => {
      const memberData = membersByWorkgroup.get(workgroup.id)
      return {
        ...workgroup,
        member_count: memberData?.count ?? 0,
        members_preview: memberData?.members.slice(0, 5) ?? [],
      }
    })
  }

  return NextResponse.json({
    workgroups: enrichedWorkgroups,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/workgroups - Create a new workgroup (Vorstand only)
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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = workgroupSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if creator is in member list (E-1: mindestens der Ersteller muss Mitglied sein)
  const memberIds = data.member_ids || []
  if (!memberIds.includes(profile.id)) {
    memberIds.push(profile.id)
  }

  // Check for duplicate name (E-3: Warnung, aber erlaubt)
  const escapedName = data.name.replace(/[%_\\]/g, '\\$&')
  const { data: existingWorkgroup } = await supabase
    .from('workgroups')
    .select('id, name')
    .ilike('name', escapedName)
    .eq('status', 'active')
    .maybeSingle()

  const duplicateWarning = existingWorkgroup
    ? `Eine Workgroup mit dem Namen "${existingWorkgroup.name}" existiert bereits.`
    : null

  // Insert workgroup
  const { data: workgroup, error: insertError } = await supabase
    .from('workgroups')
    .insert({
      name: data.name,
      description: data.description || null,
      category_id: data.category_id || null,
      created_by: profile.id,
    })
    .select(`
      *,
      category:workgroup_categories(id, name),
      created_by_profile:profiles!workgroups_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating workgroup:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Insert members
  if (memberIds.length > 0) {
    const memberRows = memberIds.map((profileId) => ({
      workgroup_id: workgroup.id,
      profile_id: profileId,
    }))

    const { error: membersError } = await supabase
      .from('workgroup_members')
      .insert(memberRows)

    if (membersError) {
      console.error('Error adding workgroup members:', membersError)
      // Don't fail the request, but log the error
    }
  }

  // Fetch member count for response
  const { count: memberCount } = await supabase
    .from('workgroup_members')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', workgroup.id)

  return NextResponse.json({
    workgroup: {
      ...workgroup,
      member_count: memberCount || 0,
    },
    warning: duplicateWarning,
  }, { status: 201 })
}
