import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().max(100, "Titel darf maximal 100 Zeichen haben").optional().nullable(),
  content: z
    .string()
    .min(10, "Notiz muss mindestens 10 Zeichen haben")
    .max(5000, "Notiz darf maximal 5000 Zeichen haben"),
  training_session_id: z.string().uuid().optional().nullable(),
})

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// ============================================================
// GET /api/groups/[id]/trainer-notes
// Load all trainer notes for a group (only trainer's own notes)
// Query params:
//   - search: optional search term for title/content
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 })
  }

  // Check if user is trainer for this group (main trainer OR co-trainer)
  const [coTrainerResult, mainTrainerResult] = await Promise.all([
    // Check group_trainers (co-trainers)
    supabase
      .from("group_trainers")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profile.id)
      .maybeSingle(),
    // Check groups.trainer_id (main trainer)
    supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("trainer_id", profile.id)
      .maybeSingle(),
  ])

  const isTrainer = !!coTrainerResult.data || !!mainTrainerResult.data

  if (!isTrainer) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Trainer dieser Gruppe" },
      { status: 403 }
    )
  }

  // Parse search param
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")

  // Build query
  let query = supabase
    .from("trainer_notes")
    .select(`
      *,
      training_session:training_sessions(id, date, start_time, location)
    `)
    .eq("group_id", groupId)
    .eq("trainer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Apply search filter if provided
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim()
    query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
  }

  const { data: notes, error } = await query

  if (error) {
    console.error("Error fetching trainer notes:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Notizen" },
      { status: 500 }
    )
  }

  return NextResponse.json({ notes: notes || [] })
}

// ============================================================
// POST /api/groups/[id]/trainer-notes
// Create a new trainer note
// Body: { title?: string, content: string, training_session_id?: string }
// ============================================================
export async function POST(
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 })
  }

  // Check if user is trainer for this group (main trainer OR co-trainer)
  const [coTrainerResult, mainTrainerResult] = await Promise.all([
    // Check group_trainers (co-trainers)
    supabase
      .from("group_trainers")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profile.id)
      .maybeSingle(),
    // Check groups.trainer_id (main trainer)
    supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("trainer_id", profile.id)
      .maybeSingle(),
  ])

  const isTrainer = !!coTrainerResult.data || !!mainTrainerResult.data

  if (!isTrainer) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Trainer dieser Gruppe" },
      { status: 403 }
    )
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = createNoteSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  const { title, content, training_session_id } = validation.data

  // If training_session_id is provided, verify it belongs to this group
  if (training_session_id) {
    const { data: session } = await supabase
      .from("training_sessions")
      .select("id")
      .eq("id", training_session_id)
      .eq("group_id", groupId)
      .maybeSingle()

    if (!session) {
      return NextResponse.json(
        { error: "Training-Session nicht gefunden oder gehört nicht zu dieser Gruppe" },
        { status: 400 }
      )
    }
  }

  // Insert note
  const { data: note, error } = await supabase
    .from("trainer_notes")
    .insert({
      group_id: groupId,
      trainer_id: profile.id,
      title: title || null,
      content,
      training_session_id: training_session_id || null,
    })
    .select(`
      *,
      training_session:training_sessions(id, date, start_time, location)
    `)
    .single()

  if (error) {
    console.error("Error creating trainer note:", error)
    return NextResponse.json(
      { error: "Notiz konnte nicht erstellt werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ note }, { status: 201 })
}
