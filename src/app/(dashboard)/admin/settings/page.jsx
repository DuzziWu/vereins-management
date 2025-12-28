import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import DashboardHeader from '@/components/dashboard-header'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { SettingsClient } from './settings-client'

export const metadata = {
  title: 'Einstellungen | ClubGrid',
}

export default async function SettingsPage() {
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

  // Get club data
  const club = profile.club || {}

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Admin'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Vereins-Admin'}
        clubName={club.name || 'FC Digital'}
        isAdmin={true}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={club.logo_url}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4 bg-transparent border-2 border-border hover:border-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte deine Vereinseinstellungen und Präferenzen</p>
        </div>

        <SettingsClient
          initialClub={{
            id: club.id,
            name: club.name || '',
            description: club.description || '',
            logoUrl: club.logo_url || null,
            primaryColor: club.primary_color || '#d9f99d',
          }}
          initialProfile={{
            id: profile.id,
            fullName: profile.full_name || '',
            avatarUrl: profile.avatar_url || null,
            email: user.email || '',
          }}
        />
      </main>
    </div>
  )
}
