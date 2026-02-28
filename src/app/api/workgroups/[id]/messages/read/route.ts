import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isValidUUID, getAuthenticatedProfile } from "@/lib/api/chat-helpers"

// ============================================================
// POST /api/workgroups/[id]/messages/read
// Mark messages as read: UPSERT last_read_at for the current user.
// Access: workgroup members + Vorstand (who can also view chats)
// ============================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: workgroupId } = await params

  if (!isValidUUID(workgroupId)) {
    return NextResponse.json({ error: "Invalid workgroup ID format" }, { status: 400 })
  }

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Access: members + Vorstand (Vorstand can mark as read since they can view)
  const isMember = await supabase
    .from("workgroup_members")
    .select("profile_id")
    .eq("workgroup_id", workgroupId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  const isVorstand = profile.role === "vorstand"

  if (!isMember.data && !isVorstand) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Workgroup" },
      { status: 403 }
    )
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("workgroup_message_reads")
    .upsert(
      {
        workgroup_id: workgroupId,
        profile_id: profile.id,
        last_read_at: now,
      },
      { onConflict: "workgroup_id,profile_id" }
    )

  if (error) {
    console.error("Error updating workgroup read status:", error)
    return NextResponse.json(
      { error: "Lesestatus konnte nicht aktualisiert werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ last_read_at: now })
}
