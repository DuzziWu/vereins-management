'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign in with email and password
 */
export async function signIn(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user's role to redirect to correct dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const dashboardRoute = profile?.role === 'admin'
    ? '/admin'
    : profile?.role === 'coach'
      ? '/coach'
      : '/player'

  revalidatePath('/', 'layout')
  redirect(dashboardRoute)
}

/**
 * Sign up with email and password
 * Assigns user to the configured club (via CLUB_ID env var)
 */
export async function signUp(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('fullName')
  const inviteToken = formData.get('inviteToken')

  // Get the default club ID from environment
  const defaultClubId = process.env.CLUB_ID

  if (!defaultClubId && !inviteToken) {
    return { error: 'Kein Verein konfiguriert. Bitte kontaktiere den Administrator.' }
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  // If there's an invite token, join that club with the specified role
  if (inviteToken) {
    const { data: invite, error: inviteError } = await supabase
      .from('club_invites')
      .select('*')
      .eq('token', inviteToken)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return { error: 'Ungültiger oder abgelaufener Einladungslink' }
    }

    // Update profile with club and role from invite
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        club_id: invite.club_id,
        role: invite.role,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      return { error: 'Fehler beim Beitreten des Vereins' }
    }

    // Mark invite as used
    await supabase
      .from('club_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id)

  } else {
    // Assign user to the default club as player
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        club_id: defaultClubId,
        role: 'player', // Default role for new registrations
      })
      .eq('id', authData.user.id)

    if (profileError) {
      return { error: 'Fehler beim Zuweisen des Vereins' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/player') // New users go to player dashboard by default
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Send magic link for passwordless login
 */
export async function signInWithMagicLink(formData) {
  const supabase = await createClient()

  const email = formData.get('email')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Magic Link wurde gesendet! Prüfe dein E-Mail-Postfach.' }
}

/**
 * Get the current user's profile with club info
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      club:clubs(*)
    `)
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Accept an invite and create user account
 */
export async function acceptInvite(formData) {
  const supabase = await createClient()

  // Sign out any existing user first to prevent session conflicts
  await supabase.auth.signOut()

  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('fullName')
  const inviteToken = formData.get('inviteToken')

  if (!inviteToken) {
    return { error: 'Kein Einladungstoken gefunden' }
  }

  // Validate the invite
  const { data: invite, error: inviteError } = await supabase
    .from('club_invites')
    .select('*')
    .eq('token', inviteToken)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    return { error: 'Ungültiger oder abgelaufener Einladungslink' }
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  // Update profile with club and role from invite
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      club_id: invite.club_id,
      role: invite.role,
      full_name: fullName,
    })
    .eq('id', authData.user.id)

  if (profileError) {
    return { error: 'Fehler beim Beitreten des Vereins' }
  }

  // Mark invite as used
  await supabase
    .from('club_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  revalidatePath('/', 'layout')

  // Redirect based on role
  const dashboardRoute = invite.role === 'admin'
    ? '/admin'
    : invite.role === 'coach'
      ? '/coach'
      : '/player'

  redirect(dashboardRoute)
}
