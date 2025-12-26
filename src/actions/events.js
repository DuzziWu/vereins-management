'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Update attendance status for an event
 */
export async function updateAttendance(formData) {
  const supabase = await createClient()

  const eventId = formData.get('eventId')
  const status = formData.get('status')
  const reason = formData.get('reason') || null

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht angemeldet' }
  }

  // Upsert attendance record
  const { error } = await supabase
    .from('attendance')
    .upsert(
      {
        event_id: eventId,
        profile_id: user.id,
        status,
        reason,
        responded_at: new Date().toISOString(),
      },
      {
        onConflict: 'event_id,profile_id',
      }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/player')
  revalidatePath('/coach')
  return { success: true }
}

/**
 * Create a new event
 */
export async function createEvent(formData) {
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

  const eventData = {
    club_id: profile.club_id,
    team_id: formData.get('teamId') || null,
    location_id: formData.get('locationId') || null,
    type: formData.get('type'),
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    start_time: formData.get('startTime'),
    end_time: formData.get('endTime'),
    created_by: user.id,
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Create attendance records for all team members (or all players if no team specified)
  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('club_id', profile.club_id)
    .eq('role', 'player')

  if (members && members.length > 0) {
    const attendanceRecords = members.map(member => ({
      event_id: event.id,
      profile_id: member.id,
      status: 'pending',
    }))

    await supabase.from('attendance').insert(attendanceRecords)
  }

  revalidatePath('/coach')
  revalidatePath('/coach/events')
  redirect('/coach/events')
}

/**
 * Update an event
 */
export async function updateEvent(formData) {
  const supabase = await createClient()

  const eventId = formData.get('eventId')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'coach'].includes(profile.role)) {
    return { error: 'Keine Berechtigung' }
  }

  const updateData = {
    team_id: formData.get('teamId') || null,
    location_id: formData.get('locationId') || null,
    type: formData.get('type'),
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    start_time: formData.get('startTime'),
    end_time: formData.get('endTime'),
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('club_id', profile.club_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach')
  revalidatePath('/coach/events')
  return { success: true }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId) {
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

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('club_id', profile.club_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/coach')
  revalidatePath('/coach/events')
  redirect('/coach/events')
}
