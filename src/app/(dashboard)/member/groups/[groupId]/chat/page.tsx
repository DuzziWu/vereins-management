import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { ChatPageClient } from "./chat-page-client"

// ============================================================
// PROJ-14: Member Chat Page (Server Component)
// Route: /member/groups/[groupId]/chat
// Checks:
//   1. User is authenticated
//   2. User is a member of the group
//   3. Group has chat_enabled = true
// ============================================================

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function MemberChatPage({ params }: PageProps) {
  const { groupId } = await params
  const profile = await getMyProfile()

  if (!profile) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch group details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase
    .from("groups")
    .select("id, name, chat_enabled, is_active")
    .eq("id", groupId)
    .single() as any)

  if (groupError || !group) {
    redirect("/member/groups")
  }

  // Check chat is enabled
  if (!group.chat_enabled) {
    redirect("/member/groups")
  }

  // Check group is active
  if (group.is_active === false) {
    redirect("/member/groups")
  }

  // Check user is a member of the group
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  // Also check if user is trainer or co-trainer
  const isMainTrainer = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("trainer_id", profile.id)
    .maybeSingle()

  const { data: coTrainerEntry } = await supabase
    .from("group_trainers")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  const isParticipant = !!membership || !!isMainTrainer.data || !!coTrainerEntry

  if (!isParticipant) {
    redirect("/member/groups")
  }

  return (
    <ChatPageClient
      groupId={group.id}
      groupName={group.name}
      currentUserId={profile.id}
      backHref="/member/groups"
    />
  )
}
