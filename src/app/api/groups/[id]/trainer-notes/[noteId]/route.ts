import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Validation schema
const updateNoteSchema = z.object({
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
// GET /api/groups/[id]/trainer-notes/[noteId]
// Get a single trainer note
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const supabase = await createClient()
  const { id: groupId, noteId } = await params

  // Validate UUIDs
  if (!isValidUUID(groupId) || !isValidUUID(noteId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
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

  // Get note (RLS will ensure only owner can see it)
  const { data: note, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      training_session:training_sessions(id, date, start_time, location)
    `)
    .eq("id", noteId)
    .eq("group_id", groupId)
    .eq("trainer_id", profile.id)
    .single()

  if (error || !note) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 })
  }

  return NextResponse.json({ note })
}

// ============================================================
// PUT /api/groups/[id]/trainer-notes/[noteId]
// Update a trainer note
// Body: { title?: string, content: string, training_session_id?: string }
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const supabase = await createClient()
  const { id: groupId, noteId } = await params

  // Validate UUIDs
  if (!isValidUUID(groupId) || !isValidUUID(noteId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
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

  // Check if note exists and belongs to this trainer
  const { data: existingNote } = await supabase
    .from("trainer_notes")
    .select("id, group_id")
    .eq("id", noteId)
    .eq("trainer_id", profile.id)
    .single()

  if (!existingNote) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 })
  }

  if (existingNote.group_id !== groupId) {
    return NextResponse.json(
      { error: "Notiz gehört nicht zu dieser Gruppe" },
      { status: 400 }
    )
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = updateNoteSchema.safeParse(body)
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

  // Update note
  const { data: note, error } = await supabase
    .from("trainer_notes")
    .update({
      title: title || null,
      content,
      training_session_id: training_session_id || null,
    })
    .eq("id", noteId)
    .select(`
      *,
      training_session:training_sessions(id, date, start_time, location)
    `)
    .single()

  if (error) {
    console.error("Error updating trainer note:", error)
    return NextResponse.json(
      { error: "Notiz konnte nicht aktualisiert werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ note })
}

// ============================================================
// DELETE /api/groups/[id]/trainer-notes/[noteId]
// Delete a trainer note (permanent deletion)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const supabase = await createClient()
  const { id: groupId, noteId } = await params

  // Validate UUIDs
  if (!isValidUUID(groupId) || !isValidUUID(noteId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
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

  // Check if note exists and belongs to this trainer in this group
  const { data: existingNote } = await supabase
    .from("trainer_notes")
    .select("id, group_id")
    .eq("id", noteId)
    .eq("trainer_id", profile.id)
    .single()

  if (!existingNote) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 })
  }

  if (existingNote.group_id !== groupId) {
    return NextResponse.json(
      { error: "Notiz gehört nicht zu dieser Gruppe" },
      { status: 400 }
    )
  }

  // Delete note
  const { error } = await supabase
    .from("trainer_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("Error deleting trainer note:", error)
    return NextResponse.json(
      { error: "Notiz konnte nicht gelöscht werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
