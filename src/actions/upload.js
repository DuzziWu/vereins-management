'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Upload club logo
 */
export async function uploadClubLogo(formData) {
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

  const file = formData.get('file')
  if (!file || file.size === 0) {
    return { error: 'Keine Datei ausgewählt' }
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Datei ist zu groß (max. 2MB)' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, SVG, WebP' }
  }

  const clubId = profile.club_id
  const fileExt = file.name.split('.').pop()
  const fileName = `${clubId}/logo.${fileExt}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('club-logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    return { error: 'Logo konnte nicht hochgeladen werden' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('club-logos')
    .getPublicUrl(fileName)

  // Update club record with logo URL
  const { error: updateError } = await supabase
    .from('clubs')
    .update({
      logo_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clubId)

  if (updateError) {
    console.error('Error updating club logo URL:', updateError)
    return { error: 'Logo-URL konnte nicht gespeichert werden' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  return { success: true, url: publicUrl }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(formData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const file = formData.get('file')
  if (!file || file.size === 0) {
    return { error: 'Keine Datei ausgewählt' }
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Datei ist zu groß (max. 2MB)' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/avatar.${fileExt}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    return { error: 'Avatar konnte nicht hochgeladen werden' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile record with avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating avatar URL:', updateError)
    return { error: 'Avatar-URL konnte nicht gespeichert werden' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/coach')
  revalidatePath('/player')
  return { success: true, url: publicUrl }
}

/**
 * Update user profile
 */
export async function updateProfile({ fullName }) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Profil konnte nicht aktualisiert werden' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/coach')
  revalidatePath('/player')
  return { success: true }
}
