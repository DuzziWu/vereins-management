import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"

// =============================================
// PROJ-28: Document Confirmations Status API (Vorstand only)
// GET /api/documents/[id]/confirmations - Get confirmation status
// =============================================

// GET /api/documents/[id]/confirmations - Get confirmation status (Vorstand only)
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

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return NextResponse.json({ error: "Forbidden: Vorstand access required" }, { status: 403 })
  }

  // Check if document exists and requires confirmation
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(`
      id,
      name,
      requires_confirmation,
      current_version_id,
      folder:folders!folder_id(id, name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (!document.requires_confirmation) {
    return NextResponse.json({
      document: { id: document.id, name: document.name },
      requires_confirmation: false,
      message: "This document does not require confirmation",
    })
  }

  // Get all confirmations for this document
  const { data: confirmations, error: confirmError } = await supabase
    .from("document_confirmations")
    .select(`
      id,
      confirmed_at,
      version_id,
      profile:profiles!profile_id(
        id, first_name, last_name
      )
    `)
    .eq("document_id", id)
    .order("confirmed_at", { ascending: false })

  if (confirmError) {
    console.error("Error fetching confirmations:", confirmError)
    return NextResponse.json({ error: confirmError.message }, { status: 500 })
  }

  // Get folder permissions to determine who should confirm
  const { data: folderDoc } = await supabase
    .from("documents")
    .select("folder_id")
    .eq("id", id)
    .single()

  if (!folderDoc) {
    return NextResponse.json({ error: "Document folder not found" }, { status: 404 })
  }

  // Get folder permissions
  const { data: permissions } = await supabase
    .from("folder_permissions")
    .select("role, group_id, profile_id")
    .eq("folder_id", folderDoc.folder_id)

  // Collect all profiles that should confirm
  const targetProfileIds = new Set<string>()

  if (permissions) {
    for (const perm of permissions) {
      if (perm.profile_id) {
        // Direct profile permission
        targetProfileIds.add(perm.profile_id)
      } else if (perm.group_id) {
        // Group permission - get all members
        const { data: members } = await supabase
          .from("group_members")
          .select("profile_id")
          .eq("group_id", perm.group_id)

        members?.forEach((m) => targetProfileIds.add(m.profile_id))
      } else if (perm.role) {
        // Role permission - get all profiles with this role
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", perm.role)
          .eq("status", "active")

        profiles?.forEach((p) => targetProfileIds.add(p.id))
      }
    }
  }

  // Get profiles that have not confirmed
  const confirmedProfileIds = new Set((confirmations || []).map((c) => c.profile?.id).filter(Boolean))
  const pendingProfileIds = [...targetProfileIds].filter((id) => !confirmedProfileIds.has(id))

  // Fetch pending profiles
  let pendingProfiles: Array<{ id: string; first_name: string; last_name: string }> = []
  if (pendingProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", pendingProfileIds)
      .eq("status", "active")
      .order("last_name", { ascending: true })

    pendingProfiles = profiles || []
  }

  const confirmedCount = confirmations?.length || 0
  const totalCount = targetProfileIds.size
  const pendingCount = pendingProfiles.length

  return NextResponse.json({
    document: {
      id: document.id,
      name: document.name,
      folder: document.folder,
    },
    requires_confirmation: true,
    summary: {
      confirmed: confirmedCount,
      pending: pendingCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0,
    },
    confirmed: (confirmations || []).map((c) => ({
      profile: c.profile,
      confirmed_at: c.confirmed_at,
      version_id: c.version_id,
    })),
    pending: pendingProfiles.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
    })),
  })
}
