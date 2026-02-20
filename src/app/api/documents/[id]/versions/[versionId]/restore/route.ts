import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"

// =============================================
// PROJ-28: Restore Document Version API Route
// POST /api/documents/[id]/versions/[versionId]/restore
// Restores a previous version by creating a new version with its content
// =============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params

  if (!isValidUUID(id) || !isValidUUID(versionId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
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
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Get the version to restore
  const { data: versionToRestore, error: versionError } = await supabase
    .from("document_versions")
    .select("*")
    .eq("id", versionId)
    .eq("document_id", id)
    .single()

  if (versionError || !versionToRestore) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  // Get the next version number
  const { data: lastVersion } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (lastVersion?.version_number || 0) + 1

  // Copy the file in storage to a new path
  const newVersionId = crypto.randomUUID()
  const fileExt = versionToRestore.storage_path.split(".").pop()
  const newStoragePath = `${id}/${newVersionId}.${fileExt}`

  // Download and re-upload the file to create a copy
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(versionToRestore.storage_path)

  if (downloadError || !fileData) {
    console.error("Error downloading file for restore:", downloadError)
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 })
  }

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(newStoragePath, fileData, {
      contentType: fileData.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading restored file:", uploadError)
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 })
  }

  // Create new version record
  // Note: The database trigger will update current_version_id and reset confirmations
  const { data: newVersion, error: createError } = await supabase
    .from("document_versions")
    .insert({
      id: newVersionId,
      document_id: id,
      version_number: nextVersionNumber,
      storage_path: newStoragePath,
      file_size: versionToRestore.file_size,
      change_note: `Wiederhergestellt von Version ${versionToRestore.version_number}`,
      uploaded_by: profile.id,
    })
    .select(`
      *,
      uploaded_by_profile:profiles!document_versions_uploaded_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (createError) {
    // Rollback: Delete uploaded file
    await supabase.storage.from("documents").remove([newStoragePath])
    console.error("Error creating restored version:", createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Generate signed URL for the new version
  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(newStoragePath, 3600)

  return NextResponse.json({
    version: {
      ...newVersion,
      download_url: signedUrlData?.signedUrl || null,
      is_current: true,
    },
    restored_from_version: versionToRestore.version_number,
  }, { status: 201 })
}
