import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createSessionSchema } from "@/lib/validations/training"
import { getAuthenticatedProfile, isTrainerOfGroup } from "@/lib/api/training-helpers"

// ============================================================
// GET /api/training/sessions
// Query params: group_id, from, to, view (optional: "member")
// ============================================================
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  const searchParams = request.nextUrl.searchParams
  const groupId = searchParams.get("group_id")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const view = searchParams.get("view")

  // Member view: get all sessions for the member's groups
  if (view === "member") {
    // Get all group IDs the member belongs to
    const { data: memberGroups } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("profile_id", profile.id)

    // Also include groups where the user is trainer/co-trainer
    const { data: trainerGroups } = await supabase
      .from("groups")
      .select("id")
      .eq("trainer_id", profile.id)

    const { data: coTrainerGroups } = await supabase
      .from("group_trainers")
      .select("group_id")
      .eq("profile_id", profile.id)

    const allGroupIds = [
      ...(memberGroups || []).map((g) => g.group_id),
      ...(trainerGroups || []).map((g) => g.id),
      ...(coTrainerGroups || []).map((g) => g.group_id),
    ]
    const uniqueGroupIds = [...new Set(allGroupIds)]

    if (uniqueGroupIds.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    let query = supabase
      .from("training_sessions")
      .select(
        `
        *,
        group:groups!training_sessions_group_id_fkey(id, name, training_location)
      `
      )
      .in("group_id", uniqueGroupIds)
      .order("date", { ascending: true })

    if (from) query = query.gte("date", from)
    if (to) query = query.lte("date", to)

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching member sessions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the member's own RSVP for each session
    const sessionIds = (sessions || []).map((s) => s.id)
    let myRsvps: Record<string, { rsvp_status: string; rsvp_reason: string | null }> = {}

    if (sessionIds.length > 0) {
      const { data: rsvpData } = await supabase
        .from("attendance")
        .select("training_session_id, rsvp_status, rsvp_reason")
        .in("training_session_id", sessionIds)
        .eq("profile_id", profile.id)

      for (const rsvp of rsvpData || []) {
        myRsvps[rsvp.training_session_id] = {
          rsvp_status: rsvp.rsvp_status,
          rsvp_reason: rsvp.rsvp_reason,
        }
      }
    }

    const enrichedSessions = (sessions || []).map((session) => ({
      ...session,
      my_rsvp: myRsvps[session.id] || { rsvp_status: "pending", rsvp_reason: null },
    }))

    return NextResponse.json({ sessions: enrichedSessions })
  }

  // Trainer view: get sessions for a specific group with RSVP summary
  if (!groupId) {
    return NextResponse.json(
      { error: "group_id is required for trainer view" },
      { status: 400 }
    )
  }

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(supabase, profile.id, groupId, profile.role)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Not a trainer of this group" },
      { status: 403 }
    )
  }

  let query = supabase
    .from("training_sessions")
    .select(
      `
      *,
      group:groups!training_sessions_group_id_fkey(id, name, training_location)
    `
    )
    .eq("group_id", groupId)
    .order("date", { ascending: true })

  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to)

  const { data: sessions, error } = await query

  if (error) {
    console.error("Error fetching trainer sessions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get RSVP summary for each session
  const sessionIds = (sessions || []).map((s) => s.id)
  const rsvpSummaries: Record<string, { confirmed: number; declined: number; pending: number }> = {}

  if (sessionIds.length > 0) {
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("training_session_id, rsvp_status")
      .in("training_session_id", sessionIds)

    // Initialize summaries
    for (const id of sessionIds) {
      rsvpSummaries[id] = { confirmed: 0, declined: 0, pending: 0 }
    }

    for (const record of attendanceData || []) {
      const summary = rsvpSummaries[record.training_session_id]
      if (summary) {
        if (record.rsvp_status === "confirmed") summary.confirmed++
        else if (record.rsvp_status === "declined") summary.declined++
        else summary.pending++
      }
    }
  }

  const enrichedSessions = (sessions || []).map((session) => ({
    ...session,
    rsvp_summary: rsvpSummaries[session.id] || {
      confirmed: 0,
      declined: 0,
      pending: 0,
    },
  }))

  return NextResponse.json({ sessions: enrichedSessions })
}

// ============================================================
// POST /api/training/sessions - Create a single training session
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = createSessionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(supabase, profile.id, data.group_id, profile.role)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Not a trainer of this group" },
      { status: 403 }
    )
  }

  // Create the session
  const { data: session, error } = await supabase
    .from("training_sessions")
    .insert({
      group_id: data.group_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || null,
      description: data.description || null,
      created_by: profile.id,
    })
    .select(
      `
      *,
      group:groups!training_sessions_group_id_fkey(id, name, training_location)
    `
    )
    .single()

  if (error) {
    console.error("Error creating training session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create attendance records for all group members
  const { data: members } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", data.group_id)

  if (members && members.length > 0) {
    const attendanceRecords = members.map((m) => ({
      training_session_id: session.id,
      profile_id: m.profile_id,
      rsvp_status: "pending",
    }))

    const { error: attendanceError } = await supabase
      .from("attendance")
      .insert(attendanceRecords)

    if (attendanceError) {
      console.error("Error creating attendance records:", attendanceError)
    }
  }

  return NextResponse.json({ session }, { status: 201 })
}
