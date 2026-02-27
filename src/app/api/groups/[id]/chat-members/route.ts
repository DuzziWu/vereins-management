import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  isValidUUID,
  getAuthenticatedProfile,
  isGroupParticipant,
  getGroupWithChatCheck,
} from "@/lib/api/chat-helpers"

// ============================================================
// GET /api/groups/[id]/chat-members
// Returns group members with server-side anonymised display names.
// DSGVO: The client never receives full last names in the chat context.
// Response: { members: [{ id, display_name, role }] }
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Validate UUID format
  if (!isValidUUID(groupId)) {
    return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 })
  }

  // Authenticate user and get profile
  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check group exists and has chat enabled
  const groupCheck = await getGroupWithChatCheck(supabase, groupId)
  if (!groupCheck.valid) return groupCheck.response

  // Check group membership (DSGVO: no Vorstand override)
  const isParticipant = await isGroupParticipant(supabase, profile.id, groupId)
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Gruppe" },
      { status: 403 }
    )
  }

  // Load group trainer
  const { data: group } = await supabase
    .from("groups")
    .select("trainer_id, trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)")
    .eq("id", groupId)
    .single()

  // Load co-trainers and members in parallel
  const [coTrainersResult, membersResult] = await Promise.all([
    supabase
      .from("group_trainers")
      .select("profile:profiles!group_trainers_profile_id_fkey(id, first_name, last_name)")
      .eq("group_id", groupId),
    supabase
      .from("group_members")
      .select("profile:profiles!group_members_profile_id_fkey(id, first_name, last_name)")
      .eq("group_id", groupId),
  ])

  // Helper: anonymise a name server-side (first_name + last_name initial)
  function anonymise(firstName: string | null, lastName: string | null): string {
    const first = firstName?.trim() || "?"
    const lastInitial = lastName?.trim()?.charAt(0) || "?"
    return `${first} ${lastInitial}.`
  }

  // Build members list with server-side anonymisation
  type AnonymisedMember = { id: string; display_name: string; role: "trainer" | "co-trainer" | "mitglied" }
  const membersList: AnonymisedMember[] = []

  // Add main trainer
  if (group?.trainer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trainer = group.trainer as any
    membersList.push({
      id: trainer.id,
      display_name: anonymise(trainer.first_name, trainer.last_name),
      role: "trainer",
    })
  }

  // Add co-trainers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coTrainers = (coTrainersResult.data || [])
    .map((ct: any) => ct.profile)
    .filter(Boolean)

  for (const ct of coTrainers) {
    if (!ct) continue
    membersList.push({
      id: ct.id,
      display_name: anonymise(ct.first_name, ct.last_name),
      role: "co-trainer",
    })
  }

  // Add regular members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regularMembers = (membersResult.data || [])
    .map((m: any) => m.profile)
    .filter(Boolean)

  for (const m of regularMembers) {
    if (!m) continue
    membersList.push({
      id: m.id,
      display_name: anonymise(m.first_name, m.last_name),
      role: "mitglied",
    })
  }

  return NextResponse.json({ members: membersList })
}
