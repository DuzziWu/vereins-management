'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { generateInviteEmailHTML, generateInviteEmailText } from '@/components/emails/invite-email'

/**
 * Create an invite link for a new member
 */
export async function createInvite(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return { error: 'Keine Berechtigung' }
  }

  const fullName = formData.get('fullName') || null
  const email = formData.get('email') || null
  const role = formData.get('role') || 'player'

  if (!fullName) {
    return { error: 'Name ist erforderlich' }
  }

  // Generate unique token
  const token = randomBytes(32).toString('hex')

  // Invite expires in 7 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invite, error } = await supabase
    .from('club_invites')
    .insert({
      club_id: profile.club_id,
      full_name: fullName,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Generate invite URL - points to the invite acceptance page
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${token}`

  revalidatePath('/admin/members')
  return { success: true, inviteUrl, invite }
}

/**
 * Send invite email to the invited person using Nodemailer
 */
export async function sendInviteEmail({ email, fullName, role, inviteUrl, clubName }) {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT || 587
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || 'noreply@clubgrid.app'

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('SMTP not configured, skipping email send')
    console.log('Would send invite email to:', { email, fullName, role, inviteUrl, clubName })
    return { success: true, skipped: true }
  }

  // Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"ClubGrid" <${smtpFrom}>`,
      to: email,
      subject: `Einladung zu ${clubName}`,
      text: generateInviteEmailText({ fullName, clubName, role, inviteUrl }),
      html: generateInviteEmailHTML({ fullName, clubName, role, inviteUrl }),
    })

    console.log('Invite email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('Error sending invite email:', err)
    return { error: 'E-Mail konnte nicht gesendet werden' }
  }
}

/**
 * Get invite details by token (public function for invite acceptance page)
 */
export async function getInviteByToken(token) {
  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from('club_invites')
    .select(`
      *,
      club:clubs(id, name, logo_url, primary_color)
    `)
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !invite) {
    return { error: 'Ungültiger oder abgelaufener Einladungslink' }
  }

  return { invite }
}

/**
 * Get all invites for the club (admin/coach only)
 */
export async function getInvites() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return { error: 'Keine Berechtigung' }
  }

  const { data: invites, error } = await supabase
    .from('club_invites')
    .select(`
      *,
      created_by_profile:profiles!club_invites_created_by_fkey(full_name)
    `)
    .eq('club_id', profile.club_id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { invites }
}

/**
 * Resend an expired invite (creates new token with fresh expiry)
 */
export async function resendInvite(inviteId) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return { error: 'Keine Berechtigung' }
  }

  // Get the existing invite
  const { data: existingInvite, error: fetchError } = await supabase
    .from('club_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('club_id', profile.club_id)
    .single()

  if (fetchError || !existingInvite) {
    return { error: 'Einladung nicht gefunden' }
  }

  // Can't resend used invites
  if (existingInvite.used_at) {
    return { error: 'Diese Einladung wurde bereits verwendet' }
  }

  // Generate new token and expiry
  const newToken = randomBytes(32).toString('hex')
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + 7)

  const { error: updateError } = await supabase
    .from('club_invites')
    .update({
      token: newToken,
      expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', inviteId)

  if (updateError) {
    return { error: updateError.message }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${newToken}`

  revalidatePath('/admin/members')
  return { success: true, inviteUrl }
}

/**
 * Delete an invite
 */
export async function deleteInvite(inviteId) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  const { error } = await supabase
    .from('club_invites')
    .delete()
    .eq('id', inviteId)
    .eq('club_id', profile.club_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

/**
 * Update a member's role
 */
export async function updateMemberRole({ memberId, newRole }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Can't change own role
  if (memberId === user.id) {
    return { error: 'Du kannst deine eigene Rolle nicht ändern' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('club_id', profile.club_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

/**
 * Remove a member from the club
 */
export async function removeMember(memberId) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Can't remove yourself
  if (memberId === user.id) {
    return { error: 'Du kannst dich nicht selbst entfernen' }
  }

  // Remove club association (don't delete user)
  const { error } = await supabase
    .from('profiles')
    .update({ club_id: null, role: 'player' })
    .eq('id', memberId)
    .eq('club_id', profile.club_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

/**
 * Assign a member to a team
 */
export async function assignToTeam({ memberId, teamId, position = null }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return { error: 'Keine Berechtigung' }
  }

  // First, remove all existing team memberships for this member
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('profile_id', memberId)

  if (deleteError) {
    console.error('Error removing old team membership:', deleteError)
    return { error: 'Fehler beim Aktualisieren der Mannschaftszuordnung' }
  }

  // If teamId is provided, add the new team membership
  if (teamId) {
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        profile_id: memberId,
        position,
      })

    if (insertError) {
      console.error('Error adding team membership:', insertError)
      return { error: 'Fehler beim Zuordnen zur Mannschaft' }
    }
  }

  revalidatePath('/admin/members')
  revalidatePath('/admin/teams')
  return { success: true }
}
