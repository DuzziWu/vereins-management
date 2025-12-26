'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTeam({ name, league }) {
  const supabase = await createClient()

  // Get current user and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({
      name,
      league,
      club_id: profile.club_id,
    })
    .select('id, name, league, created_at')
    .single()

  if (error) {
    console.error('Error creating team:', error)
    return { error: 'Team konnte nicht erstellt werden' }
  }

  revalidatePath('/admin/teams')
  return { success: true, team: newTeam }
}

export async function updateTeam({ teamId, name, league }) {
  const supabase = await createClient()

  // Get current user and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Verify team belongs to admin's club
  const { data: team } = await supabase
    .from('teams')
    .select('club_id')
    .eq('id', teamId)
    .single()

  if (team?.club_id !== profile.club_id) {
    return { error: 'Team nicht gefunden' }
  }

  const { error } = await supabase
    .from('teams')
    .update({ name, league })
    .eq('id', teamId)

  if (error) {
    console.error('Error updating team:', error)
    return { error: 'Team konnte nicht aktualisiert werden' }
  }

  revalidatePath('/admin/teams')
  return { success: true }
}

export async function deleteTeam({ teamId }) {
  const supabase = await createClient()

  // Get current user and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Verify team belongs to admin's club
  const { data: team } = await supabase
    .from('teams')
    .select('club_id')
    .eq('id', teamId)
    .single()

  if (team?.club_id !== profile.club_id) {
    return { error: 'Team nicht gefunden' }
  }

  // Check if team has members
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (memberCount > 0) {
    return { error: 'Team hat noch Mitglieder. Bitte zuerst alle Mitglieder entfernen.' }
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) {
    console.error('Error deleting team:', error)
    return { error: 'Team konnte nicht gelöscht werden' }
  }

  revalidatePath('/admin/teams')
  return { success: true }
}
