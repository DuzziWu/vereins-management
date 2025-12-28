import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuthHeader } from '@/components/auth-header'
import { InviteAcceptForm } from './invite-accept-form'
import { ROLE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'

export async function generateMetadata({ params }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('club_invites')
    .select('club:clubs(name)')
    .eq('token', token)
    .single()

  return {
    title: invite?.club?.name
      ? `Einladung zu ${invite.club.name} | ClubGrid`
      : 'Einladung | ClubGrid',
  }
}

export default async function InviteAcceptPage({ params }) {
  const { token } = await params
  const supabase = await createClient()

  // Check if someone is already logged in
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Get invite with club details (including used ones)
  const { data: invite, error } = await supabase
    .from('club_invites')
    .select(`
      *,
      club:clubs(id, name, logo_url, primary_color)
    `)
    .eq('token', token)
    .single()

  // Check if invite exists
  if (error || !invite) {
    notFound()
  }

  // Check if invite was already used
  if (invite.used_at) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 speed-lines opacity-30" />
        <AuthHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Einladung bereits verwendet</h1>
              <p className="text-muted-foreground">
                Diese Einladung wurde bereits angenommen. Falls du bereits ein Konto erstellt hast, kannst du dich anmelden.
              </p>
            </div>
            <Button asChild>
              <Link href="/login">Zur Anmeldung</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Check if invite is expired
  const isExpired = new Date(invite.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 speed-lines opacity-30" />
        <AuthHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Einladung abgelaufen</h1>
              <p className="text-muted-foreground">
                Diese Einladung ist leider nicht mehr gültig. Bitte kontaktiere {invite.club?.name || 'den Verein'} für eine neue Einladung.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Zur Startseite</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 speed-lines opacity-30" />
      <div className="absolute top-40 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <AuthHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md space-y-4">
          {/* Warning if user is already logged in */}
          {currentUser && (
            <Card className="p-4 bg-amber-500/10 border-amber-500/30 border-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-500">
                    Du bist bereits angemeldet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Wenn du diese Einladung annimmst, wirst du automatisch abgemeldet und ein neues Konto wird erstellt.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <InviteAcceptForm
            invite={{
              token: invite.token,
              fullName: invite.full_name,
              email: invite.email,
              role: invite.role,
              roleLabel: ROLE_LABELS[invite.role],
              clubName: invite.club?.name,
              clubLogo: invite.club?.logo_url,
            }}
          />
        </div>
      </main>
    </div>
  )
}
