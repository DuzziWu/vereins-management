import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID, assignEventSchema } from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id]/assignments
// Lade alle Teilnehmer/Einladungen für ein Event
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

  // Hole Profil für Berechtigungsprüfung
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
    .select("id, created_by, status")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Lade Assignments mit Profil- und Gruppen-Daten
  const { data: assignments, error } = await supabase
    .from("event_assignments")
    .select(`
      id,
      event_id,
      group_id,
      profile_id,
      rsvp_status,
      rsvp_updated_at,
      reminder_sent_at,
      created_at,
      profile:profiles!event_assignments_profile_id_fkey(id, first_name, last_name),
      group:groups!event_assignments_group_id_fkey(id, name)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Berechne RSVP-Stats
  const stats = {
    total_invited: assignments?.length || 0,
    total_confirmed: assignments?.filter(a => a.rsvp_status === "zugesagt").length || 0,
    total_declined: assignments?.filter(a => a.rsvp_status === "abgesagt").length || 0,
    total_pending: assignments?.filter(a => a.rsvp_status === "ausstehend").length || 0,
  }

  return NextResponse.json({ assignments, stats })
}

// ============================================================
// POST /api/events/[id]/assignments
// Weise Mitglieder zu einem Event zu
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

  // Prüfe ob Event existiert
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by, status")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Nur Vorstand oder Event-Ersteller darf zuweisen
  const canAssign = profile.role === "vorstand" || event.created_by === profile.id

  if (!canAssign) {
    // Prüfe ob Trainer (hat eigene RLS Policy)
    // Die RLS Policy prüft ob der User Trainer einer der zugewiesenen Gruppen ist
  }

  // Parse Body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = assignEventSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { assignments: newAssignments } = validation.data

  // Erstelle Assignments (Deduplizierung durch UNIQUE constraint)
  const insertData = newAssignments.map(a => ({
    event_id: eventId,
    profile_id: a.profile_id,
    group_id: a.group_id || null,
    rsvp_status: "ausstehend" as const,
  }))

  // Nutze upsert um Duplikate zu vermeiden
  const { data: created, error } = await supabase
    .from("event_assignments")
    .upsert(insertData, {
      onConflict: "event_id,profile_id",
      ignoreDuplicates: true,
    })
    .select(`
      id,
      event_id,
      group_id,
      profile_id,
      rsvp_status,
      created_at,
      profile:profiles!event_assignments_profile_id_fkey(id, first_name, last_name)
    `)

  if (error) {
    console.error("Error creating assignments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assignments: created }, { status: 201 })
}

// ============================================================
// PUT /api/events/[id]/assignments
// Aktualisiere die Teilnehmer-Liste (ersetze alle)
// ============================================================
export async function PUT(
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

  // Prüfe ob Event existiert
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by, status")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Nur Vorstand oder Event-Ersteller darf bearbeiten
  const canEdit = profile.role === "vorstand" || event.created_by === profile.id
  if (!canEdit) {
    return NextResponse.json(
      { error: "Forbidden: Only event creator or Vorstand can edit assignments" },
      { status: 403 }
    )
  }

  // Parse Body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = assignEventSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { assignments: newAssignments } = validation.data
  const newProfileIds = newAssignments.map(a => a.profile_id)

  // Hole aktuelle Assignments
  const { data: currentAssignments } = await supabase
    .from("event_assignments")
    .select("id, profile_id")
    .eq("event_id", eventId)

  const currentProfileIds = currentAssignments?.map(a => a.profile_id) || []

  // Finde zu löschende und neue Assignments
  const toDelete = currentAssignments?.filter(a => !newProfileIds.includes(a.profile_id)) || []
  const toAdd = newAssignments.filter(a => !currentProfileIds.includes(a.profile_id))

  // Lösche entfernte Assignments
  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(a => a.id)
    const { error: deleteError } = await supabase
      .from("event_assignments")
      .delete()
      .in("id", deleteIds)

    if (deleteError) {
      console.error("Error deleting assignments:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
  }

  // Füge neue Assignments hinzu
  if (toAdd.length > 0) {
    const insertData = toAdd.map(a => ({
      event_id: eventId,
      profile_id: a.profile_id,
      group_id: a.group_id || null,
      rsvp_status: "ausstehend" as const,
    }))

    const { error: insertError } = await supabase
      .from("event_assignments")
      .insert(insertData)

    if (insertError) {
      console.error("Error inserting assignments:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Lade aktualisierte Liste
  const { data: assignments, error } = await supabase
    .from("event_assignments")
    .select(`
      id,
      event_id,
      group_id,
      profile_id,
      rsvp_status,
      rsvp_updated_at,
      created_at,
      profile:profiles!event_assignments_profile_id_fkey(id, first_name, last_name),
      group:groups!event_assignments_group_id_fkey(id, name)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    assignments,
    deleted: toDelete.length,
    added: toAdd.length,
  })
}

// ============================================================
// DELETE /api/events/[id]/assignments
// Lösche alle Assignments für ein Event
// ============================================================
export async function DELETE(
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

  // Nur Vorstand darf alle Assignments löschen
  if (profile.role !== "vorstand") {
    return NextResponse.json(
      { error: "Forbidden: Only Vorstand can delete all assignments" },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from("event_assignments")
    .delete()
    .eq("event_id", eventId)

  if (error) {
    console.error("Error deleting assignments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
