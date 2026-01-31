import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { ActualStatus } from "@/lib/validations/training"
import { getAuthenticatedProfile, isTrainerOfGroup, getTodayBerlin } from "@/lib/api/training-helpers"

// ============================================================
// Helper: Calculate period date range
// ============================================================
function getPeriodDateRange(period: string): { from: string; to: string } {
  const to = getTodayBerlin()

  // Parse the Berlin date to compute the "from" offset
  const [year, month, day] = to.split("-").map(Number)
  const from = new Date(year, month - 1, day)

  switch (period) {
    case "4weeks":
      from.setDate(from.getDate() - 28)
      break
    case "1month":
      from.setMonth(from.getMonth() - 1)
      break
    case "3months":
      from.setMonth(from.getMonth() - 3)
      break
    default:
      from.setDate(from.getDate() - 28)
  }

  const fromYear = from.getFullYear()
  const fromMonth = String(from.getMonth() + 1).padStart(2, "0")
  const fromDay = String(from.getDate()).padStart(2, "0")

  return {
    from: `${fromYear}-${fromMonth}-${fromDay}`,
    to,
  }
}

// ============================================================
// GET /api/training/attendance
// Query params: group_id, period ("4weeks" | "1month" | "3months")
// Returns attendance matrix for the overview
// ============================================================
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  const searchParams = request.nextUrl.searchParams
  const groupId = searchParams.get("group_id")
  const period = searchParams.get("period") || "4weeks"

  if (!groupId) {
    return NextResponse.json(
      { error: "group_id is required" },
      { status: 400 }
    )
  }

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(
    supabase,
    profile.id,
    groupId,
    profile.role
  )
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Only trainers can view attendance overview" },
      { status: 403 }
    )
  }

  // Calculate date range
  const { from, to } = getPeriodDateRange(period)

  // Get all sessions for this group in the period (only non-cancelled)
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select("id, date")
    .eq("group_id", groupId)
    .eq("is_cancelled", false)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })

  if (sessionsError) {
    console.error("Error fetching sessions for matrix:", sessionsError)
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({
      matrix: [],
      sessions: [],
    })
  }

  const sessionIds = sessions.map((s) => s.id)

  // Get all attendance records for these sessions
  const { data: attendanceData, error: attendanceError } = await supabase
    .from("attendance")
    .select(
      `
      training_session_id,
      profile_id,
      actual_status,
      rsvp_reason,
      profile:profiles!attendance_profile_id_fkey(id, first_name, last_name)
    `
    )
    .in("training_session_id", sessionIds)

  if (attendanceError) {
    console.error("Error fetching attendance for matrix:", attendanceError)
    return NextResponse.json(
      { error: attendanceError.message },
      { status: 500 }
    )
  }

  // Build the matrix: group by profile
  const profileMap = new Map<
    string,
    {
      profile_id: string
      first_name: string
      last_name: string
      sessions: {
        session_id: string
        date: string
        actual_status: string | null
        rsvp_reason: string | null
      }[]
    }
  >()

  // First, get all group members to include even those without attendance records
  const { data: members } = await supabase
    .from("group_members")
    .select(
      "profile:profiles!group_members_profile_id_fkey(id, first_name, last_name)"
    )
    .eq("group_id", groupId)

  // Initialize all members in the map
  for (const member of members || []) {
    const memberProfile = member.profile as {
      id: string
      first_name: string
      last_name: string
    } | null
    if (memberProfile) {
      profileMap.set(memberProfile.id, {
        profile_id: memberProfile.id,
        first_name: memberProfile.first_name,
        last_name: memberProfile.last_name,
        sessions: [],
      })
    }
  }

  // Create a session date lookup
  const sessionDateMap = new Map<string, string>()
  for (const session of sessions) {
    sessionDateMap.set(session.id, session.date)
  }

  // Populate attendance data
  for (const record of attendanceData || []) {
    const recordProfile = record.profile as {
      id: string
      first_name: string
      last_name: string
    } | null

    if (!recordProfile) continue

    if (!profileMap.has(recordProfile.id)) {
      profileMap.set(recordProfile.id, {
        profile_id: recordProfile.id,
        first_name: recordProfile.first_name,
        last_name: recordProfile.last_name,
        sessions: [],
      })
    }

    const entry = profileMap.get(recordProfile.id)!
    entry.sessions.push({
      session_id: record.training_session_id,
      date: sessionDateMap.get(record.training_session_id) || "",
      actual_status: record.actual_status as ActualStatus | null,
      rsvp_reason: record.rsvp_reason,
    })
  }

  // Calculate attendance rate and build final matrix
  const matrix = Array.from(profileMap.values())
    .map((entry) => {
      // Count sessions where actual_status was recorded
      const recordedSessions = entry.sessions.filter(
        (s) => s.actual_status !== null
      )
      const presentSessions = recordedSessions.filter(
        (s) => s.actual_status === "present"
      )

      const attendanceRate =
        recordedSessions.length > 0
          ? Math.round((presentSessions.length / recordedSessions.length) * 100)
          : 0

      return {
        profile_id: entry.profile_id,
        first_name: entry.first_name,
        last_name: entry.last_name,
        sessions: entry.sessions,
        attendance_rate: attendanceRate,
      }
    })
    .sort((a, b) => a.last_name.localeCompare(b.last_name))

  return NextResponse.json({
    matrix,
    sessions: sessions.map((s) => ({ id: s.id, date: s.date })),
  })
}
