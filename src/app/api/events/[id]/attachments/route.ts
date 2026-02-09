import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  isValidUUID,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_EVENT,
} from "@/lib/validations/events"

// ============================================================
// GET /api/events/[id]/attachments - Anhänge auflisten
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
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

  // Hole Profil
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
    .select("id, created_by")
    .eq("id", id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Zugriffsprüfung: Vorstand, Event-Ersteller, oder eingeladen
  const isVorstand = profile.role === "vorstand"
  const isEventCreator = event.created_by === profile.id

  if (!isVorstand && !isEventCreator) {
    // Prüfe ob User zum Event eingeladen ist
    const { data: assignment } = await supabase
      .from("event_assignments")
      .select("id")
      .eq("event_id", id)
      .eq("profile_id", profile.id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: "Forbidden: No access to this event" },
        { status: 403 }
      )
    }
  }

  // Lade Anhänge mit Uploader-Info
  const { data: attachments, error } = await supabase
    .from("event_attachments")
    .select(`
      *,
      uploader:profiles!event_attachments_uploaded_by_fkey(first_name, last_name)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching attachments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ attachments: attachments || [] })
}

// ============================================================
// POST /api/events/[id]/attachments - Datei hochladen
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
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

  // Hole Profil und prüfe Berechtigung
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Prüfe ob Event existiert und User berechtigt ist
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Nur Ersteller oder Vorstand darf hochladen
  const canUpload =
    profile.role === "vorstand" ||
    (profile.role === "trainer" && event.created_by === profile.id)

  if (!canUpload) {
    return NextResponse.json(
      { error: "Forbidden: Only event creator (Trainer) or Vorstand can upload attachments" },
      { status: 403 }
    )
  }

  // Prüfe aktuelle Anzahl der Anhänge
  const { count: attachmentCount } = await supabase
    .from("event_attachments")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id)

  if (attachmentCount !== null && attachmentCount >= MAX_FILES_PER_EVENT) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES_PER_EVENT} attachments per event allowed` },
      { status: 400 }
    )
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Validiere Dateityp
  if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, JPG, PNG, DOCX" },
      { status: 400 }
    )
  }

  // Validiere Dateigröße
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB` },
      { status: 400 }
    )
  }

  // Generiere eindeutigen Dateinamen
  const fileExt = file.name.split(".").pop()
  const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `events/${id}/${uniqueFileName}`

  // Upload zu Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("event-attachments")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading file:", uploadError)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }

  // Speichere Metadaten in der Datenbank
  const { data: attachment, error: dbError } = await supabase
    .from("event_attachments")
    .insert({
      event_id: id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: profile.id,
    })
    .select(`
      *,
      uploader:profiles!event_attachments_uploaded_by_fkey(first_name, last_name)
    `)
    .single()

  if (dbError) {
    // Rollback: Lösche hochgeladene Datei
    await supabase.storage.from("event-attachments").remove([filePath])
    console.error("Error saving attachment metadata:", dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ attachment }, { status: 201 })
}
