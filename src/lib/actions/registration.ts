'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateInvitationToken } from './invitations'

// ============================================
// ACCEPT INVITATION (REGISTER)
// ============================================
export async function acceptInvitation(data: {
  token: string
  password: string
  dateOfBirth: string
  phone?: string
}) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Validate token
  const validation = await validateInvitationToken(data.token)

  if (!validation.valid || !validation.invitation) {
    return { error: validation.error || 'Ungültige Einladung' }
  }

  const { invitation } = validation

  // Password validation
  if (data.password.length < 8) {
    return { error: 'Passwort muss mindestens 8 Zeichen lang sein' }
  }

  if (!/[a-zA-Z]/.test(data.password)) {
    return { error: 'Passwort muss mindestens einen Buchstaben enthalten' }
  }

  if (!/[0-9]/.test(data.password)) {
    return { error: 'Passwort muss mindestens eine Zahl enthalten' }
  }

  // Validate service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    return { error: 'Server-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.' }
  }

  // Create user with Supabase Admin API
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: invitation.email,
    password: data.password,
    email_confirm: true, // Auto-confirm since they came via invitation
  })

  if (authError || !authData.user) {
    console.error('Create user error:', authError?.message, authError?.status, authError)

    // Provide more specific error messages
    if (authError?.message?.includes('already been registered')) {
      return { error: 'Ein Konto mit dieser Email existiert bereits.' }
    }
    if (authError?.message?.includes('Invalid API key')) {
      console.error('Invalid Supabase Service Role Key')
      return { error: 'Server-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.' }
    }

    return { error: 'Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.' }
  }

  // Create profile
  const { error: profileError } = await serviceClient.from('profiles').insert({
    user_id: authData.user.id,
    first_name: invitation.firstName,
    last_name: invitation.lastName,
    date_of_birth: data.dateOfBirth,
    phone: data.phone || null,
    role: invitation.role,
    is_active: true,
  })

  if (profileError) {
    console.error('Create profile error:', profileError)
    // Rollback: Delete the created auth user
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Profil konnte nicht erstellt werden. Bitte versuchen Sie es erneut.' }
  }

  // Mark invitation as used
  const { error: updateError } = await serviceClient
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  if (updateError) {
    console.error('Update invitation error:', updateError)
    // Non-critical error, continue
  }

  // Sign in the user automatically
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: data.password,
  })

  if (signInError) {
    console.error('Auto sign-in error:', signInError)
    // Non-critical: User can sign in manually
    return {
      success: true,
      autoSignIn: false,
      message: 'Konto erfolgreich erstellt. Bitte melden Sie sich an.',
    }
  }

  return {
    success: true,
    autoSignIn: true,
  }
}
