"use server"

import { createClient } from "@/lib/supabase/server"

// ============================================================
// Types
// ============================================================

export interface TrainerGroup {
  id: string
  name: string
  member_count: number
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
  training_location: string | null
}

export interface TrainerUpcomingSession {
  id: string
  date: string
  start_time: string
  end_time: string
  group_id: string
  group_name: string
  location: string | null
}

// ============================================================
// Helper: Get authenticated trainer profile with role check
// ============================================================

async function getAuthenticatedTrainerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Nicht authentifiziert")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    throw new Error("Profil nicht gefunden")
  }

  // Role validation
  if (profile.role !== "trainer" && profile.role !== "vorstand") {
    throw new Error("Zugriff nicht erlaubt")
  }

  return profile
}

// ============================================================
// Helper: Get all group IDs for a trainer (main + co-trainer)
// ============================================================

async function getTrainerGroupIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
): Promise<string[]> {
  // Run both queries in parallel
  const [mainTrainerResult, coTrainerResult] = await Promise.all([
    supabase
      .from("groups")
      .select("id")
      .eq("trainer_id", profileId)
      .eq("is_active", true),
    // BUG-7 fix: Filter co-trainer groups by is_active via inner join
    supabase
      .from("group_trainers")
      .select(
        "group_id, group:groups!group_trainers_group_id_fkey!inner(is_active)"
      )
      .eq("profile_id", profileId)
      .eq("group.is_active", true),
  ])

  // Merge and deduplicate IDs
  const allIds = new Set<string>()
  for (const g of mainTrainerResult.data || []) allIds.add(g.id)
  for (const ct of coTrainerResult.data || []) allIds.add(ct.group_id)

  return Array.from(allIds)
}

// ============================================================
// Helper: Get current Berlin time info
// ============================================================

function getBerlinTimeInfo() {
  const now = new Date()
  const today = now.toLocaleDateString("sv-SE", {
    timeZone: "Europe/Berlin",
  })
  const currentTime = now.toLocaleTimeString("sv-SE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  return { today, currentTime }
}

// ============================================================
// Server Action: Get groups for the logged-in trainer
// ============================================================

export async function getMyTrainerGroups(): Promise<TrainerGroup[]> {
  const supabase = await createClient()

  const profile = await getAuthenticatedTrainerProfile(supabase)

  const allGroupIds = await getTrainerGroupIds(supabase, profile.id)

  if (allGroupIds.length === 0) return []

  // Fetch group details and member counts in parallel
  // BUG-5 fix: Use RPC with SQL COUNT + GROUP BY instead of fetching all rows
  const [groupsResult, memberCountsResult] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, training_day, training_start_time, training_end_time, training_location"
      )
      .in("id", allGroupIds)
      .eq("is_active", true)
      .order("name"),
    supabase.rpc("get_group_member_counts", { group_ids: allGroupIds }),
  ])

  if (groupsResult.error) {
    console.error("Error fetching trainer groups:", groupsResult.error)
    throw new Error("Fehler beim Laden der Gruppen")
  }

  // BUG-NEW-2 fix: Log RPC error instead of silently ignoring it
  if (memberCountsResult.error) {
    console.error("Error fetching member counts:", memberCountsResult.error)
  }

  const groups = groupsResult.data
  if (!groups || groups.length === 0) return []

  // Build count map from RPC result (already aggregated by database)
  const countByGroup = new Map<string, number>()
  for (const row of memberCountsResult.data || []) {
    countByGroup.set(row.group_id, Number(row.member_count))
  }

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    member_count: countByGroup.get(g.id) || 0,
    training_day: g.training_day,
    training_start_time: g.training_start_time,
    training_end_time: g.training_end_time,
    training_location: g.training_location,
  }))
}

// ============================================================
// Server Action: Get upcoming training sessions for the trainer
// ============================================================

export async function getMyUpcomingTrainerSessions(): Promise<TrainerUpcomingSession[]> {
  const supabase = await createClient()

  const profile = await getAuthenticatedTrainerProfile(supabase)

  const allGroupIds = await getTrainerGroupIds(supabase, profile.id)

  if (allGroupIds.length === 0) return []

  // Filter to only active groups for sessions query
  const { data: activeGroups } = await supabase
    .from("groups")
    .select("id")
    .in("id", allGroupIds)
    .eq("is_active", true)

  if (!activeGroups || activeGroups.length === 0) return []

  const groupIds = activeGroups.map((g) => g.id)

  // Get today's date and current time in Berlin timezone
  const { today, currentTime } = getBerlinTimeInfo()

  // Fetch extra sessions to account for today's past sessions
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      location,
      group_id,
      group:groups!training_sessions_group_id_fkey(name)
    `
    )
    .in("group_id", groupIds)
    .gte("date", today)
    .eq("is_cancelled", false)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(10)

  if (error) {
    console.error("Error fetching trainer sessions:", error)
    throw new Error("Fehler beim Laden der Trainingstermine")
  }

  // Filter out today's sessions that have already ended
  const filteredSessions = (sessions || [])
    .filter((s) => {
      if (s.date > today) return true
      // For today's sessions, only include if end_time is still in the future
      return s.end_time > currentTime
    })
    .slice(0, 5)

  return filteredSessions.map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = s.group as any
    return {
      id: s.id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      group_id: s.group_id,
      group_name: group?.name || "Unbekannte Gruppe",
      location: s.location,
    }
  })
}
