import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import DashboardHeader from '@/components/dashboard-header'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { TeamsClient } from './teams-client'

export const metadata = {
  title: 'Mannschaften | ClubGrid',
}

export default async function TeamsPage() {
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

  // Fetch all teams with member count
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      league,
      created_at,
      team_members(count)
    `)
    .eq('club_id', clubId)
    .order('name')

  if (teamsError) {
    console.error('Error fetching teams:', teamsError)
  }

  // Transform teams data
  const transformedTeams = teams?.map(team => ({
    id: team.id,
    name: team.name,
    league: team.league || '',
    memberCount: team.team_members?.[0]?.count || 0,
    createdAt: team.created_at,
  })) || []

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

        <TeamsClient initialTeams={transformedTeams} />
      </main>
    </div>
  )
}
