import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import DashboardHeader from '@/components/dashboard-header'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { InviteForm } from './invite-form'

export const metadata = {
  title: 'Mitglied einladen | Vereins-Master',
}

export default async function InviteMemberPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, club:clubs(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    redirect('/admin')
  }

  const club = profile.club || {}

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Admin'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Vereins-Admin'}
        clubName={club.name || 'Mein Verein'}
        isAdmin={profile.role === 'admin'}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={club.logo_url}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/admin/members">
            <Button variant="outline" size="sm" className="mb-4 bg-transparent border-2 border-border hover:border-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Mitgliederliste
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Mitglied einladen</h1>
          <p className="text-muted-foreground">Erstelle einen Einladungslink für neue Vereinsmitglieder</p>
        </div>

        <InviteForm clubName={club.name} />
      </main>
    </div>
  )
}
