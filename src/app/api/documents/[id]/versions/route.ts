import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from "@/components/documents/types"

// =============================================
// PROJ-28: Document Versions API Routes
// GET /api/documents/[id]/versions - List all versions
// POST /api/documents/[id]/versions - Upload new version (Vorstand only)
// =============================================

// GET /api/documents/[id]/versions - List all versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid document ID format" }, { status: 400 })
  }

  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if document exists and is accessible (RLS handles access)
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, name, current_version_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Fetch all versions
  const { data: versions, error } = await supabase
    .from("document_versions")
    .select(`
      *,
      uploaded_by_profile:profiles!uploaded_by(id, first_name, last_name)
    `)
    .eq("document_id", id)
    .order("version_number", { ascending: false })

  if (error) {
    console.error("Error fetching versions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate signed URLs for each version
  const versionsWithUrls = await Promise.all(
    (versions || []).map(async (version) => {
      const { data: signedUrlData } = await supabase.storage
        .from("documents")
        .createSignedUrl(version.storage_path, 3600) // 1 hour

      return {
        ...version,
        download_url: signedUrlData?.signedUrl || null,
        is_current: version.id === document.current_version_id,
      }
    })
  )

  return NextResponse.json({ versions: versionsWithUrls })
}

// POST /api/documents/[id]/versions - Upload new version (Vorstand only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid document ID format" }, { status: 400 })
  }

  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return NextResponse.json({ error: "Forbidden: Vorstand access required" }, { status: 403 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Check if document exists
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, name, mime_type")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const changeNote = formData.get("change_note") as string | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, Images, ZIP" },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_DOCUMENT_SIZE / 1024 / 1024} MB` },
      { status: 400 }
    )
  }

  // Validate change note length
  if (changeNote && changeNote.length > 200) {
    return NextResponse.json(
      { error: "Change note too long. Maximum 200 characters." },
      { status: 400 }
    )
  }

  // Get next version number
  const { data: lastVersion } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (lastVersion?.version_number || 0) + 1

  // Generate storage path
  const versionId = crypto.randomUUID()
  const fileExt = file.name.split(".").pop()
  const storagePath = `${id}/${versionId}.${fileExt}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading file:", uploadError)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }

  // Create version record (trigger will update current_version_id and reset confirmations)
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      id: versionId,
      document_id: id,
      version_number: nextVersionNumber,
      storage_path: storagePath,
      file_size: file.size,
      change_note: changeNote?.trim() || null,
      uploaded_by: profile.id,
    })
    .select(`
      *,
      uploaded_by_profile:profiles!uploaded_by(id, first_name, last_name)
    `)
    .single()

  if (versionError) {
    // Rollback: Delete uploaded file
    await supabase.storage.from("documents").remove([storagePath])
    console.error("Error creating version:", versionError)
    return NextResponse.json({ error: versionError.message }, { status: 500 })
  }

  // Update document's mime_type and original_filename if changed
  if (file.type !== document.mime_type) {
    await supabase
      .from("documents")
      .update({
        mime_type: file.type,
        original_filename: file.name,
      })
      .eq("id", id)
  }

  // Generate signed URL for the new version
  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    version: {
      ...version,
      download_url: signedUrlData?.signedUrl || null,
      is_current: true,
    },
    confirmations_reset: nextVersionNumber > 1,
  }, { status: 201 })
}
