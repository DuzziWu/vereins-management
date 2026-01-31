import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rsvpSchema } from "@/lib/validations/training"
import { getAuthenticatedProfile } from "@/lib/api/training-helpers"

// ============================================================
// POST /api/training/sessions/[id]/rsvp
// Body: { rsvp_status: "confirmed" | "declined", rsvp_reason?: string }
// Members submit their own RSVP (only for own profile)
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: sessionId } = await params

  // Authenticate and get profile
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

  const validation = rsvpSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Get the session to verify it exists and isn't cancelled
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
      { error: "Cannot RSVP for a cancelled training" },
      { status: 400 }
    )
  }

  // BUG-1 FIX: Prevent RSVP for past training sessions
  const sessionDate = new Date(session.date + "T23:59:59")
  if (sessionDate < new Date()) {
    return NextResponse.json(
      { error: "RSVP ist nur bis zum Trainingstag möglich" },
      { status: 400 }
    )
  }

  // Check if the member is part of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", session.group_id)
    .eq("profile_id", profile.id)
    .maybeSingle()

  // Also allow trainers to RSVP (they might attend too)
  let isGroupMember = !!membership

  if (!isGroupMember) {
    // Check if trainer or co-trainer
    const { data: group } = await supabase
      .from("groups")
      .select("trainer_id")
      .eq("id", session.group_id)
      .single()

    if (group?.trainer_id === profile.id) {
      isGroupMember = true
    } else {
      const { data: coTrainer } = await supabase
        .from("group_trainers")
        .select("id")
        .eq("group_id", session.group_id)
        .eq("profile_id", profile.id)
        .maybeSingle()

      if (coTrainer) {
        isGroupMember = true
      }
    }
  }

  if (!isGroupMember && profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Not a member of this group" },
      { status: 403 }
    )
  }

  // Check if attendance record exists (upsert)
  const { data: existingAttendance } = await supabase
    .from("attendance")
    .select("id")
    .eq("training_session_id", sessionId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  let attendance
  let error

  if (existingAttendance) {
    // Update existing RSVP
    const result = await supabase
      .from("attendance")
      .update({
        rsvp_status: data.rsvp_status,
        rsvp_reason: data.rsvp_status === "declined" ? (data.rsvp_reason || null) : null,
        rsvp_at: new Date().toISOString(),
      })
      .eq("id", existingAttendance.id)
      .select()
      .single()

    attendance = result.data
    error = result.error
  } else {
    // Create new attendance record with RSVP
    const result = await supabase
      .from("attendance")
      .insert({
        training_session_id: sessionId,
        profile_id: profile.id,
        rsvp_status: data.rsvp_status,
        rsvp_reason: data.rsvp_status === "declined" ? (data.rsvp_reason || null) : null,
        rsvp_at: new Date().toISOString(),
      })
      .select()
      .single()

    attendance = result.data
    error = result.error
  }

  if (error) {
    console.error("Error saving RSVP:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ attendance })
}
