"use server"

import { createClient } from "@/lib/supabase/server"
import {
  NotificationCategory,
  NotificationPreference,
  NOTIFICATION_CATEGORIES
} from "@/lib/validations/profile"
import { revalidatePath } from "next/cache"

// Get notification preferences for the current user
export async function getMyNotificationPreferences(): Promise<NotificationPreference[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  // Get profile ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return []
  }

  // Get existing preferences
  const { data: preferences, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", profile.id)

  if (error) {
    console.error("Error fetching notification preferences:", error)
    return []
  }

  // If no preferences exist, create defaults
  if (!preferences || preferences.length === 0) {
    const defaults = await createDefaultPreferences(profile.id)
    return defaults
  }

  // Ensure all categories exist (in case new ones were added)
  const existingCategories = new Set(preferences.map((p) => p.category))
  const missingCategories = NOTIFICATION_CATEGORIES.filter(
    (c) => !existingCategories.has(c.id)
  )

  if (missingCategories.length > 0) {
    const newPrefs = await createPreferencesForCategories(
      profile.id,
      missingCategories.map((c) => c.id)
    )
    return [...preferences as NotificationPreference[], ...newPrefs]
  }

  return preferences as NotificationPreference[]
}

// Create default preferences for a profile
async function createDefaultPreferences(
  profileId: string
): Promise<NotificationPreference[]> {
  const supabase = await createClient()

  const defaults = NOTIFICATION_CATEGORIES.map((category) => ({
    profile_id: profileId,
    category: category.id,
    email_enabled: true,
    push_enabled: false,
  }))

  const { data, error } = await supabase
    .from("notification_preferences")
    .insert(defaults)
    .select()

  if (error) {
    console.error("Error creating default preferences:", error)
    return []
  }

  return (data || []) as NotificationPreference[]
}

// Create preferences for specific categories
async function createPreferencesForCategories(
  profileId: string,
  categories: NotificationCategory[]
): Promise<NotificationPreference[]> {
  const supabase = await createClient()

  const newPrefs = categories.map((category) => ({
    profile_id: profileId,
    category,
    email_enabled: true,
    push_enabled: false,
  }))

  const { data, error } = await supabase
    .from("notification_preferences")
    .insert(newPrefs)
    .select()

  if (error) {
    console.error("Error creating preferences for categories:", error)
    return []
  }

  return (data || []) as NotificationPreference[]
}

// Update a single notification preference
export async function updateNotificationPreference(
  category: NotificationCategory,
  type: "email" | "push",
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Nicht authentifiziert" }
  }

  // Get profile ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return { success: false, error: "Profil nicht gefunden" }
  }

  // Check if preference exists
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("category", category)
    .single()

  if (existing) {
    // Update existing preference
    const updateData = type === "email"
      ? { email_enabled: enabled }
      : { push_enabled: enabled }

    const { error: updateError } = await supabase
      .from("notification_preferences")
      .update(updateData)
      .eq("id", existing.id)

    if (updateError) {
      console.error("Error updating notification preference:", updateError)
      return { success: false, error: "Fehler beim Speichern" }
    }
  } else {
    // Create new preference
    const { error: insertError } = await supabase
      .from("notification_preferences")
      .insert({
        profile_id: profile.id,
        category,
        email_enabled: type === "email" ? enabled : true,
        push_enabled: type === "push" ? enabled : false,
      })

    if (insertError) {
      console.error("Error creating notification preference:", insertError)
      return { success: false, error: "Fehler beim Speichern" }
    }
  }

  revalidatePath("/profile")
  return { success: true }
}
