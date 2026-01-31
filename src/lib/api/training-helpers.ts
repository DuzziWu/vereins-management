import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// Helper: Get current date in Europe/Berlin timezone (YYYY-MM-DD)
// Uses 'sv-SE' locale which returns ISO format natively
// ============================================================
export function getTodayBerlin(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })
}

// ============================================================
// Helper: Get profile for authenticated user
// ============================================================
export async function getAuthenticatedProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    }
  }

  return { user, profile }
}

// ============================================================
// Helper: Check if profile is trainer of a group
// ============================================================
export async function isTrainerOfGroup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  groupId: string,
  role: string
): Promise<boolean> {
  if (role === "vorstand") return true

  const { data: group } = await supabase
    .from("groups")
    .select("trainer_id")
    .eq("id", groupId)
    .single()

  if (group?.trainer_id === profileId) return true

  const { data: coTrainer } = await supabase
    .from("group_trainers")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle()

  return !!coTrainer
}

// ============================================================
// Helper: Check if attendance recording is within allowed time window
// (day of training + 24 hours after)
// ============================================================
export function isWithinAttendanceWindow(sessionDate: string): boolean {
  const now = new Date()
  const trainingDate = new Date(sessionDate + "T00:00:00")

  // Training day start (00:00)
  const windowStart = new Date(trainingDate)

  // Training day + 24 hours after end of day (i.e., end of next day)
  const windowEnd = new Date(trainingDate)
  windowEnd.setDate(windowEnd.getDate() + 2) // day of training + 1 day buffer = 2 days from start

  return now >= windowStart && now <= windowEnd
}
