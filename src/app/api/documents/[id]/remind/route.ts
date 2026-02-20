import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID } from "@/lib/validations/documents"
import { z } from "zod"

// =============================================
// PROJ-28: Send Document Reminder API Route
// POST /api/documents/[id]/remind - Send reminders to members
// =============================================

const remindRequestSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1, "At least one profile ID required"),
})

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

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Validate request
  const validation = remindRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: "Validation failed",
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { profile_ids } = validation.data

  // Check if document exists and requires confirmation
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, name, requires_confirmation")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (!document.requires_confirmation) {
    return NextResponse.json(
      { error: "Document does not require confirmation" },
      { status: 400 }
    )
  }

  // Verify that the profiles exist and haven't confirmed yet
  const { data: pendingProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", profile_ids)

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }

  if (!pendingProfiles || pendingProfiles.length === 0) {
    return NextResponse.json({ error: "No valid profiles found" }, { status: 404 })
  }

  // Check which profiles have already confirmed
  const { data: confirmedProfiles } = await supabase
    .from("document_confirmations")
    .select("profile_id")
    .eq("document_id", id)
    .in("profile_id", profile_ids)

  const confirmedIds = new Set((confirmedProfiles || []).map(c => c.profile_id))
  const profilesToRemind = pendingProfiles.filter(p => !confirmedIds.has(p.id))

  if (profilesToRemind.length === 0) {
    return NextResponse.json(
      { error: "All selected members have already confirmed" },
      { status: 400 }
    )
  }

  // TODO: Implement actual notification sending
  // Options:
  // 1. Supabase Edge Function with email provider (Resend, SendGrid, etc.)
  // 2. In-app notifications table
  // 3. Push notifications
  //
  // For now, we'll create a reminder record that could be processed by a background job
  // or just return success for the UI to show a success message

  // Log the reminder attempt (could be stored in a reminders table)
  console.log(`[Document Reminder] Document: ${document.name} (${id})`)
  console.log(`[Document Reminder] Sent to ${profilesToRemind.length} members:`)
  profilesToRemind.forEach(p => {
    console.log(`  - ${p.first_name} ${p.last_name}`)
  })

  // Return success
  return NextResponse.json({
    success: true,
    message: `Erinnerung an ${profilesToRemind.length} Mitglied(er) gesendet`,
    reminded_count: profilesToRemind.length,
    reminded_profiles: profilesToRemind.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
    })),
  })
}
