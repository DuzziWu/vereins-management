"use server"

import { createClient } from "@/lib/supabase/server"

// ============================================================
// Types
// ============================================================

export interface MemberGroup {
  id: string
  name: string
  trainer_name: string | null
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
  chat_enabled: boolean
}

export interface MemberUpcomingTraining {
  id: string
  date: string
  start_time: string
  end_time: string
  group_name: string
  location: string | null
  rsvp_status: "confirmed" | "declined" | "pending"
}

// ============================================================
// Helper: Get authenticated profile with role check
// ============================================================

async function getAuthenticatedMemberProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
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

  // SECURITY-2: Defense-in-depth role check (consistent with trainer-dashboard.ts)
  if (profile.role !== "mitglied" && profile.role !== "vorstand") {
    throw new Error("Zugriff nicht erlaubt")
  }

  return profile
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
// Server Action: Get groups for the logged-in member
// ============================================================

export async function getMyMemberGroups(): Promise<MemberGroup[]> {
  const supabase = await createClient()

  const profile = await getAuthenticatedMemberProfile(supabase)

  // BUG-4 optimization: Combined query -- get memberships + group details in one query
  // using nested select through group_members -> groups with trainer join
  const { data: memberships, error } = await supabase
    .from("group_members")
    .select(`
      group:groups!group_members_group_id_fkey(
        id,
        name,
        training_day,
        training_start_time,
        training_end_time,
        chat_enabled,
        is_active,
        trainer:profiles!groups_trainer_id_fkey(first_name, last_name)
      )
    `)
    .eq("profile_id", profile.id)

  if (error) {
    console.error("Error fetching member groups:", error)
    throw new Error("Fehler beim Laden der Gruppen")
  }

  if (!memberships || memberships.length === 0) return []

  // Filter active groups and map to result type
  return memberships
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
        chat_enabled: boolean
        trainer: { first_name: string; last_name: string } | null
      }
      const trainerName = g.trainer && g.trainer.first_name?.trim()
        ? `${g.trainer.first_name.trim()} ${g.trainer.last_name?.trim() ? g.trainer.last_name.trim().charAt(0) + "." : ""}`.trim()
        : null
      return {
        id: g.id,
        name: g.name,
        trainer_name: trainerName || null,
        training_day: g.training_day,
        training_start_time: g.training_start_time,
        training_end_time: g.training_end_time,
        chat_enabled: g.chat_enabled,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ============================================================
// Server Action: Get upcoming trainings for the logged-in member
// ============================================================

export async function getMyUpcomingTrainings(): Promise<MemberUpcomingTraining[]> {
  const supabase = await createClient()

  const profile = await getAuthenticatedMemberProfile(supabase)

  // Get group IDs the member belongs to (only active groups)
  // BUG-NEW-1 fix: Join with groups to filter by is_active (consistent with getMyMemberGroups and trainer-dashboard)
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, group:groups!group_members_group_id_fkey!inner(is_active)")
    .eq("profile_id", profile.id)
    .eq("group.is_active", true)

  if (!memberships || memberships.length === 0) return []

  const groupIds = memberships.map((m) => m.group_id)

  // Get today's date and current time in Berlin timezone
  const { today, currentTime } = getBerlinTimeInfo()

  // BUG-11 fix: Fetch a few extra sessions to account for today's past sessions
  // We fetch more than 5, then filter out past sessions from today, and take the first 5
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      location,
      group:groups!training_sessions_group_id_fkey(name)
    `)
    .in("group_id", groupIds)
    .gte("date", today)
    .eq("is_cancelled", false)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(10)

  if (sessionsError) {
    console.error("Error fetching upcoming trainings:", sessionsError)
    throw new Error("Fehler beim Laden der Trainingstermine")
  }

  if (!sessions || sessions.length === 0) return []

  // BUG-11 fix: Filter out today's sessions that have already ended
  const filteredSessions = sessions
    .filter((s) => {
      if (s.date > today) return true
      // For today's sessions, only include if end_time is still in the future
      return s.end_time > currentTime
    })
    .slice(0, 5)

  if (filteredSessions.length === 0) return []

  // BUG-4 optimization: Batch fetch RSVP statuses in parallel with sessions (already batched)
  const sessionIds = filteredSessions.map((s) => s.id)
  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("training_session_id, rsvp_status")
    .eq("profile_id", profile.id)
    .in("training_session_id", sessionIds)

  const rsvpMap = new Map<string, string>()
  for (const a of attendanceData || []) {
    rsvpMap.set(a.training_session_id, a.rsvp_status)
  }

  return filteredSessions.map((s) => {
    const group = s.group as { name: string } | null
    const rawRsvp = rsvpMap.get(s.id) || "pending"
    const validStatuses = ["confirmed", "declined", "pending"] as const
    const rsvp_status = validStatuses.includes(rawRsvp as typeof validStatuses[number])
      ? (rawRsvp as "confirmed" | "declined" | "pending")
      : "pending"
    return {
      id: s.id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      group_name: group?.name || "Unbekannte Gruppe",
      location: s.location,
      rsvp_status,
    }
  })
}
