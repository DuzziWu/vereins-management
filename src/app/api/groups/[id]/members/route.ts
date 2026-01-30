import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Helper: Check if the current user is Vorstand or a trainer/co-trainer of the given group.
 * Returns { allowed: true, profile } or { allowed: false, response }.
 */
async function checkGroupAccess(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, groupId: string) {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', userId)
    .single()

  if (!profile) {
    return {
      allowed: false as const,
      response: NextResponse.json({ error: 'Profile not found' }, { status: 404 }),
    }
  }

  // Vorstand has full access
  if (profile.role === 'vorstand') {
    return { allowed: true as const, profile }
  }

  // Check if user is the main trainer
  const { data: group } = await supabase
    .from('groups')
    .select('trainer_id')
    .eq('id', groupId)
    .single()

  if (!group) {
    return {
      allowed: false as const,
      response: NextResponse.json({ error: 'Group not found' }, { status: 404 }),
    }
  }

  if (group.trainer_id === profile.id) {
    return { allowed: true as const, profile }
  }

  // Check if user is a co-trainer
  const { data: coTrainerEntry } = await supabase
    .from('group_trainers')
    .select('id')
    .eq('group_id', groupId)
    .eq('profile_id', profile.id)
    .maybeSingle()

  if (coTrainerEntry) {
    return { allowed: true as const, profile }
  }

  return {
    allowed: false as const,
    response: NextResponse.json(
      { error: 'Forbidden: Only Vorstand or assigned trainer/co-trainer can manage members' },
      { status: 403 }
    ),
  }
}

// POST /api/groups/[id]/members - Add a member to the group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check access
  const access = await checkGroupAccess(supabase, user.id, groupId)
  if (!access.allowed) {
    return access.response
  }

  // Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { profile_id } = body
  if (!profile_id || typeof profile_id !== 'string') {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(profile_id)) {
    return NextResponse.json({ error: 'Invalid profile_id format' }, { status: 400 })
  }

  // Check if member is already in the group
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('profile_id', profile_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Mitglied ist bereits in dieser Gruppe' }, { status: 409 })
  }

  // Check max_members limit
  const { data: group } = await supabase
    .from('groups')
    .select('max_members')
    .eq('id', groupId)
    .single()

  if (group?.max_members) {
    const { data: memberCount } = await supabase.rpc('get_group_member_count', { p_group_id: groupId })
    if (memberCount !== null && memberCount >= group.max_members) {
      // Return a warning but still allow adding (not blocking per spec)
      // The frontend can choose to show this warning
    }
  }

  // Insert member
  const { data: member, error: insertError } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, profile_id })
    .select('id, group_id, profile_id, created_at')
    .single()

  if (insertError) {
    console.error('Error adding member to group:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ member }, { status: 201 })
}

// DELETE /api/groups/[id]/members - Remove a member from the group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check access
  const access = await checkGroupAccess(supabase, user.id, groupId)
  if (!access.allowed) {
    return access.response
  }

  // Get profile_id from query params or body
  let profileId: string | null = request.nextUrl.searchParams.get('profile_id')

  if (!profileId) {
    try {
      const body = await request.json()
      profileId = body.profile_id
    } catch {
      // No body provided
    }
  }

  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(profileId)) {
    return NextResponse.json({ error: 'Invalid profile_id format' }, { status: 400 })
  }

  // Delete the membership
  const { error: deleteError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', profileId)

  if (deleteError) {
    console.error('Error removing member from group:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Mitglied aus Gruppe entfernt' })
}
