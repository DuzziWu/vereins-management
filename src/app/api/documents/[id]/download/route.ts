import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"

// =============================================
// PROJ-28: Document Download API Route
// GET /api/documents/[id]/download - Stream document file
// =============================================

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

  // Fetch document with current version (RLS handles access control)
  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      id, name, original_filename, mime_type,
      current_version:document_versions!documents_current_version_fkey(
        storage_path
      )
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (!document.current_version?.storage_path) {
    return NextResponse.json({ error: "No file available" }, { status: 404 })
  }

  // Download file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.current_version.storage_path)

  if (downloadError || !fileData) {
    console.error("Error downloading file:", downloadError)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }

  // Get file content
  const arrayBuffer = await fileData.arrayBuffer()

  // Return file with appropriate headers
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": document.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.original_filename || document.name)}"`,
      "Content-Length": arrayBuffer.byteLength.toString(),
    },
  })
}
