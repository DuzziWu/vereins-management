import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import DashboardHeader from '@/components/dashboard-header'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { MembersPageClient } from './members-page-client'

export const metadata = {
  title: 'Mitglieder | ClubGrid',
}

export default async function MembersPage() {
  const supabase = await createClient()

  // Get current user and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, club:clubs(*)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect(`/${profile?.role || 'player'}`)
  }

  const clubId = profile.club_id

  // Fetch all members of the club
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      avatar_url,
      created_at,
      team_members(
        team:teams(id, name)
      )
    `)
    .eq('club_id', clubId)
    .order('full_name')

  if (membersError) {
    console.error('Error fetching members:', membersError)
  }

  // Fetch all teams for the club
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('club_id', clubId)
    .order('name')

  // Fetch all invites for the club
  const { data: invites } = await supabase
    .from('club_invites')
    .select(`
      *,
      created_by_profile:profiles!club_invites_created_by_fkey(full_name)
    `)
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })

  // Transform members data
  const transformedMembers = members?.map(member => ({
    id: member.id,
    name: member.full_name || 'Unbekannt',
    role: member.role,
    team: member.team_members?.[0]?.team?.name || 'Nicht zugewiesen',
    teamId: member.team_members?.[0]?.team?.id || null,
    avatarUrl: member.avatar_url,
    createdAt: member.created_at,
  })) || []

  // Count pending invites for badge
  const pendingInvitesCount = invites?.filter(
    i => !i.used_at && new Date(i.expires_at) >= new Date()
  ).length || 0

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Admin'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Vereins-Admin'}
        clubName={profile.club?.name || 'FC Digital'}
        isAdmin={true}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={profile.club?.logo_url}
      />

      <main className="container mx-auto px-6 py-12">
        <Link href="/admin">
          <Button
            variant="outline"
            className="mb-8 h-11 border-2 border-border hover:border-primary bg-transparent hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Button>
        </Link>

        <MembersPageClient
          initialMembers={transformedMembers}
          teams={teams || []}
          clubId={clubId}
          initialInvites={invites || []}
          pendingInvitesCount={pendingInvitesCount}
        />
      </main>
    </div>
  )
}
