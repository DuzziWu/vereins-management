"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Users, Bell, RefreshCw, Filter, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type RsvpStatus,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_COLORS,
} from "@/lib/validations/events"

interface Assignment {
  id: string
  profile_id: string
  group_id: string | null
  rsvp_status: RsvpStatus
  rsvp_updated_at: string | null
  reminder_sent_at: string | null
  profile: {
    id: string
    first_name: string
    last_name: string
  }
  group: {
    id: string
    name: string
  } | null
}

interface EventRsvpOverviewProps {
  eventId: string
  canSendReminder?: boolean
  onRefresh?: () => void
}

export function EventRsvpOverview({
  eventId,
  canSendReminder = false,
  onRefresh,
}: EventRsvpOverviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")

  // Fetch assignments
  async function loadAssignments() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/assignments`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        toast.error("Fehler beim Laden der Teilnehmer")
      }
    } catch {
      toast.error("Fehler beim Laden der Teilnehmer")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Get unique groups for filter
  const groups = useMemo(() => {
    const groupMap = new Map<string, string>()
    assignments.forEach((a) => {
      if (a.group) {
        groupMap.set(a.group.id, a.group.name)
      }
    })
    return Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }))
  }, [assignments])

  // Filter assignments by group
  const filteredAssignments = useMemo(() => {
    if (selectedGroupId === "all") return assignments
    return assignments.filter((a) => a.group?.id === selectedGroupId)
  }, [assignments, selectedGroupId])

  // Group by RSVP status
  const { confirmed, declined, pending } = useMemo(() => {
    return {
      confirmed: filteredAssignments.filter((a) => a.rsvp_status === "zugesagt"),
      declined: filteredAssignments.filter((a) => a.rsvp_status === "abgesagt"),
      pending: filteredAssignments.filter((a) => a.rsvp_status === "ausstehend"),
    }
  }, [filteredAssignments])

  // Calculate stats
  const totalInvited = filteredAssignments.length
  const totalResponded = confirmed.length + declined.length
  const responseRate = totalInvited > 0 ? Math.round((totalResponded / totalInvited) * 100) : 0

  async function handleSendReminder() {
    if (pending.length === 0) {
      toast.info("Keine ausstehenden RSVPs")
      return
    }

    setIsSendingReminder(true)
    try {
      const response = await fetch(`/api/events/${eventId}/reminder`, {
        method: "POST",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Senden")
      }

      const data = await response.json()
      toast.success(`Erinnerung an ${data.sent} Mitglieder gesendet`)
      loadAssignments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Senden")
    } finally {
      setIsSendingReminder(false)
    }
  }

  function handleRefresh() {
    loadAssignments()
    onRefresh?.()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          Noch keine Teilnehmer zugewiesen
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalResponded} von {totalInvited} haben geantwortet
          </span>
          <span className="font-medium">{responseRate}%</span>
        </div>
        <Progress value={responseRate} className="h-2" />
      </div>

      {/* Stats Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={cn("border", RSVP_STATUS_COLORS.zugesagt)}>
          {confirmed.length} Zugesagt
        </Badge>
        <Badge className={cn("border", RSVP_STATUS_COLORS.abgesagt)}>
          {declined.length} Abgesagt
        </Badge>
        <Badge className={cn("border", RSVP_STATUS_COLORS.ausstehend)}>
          {pending.length} Ausstehend
        </Badge>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {groups.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Gruppen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gruppen</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Aktualisieren
          </Button>
          {canSendReminder && pending.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
            >
              {isSendingReminder ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-1" />
              )}
              Alle erinnern ({pending.length})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="confirmed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="confirmed" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            Zugesagt ({confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700">
            Abgesagt ({declined.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            Ausstehend ({pending.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed">
          <MemberList members={confirmed} emptyText="Noch keine Zusagen" />
        </TabsContent>

        <TabsContent value="declined">
          <MemberList members={declined} emptyText="Keine Absagen" />
        </TabsContent>

        <TabsContent value="pending">
          <MemberList members={pending} emptyText="Alle haben geantwortet" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for member list
function MemberList({
  members,
  emptyText,
}: {
  members: Assignment[]
  emptyText: string
}) {
  if (members.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-1 py-2">
        {members
          .sort((a, b) => a.profile.last_name.localeCompare(b.profile.last_name))
          .map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">
                  {assignment.profile.first_name} {assignment.profile.last_name}
                </p>
                {assignment.group && (
                  <p className="text-xs text-muted-foreground">
                    {assignment.group.name}
                  </p>
                )}
              </div>
              {assignment.rsvp_updated_at && (
                <span className="text-xs text-muted-foreground">
                  {new Date(assignment.rsvp_updated_at).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              )}
            </div>
          ))}
      </div>
    </ScrollArea>
  )
}
