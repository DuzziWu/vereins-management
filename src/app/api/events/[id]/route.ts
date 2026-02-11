import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { updateEventSchema, isValidUUID } from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id] - Event-Details
// Optional query params:
// - include=schedule,attachments - Include schedule and/or attachments
// - rsvp=true - Include current user's RSVP status and RSVP stats
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const includeRsvp = searchParams.get("rsvp") === "true"
  const includeParam = searchParams.get("include") || ""
  const includes = includeParam.split(",").filter(Boolean)

  // UUID-Validierung
  if (!isValidUUID(id)) {
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

  // Hole Profil fuer RSVP-Abfrage
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name),
      event_type_info:event_types!events_event_type_id_fkey(id, name, color, icon)
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Erweitere Event-Objekt mit optionalen Daten
  const eventWithDetails: Record<string, unknown> = { ...event }

  // Include schedule if requested
  if (includes.includes("schedule")) {
    const { data: schedule } = await supabase
      .from("event_schedule")
      .select("*")
      .eq("event_id", id)
      .order("sort_order", { ascending: true })
    eventWithDetails.schedule = schedule || []
  }

  // Include attachments if requested
  if (includes.includes("attachments")) {
    const { data: attachments } = await supabase
      .from("event_attachments")
      .select(`
        *,
        uploader:profiles!event_attachments_uploaded_by_fkey(first_name, last_name)
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: true })
    eventWithDetails.attachments = attachments || []
  }

  // Include RSVP data if requested or by default for EventDetailView
  if (includeRsvp || includes.length > 0) {
    // Hole RSVP-Stats
    const { data: assignments } = await supabase
      .from("event_assignments")
      .select("rsvp_status, profile_id")
      .eq("event_id", id)

    if (assignments) {
      eventWithDetails.rsvp_stats = {
        total_invited: assignments.length,
        total_confirmed: assignments.filter(a => a.rsvp_status === "zugesagt").length,
        total_declined: assignments.filter(a => a.rsvp_status === "abgesagt").length,
        total_pending: assignments.filter(a => a.rsvp_status === "ausstehend").length,
      }

      // Hole eigenen RSVP-Status wenn User ein Profil hat
      if (profile) {
        const myAssignment = assignments.find(a => a.profile_id === profile.id)
        eventWithDetails.my_rsvp_status = myAssignment?.rsvp_status || null
        eventWithDetails.is_invited = !!myAssignment
      }
    }
  }

  return NextResponse.json({ event: eventWithDetails })
}

// ============================================================
// PUT /api/events/[id] - Event bearbeiten
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // UUID-Validierung
  if (!isValidUUID(id)) {
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

  // Prüfe ob Event existiert und User berechtigt ist
  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, created_by, status")
    .eq("id", id)
    .single()

  if (fetchError || !existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Nur Ersteller oder Vorstand darf bearbeiten
  const canEdit =
    profile.role === "vorstand" || existingEvent.created_by === profile.id

  if (!canEdit) {
    return NextResponse.json(
      { error: "Forbidden: Only event creator or Vorstand can edit" },
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

  const validation = updateEventSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Update-Objekt vorbereiten
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.event_type !== undefined) updateData.event_type = data.event_type
  if (data.event_date !== undefined) updateData.event_date = data.event_date
  if (data.start_time !== undefined) updateData.start_time = data.start_time
  if (data.end_time !== undefined) updateData.end_time = data.end_time || null
  if (data.location_name !== undefined) updateData.location_name = data.location_name || null
  if (data.address !== undefined) updateData.address = data.address || null
  if (data.meeting_point !== undefined) updateData.meeting_point = data.meeting_point || null
  // PROJ-23: Dynamischer Event-Typ
  if (body.event_type_id !== undefined) updateData.event_type_id = body.event_type_id

  const { data: event, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name),
      event_type_info:event_types!events_event_type_id_fkey(id, name, color, icon)
    `)
    .single()

  if (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event })
}

// ============================================================
// DELETE /api/events/[id] - Event löschen (nur Vorstand)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // UUID-Validierung
  if (!isValidUUID(id)) {
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

  // Nur Vorstand darf löschen
  if (profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Only Vorstand can delete events" },
      { status: 403 }
    )
  }

  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
