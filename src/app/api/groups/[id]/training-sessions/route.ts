import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// ============================================================
// GET /api/groups/[id]/training-sessions
// Get past training sessions for a group (for note linking dropdown)
// Query params:
//   - limit: number of sessions to return (default 30)
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Validate UUID
  if (!isValidUUID(groupId)) {
    return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 })
  }

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 })
  }

  // Check if user is trainer for this group
  const { data: trainerAssignment } = await supabase
    .from("group_trainers")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  if (!trainerAssignment) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Trainer dieser Gruppe" },
      { status: 403 }
    )
  }

  // Parse limit param
  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30

  // Get today's date
  const today = new Date().toISOString().split("T")[0]

  // Get past training sessions for this group
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("id, date, start_time, location")
    .eq("group_id", groupId)
    .eq("is_cancelled", false)
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching training sessions:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Training-Sessions" },
      { status: 500 }
    )
  }

  return NextResponse.json({ sessions: sessions || [] })
}
