import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { updateEventSchema, isValidUUID } from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id] - Event-Details
// ============================================================
export async function GET(
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

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name)
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

  return NextResponse.json({ event })
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

  const { data: event, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name)
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
