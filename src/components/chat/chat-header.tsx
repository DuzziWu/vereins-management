"use client"

import { ArrowLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatConnectionStatus } from "./chat-connection-status"
import type { ConnectionStatus } from "@/lib/chat-types"

// ============================================================
// PROJ-14: Chat Header
// - Back button to group overview
// - Group name + member count
// - Members button (opens members sheet)
// - Connection status indicator
// ============================================================

interface ChatHeaderProps {
  groupName: string
  memberCount: number
  connectionStatus: ConnectionStatus
  backHref: string
  onOpenMembers: () => void
}

export function ChatHeader({
  groupName,
  memberCount,
  connectionStatus,
  backHref,
  onOpenMembers,
}: ChatHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 sm:px-4 sm:py-3">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 -ml-1"
        onClick={() => router.push(backHref)}
        aria-label="Zurueck zur Gruppenuebersicht"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Group info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold truncate">{groupName}</h1>
          <ChatConnectionStatus status={connectionStatus} compact />
        </div>
        <p className="text-xs text-muted-foreground">
          {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
        </p>
      </div>

      {/* Members button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={onOpenMembers}
        aria-label="Mitgliederliste anzeigen"
      >
        <Users className="h-5 w-5" />
      </Button>
    </div>
  )
}
