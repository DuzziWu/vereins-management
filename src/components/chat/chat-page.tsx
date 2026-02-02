"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { ChatMembersSheet } from "./chat-members-sheet"
import { ChatConnectionStatus } from "./chat-connection-status"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useChatRealtime } from "@/hooks/use-chat-realtime"
import type { ChatMember } from "@/lib/chat-types"

// ============================================================
// PROJ-14: Main Chat Page Component
// Orchestrates all chat sub-components, hooks, and state.
// ============================================================

interface ChatPageProps {
  groupId: string
  groupName: string
  currentUserId: string
  /** Role-based back navigation href */
  backHref: string
}

export function ChatPage({
  groupId,
  groupName,
  currentUserId,
  backHref,
}: ChatPageProps) {
  const [membersOpen, setMembersOpen] = useState(false)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [trainerIds, setTrainerIds] = useState<string[]>([])

  // Chat messages hook
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error: messagesError,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    addRealtimeMessage,
    pollNewMessages,
  } = useChatMessages({ groupId })

  // Realtime subscription
  const { connectionStatus } = useChatRealtime({
    groupId,
    onNewMessage: addRealtimeMessage,
  })

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Poll for new messages as Realtime fallback (every 3 seconds)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    pollIntervalRef.current = setInterval(pollNewMessages, 3000)
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [pollNewMessages])

  // PERF-2: Mark as read only on mount and on unmount (not every 10s)
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch(`/api/groups/${groupId}/messages/read`, {
          method: "POST",
        })
      } catch (err) {
        console.error("Error marking messages as read:", err)
      }
    }

    // Mark as read on mount
    markAsRead()

    // Mark as read on unmount (when user leaves the chat)
    return () => {
      markAsRead()
    }
  }, [groupId])

  // Fetch group members (via privacy-safe endpoint that returns pre-anonymised names)
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/chat-members`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Mitglieder")
      }
      const data = await response.json()
      const membersList: ChatMember[] = data.members ?? []

      // Derive trainer IDs from role
      const trainerIdsList = membersList
        .filter((m) => m.role === "trainer" || m.role === "co-trainer")
        .map((m) => m.id)

      setMembers(membersList)
      setTrainerIds(trainerIdsList)
    } catch (err) {
      console.error("Error fetching members:", err)
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setMembersLoading(false)
    }
  }, [groupId])

  // Fetch members on mount
  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Handle sending message
  const handleSend = useCallback(
    async (content: string) => {
      const result = await sendMessage(content)
      if (result) {
        // Optimistically add the message (deduplication handled in hook)
        addRealtimeMessage(result)
        // Mark as read after sending
        try {
          await fetch(`/api/groups/${groupId}/messages/read`, {
            method: "POST",
          })
        } catch {
          // ignore
        }
      } else {
        toast.error("Nachricht konnte nicht gesendet werden")
        throw new Error("Nachricht konnte nicht gesendet werden")
      }
    },
    [sendMessage, addRealtimeMessage, groupId]
  )

  // Show error toast
  useEffect(() => {
    if (messagesError) {
      toast.error(messagesError)
    }
  }, [messagesError])

  const memberCount = members.length

  return (
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-6.5rem)]">
      {/* Header */}
      <ChatHeader
        groupName={groupName}
        memberCount={memberCount}
        connectionStatus={connectionStatus}
        backHref={backHref}
        onOpenMembers={() => setMembersOpen(true)}
      />

      {/* Connection status banner (non-compact) */}
      {connectionStatus !== "connected" && (
        <div className="px-3 py-1">
          <ChatConnectionStatus status={connectionStatus} />
        </div>
      )}

      {/* Messages area */}
      <ChatMessages
        messages={messages}
        currentUserId={currentUserId}
        trainerIds={trainerIds}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={connectionStatus === "disconnected"}
      />

      {/* Members sheet */}
      <ChatMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        members={members}
        isLoading={membersLoading}
        groupName={groupName}
      />
    </div>
  )
}
