import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { updateStatusSchema, isValidUUID, type EventStatus } from "@/lib/validations/events"

// Erlaubte Status-Transitions
const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  anfrage: ["bestaetigt", "abgesagt"],
  bestaetigt: ["abgeschlossen", "abgesagt"],
  abgeschlossen: [], // Keine weitere Transition möglich
  abgesagt: [], // Keine weitere Transition möglich
}

// ============================================================
// PATCH /api/events/[id]/status - Event-Status ändern (nur Vorstand)
// ============================================================
export async function PATCH(
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

  // Nur Vorstand darf Status ändern
  if (profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Only Vorstand can change event status" },
      { status: 403 }
    )
  }

  // Hole aktuelles Event
  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Parse und validiere Body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = updateStatusSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { status: newStatus } = validation.data
  const oldStatus = existingEvent.status as EventStatus

  // Prüfe ob Transition erlaubt ist
  if (!ALLOWED_TRANSITIONS[oldStatus].includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status transition from '${oldStatus}' to '${newStatus}'`,
        allowed: ALLOWED_TRANSITIONS[oldStatus],
      },
      { status: 400 }
    )
  }

  // Update Status
  const { data: event, error } = await supabase
    .from("events")
    .update({ status: newStatus })
    .eq("id", id)
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name)
    `)
    .single()

  if (error) {
    console.error("Error updating event status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Status-Log-Eintrag erstellen
  await supabase.from("event_status_log").insert({
    event_id: id,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: profile.id,
  })

  return NextResponse.json({ event })
}
