import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/events"

// ============================================================
// DELETE /api/events/[id]/attachments/[attachmentId]
// Einzelnen Anhang löschen
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id: eventId, attachmentId } = await params

  if (!isValidUUID(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
  }

  if (!isValidUUID(attachmentId)) {
    return NextResponse.json({ error: "Invalid attachment ID format" }, { status: 400 })
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

  // Hole Attachment und prüfe ob es existiert
  const { data: attachment, error: attachmentError } = await supabase
    .from("event_attachments")
    .select("id, event_id, file_path, uploaded_by")
    .eq("id", attachmentId)
    .eq("event_id", eventId)
    .single()

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
  }

  // Nur Uploader oder Vorstand darf löschen
  const canDelete =
    profile.role === "vorstand" || attachment.uploaded_by === profile.id

  if (!canDelete) {
    return NextResponse.json(
      { error: "Forbidden: Only uploader or Vorstand can delete attachments" },
      { status: 403 }
    )
  }

  // Lösche aus Storage
  const { error: storageError } = await supabase.storage
    .from("event-attachments")
    .remove([attachment.file_path])

  if (storageError) {
    console.error("Error deleting file from storage:", storageError)
    // Fahre trotzdem fort mit DB-Löschung (Datei könnte bereits fehlen)
  }

  // Lösche Metadaten aus DB
  const { error: dbError } = await supabase
    .from("event_attachments")
    .delete()
    .eq("id", attachmentId)

  if (dbError) {
    console.error("Error deleting attachment from database:", dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Attachment deleted" })
}

// ============================================================
// GET /api/events/[id]/attachments/[attachmentId]
// Download-URL für einen Anhang generieren
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id: eventId, attachmentId } = await params

  if (!isValidUUID(eventId)) {
    return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 })
  }

  if (!isValidUUID(attachmentId)) {
    return NextResponse.json({ error: "Invalid attachment ID format" }, { status: 400 })
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

  // Hole Event für Zugriffsprüfung
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", eventId)
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
      .eq("event_id", eventId)
      .eq("profile_id", profile.id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: "Forbidden: No access to this event" },
        { status: 403 }
      )
    }
  }

  // Hole Attachment
  const { data: attachment, error: attachmentError } = await supabase
    .from("event_attachments")
    .select("id, event_id, file_path, file_name, file_type")
    .eq("id", attachmentId)
    .eq("event_id", eventId)
    .single()

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
  }

  // Generiere signierte URL (gültig für 1 Stunde)
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from("event-attachments")
    .createSignedUrl(attachment.file_path, 3600)

  if (urlError || !signedUrl) {
    console.error("Error creating signed URL:", urlError)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }

  return NextResponse.json({
    url: signedUrl.signedUrl,
    fileName: attachment.file_name,
    fileType: attachment.file_type,
  })
}
