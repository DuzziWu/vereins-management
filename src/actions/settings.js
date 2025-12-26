'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateClubSettings({ clubId, name, description, primaryColor }) {
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

  // Verify club belongs to admin
  if (profile.club_id !== clubId) {
    return { error: 'Keine Berechtigung für diesen Verein' }
  }

  // Update club settings
  const { error } = await supabase
    .from('clubs')
    .update({
      name,
      description,
      primary_color: primaryColor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clubId)

  if (error) {
    console.error('Error updating club settings:', error)
    return { error: 'Einstellungen konnten nicht gespeichert werden' }
  }

  // Revalidate all dashboard paths to update the primary color
  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/coach')
  revalidatePath('/player')
  return { success: true }
}
