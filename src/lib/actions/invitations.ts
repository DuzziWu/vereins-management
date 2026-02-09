'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/components/auth'

// ============================================
// CREATE INVITATION
// ============================================
export async function createInvitation(data: {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Check if user is Vorstand
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht autorisiert' }
  }

  const { data: isVorstand } = await supabase.rpc('is_vorstand')

  if (!isVorstand) {
    return { error: 'Nur Vorstand kann Einladungen erstellen' }
  }

  // Check if user is trying to invite themselves
  const currentUserEmail = user.email?.toLowerCase()
  if (currentUserEmail === data.email.toLowerCase()) {
    return { error: 'Sie können sich nicht selbst einladen.' }
  }

  // Check if email already exists as active user
  const { data: existingUser } = await serviceClient.auth.admin.listUsers()
  const emailExists = existingUser?.users.some(
    (u) => u.email?.toLowerCase() === data.email.toLowerCase()
  )

  if (emailExists) {
    return { error: 'Ein Konto mit dieser Email existiert bereits.' }
  }

  // Check for existing pending invitation - block duplicate
  const { data: existingInvitation } = await supabase
    .from('invitations')
    .select('id, expires_at')
    .eq('email', data.email.toLowerCase())
    .is('used_at', null)
    .is('revoked_at', null)
    .single()

  if (existingInvitation) {
    // Check if the existing invitation is still valid (not expired)
    if (new Date(existingInvitation.expires_at) > new Date()) {
      return { error: 'Für diese Email existiert bereits eine gültige Einladung.' }
    }
    // If expired, revoke it so we can create a new one
    await supabase
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', existingInvitation.id)
  }

  // Generate unique token
  const token = nanoid(32)

  // Calculate expiry (7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      email: data.email.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Create invitation error:', error)
    return { error: 'Einladung konnte nicht erstellt werden' }
  }

  // Send invitation email via Supabase
  // Note: In production, you would configure custom email templates in Supabase
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${token}`

  // For now, we'll use Supabase's built-in invite (or log the URL for development)
  console.log('Invitation URL:', inviteUrl)

  // TODO: Send custom email via Supabase Edge Function or external service
  // For MVP, the invitation is created and the link can be copied

  revalidatePath('/admin/users/invitations')

  return {
    success: true,
    invitation,
    inviteUrl,
  }
}

// ============================================
// LIST INVITATIONS
// ============================================
export async function listInvitations() {
  const supabase = await createClient()

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('List invitations error:', error)
    return { error: 'Einladungen konnten nicht geladen werden' }
  }

  // Transform to match frontend interface
  const transformedInvitations = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    firstName: inv.first_name,
    lastName: inv.last_name,
    role: inv.role as UserRole,
    status: getInvitationStatus(inv),
    createdAt: inv.created_at,
    expiresAt: inv.expires_at,
  }))

  return { invitations: transformedInvitations }
}

function getInvitationStatus(invitation: {
  used_at: string | null
  revoked_at: string | null
  expires_at: string
}): 'pending' | 'accepted' | 'expired' | 'revoked' {
  if (invitation.used_at) return 'accepted'
  if (invitation.revoked_at) return 'revoked'
  if (new Date(invitation.expires_at) < new Date()) return 'expired'
  return 'pending'
}

// ============================================
// REVOKE INVITATION
// ============================================
export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .is('used_at', null) // Can only revoke unused invitations

  if (error) {
    console.error('Revoke invitation error:', error)
    return { error: 'Einladung konnte nicht widerrufen werden' }
  }

  revalidatePath('/admin/users/invitations')

  return { success: true }
}

// ============================================
// RESEND INVITATION
// ============================================
export async function resendInvitation(invitationId: string) {
  const supabase = await createClient()

  // Get existing invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (fetchError || !invitation) {
    return { error: 'Einladung nicht gefunden' }
  }

  // Create new invitation with same data
  return createInvitation({
    email: invitation.email,
    firstName: invitation.first_name,
    lastName: invitation.last_name,
    role: invitation.role as UserRole,
  })
}

// ============================================
// VALIDATE INVITATION TOKEN (Public)
// ============================================
export async function validateInvitationToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('validate_invitation_token', {
    invite_token: token,
  })

  if (error || !data || data.length === 0) {
    return {
      valid: false,
      error: 'Dieser Einladungslink ist ungültig.',
    }
  }

  const result = data[0]

  if (!result.is_valid) {
    return {
      valid: false,
      error: result.error_message,
    }
  }

  return {
    valid: true,
    invitation: {
      id: result.id,
      email: result.email,
      firstName: result.first_name,
      lastName: result.last_name,
      role: result.role,
    },
  }
}
