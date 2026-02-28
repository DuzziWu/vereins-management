"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WorkgroupChatMessage, ConnectionStatus } from "@/lib/chat-types"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ============================================================
// PROJ-31: Hook for Supabase Realtime subscription (Workgroup Chat)
// - Channel: workgroup-chat:{workgroupId}
// - Table: workgroup_messages
// - Tracks connection status
// ============================================================

interface UseWorkgroupChatRealtimeOptions {
  workgroupId: string
  onNewMessage: (message: WorkgroupChatMessage) => void
}

interface UseWorkgroupChatRealtimeReturn {
  connectionStatus: ConnectionStatus
}

export function useWorkgroupChatRealtime({
  workgroupId,
  onNewMessage,
}: UseWorkgroupChatRealtimeOptions): UseWorkgroupChatRealtimeReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected")
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onNewMessageRef = useRef(onNewMessage)

  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])

  const subscribe = useCallback(() => {
    const supabase = createClient()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`workgroup-chat:${workgroupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "workgroup_messages",
          filter: `workgroup_id=eq.${workgroupId}`,
        },
        (payload) => {
          onNewMessageRef.current(payload.new as WorkgroupChatMessage)
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
            setConnectionStatus("reconnecting")
            break
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workgroupId])

  useEffect(() => {
    const cleanup = subscribe()
    return cleanup
  }, [subscribe])

  return { connectionStatus }
}
