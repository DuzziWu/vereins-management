import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  isValidUUID,
  getAuthenticatedProfile,
  isGroupParticipant,
} from "@/lib/api/chat-helpers"

// ============================================================
// POST /api/groups/[id]/messages/read
// Mark messages as read: UPSERT last_read_at for the current user
// Body (optional): { last_read_at: ISO string } - defaults to now()
// ============================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Validate UUID
  if (!isValidUUID(groupId)) {
    return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 })
  }

  // Authenticate
  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check group membership (DSGVO: no Vorstand override)
  const isParticipant = await isGroupParticipant(supabase, profile.id, groupId)
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Gruppe" },
      { status: 403 }
    )
  }

  // UPSERT the read timestamp
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("group_chat_reads")
    .upsert(
      {
        group_id: groupId,
        profile_id: profile.id,
        last_read_at: now,
      },
      {
        onConflict: "group_id,profile_id",
      }
    )

  if (error) {
    console.error("Error updating read status:", error)
    return NextResponse.json(
      { error: "Lesestatus konnte nicht aktualisiert werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ last_read_at: now })
}
