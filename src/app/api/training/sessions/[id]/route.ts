import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cancelSessionSchema } from "@/lib/validations/training"
import { getAuthenticatedProfile, isTrainerOfGroup } from "@/lib/api/training-helpers"

// ============================================================
// GET /api/training/sessions/[id] - Get a single training session
// Returns session with group data and RSVP status of all members
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

  // Get the session with group data
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("*, group:groups!training_sessions_group_id_fkey(id, name, training_location)")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Training session not found" },
      { status: 404 }
    )
  }

  // Check access: must be member or trainer of the group
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", session.group_id)
    .eq("profile_id", profile.id)
    .maybeSingle()

  const hasTrainerAccess = await isTrainerOfGroup(
    supabase,
    profile.id,
    session.group_id,
    profile.role
  )

  if (!membership && !hasTrainerAccess && profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Not a member of this group" },
      { status: 403 }
    )
  }

  // If trainer/vorstand, include RSVP summary of all members
  if (hasTrainerAccess) {
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select(
        `
        id,
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

    return NextResponse.json({
      session,
      attendance: attendanceData || [],
    })
  }

  // For members, include only their own RSVP
  const { data: myRsvp } = await supabase
    .from("attendance")
    .select("rsvp_status, rsvp_reason, rsvp_at, actual_status")
    .eq("training_session_id", sessionId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  return NextResponse.json({
    session,
    my_rsvp: myRsvp || { rsvp_status: "pending", rsvp_reason: null },
  })
}

// ============================================================
// PATCH /api/training/sessions/[id] - Cancel a training session
// Body: { is_cancelled: true, cancellation_reason: string }
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

  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("*, group:groups!training_sessions_group_id_fkey(id, name, training_location)")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Training session not found" },
      { status: 404 }
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

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // We only support cancellation via PATCH
  if (!body.is_cancelled) {
    return NextResponse.json(
      { error: "Only cancellation is supported via PATCH" },
      { status: 400 }
    )
  }

  const validation = cancelSessionSchema.safeParse({
    cancellation_reason: body.cancellation_reason,
  })
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  // Check if already cancelled
  if (session.is_cancelled) {
    return NextResponse.json(
      { error: "Training is already cancelled" },
      { status: 409 }
    )
  }

  // Cancel the session
  const { data: updatedSession, error: updateError } = await supabase
    .from("training_sessions")
    .update({
      is_cancelled: true,
      cancellation_reason: validation.data.cancellation_reason,
    })
    .eq("id", sessionId)
    .select("*, group:groups!training_sessions_group_id_fkey(id, name, training_location)")
    .single()

  if (updateError) {
    console.error("Error cancelling training session:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send notifications to all group members
  const { data: members } = await supabase
    .from("group_members")
    .select("profile:profiles!group_members_profile_id_fkey(user_id)")
    .eq("group_id", session.group_id)

  if (members && members.length > 0) {
    const groupName =
      (session.group as { id: string; name: string } | null)?.name || "Gruppe"

    const notifications = members
      .filter((m) => {
        const memberProfile = m.profile as { user_id: string | null } | null
        return memberProfile?.user_id != null
      })
      .map((m) => {
        const memberProfile = m.profile as { user_id: string }
        return {
          user_id: memberProfile.user_id,
          type: "event" as const,
          title: "Training abgesagt",
          message: `Das Training der ${groupName} am ${session.date} wurde abgesagt. Grund: ${validation.data.cancellation_reason}`,
          link: "/member/schedule",
        }
      })

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (notifError) {
        console.error("Error sending cancellation notifications:", notifError)
      }
    }
  }

  return NextResponse.json({ session: updatedSession })
}
