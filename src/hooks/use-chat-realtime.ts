"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, ConnectionStatus } from "@/lib/chat-types"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ============================================================
// PROJ-14: Hook for Supabase Realtime subscription
// - Subscribes to INSERT events on group_messages
// - Channel: group-chat:{groupId}
// - Tracks connection status (connected/reconnecting/disconnected)
// - Cleanup on unmount
// ============================================================

interface UseChatRealtimeOptions {
  groupId: string
  onNewMessage: (message: ChatMessage) => void
}

interface UseChatRealtimeReturn {
  connectionStatus: ConnectionStatus
}

export function useChatRealtime({
  groupId,
  onNewMessage,
}: UseChatRealtimeOptions): UseChatRealtimeReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected")
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onNewMessageRef = useRef(onNewMessage)

  // Keep callback ref up to date without causing re-subscriptions
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])

  const subscribe = useCallback(() => {
    const supabase = createClient()

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          onNewMessageRef.current(newMessage)
        }
      )
      .subscribe((status) => {
        switch (status) {
          case "SUBSCRIBED":
            setConnectionStatus("connected")
            break
          case "CHANNEL_ERROR":
          case "TIMED_OUT":
            setConnectionStatus("reconnecting")
            break
          case "CLOSED":
            setConnectionStatus("disconnected")
            break
          default:
            // SUBSCRIBING state
            setConnectionStatus("reconnecting")
            break
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [groupId])

  useEffect(() => {
    const cleanup = subscribe()
    return cleanup
  }, [subscribe])

  return { connectionStatus }
}
