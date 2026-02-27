import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { groupSchema } from '@/lib/validations/group'

// Helper: calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// GET /api/groups - List groups with pagination, search, and role-based filtering
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
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true
  const offset = (page - 1) * limit

  // Determine which group IDs the user has access to
  let accessibleGroupIds: string[] | null = null // null means all groups

  if (isVorstand) {
    // Vorstand sees all groups
    accessibleGroupIds = null
  } else if (profile.role === 'trainer') {
    // Trainer sees groups where they are trainer or co-trainer
    const [trainerResult, coTrainerResult] = await Promise.all([
      supabase
        .from('groups')
        .select('id')
        .eq('trainer_id', profile.id)
        .eq('is_active', true),
      supabase
        .from('group_trainers')
        .select('group_id')
        .eq('profile_id', profile.id),
    ])

    const trainerIds = (trainerResult.data || []).map((g) => g.id)
    const coTrainerIds = (coTrainerResult.data || []).map((ct) => ct.group_id)
    accessibleGroupIds = [...new Set([...trainerIds, ...coTrainerIds])]
  } else {
    // Mitglied sees groups they are a member of
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('profile_id', profile.id)

    accessibleGroupIds = (memberGroups || []).map((mg) => mg.group_id)
  }

  // Build query
  let query = supabase
    .from('groups')
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `, { count: 'exact' })

  // BUG-12: Vorstand sees all groups (including inactive), others only active
  if (!isVorstand) {
    query = query.eq('is_active', true)
  }

  // Apply role-based filtering
  if (accessibleGroupIds !== null) {
    if (accessibleGroupIds.length === 0) {
      // No accessible groups - return empty result
      return NextResponse.json({
        groups: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }
    query = query.in('id', accessibleGroupIds)
  }

  // Apply search filter
  if (search && search.length >= 2) {
    const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('name', `%${sanitizedSearch}%`)
  }

  // Apply sorting
  const validSortColumns = ['name', 'created_at', 'training_day']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name'
  query = query.order(sortColumn, { ascending: sortOrder })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: groups, error, count } = await query

  if (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // BUG-11: Batch enrich groups with member_count and age_range (avoids N+1 queries)
  const groupIds = (groups || []).map(g => g.id)
  let enrichedGroups = groups || []

  if (groupIds.length > 0) {
    const { data: allGroupMembers } = await supabase
      .from('group_members')
      .select('group_id, profile:profiles!group_members_profile_id_fkey(date_of_birth)')
      .in('group_id', groupIds)

    const membersByGroup = new Map<string, { count: number; ages: number[] }>()
    for (const gm of (allGroupMembers || [])) {
      const groupId = gm.group_id
      if (!membersByGroup.has(groupId)) {
        membersByGroup.set(groupId, { count: 0, ages: [] })
      }
      const entry = membersByGroup.get(groupId)!
      entry.count++
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberProfile = gm.profile as any
      if (memberProfile?.date_of_birth) {
        entry.ages.push(calculateAge(memberProfile.date_of_birth))
      }
    }

    enrichedGroups = (groups || []).map((group) => {
      const memberData = membersByGroup.get(group.id)
      const memberCount = memberData?.count ?? 0
      let ageRange = 'Keine Mitglieder'

      if (memberData && memberData.ages.length > 0) {
        const minAge = Math.min(...memberData.ages)
        const maxAge = Math.max(...memberData.ages)
        ageRange = minAge === maxAge ? `${minAge} Jahre` : `${minAge} - ${maxAge} Jahre`
      }

      return {
        ...group,
        member_count: memberCount,
        age_range: ageRange,
      }
    })
  }

  return NextResponse.json({
    groups: enrichedGroups,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/groups - Create a new group (Vorstand only)
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

  const validation = groupSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // BUG-9: Server-side validation - trainer cannot be co-trainer
  if (data.co_trainer_ids && data.co_trainer_ids.includes(data.trainer_id)) {
    return NextResponse.json({ error: 'Diese Person ist bereits als Trainer zugewiesen' }, { status: 400 })
  }

  // BUG-1: Case-insensitive check for duplicate group name
  const escapedName = data.name.replace(/[%_\\]/g, '\\$&')
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id')
    .ilike('name', escapedName)
    .eq('is_active', true)
    .maybeSingle()

  if (existingGroup) {
    return NextResponse.json({ error: 'Eine Gruppe mit diesem Namen existiert bereits' }, { status: 409 })
  }

  // Insert group
  const { data: group, error: insertError } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      description: data.description || null,
      training_day: data.training_day || null,
      training_start_time: data.training_start_time || null,
      training_end_time: data.training_end_time || null,
      training_location: data.training_location || null,
      max_members: data.max_members ?? null,
      chat_enabled: data.chat_enabled,
      trainer_id: data.trainer_id,
    })
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating group:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Insert co-trainers if provided (filter out trainer_id for safety - BUG-9)
  const coTrainerIds = (data.co_trainer_ids || []).filter(ctId => ctId !== data.trainer_id)
  if (coTrainerIds.length > 0) {
    const coTrainerRows = coTrainerIds.map((profileId) => ({
      group_id: group.id,
      profile_id: profileId,
      role: 'co_trainer',
    }))

    const { error: coTrainerError } = await supabase
      .from('group_trainers')
      .insert(coTrainerRows)

    if (coTrainerError) {
      console.error('Error adding co-trainers:', coTrainerError)
    }
  }

  // Insert members if provided
  if (data.member_ids && data.member_ids.length > 0) {
    const memberRows = data.member_ids.map((profileId) => ({
      group_id: group.id,
      profile_id: profileId,
    }))

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberRows)

    if (membersError) {
      console.error('Error adding members:', membersError)
    }
  }

  return NextResponse.json({ group }, { status: 201 })
}
