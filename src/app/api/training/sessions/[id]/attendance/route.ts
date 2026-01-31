import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { recordAttendanceSchema, correctAttendanceSchema } from "@/lib/validations/training"
import { getAuthenticatedProfile, isTrainerOfGroup, isWithinAttendanceWindow } from "@/lib/api/training-helpers"

// ============================================================
// GET /api/training/sessions/[id]/attendance
// Returns attendance list with profile data and RSVP status
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: sessionId } = await params

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, group_id")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Training session not found" },
      { status: 404 }
    )
  }

  // Check access: trainer or vorstand can see all attendance
  const hasTrainerAccess = await isTrainerOfGroup(
    supabase,
    profile.id,
    session.group_id,
    profile.role
  )

  if (!hasTrainerAccess) {
    return NextResponse.json(
      { error: "Forbidden: Only trainers can view attendance list" },
      { status: 403 }
    )
  }

  // Fetch attendance with profile data
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select(
      `
      id,
      training_session_id,
      profile_id,
      rsvp_status,
      rsvp_reason,
      rsvp_at,
      actual_status,
      recorded_by,
      recorded_at,
      profile:profiles!attendance_profile_id_fkey(id, first_name, last_name)
    `
    )
    .eq("training_session_id", sessionId)
    .order("profile_id")

  if (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ attendance: attendance || [] })
}

// ============================================================
// POST /api/training/sessions/[id]/attendance
// Body: { attendance: [{ profile_id, actual_status }] }
// Trainer records actual attendance
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: sessionId } = await params

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, group_id, date, is_cancelled")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Training session not found" },
      { status: 404 }
    )
  }

  // Cannot record attendance for cancelled sessions
  if (session.is_cancelled) {
    return NextResponse.json(
      { error: "Cannot record attendance for a cancelled training" },
      { status: 400 }
    )
  }

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(
    supabase,
    profile.id,
    session.group_id,
    profile.role
  )
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Not a trainer of this group" },
      { status: 403 }
    )
  }

  // Check time window (day of training + 24h), unless Vorstand
  if (profile.role !== "vorstand" && !isWithinAttendanceWindow(session.date)) {
    return NextResponse.json(
      {
        error:
          "Zeitfenster abgelaufen: Anwesenheit kann nur am Trainingstag und bis 24 Stunden danach erfasst werden",
      },
      { status: 403 }
    )
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = recordAttendanceSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { attendance: attendanceUpdates } = validation.data

  // Update each attendance record
  // Note: Audit logging is handled automatically by the DB trigger
  // (trg_log_attendance_change → log_attendance_actual_status_change)
  const errors: string[] = []

  for (const update of attendanceUpdates) {
    const { error: updateError } = await supabase
      .from("attendance")
      .update({
        actual_status: update.actual_status,
        recorded_by: profile.id,
        recorded_at: new Date().toISOString(),
      })
      .eq("training_session_id", sessionId)
      .eq("profile_id", update.profile_id)

    if (updateError) {
      console.error(
        `Error updating attendance for ${update.profile_id}:`,
        updateError
      )
      errors.push(`Failed to update attendance for profile ${update.profile_id}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, errors },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

// ============================================================
// PATCH /api/training/sessions/[id]/attendance
// Body: { attendance: [{ profile_id, actual_status }] }
// Vorstand-only: correct attendance after the 24h window
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: sessionId } = await params

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Only Vorstand can correct attendance after the time window
  if (profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Nur der Vorstand kann Anwesenheiten nachträglich korrigieren" },
      { status: 403 }
    )
  }

  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, group_id, date, is_cancelled")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Training session not found" },
      { status: 404 }
    )
  }

  if (session.is_cancelled) {
    return NextResponse.json(
      { error: "Cannot correct attendance for a cancelled training" },
      { status: 400 }
    )
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = correctAttendanceSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { attendance: attendanceUpdates } = validation.data

  // Update each attendance record
  // Note: Audit logging is handled automatically by the DB trigger
  // (trg_log_attendance_change → log_attendance_actual_status_change)
  const errors: string[] = []

  for (const update of attendanceUpdates) {
    const { error: updateError } = await supabase
      .from("attendance")
      .update({
        actual_status: update.actual_status,
        recorded_by: profile.id,
        recorded_at: new Date().toISOString(),
      })
      .eq("training_session_id", sessionId)
      .eq("profile_id", update.profile_id)

    if (updateError) {
      console.error(
        `Error correcting attendance for ${update.profile_id}:`,
        updateError
      )
      errors.push(`Failed to correct attendance for profile ${update.profile_id}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, errors },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
