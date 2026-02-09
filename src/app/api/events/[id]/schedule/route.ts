import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID, updateScheduleSchema, ScheduleEntryInput } from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id]/schedule - Ablaufplan laden
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

  // Prüfe ob Event existiert
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
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

  // Lade Ablaufplan
  const { data: entries, error } = await supabase
    .from("event_schedule")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true })
    .order("time", { ascending: true })

  if (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: entries || [] })
}

// ============================================================
// PUT /api/events/[id]/schedule - Ablaufplan speichern (alle Einträge)
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
      { error: "Forbidden: Only event creator (Trainer) or Vorstand can edit schedule" },
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

  const validation = updateScheduleSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { entries } = validation.data

  // Transaction: Lösche alte Einträge und füge neue ein
  // Erst alle existierenden Einträge löschen
  const { error: deleteError } = await supabase
    .from("event_schedule")
    .delete()
    .eq("event_id", id)

  if (deleteError) {
    console.error("Error deleting old schedule:", deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Wenn keine neuen Einträge, sind wir fertig
  if (entries.length === 0) {
    return NextResponse.json({ entries: [] })
  }

  // Neue Einträge einfügen mit sort_order
  const newEntries = entries.map((entry: ScheduleEntryInput, index: number) => ({
    event_id: id,
    time: entry.time,
    description: entry.description,
    sort_order: entry.sort_order ?? index,
  }))

  const { data: insertedEntries, error: insertError } = await supabase
    .from("event_schedule")
    .insert(newEntries)
    .select()
    .order("sort_order", { ascending: true })

  if (insertError) {
    console.error("Error inserting schedule:", insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ entries: insertedEntries })
}
