"use client"

import { GraduationCap, User } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { ChatMember } from "@/lib/chat-types"

// ============================================================
// PROJ-14: Members Sheet/Drawer
// Shows all group members with anonymized names and role badges.
// No click actions (no direct messaging feature).
// ============================================================

interface ChatMembersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: ChatMember[]
  isLoading: boolean
  groupName: string
}

function getRoleBadge(role: ChatMember["role"]) {
  switch (role) {
    case "trainer":
      return (
        <Badge variant="default" className="text-xs gap-1">
          <GraduationCap className="h-3 w-3" />
          Trainer
        </Badge>
      )
    case "co-trainer":
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <GraduationCap className="h-3 w-3" />
          Co-Trainer
        </Badge>
      )
    default:
      return null
  }
}

export function ChatMembersSheet({
  open,
  onOpenChange,
  members,
  isLoading,
  groupName,
}: ChatMembersSheetProps) {
  // Sort: trainers first, then co-trainers, then members
  const sortedMembers = [...members].sort((a, b) => {
    const order = { trainer: 0, "co-trainer": 1, mitglied: 2 }
    return (order[a.role] ?? 2) - (order[b.role] ?? 2)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] max-w-[90vw] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Gruppenmitglieder</SheetTitle>
          <SheetDescription>
            {groupName} &middot; {members.length}{" "}
            {members.length === 1 ? "Mitglied" : "Mitglieder"}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-2.5"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Mitglieder gefunden.
            </p>
          ) : (
            sortedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-2 py-2.5 rounded-md"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.display_name}
                  </p>
                </div>
                {getRoleBadge(member.role)}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
