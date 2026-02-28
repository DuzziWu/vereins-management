"use client"

import { useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatConnectionStatus } from "@/components/chat/chat-connection-status"
import { useWorkgroupChatMessages } from "@/hooks/use-workgroup-chat-messages"
import { useWorkgroupChatRealtime } from "@/hooks/use-workgroup-chat-realtime"
import type { ChatMessage, WorkgroupChatMessage } from "@/lib/chat-types"

// ============================================================
// PROJ-31: Workgroup Chat Tab Component
// Reuses existing chat infrastructure (hooks, components) from PROJ-14.
// Embedded inside the workgroup detail page as a tab.
// ============================================================

interface WorkgroupChatTabProps {
  workgroupId: string
  currentUserId: string
  /** Whether this tab is currently visible – controls message loading and read tracking */
  isActive: boolean
  /** Called when a new realtime message arrives (for unread badge in parent) */
  onNewMessage?: () => void
}

export function WorkgroupChatTab({
  workgroupId,
  currentUserId,
  isActive,
  onNewMessage,
}: WorkgroupChatTabProps) {
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
  } = useWorkgroupChatMessages({ workgroupId })

  const handleRealtimeMessage = useCallback(
    (message: WorkgroupChatMessage) => {
      addRealtimeMessage(message)
      if (!isActive) {
        onNewMessage?.()
      }
    },
    [addRealtimeMessage, isActive, onNewMessage]
  )

  const { connectionStatus } = useWorkgroupChatRealtime({
    workgroupId,
    onNewMessage: handleRealtimeMessage,
  })

  // Load messages when tab first becomes active
  useEffect(() => {
    if (isActive) {
      loadMessages()
    }
  }, [isActive, loadMessages])

  // Poll for new messages as Realtime fallback (every 3 seconds)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!isActive) return

    pollIntervalRef.current = setInterval(pollNewMessages, 3000)
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isActive, pollNewMessages])

  // Mark messages as read when tab is active
  useEffect(() => {
    if (!isActive) return

    const markAsRead = async () => {
      try {
        await fetch(`/api/workgroups/${workgroupId}/messages/read`, {
          method: "POST",
        })
      } catch {
        // ignore
      }
    }

    markAsRead()

    return () => {
      markAsRead()
    }
  }, [workgroupId, isActive])

  const handleSend = useCallback(
    async (content: string) => {
      const result = await sendMessage(content)
      if (result) {
        addRealtimeMessage(result)
        try {
          await fetch(`/api/workgroups/${workgroupId}/messages/read`, {
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
    [sendMessage, addRealtimeMessage, workgroupId]
  )

  // Show error toast
  useEffect(() => {
    if (messagesError) {
      toast.error(messagesError)
    }
  }, [messagesError])

  // WorkgroupChatMessage is structurally compatible with ChatMessage for display purposes
  // (same fields: id, sender_id, sender_display_name, content, created_at)
  const chatMessages = messages as unknown as ChatMessage[]

  return (
    <div className="flex flex-col h-[calc(100dvh-22rem)] min-h-[420px]">
      {/* Connection status banner */}
      {connectionStatus !== "connected" && (
        <div className="px-3 py-1">
          <ChatConnectionStatus status={connectionStatus} />
        </div>
      )}

      {/* Messages area */}
      <ChatMessages
        messages={chatMessages}
        currentUserId={currentUserId}
        trainerIds={[]}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={connectionStatus === "disconnected"}
        maxChars={2000}
        showCounterAt={1500}
      />
    </div>
  )
}
