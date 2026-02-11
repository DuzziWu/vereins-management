import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createEventSchema } from "@/lib/validations/events"
import { getEventRateLimiter, checkRateLimit } from "@/lib/rate-limiter"

// ============================================================
// GET /api/events
// Query params: from, to, status (optional)
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

  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const status = searchParams.get("status")

  let query = supabase
    .from("events")
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name),
      event_type_info:event_types!events_event_type_id_fkey(id, name, color, icon)
    `)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })

  // Datumsbereich-Filter
  if (from) query = query.gte("event_date", from)
  if (to) query = query.lte("event_date", to)

  // Status-Filter (nur für Vorstand)
  if (status && profile.role === "vorstand") {
    query = query.eq("status", status)
  }

  // Rollenbasierte Filterung wird durch RLS gehandhabt
  // Zusätzliche Filterung hier für Konsistenz:
  // - Mitglieder: nur bestätigte/abgeschlossene Events
  // - Trainer: + eigene Anfragen
  // - Vorstand: alle
  if (profile.role === "mitglied") {
    query = query.in("status", ["bestaetigt", "abgeschlossen"])
  } else if (profile.role === "trainer") {
    // Trainer sieht bestätigte + eigene Anfragen
    // Dies wird durch RLS gehandhabt, aber wir können hier nicht ODER-Logik abbilden
    // Daher verlassen wir uns auf RLS
  }

  const { data: events, error } = await query

  if (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: events || [] })
}

// ============================================================
// POST /api/events - Event erstellen
// ============================================================
export async function POST(request: NextRequest) {
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

  // Nur Vorstand und Trainer dürfen Events erstellen
  if (!["vorstand", "trainer"].includes(profile.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only Vorstand and Trainer can create events" },
      { status: 403 }
    )
  }

  // Rate Limiting: 10 Events pro Stunde pro User
  const rateLimiter = getEventRateLimiter()
  const rateLimitResult = await checkRateLimit(rateLimiter, user.id)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: rateLimitResult.reset
          ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
          : 3600,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.reset
            ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            : "3600",
        },
      }
    )
  }

  // Parse und validiere Body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = createEventSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // PROJ-23: Hole event_type_id aus Body (falls mitgesendet)
  const eventTypeId = body.event_type_id

  // Initial-Status basierend auf Rolle
  // Vorstand: Events werden direkt "bestätigt"
  // Trainer: Events starten als "Anfrage"
  const initialStatus = profile.role === "vorstand" ? "bestaetigt" : "anfrage"

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title: data.title,
      description: data.description || null,
      event_type: data.event_type,
      event_type_id: eventTypeId || null, // PROJ-23: Dynamischer Event-Typ
      status: initialStatus,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time || null,
      location_name: data.location_name || null,
      address: data.address || null,
      meeting_point: data.meeting_point || null,
      created_by: profile.id,
    })
    .select(`
      *,
      creator:profiles!events_created_by_fkey(first_name, last_name),
      event_type_info:event_types!events_event_type_id_fkey(id, name, color, icon)
    `)
    .single()

  if (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Status-Log-Eintrag für initiale Erstellung (für alle Rollen)
  await supabase.from("event_status_log").insert({
    event_id: event.id,
    old_status: null,
    new_status: initialStatus,
    changed_by: profile.id,
  })

  return NextResponse.json({ event }, { status: 201 })
}
