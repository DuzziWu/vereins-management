import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import DashboardHeader from '@/components/dashboard-header'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { ModulesClient } from './modules-client'

export const metadata = {
  title: 'Modul-Shop | Vereins-Master',
}

export default async function ModulesPage() {
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

  const club = profile.club || {}

  // Get all modules
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('name')

  // Get club's active modules
  const { data: clubModules } = await supabase
    .from('club_modules')
    .select('module_id, is_active, activated_at')
    .eq('club_id', profile.club_id)

  // Combine data
  const modulesWithStatus = modules?.map(module => {
    const clubModule = clubModules?.find(cm => cm.module_id === module.id)
    return {
      ...module,
      isActive: clubModule?.is_active || false,
      activatedAt: clubModule?.activated_at || null,
    }
  }) || []

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
        </div>

        <ModulesClient modules={modulesWithStatus} />
      </main>
    </div>
  )
}
