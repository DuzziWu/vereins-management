import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createSeriesSchema, deleteSeriesSchema } from "@/lib/validations/training"
import { getAuthenticatedProfile, isTrainerOfGroup, getTodayBerlin } from "@/lib/api/training-helpers"

// ============================================================
// Helper: Generate dates for a recurring series
// ============================================================
function generateSeriesDates(
  startDate: string,
  endDate: string | null,
  dayOfWeek: number
): string[] {
  const dates: string[] = []
  const start = new Date(startDate + "T00:00:00")

  // If no end date, generate 6 months of dates
  let end: Date
  if (endDate) {
    end = new Date(endDate + "T00:00:00")
  } else {
    end = new Date(start)
    end.setMonth(end.getMonth() + 6)
  }

  // day_of_week: 0=Montag, 1=Dienstag, ..., 6=Sonntag
  // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
  // Convert: our 0(Mon) -> JS 1(Mon), our 6(Son) -> JS 0(Sun)
  const jsDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1

  // Find first occurrence
  const current = new Date(start)
  while (current.getDay() !== jsDayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  // Generate all dates
  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, "0")
    const day = String(current.getDate()).padStart(2, "0")
    dates.push(`${year}-${month}-${day}`)
    current.setDate(current.getDate() + 7)
  }

  return dates
}

// ============================================================
// POST /api/training/series - Create a recurring training series
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = createSeriesSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const data = validation.data

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(supabase, profile.id, data.group_id, profile.role)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Not a trainer of this group" },
      { status: 403 }
    )
  }

  // Create the series
  const { data: series, error: seriesError } = await supabase
    .from("training_series")
    .insert({
      group_id: data.group_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || null,
      start_date: data.start_date,
      end_date: data.end_date || null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (seriesError) {
    console.error("Error creating training series:", seriesError)
    return NextResponse.json({ error: seriesError.message }, { status: 500 })
  }

  // Generate session dates
  const dates = generateSeriesDates(
    data.start_date,
    data.end_date || null,
    data.day_of_week
  )

  if (dates.length === 0) {
    return NextResponse.json(
      { series, sessions_created: 0 },
      { status: 201 }
    )
  }

  // Create all sessions
  const sessionRecords = dates.map((date) => ({
    group_id: data.group_id,
    date,
    start_time: data.start_time,
    end_time: data.end_time,
    location: data.location || null,
    series_id: series.id,
    created_by: profile.id,
  }))

  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .insert(sessionRecords)
    .select("id")

  if (sessionsError) {
    console.error("Error creating training sessions:", sessionsError)
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  // Create attendance records for all group members for all sessions
  const { data: members } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", data.group_id)

  if (members && members.length > 0 && sessions && sessions.length > 0) {
    const attendanceRecords: {
      training_session_id: string
      profile_id: string
      rsvp_status: string
    }[] = []

    for (const session of sessions) {
      for (const member of members) {
        attendanceRecords.push({
          training_session_id: session.id,
          profile_id: member.profile_id,
          rsvp_status: "pending",
        })
      }
    }

    // Insert in batches of 500 to avoid payload limits
    const batchSize = 500
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize)
      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert(batch)

      if (attendanceError) {
        console.error("Error creating attendance records (batch):", attendanceError)
      }
    }
  }

  return NextResponse.json(
    { series, sessions_created: sessions?.length || 0 },
    { status: 201 }
  )
}

// ============================================================
// DELETE /api/training/series - End a recurring training series
// Body: { series_id: string }
// Deactivates the series and deletes all future sessions
// ============================================================
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = deleteSeriesSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { series_id } = validation.data

  // Get the series
  const { data: series, error: seriesError } = await supabase
    .from("training_series")
    .select("id, group_id, is_active")
    .eq("id", series_id)
    .single()

  if (seriesError || !series) {
    return NextResponse.json(
      { error: "Training series not found" },
      { status: 404 }
    )
  }

  // Check trainer access
  const hasAccess = await isTrainerOfGroup(supabase, profile.id, series.group_id, profile.role)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Forbidden: Not a trainer of this group" },
      { status: 403 }
    )
  }

  if (!series.is_active) {
    return NextResponse.json(
      { error: "Series is already inactive" },
      { status: 409 }
    )
  }

  // Get today's date for filtering future sessions
  const today = getTodayBerlin()

  // Get future session IDs for this series (to delete attendance records first)
  const { data: futureSessions } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("series_id", series_id)
    .gt("date", today)

  const futureSessionIds = (futureSessions || []).map((s) => s.id)

  // Delete attendance records for future sessions
  if (futureSessionIds.length > 0) {
    const { error: attendanceDeleteError } = await supabase
      .from("attendance")
      .delete()
      .in("training_session_id", futureSessionIds)

    if (attendanceDeleteError) {
      console.error("Error deleting future attendance records:", attendanceDeleteError)
    }

    // Delete future sessions
    const { error: sessionsDeleteError } = await supabase
      .from("training_sessions")
      .delete()
      .in("id", futureSessionIds)

    if (sessionsDeleteError) {
      console.error("Error deleting future sessions:", sessionsDeleteError)
      return NextResponse.json({ error: sessionsDeleteError.message }, { status: 500 })
    }
  }

  // Deactivate the series
  const { data: updatedSeries, error: updateError } = await supabase
    .from("training_series")
    .update({ is_active: false })
    .eq("id", series_id)
    .select()
    .single()

  if (updateError) {
    console.error("Error deactivating series:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    series: updatedSeries,
    sessions_deleted: futureSessionIds.length,
  })
}
