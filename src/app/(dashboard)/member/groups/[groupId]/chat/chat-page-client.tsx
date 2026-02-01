"use client"

import { ChatPage } from "@/components/chat"

// ============================================================
// PROJ-14: Client wrapper for ChatPage in member route
// ============================================================

interface ChatPageClientProps {
  groupId: string
  groupName: string
  currentUserId: string
  backHref: string
}

export function ChatPageClient({
  groupId,
  groupName,
  currentUserId,
  backHref,
}: ChatPageClientProps) {
  return (
    <ChatPage
      groupId={groupId}
      groupName={groupName}
      currentUserId={currentUserId}
      backHref={backHref}
    />
  )
}
