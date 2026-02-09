import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/events"

// ============================================================
// POST /api/events/[id]/reminder
// Sende Erinnerung an alle Mitglieder mit Status "ausstehend"
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

  // Prüfe ob Event existiert und nicht abgesagt/abgeschlossen ist
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, event_date, start_time, status, created_by")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  if (event.status === "abgesagt" || event.status === "abgeschlossen") {
    return NextResponse.json(
      { error: "Keine Erinnerungen für abgesagte oder abgeschlossene Events" },
      { status: 400 }
    )
  }

  // Prüfe ob Event in der Zukunft liegt
  const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)
  if (eventDateTime < new Date()) {
    return NextResponse.json(
      { error: "Keine Erinnerungen für vergangene Events" },
      { status: 400 }
    )
  }

  // Nur Vorstand oder Event-Ersteller darf Erinnerungen senden
  const canSend = profile.role === "vorstand" || event.created_by === profile.id

  if (!canSend) {
    // Prüfe ob Trainer eines zugewiesenen Events
    const { data: isTrainer } = await supabase
      .from("event_assignments")
      .select(`
        id,
        group:groups!event_assignments_group_id_fkey(
          trainer_id,
          group_trainers(profile_id)
        )
      `)
      .eq("event_id", eventId)
      .limit(1)
      .maybeSingle()

    const group = isTrainer?.group as { trainer_id: string; group_trainers: { profile_id: string }[] } | null
    const isGroupTrainer = group?.trainer_id === profile.id ||
      group?.group_trainers?.some((gt: { profile_id: string }) => gt.profile_id === profile.id)

    if (!isGroupTrainer) {
      return NextResponse.json(
        { error: "Forbidden: Nur Vorstand, Event-Ersteller oder Trainer können Erinnerungen senden" },
        { status: 403 }
      )
    }
  }

  // Hole alle Assignments mit Status "ausstehend" (inkl. auth user_id für Notification)
  const { data: pendingAssignments, error: assignmentError } = await supabase
    .from("event_assignments")
    .select(`
      id,
      profile_id,
      profile:profiles!event_assignments_profile_id_fkey(
        id,
        first_name,
        last_name,
        user_id
      )
    `)
    .eq("event_id", eventId)
    .eq("rsvp_status", "ausstehend")

  if (assignmentError) {
    console.error("Error fetching pending assignments:", assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (!pendingAssignments || pendingAssignments.length === 0) {
    return NextResponse.json({
      success: true,
      message: "Keine ausstehenden RSVPs",
      sent: 0,
    })
  }

  // Formatiere Event-Datum für Nachricht
  const eventDateFormatted = new Date(event.event_date).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // Erstelle Notifications für alle mit ausstehenden RSVPs
  const notifications = pendingAssignments
    .filter(a => a.profile?.user_id) // Nur Mitglieder mit Account
    .map(a => ({
      user_id: (a.profile as { user_id: string }).user_id,
      type: "event" as const,
      title: "RSVP-Erinnerung",
      message: `Bitte bestätige deine Teilnahme für "${event.title}" am ${eventDateFormatted}.`,
      link: `/dashboard/events/${eventId}`,
    }))

  if (notifications.length > 0) {
    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications)

    if (notifyError) {
      console.error("Error creating notifications:", notifyError)
      return NextResponse.json({ error: notifyError.message }, { status: 500 })
    }
  }

  // Aktualisiere reminder_sent_at für alle betroffenen Assignments
  const assignmentIds = pendingAssignments.map(a => a.id)
  const { error: updateError } = await supabase
    .from("event_assignments")
    .update({ reminder_sent_at: new Date().toISOString() })
    .in("id", assignmentIds)

  if (updateError) {
    console.error("Error updating reminder_sent_at:", updateError)
    // Nicht kritisch, wir fahren fort
  }

  return NextResponse.json({
    success: true,
    message: `Erinnerung an ${notifications.length} Mitglieder gesendet`,
    sent: notifications.length,
    total_pending: pendingAssignments.length,
  })
}
