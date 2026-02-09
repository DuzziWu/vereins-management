import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// GET /api/events/pending-rsvps
// Lädt Events mit offenen RSVPs für Trainer/Vorstand Dashboard
// ============================================================
export async function GET(request: NextRequest) {
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

  // Nur Vorstand/Trainer dürfen diese API nutzen
  if (!["vorstand", "trainer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Parameter
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 5

  // Hole zukünftige Events
  const today = new Date().toISOString().split("T")[0]

  // Für Trainer: Nur Events wo er Ersteller ist oder seine Gruppen zugewiesen sind
  // Für Vorstand: Alle Events
  let eventsQuery = supabase
    .from("events")
    .select("id, title, event_date, start_time, status")
    .gte("event_date", today)
    .neq("status", "abgesagt")
    .order("event_date", { ascending: true })
    .limit(20) // Mehr laden für Filterung

  if (profile.role === "trainer") {
    // Trainer sieht Events die er erstellt hat
    eventsQuery = eventsQuery.eq("created_by", profile.id)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error("Error fetching events:", eventsError)
    return NextResponse.json({ error: eventsError.message }, { status: 500 })
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ events: [] })
  }

  // Hole RSVP-Stats für diese Events
  const eventIds = events.map((e) => e.id)

  const { data: assignments, error: assignmentError } = await supabase
    .from("event_assignments")
    .select("event_id, rsvp_status")
    .in("event_id", eventIds)

  if (assignmentError) {
    console.error("Error fetching assignments:", assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  // Berechne Stats pro Event
  const statsByEvent = new Map<
    string,
    { total: number; confirmed: number; declined: number; pending: number }
  >()

  for (const a of assignments || []) {
    if (!statsByEvent.has(a.event_id)) {
      statsByEvent.set(a.event_id, { total: 0, confirmed: 0, declined: 0, pending: 0 })
    }
    const stats = statsByEvent.get(a.event_id)!
    stats.total++
    if (a.rsvp_status === "zugesagt") stats.confirmed++
    else if (a.rsvp_status === "abgesagt") stats.declined++
    else stats.pending++
  }

  // Erstelle Ergebnis mit Stats (nur Events mit Zuweisungen und offenen RSVPs)
  const eventsWithStats = events
    .map((event) => {
      const stats = statsByEvent.get(event.id) || {
        total: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
      }
      return {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        start_time: event.start_time,
        status: event.status,
        total_invited: stats.total,
        total_confirmed: stats.confirmed,
        total_declined: stats.declined,
        total_pending: stats.pending,
        total_responded: stats.confirmed + stats.declined,
      }
    })
    .filter((e) => e.total_invited > 0 && e.total_pending > 0) // Nur Events mit offenen RSVPs
    .slice(0, limit)

  return NextResponse.json({ events: eventsWithStats })
}
