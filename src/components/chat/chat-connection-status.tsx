"use client"

import { Wifi, WifiOff } from "lucide-react"
import type { ConnectionStatus } from "@/lib/chat-types"
import { cn } from "@/lib/utils"

// ============================================================
// PROJ-14: Connection Status Indicator
// Shows Supabase Realtime connection status
// - Connected: green dot
// - Reconnecting: yellow dot + message
// - Disconnected: red dot + message
// ============================================================

interface ChatConnectionStatusProps {
  status: ConnectionStatus
  /** Compact mode shows only the dot (for header). Default: false */
  compact?: boolean
}

export function ChatConnectionStatus({
  status,
  compact = false,
}: ChatConnectionStatusProps) {
  if (status === "connected" && compact) {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-green-500"
        title="Verbunden"
        aria-label="Verbunden"
      />
    )
  }

  if (status === "connected") {
    return null
  }

  if (status === "reconnecting") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400",
          !compact && "bg-yellow-50 dark:bg-yellow-950/30 px-3 py-1.5 rounded-md text-xs"
        )}
      >
        {compact ? (
          <span
            className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse"
            title="Verbindung wird hergestellt..."
            aria-label="Verbindung wird hergestellt"
          />
        ) : (
          <>
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            <span>Verbindung wird hergestellt...</span>
          </>
        )}
      </div>
    )
  }

  // disconnected
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-destructive",
        !compact && "bg-destructive/10 px-3 py-1.5 rounded-md text-xs"
      )}
    >
      {compact ? (
        <span
          className="inline-block h-2 w-2 rounded-full bg-destructive"
          title="Verbindung unterbrochen"
          aria-label="Verbindung unterbrochen"
        />
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Verbindung unterbrochen, reconnecting...</span>
        </>
      )}
    </div>
  )
}
