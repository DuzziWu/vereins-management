import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID, updateRsvpSchema } from "@/lib/validations/events"

// ============================================================
// POST /api/events/[id]/rsvp
// Mitglied setzt eigenen RSVP-Status (zusagen/absagen)
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params

  if (!isValidUUID(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Prüfe ob Event existiert und nicht abgesagt ist
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, event_date, start_time, status")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  if (event.status === "abgesagt") {
    return NextResponse.json(
      { error: "RSVP nicht möglich für abgesagtes Event" },
      { status: 400 }
    )
  }

  // Prüfe ob Event bereits begonnen hat
  const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)
  if (eventDateTime < new Date()) {
    return NextResponse.json(
      { error: "RSVP ist nur vor Eventbeginn möglich" },
      { status: 400 }
    )
  }

  // Prüfe ob Mitglied eingeladen wurde
  const { data: assignment, error: assignmentError } = await supabase
    .from("event_assignments")
    .select("id, rsvp_status")
    .eq("event_id", eventId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  if (assignmentError) {
    console.error("Error fetching assignment:", assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (!assignment) {
    return NextResponse.json(
      { error: "Sie wurden nicht zu diesem Event eingeladen" },
      { status: 403 }
    )
  }

  // Parse und validiere Body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = updateRsvpSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { status: rsvpStatus } = validation.data

  // Update RSVP-Status
  const { data: updated, error: updateError } = await supabase
    .from("event_assignments")
    .update({
      rsvp_status: rsvpStatus,
      rsvp_updated_at: new Date().toISOString(),
    })
    .eq("id", assignment.id)
    .select(`
      id,
      event_id,
      profile_id,
      rsvp_status,
      rsvp_updated_at
    `)
    .single()

  if (updateError) {
    console.error("Error updating RSVP:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    assignment: updated,
    message: rsvpStatus === "zugesagt"
      ? "Teilnahme bestätigt"
      : "Absage gespeichert",
  })
}

// ============================================================
// GET /api/events/[id]/rsvp
// Hole eigenen RSVP-Status für ein Event
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params

  if (!isValidUUID(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Hole Assignment für dieses Event
  const { data: assignment, error } = await supabase
    .from("event_assignments")
    .select(`
      id,
      event_id,
      profile_id,
      rsvp_status,
      rsvp_updated_at,
      group:groups!event_assignments_group_id_fkey(id, name)
    `)
    .eq("event_id", eventId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching RSVP:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!assignment) {
    return NextResponse.json({
      invited: false,
      assignment: null,
    })
  }

  return NextResponse.json({
    invited: true,
    assignment,
  })
}
