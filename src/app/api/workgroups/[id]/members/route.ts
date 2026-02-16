import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { workgroupMembersSchema } from '@/lib/validations/workgroups'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/workgroups/[id]/members - Get all members of a workgroup
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Check if workgroup exists (RLS will handle access)
  const { data: workgroup, error: workgroupError } = await supabase
    .from('workgroups')
    .select('id')
    .eq('id', id)
    .single()

  if (workgroupError) {
    if (workgroupError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup:', workgroupError)
    return NextResponse.json({ error: workgroupError.message }, { status: 500 })
  }

  // Fetch all members
  const { data: members, error } = await supabase
    .from('workgroup_members')
    .select(`
      id,
      joined_at,
      profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name, role)
    `)
    .eq('workgroup_id', id)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('Error fetching workgroup members:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    members: members?.map(m => ({
      membership_id: m.id,
      joined_at: m.joined_at,
      ...m.profile,
    })) ?? []
  })
}

// POST /api/workgroups/[id]/members - Add members to a workgroup (Vorstand only)
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Check if workgroup exists
  const { data: workgroup, error: workgroupError } = await supabase
    .from('workgroups')
    .select('id')
    .eq('id', id)
    .single()

  if (workgroupError) {
    if (workgroupError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup:', workgroupError)
    return NextResponse.json({ error: workgroupError.message }, { status: 500 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = workgroupMembersSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { profile_ids } = validation.data

  // Get existing members to avoid duplicates
  const { data: existingMembers } = await supabase
    .from('workgroup_members')
    .select('profile_id')
    .eq('workgroup_id', id)

  const existingProfileIds = new Set((existingMembers || []).map(m => m.profile_id))
  const newProfileIds = profile_ids.filter(pid => !existingProfileIds.has(pid))

  if (newProfileIds.length === 0) {
    return NextResponse.json({
      message: 'Alle Mitglieder sind bereits in der Workgroup',
      added: 0
    })
  }

  // Insert new members
  const memberRows = newProfileIds.map((profileId) => ({
    workgroup_id: id,
    profile_id: profileId,
  }))

  const { error: insertError } = await supabase
    .from('workgroup_members')
    .insert(memberRows)

  if (insertError) {
    console.error('Error adding workgroup members:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Fetch updated member list
  const { data: members } = await supabase
    .from('workgroup_members')
    .select(`
      id,
      joined_at,
      profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name, role)
    `)
    .eq('workgroup_id', id)
    .order('joined_at', { ascending: true })

  return NextResponse.json({
    message: `${newProfileIds.length} Mitglied(er) hinzugefügt`,
    added: newProfileIds.length,
    members: members?.map(m => ({
      membership_id: m.id,
      joined_at: m.joined_at,
      ...m.profile,
    })) ?? []
  }, { status: 201 })
}

// DELETE /api/workgroups/[id]/members - Remove members from a workgroup (Vorstand only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid workgroup ID format' }, { status: 400 })
  }

  // Check if workgroup exists
  const { data: workgroup, error: workgroupError } = await supabase
    .from('workgroups')
    .select('id, created_by')
    .eq('id', id)
    .single()

  if (workgroupError) {
    if (workgroupError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Workgroup not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup:', workgroupError)
    return NextResponse.json({ error: workgroupError.message }, { status: 500 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = workgroupMembersSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { profile_ids } = validation.data

  // E-1: Check that we're not removing the creator (last member check)
  const { count: currentMemberCount } = await supabase
    .from('workgroup_members')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', id)

  const { count: membersToRemoveCount } = await supabase
    .from('workgroup_members')
    .select('*', { count: 'exact', head: true })
    .eq('workgroup_id', id)
    .in('profile_id', profile_ids)

  if ((currentMemberCount || 0) - (membersToRemoveCount || 0) < 1) {
    return NextResponse.json({
      error: 'Mindestens ein Mitglied muss der Workgroup zugewiesen sein'
    }, { status: 400 })
  }

  // E-1: Check if creator would be removed (creator must remain)
  if (profile_ids.includes(workgroup.created_by)) {
    const { count: otherMembersCount } = await supabase
      .from('workgroup_members')
      .select('*', { count: 'exact', head: true })
      .eq('workgroup_id', id)
      .not('profile_id', 'in', `(${profile_ids.join(',')})`)

    if ((otherMembersCount || 0) === 0) {
      return NextResponse.json({
        error: 'Der Ersteller kann nicht entfernt werden, wenn keine anderen Mitglieder verbleiben'
      }, { status: 400 })
    }
  }

  // Remove members
  const { error: deleteError } = await supabase
    .from('workgroup_members')
    .delete()
    .eq('workgroup_id', id)
    .in('profile_id', profile_ids)

  if (deleteError) {
    console.error('Error removing workgroup members:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Fetch updated member list
  const { data: members } = await supabase
    .from('workgroup_members')
    .select(`
      id,
      joined_at,
      profile:profiles!workgroup_members_profile_id_fkey(id, first_name, last_name, role)
    `)
    .eq('workgroup_id', id)
    .order('joined_at', { ascending: true })

  return NextResponse.json({
    message: `${membersToRemoveCount || 0} Mitglied(er) entfernt`,
    removed: membersToRemoveCount || 0,
    members: members?.map(m => ({
      membership_id: m.id,
      joined_at: m.joined_at,
      ...m.profile,
    })) ?? []
  })
}
