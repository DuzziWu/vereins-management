import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { ChatPageClient } from "./chat-page-client"

// ============================================================
// PROJ-14: Trainer Chat Page (Server Component)
// Route: /trainer/groups/[groupId]/chat
// Checks:
//   1. User is authenticated
//   2. User is trainer/co-trainer of the group
//   3. Group has chat_enabled = true
// ============================================================

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function TrainerChatPage({ params }: PageProps) {
  const { groupId } = await params
  const profile = await getMyProfile()

  if (!profile) {
    redirect("/login")
  }

  // Only trainers and vorstand can access trainer routes
  if (profile.role !== "trainer" && profile.role !== "vorstand") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Fetch group details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase
    .from("groups")
    .select("id, name, chat_enabled, is_active, trainer_id")
    .eq("id", groupId)
    .single() as any)

  if (groupError || !group) {
    redirect("/trainer/groups")
  }

  // Check chat is enabled
  if (!group.chat_enabled) {
    redirect("/trainer/groups")
  }

  // Check group is active
  if (group.is_active === false) {
    redirect("/trainer/groups")
  }

  // Check user is trainer or co-trainer of the group
  const isMainTrainer = group.trainer_id === profile.id

  let isCoTrainer = false
  if (!isMainTrainer) {
    const { data: coTrainerEntry } = await supabase
      .from("group_trainers")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profile.id)
      .maybeSingle()

    isCoTrainer = !!coTrainerEntry
  }

  // Also check membership (vorstand who is a group member)
  let isMember = false
  if (!isMainTrainer && !isCoTrainer) {
    const { data: memberEntry } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profile.id)
      .maybeSingle()

    isMember = !!memberEntry
  }

  if (!isMainTrainer && !isCoTrainer && !isMember) {
    redirect("/trainer/groups")
  }

  return (
    <ChatPageClient
      groupId={group.id}
      groupName={group.name}
      currentUserId={profile.id}
      backHref="/trainer/groups"
    />
  )
}
