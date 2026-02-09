import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID, updateLogisticsSchema } from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id]/logistics - Logistik-Info laden
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  // Hole Profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("id, created_by, logistics_info")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    console.error("Error fetching logistics:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Zugriffsprüfung: Vorstand, Event-Ersteller, oder eingeladen
  const isVorstand = profile.role === "vorstand"
  const isEventCreator = event.created_by === profile.id

  if (!isVorstand && !isEventCreator) {
    // Prüfe ob User zum Event eingeladen ist
    const { data: assignment } = await supabase
      .from("event_assignments")
      .select("id")
      .eq("event_id", id)
      .eq("profile_id", profile.id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: "Forbidden: No access to this event" },
        { status: 403 }
      )
    }
  }

  return NextResponse.json({ logistics_info: event.logistics_info })
}

// ============================================================
// PUT /api/events/[id]/logistics - Logistik-Info speichern
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  // Hole Profil und prüfe Berechtigung
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Prüfe ob Event existiert und User berechtigt ist
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Nur Ersteller oder Vorstand darf bearbeiten
  const canEdit =
    profile.role === "vorstand" ||
    (profile.role === "trainer" && event.created_by === profile.id)

  if (!canEdit) {
    return NextResponse.json(
      { error: "Forbidden: Only event creator (Trainer) or Vorstand can edit logistics" },
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

  const validation = updateLogisticsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { logistics_info } = validation.data

  // Update Event
  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update({ logistics_info })
    .eq("id", id)
    .select("logistics_info")
    .single()

  if (updateError) {
    console.error("Error updating logistics:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ logistics_info: updatedEvent.logistics_info })
}
