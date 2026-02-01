"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage, MessagesResponse } from "@/lib/chat-types"

/** ISO-8601 datetime format validation (e.g. 2024-01-15T10:30:00.123Z) */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

// ============================================================
// PROJ-14: Hook for loading and sending chat messages
// - Initial load: 50 messages
// - Infinite scroll: load 50 more (cursor-based pagination)
// - Send message via POST
// - Poll for new messages as Realtime fallback
// ============================================================

interface UseChatMessagesOptions {
  groupId: string
}

interface UseChatMessagesReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMessages: () => Promise<void>
  loadMoreMessages: () => Promise<void>
  sendMessage: (content: string) => Promise<ChatMessage | null>
  addRealtimeMessage: (message: ChatMessage) => void
  pollNewMessages: () => Promise<void>
}

export function useChatMessages({
  groupId,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track if initial load has been done
  const hasLoadedRef = useRef(false)
  // Track the newest message timestamp for polling
  const newestTimestampRef = useRef<string | null>(null)

  /**
   * Load initial messages (newest 50).
   */
  const loadMessages = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Laden der Nachrichten")
      }

      const data: MessagesResponse = await response.json()
      setMessages(data.messages)
      setHasMore(data.has_more)
      // Track newest message timestamp for polling
      if (data.messages.length > 0) {
        newestTimestampRef.current = data.messages[data.messages.length - 1].created_at
      }
    } catch (err) {
      console.error("Error loading messages:", err)
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Nachrichten"
      )
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  /**
   * Load older messages (cursor-based pagination).
   * Uses the created_at of the oldest loaded message as cursor.
   */
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return

    setIsLoadingMore(true)

    try {
      const oldestMessage = messages[0]
      const cursor = oldestMessage.created_at

      if (!ISO_8601_REGEX.test(cursor)) {
        throw new Error("Invalid cursor format")
      }

      const response = await fetch(
        `/api/groups/${groupId}/messages?before=${encodeURIComponent(cursor)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Laden weiterer Nachrichten")
      }

      const data: MessagesResponse = await response.json()

      // Prepend older messages to the beginning
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.has_more)
    } catch (err) {
      console.error("Error loading more messages:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Laden weiterer Nachrichten"
      )
    } finally {
      setIsLoadingMore(false)
    }
  }, [groupId, messages, isLoadingMore, hasMore])

  /**
   * Send a new message.
   * Returns the sent message on success, null on error.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<ChatMessage | null> => {
      try {
        const response = await fetch(`/api/groups/${groupId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fehler beim Senden der Nachricht")
        }

        const data = await response.json()
        // The message will arrive via realtime, but we also add it locally
        // to prevent a flash before the realtime event arrives
        return data.message as ChatMessage
      } catch (err) {
        console.error("Error sending message:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Fehler beim Senden der Nachricht"
        )
        return null
      }
    },
    [groupId]
  )

  /**
   * Add a message received via Supabase Realtime.
   * Deduplicates by id (in case the sent message is already added).
   */
  const addRealtimeMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      // Check for duplicate
      if (prev.some((m) => m.id === message.id)) {
        return prev
      }
      // Update newest timestamp ref
      newestTimestampRef.current = message.created_at
      return [...prev, message]
    })
  }, [])

  /**
   * Poll for new messages (Realtime fallback).
   * Fetches messages newer than the most recent loaded message.
   */
  const pollNewMessages = useCallback(async () => {
    // Only poll if initial load is done
    if (!hasLoadedRef.current) return

    const afterCursor = newestTimestampRef.current
    if (!afterCursor) return

    try {
      const response = await fetch(
        `/api/groups/${groupId}/messages?after=${encodeURIComponent(afterCursor)}`
      )

      if (!response.ok) return // Silently fail for polling

      const data: MessagesResponse = await response.json()

      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMessages = data.messages.filter(
            (m) => !existingIds.has(m.id)
          )
          if (newMessages.length === 0) return prev
          // Update newest timestamp
          newestTimestampRef.current = newMessages[newMessages.length - 1].created_at
          return [...prev, ...newMessages]
        })
      }
    } catch {
      // Silently fail for polling - don't set error state
    }
  }, [groupId])

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
