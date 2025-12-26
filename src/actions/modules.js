'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Toggle a module's active state for a club
 */
export async function toggleModule(formData) {
  const supabase = await createClient()

  const moduleId = formData.get('moduleId')
  const isActive = formData.get('isActive') === 'true'

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  if (isActive) {
    // Deactivate: update existing record
    const { error } = await supabase
      .from('club_modules')
      .update({ is_active: false })
      .eq('club_id', profile.club_id)
      .eq('module_id', moduleId)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Activate: upsert record
    const { error } = await supabase
      .from('club_modules')
      .upsert(
        {
          club_id: profile.club_id,
          module_id: moduleId,
          is_active: true,
          activated_at: new Date().toISOString(),
        },
        {
          onConflict: 'club_id,module_id',
        }
      )

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/admin/modules')
  revalidatePath('/admin')
  return { success: true }
}

/**
 * Get all modules with activation status for current club
 */
export async function getModulesWithStatus() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'Profil nicht gefunden' }
  }

  // Get all modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .order('name')

  if (modulesError) {
    return { error: modulesError.message }
  }

  // Get club's active modules
  const { data: clubModules } = await supabase
    .from('club_modules')
    .select('module_id, is_active, activated_at')
    .eq('club_id', profile.club_id)

  // Combine data
  const modulesWithStatus = modules.map(module => {
    const clubModule = clubModules?.find(cm => cm.module_id === module.id)
    return {
      ...module,
      isActive: clubModule?.is_active || false,
      activatedAt: clubModule?.activated_at || null,
    }
  })

  return { modules: modulesWithStatus }
}
