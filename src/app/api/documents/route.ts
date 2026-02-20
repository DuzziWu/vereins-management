import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { documentCreateSchema, isValidUUID } from "@/lib/validations/documents"
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from "@/components/documents/types"

// =============================================
// PROJ-28: Documents API Routes
// GET /api/documents - List documents (optionally filtered by folder)
// POST /api/documents - Create a new document (Vorstand only)
// =============================================

// GET /api/documents - List documents
export async function GET(request: NextRequest) {
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const folderId = searchParams.get("folder_id")
  const search = searchParams.get("search") || ""
  const mimeType = searchParams.get("mime_type")
  const requiresConfirmation = searchParams.get("requires_confirmation")
  const pendingConfirmation = searchParams.get("pending_confirmation")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  // Validate folder_id if provided
  if (folderId && !isValidUUID(folderId)) {
    return NextResponse.json({ error: "Invalid folder_id format" }, { status: 400 })
  }

  // Build query
  let query = supabase
    .from("documents")
    .select(`
      *,
      created_by_profile:profiles!documents_created_by_fkey(id, first_name, last_name),
      current_version:document_versions!documents_current_version_fkey(
        id, version_number, file_size, storage_path, change_note, created_at,
        uploaded_by_profile:profiles!document_versions_uploaded_by_fkey(id, first_name, last_name)
      ),
      folder:folders!documents_folder_id_fkey(id, name, path)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1)

  // Filter by folder
  if (folderId) {
    query = query.eq("folder_id", folderId)
  }

  // Search filter
  if (search && search.length >= 2) {
    const sanitizedSearch = search.replace(/[%_\\]/g, "\\$&")
    query = query.ilike("name", `%${sanitizedSearch}%`)
  }

  // Filter by MIME type
  if (mimeType) {
    query = query.eq("mime_type", mimeType)
  }

  // Filter by requires_confirmation
  if (requiresConfirmation === "true") {
    query = query.eq("requires_confirmation", true)
  } else if (requiresConfirmation === "false") {
    query = query.eq("requires_confirmation", false)
  }

  const { data: documents, error, count } = await query

  if (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If pending_confirmation filter is set, check user's confirmations
  type EnrichedDocument = typeof documents extends (infer T)[] ? T & { user_confirmation: { document_id: string; confirmed_at: string; version_id: string } | null } : never
  let enrichedDocuments: EnrichedDocument[] = []

  if (documents && documents.length > 0) {
    // Get user's confirmations for these documents
    const documentIds = documents.map((d) => d.id)
    const { data: confirmations } = await supabase
      .from("document_confirmations")
      .select("document_id, confirmed_at, version_id")
      .eq("profile_id", profile.id)
      .in("document_id", documentIds)

    const confirmationMap = new Map(
      (confirmations || []).map((c) => [c.document_id, c])
    )

    enrichedDocuments = documents.map((doc) => ({
      ...doc,
      user_confirmation: confirmationMap.get(doc.id) || null,
    })) as EnrichedDocument[]

    // Filter by pending confirmation if requested
    if (pendingConfirmation === "true") {
      enrichedDocuments = enrichedDocuments.filter(
        (doc) => doc.requires_confirmation && !doc.user_confirmation
      )
    }
  }

  return NextResponse.json({
    documents: enrichedDocuments,
    total: count || 0,
    limit,
    offset,
  })
}

// POST /api/documents - Create a new document (Vorstand only)
export async function POST(request: NextRequest) {
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

  // Parse FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const folderId = formData.get("folder_id") as string
  const requiresConfirmation = formData.get("requires_confirmation") === "true"
  const accessAllGroups = formData.get("access_all_groups") === "true"

  // Validate required fields
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  if (!folderId || !isValidUUID(folderId)) {
    return NextResponse.json({ error: "Valid folder_id is required" }, { status: 400 })
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

  // Check if folder exists
  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .single()

  if (folderError || !folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 })
  }

  // Check for duplicate name in folder
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id, name")
    .eq("folder_id", folderId)
    .eq("name", name.trim())
    .is("deleted_at", null)
    .maybeSingle()

  if (existingDoc) {
    return NextResponse.json(
      {
        error: "Ein Dokument mit diesem Namen existiert bereits in diesem Ordner.",
        existing_document_id: existingDoc.id,
        existing_document_name: existingDoc.name,
      },
      { status: 409 }
    )
  }

  // Generate document ID first
  const documentId = crypto.randomUUID()
  const versionId = crypto.randomUUID()

  // Generate storage path
  const fileExt = file.name.split(".").pop()
  const storagePath = `${documentId}/${versionId}.${fileExt}`

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

  // Create document record
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      folder_id: folderId,
      name: name.trim(),
      description: description?.trim() || null,
      requires_confirmation: requiresConfirmation,
      access_all_groups: accessAllGroups,
      original_filename: file.name,
      mime_type: file.type,
      created_by: profile.id,
    })
    .select()
    .single()

  if (docError) {
    // Rollback: Delete uploaded file
    await supabase.storage.from("documents").remove([storagePath])
    console.error("Error creating document:", docError)
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  // Create first version
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      id: versionId,
      document_id: documentId,
      version_number: 1,
      storage_path: storagePath,
      file_size: file.size,
      change_note: "Erstversion",
      uploaded_by: profile.id,
    })
    .select()
    .single()

  if (versionError) {
    // Rollback: Delete document and uploaded file
    await supabase.from("documents").delete().eq("id", documentId)
    await supabase.storage.from("documents").remove([storagePath])
    console.error("Error creating version:", versionError)
    return NextResponse.json({ error: versionError.message }, { status: 500 })
  }

  // Fetch complete document with relations
  const { data: completeDocument, error: fetchError } = await supabase
    .from("documents")
    .select(`
      *,
      created_by_profile:profiles!documents_created_by_fkey(id, first_name, last_name),
      current_version:document_versions!documents_current_version_fkey(
        id, version_number, file_size, storage_path, change_note, created_at,
        uploaded_by_profile:profiles!document_versions_uploaded_by_fkey(id, first_name, last_name)
      ),
      folder:folders!documents_folder_id_fkey(id, name, path)
    `)
    .eq("id", documentId)
    .single()

  if (fetchError) {
    console.error("Error fetching created document:", fetchError)
    // Return basic document data
    return NextResponse.json({ document: { ...document, current_version: version } }, { status: 201 })
  }

  return NextResponse.json({ document: completeDocument }, { status: 201 })
}
