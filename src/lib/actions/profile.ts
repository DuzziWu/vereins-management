"use server"

import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/lib/database.types"
import { ProfileFormData } from "@/lib/validations/profile"
import { revalidatePath } from "next/cache"

// Rate limiting for password change attempts
// In-memory store: userId -> { count: number, firstAttempt: number }
const passwordChangeAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>()

const RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkPasswordRateLimit(userId: string): {
  allowed: boolean
  remainingAttempts: number
  resetInMs?: number
} {
  const now = Date.now()
  const record = passwordChangeAttempts.get(userId)

  if (!record) {
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS }
  }

  // Check if the window has expired
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Reset the counter
    passwordChangeAttempts.delete(userId)
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS }
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const resetInMs = RATE_LIMIT_WINDOW_MS - (now - record.firstAttempt)
    return { allowed: false, remainingAttempts: 0, resetInMs }
  }

  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - record.count,
  }
}

function recordFailedPasswordAttempt(userId: string): void {
  const now = Date.now()
  const record = passwordChangeAttempts.get(userId)

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Start a new window
    passwordChangeAttempts.set(userId, { count: 1, firstAttempt: now })
  } else {
    // Increment counter
    record.count++
  }
}

function resetPasswordAttempts(userId: string): void {
  passwordChangeAttempts.delete(userId)
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_my_profile")

  if (error || !data) {
    return null
  }

  return data as Profile
}

export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user.email ?? null
}

// Check if user has a password set (for social login users)
export async function hasPasswordSet(): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return false
  }

  // Users with only OAuth providers don't have a password
  // Check if the user has email provider (password-based)
  const identities = user.identities || []
  return identities.some((identity) => identity.provider === "email")
}

// Update own profile
export async function updateMyProfile(
  data: ProfileFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Nicht authentifiziert" }
  }

  // Get profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Profil nicht gefunden" }
  }

  // Build update object
  // Note: date_of_birth can be explicitly set to null to allow deletion
  // The Supabase generated types don't correctly reflect the nullable column
  const updateData = {
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone || null,
    // Explicitly set to null if empty, allowing users to remove their birth date
    date_of_birth: data.date_of_birth || null,
    address_street: data.address_street || null,
    address_zip: data.address_zip || null,
    address_city: data.address_city || null,
  }

  // Update profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData as any)
    .eq("id", profile.id)

  if (updateError) {
    console.error("Error updating profile:", updateError)
    return { success: false, error: "Fehler beim Speichern des Profils" }
  }

  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { success: true }
}

// Change password (requires current password verification)
// Includes rate limiting: max 5 failed attempts per 15 minutes
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || !user.email) {
    return { success: false, error: "Nicht authentifiziert" }
  }

  // Check rate limit before attempting password verification
  const rateLimit = checkPasswordRateLimit(user.id)
  if (!rateLimit.allowed) {
    const minutesRemaining = Math.ceil((rateLimit.resetInMs || 0) / 60000)
    return {
      success: false,
      error: `Zu viele Versuche. Bitte warte ${minutesRemaining} Minuten.`,
    }
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    // Record failed attempt
    recordFailedPasswordAttempt(user.id)
    const remaining = rateLimit.remainingAttempts - 1
    if (remaining <= 0) {
      return {
        success: false,
        error: "Zu viele Versuche. Bitte warte 15 Minuten.",
      }
    }
    return { success: false, error: "Aktuelles Passwort ist falsch" }
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    console.error("Error updating password:", updateError)
    return { success: false, error: "Passwort konnte nicht geaendert werden" }
  }

  // Reset attempts on successful password change
  resetPasswordAttempts(user.id)

  return { success: true }
}

// Get member's groups with trainer and training info
export interface MyGroupInfo {
  id: string
  name: string
  trainer_name: string | null
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
}

export async function getMyGroups(): Promise<MyGroupInfo[]> {
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

  // Get groups with trainer info
  const { data: memberships, error } = await supabase
    .from("group_members")
    .select(`
      group:groups!group_members_group_id_fkey(
        id,
        name,
        training_day,
        training_start_time,
        training_end_time,
        is_active,
        trainer:profiles!groups_trainer_id_fkey(first_name, last_name)
      )
    `)
    .eq("profile_id", profile.id)

  if (error) {
    console.error("Error fetching groups:", error)
    return []
  }

  return (memberships || [])
    .filter((m) => {
      const group = m.group as { is_active: boolean } | null
      return group && group.is_active
    })
    .map((m) => {
      const g = m.group as {
        id: string
        name: string
        training_day: string | null
        training_start_time: string | null
        training_end_time: string | null
        trainer: { first_name: string; last_name: string } | null
      }
      const trainerName = g.trainer
        ? `${g.trainer.first_name} ${g.trainer.last_name}`
        : null
      return {
        id: g.id,
        name: g.name,
        trainer_name: trainerName,
        training_day: g.training_day,
        training_start_time: g.training_start_time,
        training_end_time: g.training_end_time,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Get member's fees/payments
export interface MyFeeInfo {
  id: string
  year: number
  membership_type_name: string | null
  amount_due: number
  amount_paid: number
  status: "unpaid" | "partial" | "paid"
}

export async function getMyFees(): Promise<MyFeeInfo[]> {
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

  // Get fees with membership type
  const { data: fees, error } = await supabase
    .from("membership_fees")
    .select(`
      id,
      year,
      amount_due,
      amount_paid,
      membership_type:membership_types(name)
    `)
    .eq("profile_id", profile.id)
    .order("year", { ascending: false })

  if (error) {
    console.error("Error fetching fees:", error)
    return []
  }

  return (fees || []).map((f) => {
    const membershipType = f.membership_type as { name: string } | null
    let status: "unpaid" | "partial" | "paid" = "unpaid"
    if (f.amount_paid >= f.amount_due) {
      status = "paid"
    } else if (f.amount_paid > 0) {
      status = "partial"
    }
    return {
      id: f.id,
      year: f.year,
      membership_type_name: membershipType?.name || null,
      amount_due: f.amount_due,
      amount_paid: f.amount_paid,
      status,
    }
  })
}
