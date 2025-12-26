import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hexToHsl } from '@/lib/utils'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with club data including primary color
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, club:clubs(primary_color)')
    .eq('id', user.id)
    .single()

  // If user has no club, redirect to onboarding or show error
  if (!profile?.club_id) {
    redirect('/register')
  }

  // Get club primary color and convert to HSL
  const primaryColor = profile?.club?.primary_color || '#d9f99d'
  const primaryHsl = hexToHsl(primaryColor)

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${primaryHsl};
              --club-primary: ${primaryHsl};
              --accent: ${primaryHsl};
              --ring: ${primaryHsl};
            }
          `,
        }}
      />
      {children}
    </>
  )
}
