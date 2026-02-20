import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { documentUpdateSchema, documentMoveSchema, isValidUUID } from "@/lib/validations/documents"

// =============================================
// PROJ-28: Document Detail API Routes
// GET /api/documents/[id] - Get document details
// PUT /api/documents/[id] - Update document (Vorstand only)
// DELETE /api/documents/[id] - Soft-delete document (Vorstand only)
// =============================================

// GET /api/documents/[id] - Get document details
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

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Fetch document with all relations
  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      *,
      created_by_profile:profiles!created_by(id, first_name, last_name),
      folder:folders!folder_id(id, name, path)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch versions separately
  const { data: versions } = await supabase
    .from("document_versions")
    .select(`
      id, version_number, file_size, storage_path, change_note, created_at,
      uploaded_by_profile:profiles!uploaded_by(id, first_name, last_name)
    `)
    .eq("document_id", id)
    .order("version_number", { ascending: false })

  // Get current version
  const currentVersion = versions?.find(v => v.id === document.current_version_id) || versions?.[0] || null

  // Get user's confirmation for this document
  const { data: userConfirmation } = await supabase
    .from("document_confirmations")
    .select("id, confirmed_at, version_id")
    .eq("document_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle()

  // Generate signed URL for current version
  let downloadUrl = null
  if (currentVersion?.storage_path) {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(currentVersion.storage_path, 3600) // 1 hour

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError)
    }
    downloadUrl = signedUrlData?.signedUrl || null
  }

  return NextResponse.json({
    document: {
      ...document,
      current_version: currentVersion,
      versions: versions || [],
      user_confirmation: userConfirmation,
      download_url: downloadUrl,
    },
  })
}

// PUT /api/documents/[id] - Update document (Vorstand only)
export async function PUT(
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

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Check if this is a move operation
  const moveValidation = documentMoveSchema.safeParse(body)
  if (moveValidation.success && body.folder_id) {
    // Move document to new folder
    const newFolderId = body.folder_id

    // Check if target folder exists
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", newFolderId)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Target folder not found" }, { status: 404 })
    }

    // Get current document to check for name conflict
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("name")
      .eq("id", id)
      .single()

    if (!currentDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check for duplicate name in target folder
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("folder_id", newFolderId)
      .eq("name", currentDoc.name)
      .is("deleted_at", null)
      .neq("id", id)
      .maybeSingle()

    if (existingDoc) {
      return NextResponse.json(
        { error: "Ein Dokument mit diesem Namen existiert bereits im Zielordner." },
        { status: 409 }
      )
    }

    // Update document folder
    const { data: document, error: updateError } = await supabase
      .from("documents")
      .update({ folder_id: newFolderId })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error moving document:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ document })
  }

  // Regular update
  const validation = documentUpdateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: "Validation failed",
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const data = validation.data

  // If name is being changed, check for duplicates
  if (data.name) {
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("folder_id")
      .eq("id", id)
      .single()

    if (!currentDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("folder_id", currentDoc.folder_id)
      .eq("name", data.name.trim())
      .is("deleted_at", null)
      .neq("id", id)
      .maybeSingle()

    if (existingDoc) {
      return NextResponse.json(
        { error: "Ein Dokument mit diesem Namen existiert bereits in diesem Ordner." },
        { status: 409 }
      )
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.requires_confirmation !== undefined) updateData.requires_confirmation = data.requires_confirmation

  // Update document
  const { data: document, error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", id)
    .is("deleted_at", null)
    .select(`
      *,
      created_by_profile:profiles!created_by(id, first_name, last_name),
      current_version:document_versions!current_version_id(
        id, version_number, file_size, storage_path, change_note, created_at
      ),
      folder:folders!folder_id(id, name, path)
    `)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    console.error("Error updating document:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ document })
}

// DELETE /api/documents/[id] - Soft-delete document (Vorstand only)
export async function DELETE(
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

  // Check if permanent delete is requested
  const searchParams = request.nextUrl.searchParams
  const permanent = searchParams.get("permanent") === "true"

  if (permanent) {
    // Get all versions to delete from storage
    const { data: versions } = await supabase
      .from("document_versions")
      .select("storage_path")
      .eq("document_id", id)

    // Delete from database (cascade will handle versions and confirmations)
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting document:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Delete files from storage
    if (versions && versions.length > 0) {
      const paths = versions.map((v) => v.storage_path)
      await supabase.storage.from("documents").remove(paths)
    }

    return NextResponse.json({ success: true, message: "Document permanently deleted" })
  }

  // Soft-delete: Set deleted_at timestamp
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) {
    console.error("Error soft-deleting document:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Document moved to trash" })
}
