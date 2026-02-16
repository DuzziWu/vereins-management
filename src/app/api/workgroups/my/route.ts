import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/workgroups/my - Get workgroups where the current user is a member
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Get workgroup IDs where user is a member
  const { data: memberships, error: membershipError } = await supabase
    .from('workgroup_members')
    .select('workgroup_id')
    .eq('profile_id', profile.id)

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError)
    return NextResponse.json({ error: membershipError.message }, { status: 500 })
  }

  const workgroupIds = (memberships || []).map(m => m.workgroup_id)

  if (workgroupIds.length === 0) {
    return NextResponse.json({ workgroups: [] })
  }

  // Fetch workgroups with details
  const { data: workgroups, error: workgroupsError } = await supabase
    .from('workgroups')
    .select(`
      *,
      category:workgroup_categories(id, name),
      created_by_profile:profiles!workgroups_created_by_fkey(id, first_name, last_name)
    `)
    .in('id', workgroupIds)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (workgroupsError) {
    console.error('Error fetching workgroups:', workgroupsError)
    return NextResponse.json({ error: workgroupsError.message }, { status: 500 })
  }

  // Enrich workgroups with members preview (batch query to avoid N+1)
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

  const enrichedWorkgroups = (workgroups || []).map((workgroup) => {
    const memberData = membersByWorkgroup.get(workgroup.id)
    return {
      ...workgroup,
      member_count: memberData?.count ?? 0,
      members: memberData?.members.slice(0, 5) ?? [],
    }
  })

  return NextResponse.json({ workgroups: enrichedWorkgroups })
}
