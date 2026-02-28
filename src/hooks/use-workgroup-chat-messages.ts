"use client"

import { useState, useCallback, useRef } from "react"
import type { WorkgroupChatMessage, WorkgroupMessagesResponse } from "@/lib/chat-types"

/** ISO-8601 datetime format validation */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

// ============================================================
// PROJ-31: Hook for loading and sending workgroup chat messages
// - Initial load: 50 messages
// - Infinite scroll: load 50 more (cursor-based pagination)
// - Send message via POST
// - Poll for new messages as Realtime fallback
// ============================================================

interface UseWorkgroupChatMessagesOptions {
  workgroupId: string
}

interface UseWorkgroupChatMessagesReturn {
  messages: WorkgroupChatMessage[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMessages: () => Promise<void>
  loadMoreMessages: () => Promise<void>
  sendMessage: (content: string) => Promise<WorkgroupChatMessage | null>
  addRealtimeMessage: (message: WorkgroupChatMessage) => void
  pollNewMessages: () => Promise<void>
}

export function useWorkgroupChatMessages({
  workgroupId,
}: UseWorkgroupChatMessagesOptions): UseWorkgroupChatMessagesReturn {
  const [messages, setMessages] = useState<WorkgroupChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLoadedRef = useRef(false)
  const newestTimestampRef = useRef<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/workgroups/${workgroupId}/messages`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Laden der Nachrichten")
      }

      const data: WorkgroupMessagesResponse = await response.json()
      setMessages(data.messages)
      setHasMore(data.has_more)
      if (data.messages.length > 0) {
        newestTimestampRef.current = data.messages[data.messages.length - 1].created_at
      }
    } catch (err) {
      console.error("Error loading workgroup messages:", err)
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Nachrichten")
    } finally {
      setIsLoading(false)
    }
  }, [workgroupId])

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return

    setIsLoadingMore(true)

    try {
      const cursor = messages[0].created_at

      if (!ISO_8601_REGEX.test(cursor)) {
        throw new Error("Invalid cursor format")
      }

      const response = await fetch(
        `/api/workgroups/${workgroupId}/messages?before=${encodeURIComponent(cursor)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Laden weiterer Nachrichten")
      }

      const data: WorkgroupMessagesResponse = await response.json()
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden weiterer Nachrichten")
    } finally {
      setIsLoadingMore(false)
    }
  }, [workgroupId, messages, isLoadingMore, hasMore])

  const sendMessage = useCallback(
    async (content: string): Promise<WorkgroupChatMessage | null> => {
      try {
        const response = await fetch(`/api/workgroups/${workgroupId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fehler beim Senden der Nachricht")
        }

        const data = await response.json()
        return data.message as WorkgroupChatMessage
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Senden der Nachricht")
        return null
      }
    },
    [workgroupId]
  )

  const addRealtimeMessage = useCallback((message: WorkgroupChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev
      newestTimestampRef.current = message.created_at
      return [...prev, message]
    })
  }, [])

  const pollNewMessages = useCallback(async () => {
    if (!hasLoadedRef.current) return

    const afterCursor = newestTimestampRef.current
    if (!afterCursor) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/messages?after=${encodeURIComponent(afterCursor)}`
      )

      if (!response.ok) return

      const data: WorkgroupMessagesResponse = await response.json()

      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMessages = data.messages.filter((m) => !existingIds.has(m.id))
          if (newMessages.length === 0) return prev
          newestTimestampRef.current = newMessages[newMessages.length - 1].created_at
          return [...prev, ...newMessages]
        })
      }
    } catch {
      // Silently fail for polling
    }
  }, [workgroupId])

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    addRealtimeMessage,
    pollNewMessages,
  }
}
