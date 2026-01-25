"use server"

import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/lib/database.types"

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
