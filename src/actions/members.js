'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

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

  const email = formData.get('email') || null
  const role = formData.get('role') || 'player'

  // Generate unique token
  const token = randomBytes(32).toString('hex')

  // Invite expires in 7 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invite, error } = await supabase
    .from('club_invites')
    .insert({
      club_id: profile.club_id,
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

  // Generate invite URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/register?invite=${token}`

  revalidatePath('/admin/members')
  return { success: true, inviteUrl, invite }
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
