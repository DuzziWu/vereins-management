import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"

// =============================================
// PROJ-28: Document Confirmation API
// POST /api/documents/[id]/confirm - Confirm reading a document
// DELETE /api/documents/[id]/confirm - Remove confirmation (for re-confirm after changes)
// =============================================

// POST /api/documents/[id]/confirm - Confirm reading a document
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

  // Get user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single() as any)

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Check if document exists and requires confirmation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: document, error: docError } = await (supabase
    .from("documents")
    .select("id, name, requires_confirmation, current_version_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single() as any)

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (!document.requires_confirmation) {
    return NextResponse.json(
      { error: "This document does not require confirmation" },
      { status: 400 }
    )
  }

  if (!document.current_version_id) {
    return NextResponse.json(
      { error: "Document has no version to confirm" },
      { status: 400 }
    )
  }

  // Check if already confirmed
  const { data: existingConfirmation } = await supabase
    .from("document_confirmations")
    .select("id, confirmed_at")
    .eq("document_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle()

  if (existingConfirmation) {
    return NextResponse.json({
      confirmation: existingConfirmation,
      message: "Already confirmed",
    })
  }

  // Create confirmation
  const { data: confirmation, error: confirmError } = await supabase
    .from("document_confirmations")
    .insert({
      document_id: id,
      profile_id: profile.id,
      version_id: document.current_version_id,
    })
    .select()
    .single()

  if (confirmError) {
    console.error("Error creating confirmation:", confirmError)
    return NextResponse.json({ error: confirmError.message }, { status: 500 })
  }

  return NextResponse.json({ confirmation }, { status: 201 })
}

// DELETE /api/documents/[id]/confirm - Remove own confirmation (rare use case)
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

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Delete own confirmation
  const { error } = await supabase
    .from("document_confirmations")
    .delete()
    .eq("document_id", id)
    .eq("profile_id", profile.id)

  if (error) {
    console.error("Error deleting confirmation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
