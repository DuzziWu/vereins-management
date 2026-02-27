import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// GET /api/events/my-events
// Lädt Events zu denen das aktuelle Mitglied eingeladen wurde
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
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Parameter
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 10

  // Hole Events zu denen der User eingeladen ist
  // Nur zukünftige Events und nicht abgesagte
  const today = new Date().toISOString().split("T")[0]

  const { data: assignments, error } = await (supabase
    .from("event_assignments") as ReturnType<typeof supabase.from>)
    .select(`
      id,
      rsvp_status,
      event:events!event_assignments_event_id_fkey(
        id,
        title,
        event_type,
        event_date,
        start_time,
        end_time,
        location_name,
        status
      )
    `)
    .eq("profile_id", profile.id)
    .gte("event.event_date", today)
    .neq("event.status", "abgesagt")
    .order("event.event_date", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching my events:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Type für das Assignment mit Event
  type AssignmentWithEvent = {
    id: string
    rsvp_status: string
    event: {
      id: string
      title: string
      event_type: string
      event_date: string
      start_time: string
      end_time: string | null
      location_name: string | null
      status: string
    } | null
  }

  // Formatiere Ergebnis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = ((assignments || []) as any[])
    .filter((a: any) => a.event) // Filter out any null events
    .map((a: any) => {
      const event = a.event
      return {
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        location_name: event.location_name,
        status: event.status,
        rsvp_status: a.rsvp_status,
      }
    })
    .sort((a: { event_date: string }, b: { event_date: string }) => a.event_date.localeCompare(b.event_date))

  return NextResponse.json({ events })
}
