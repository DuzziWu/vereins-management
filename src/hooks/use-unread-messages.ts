"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { UnreadEntry, UnreadResponse } from "@/lib/chat-types"

// ============================================================
// PROJ-14: Hook for tracking unread message counts
// - Fetches unread counts from GET /api/messages/unread
// - Can be used in group overview and bottom navigation
// - Auto-refreshes on interval (optional)
// ============================================================

interface UseUnreadMessagesOptions {
  /** Auto-refresh interval in milliseconds. Set to 0 to disable. Default: 30000 (30s) */
  refreshInterval?: number
  /** Whether to start fetching immediately. Default: true */
  enabled?: boolean
}

interface UseUnreadMessagesReturn {
  unread: UnreadEntry[]
  totalUnread: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getUnreadForGroup: (groupId: string) => number
}

export function useUnreadMessages(
  options: UseUnreadMessagesOptions = {}
): UseUnreadMessagesReturn {
  const { refreshInterval = 30000, enabled = true } = options

  const [unread, setUnread] = useState<UnreadEntry[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnread = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/messages/unread")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Laden der ungelesenen Nachrichten")
      }

      const data: UnreadResponse = await response.json()
      setUnread(data.unread)
      setTotalUnread(data.total_unread)
    } catch (err) {
      console.error("Error fetching unread messages:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der ungelesenen Nachrichten"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchUnread()
    }
  }, [enabled, fetchUnread])

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return

    intervalRef.current = setInterval(fetchUnread, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, refreshInterval, fetchUnread])

  /**
   * Get unread count for a specific group.
   */
  const getUnreadForGroup = useCallback(
    (groupId: string): number => {
      const entry = unread.find((u) => u.group_id === groupId)
      return entry?.unread_count ?? 0
    },
    [unread]
  )

  return {
    unread,
    totalUnread,
    isLoading,
    error,
    refresh: fetchUnread,
    getUnreadForGroup,
  }
}
