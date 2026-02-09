import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// POST /api/events/auto-complete
// Automatisches Abschließen von vergangenen Events
// Kann via Cron-Job aufgerufen werden (z.B. täglich)
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // API-Key Validierung für Cron-Jobs (optional aber empfohlen)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Wenn CRON_SECRET gesetzt ist, muss es übereinstimmen
  // Ansonsten muss der User als Vorstand eingeloggt sein
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    // Fallback: User muss Vorstand sein
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

    if (!profile || profile.role !== "vorstand") {
      return NextResponse.json(
        { error: "Forbidden: Only Vorstand or Cron can trigger auto-complete" },
        { status: 403 }
      )
    }
  }

  // Finde alle bestätigten Events die in der Vergangenheit liegen
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  const { data: pastEvents, error: fetchError } = await supabase
    .from("events")
    .select("id, status, event_date")
    .eq("status", "bestaetigt")
    .lt("event_date", today)

  if (fetchError) {
    console.error("Error fetching past events:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!pastEvents || pastEvents.length === 0) {
    return NextResponse.json({
      message: "No events to auto-complete",
      count: 0,
    })
  }

  // Update alle gefundenen Events auf "abgeschlossen"
  const eventIds = pastEvents.map((e) => e.id)

  const { error: updateError } = await supabase
    .from("events")
    .update({ status: "abgeschlossen" })
    .in("id", eventIds)

  if (updateError) {
    console.error("Error updating events:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Status-Log-Einträge für alle geänderten Events erstellen
  // Verwende einen Vorstand als changed_by (da changed_by NOT NULL ist)
  const { data: systemUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "vorstand")
    .limit(1)
    .single()

  if (systemUser) {
    const statusLogs = pastEvents.map((event) => ({
      event_id: event.id,
      old_status: "bestaetigt",
      new_status: "abgeschlossen",
      changed_by: systemUser.id, // Erster Vorstand als System-User
    }))

    const { error: logError } = await supabase
      .from("event_status_log")
      .insert(statusLogs)

    if (logError) {
      // Log-Fehler ist nicht kritisch, Events wurden trotzdem geändert
      console.error("Error creating status logs:", logError)
    }
  } else {
    console.warn("No Vorstand found for status log, skipping audit log entries")
  }

  return NextResponse.json({
    message: "Events auto-completed successfully",
    count: pastEvents.length,
    eventIds,
  })
}
