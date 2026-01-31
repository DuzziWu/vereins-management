"use client"

import * as React from "react"
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Loader2,
  Ban,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"

import type { TrainingSession, RsvpStatus } from "@/lib/validations/training"

// === Helpers ===

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatTime(start: string, end: string): string {
  return `${start.slice(0, 5)}\u2013${end.slice(0, 5)}`
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const date = new Date(dateStr + "T00:00:00")
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  )
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr + "T23:59:59") < new Date()
}

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get start of week (Monday)
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7))

  const todayMonday = new Date(today)
  todayMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const diffWeeks = Math.round(
    (monday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  if (diffWeeks === 0) return "Diese Woche"
  if (diffWeeks === 1) return "N\u00e4chste Woche"

  const weekStart = monday.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  })
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekEnd = sunday.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  })
  return `${weekStart} \u2013 ${weekEnd}`
}

function getRsvpBadge(status?: RsvpStatus): {
  label: string
  variant: "default" | "destructive" | "secondary" | "outline"
} {
  switch (status) {
    case "confirmed":
      return { label: "Zugesagt", variant: "default" }
    case "declined":
      return { label: "Abgesagt", variant: "destructive" }
    default:
      return { label: "Offen", variant: "outline" }
  }
}

function get4WeeksRange(): { from: string; to: string } {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 28)
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  }
}

// Group sessions by week
function groupByWeek(
  sessions: TrainingSession[]
): { weekLabel: string; sessions: TrainingSession[] }[] {
  const weekMap = new Map<string, TrainingSession[]>()

  for (const session of sessions) {
    const label = getWeekLabel(session.date)
    if (!weekMap.has(label)) {
      weekMap.set(label, [])
    }
    weekMap.get(label)!.push(session)
  }

  return Array.from(weekMap.entries()).map(([weekLabel, weekSessions]) => ({
    weekLabel,
    sessions: weekSessions.sort((a, b) => a.date.localeCompare(b.date)),
  }))
}

// === Skeleton ===

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// === Main Component ===

export default function MemberSchedulePage() {
  const [sessions, setSessions] = React.useState<TrainingSession[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Decline dialog
  const [declineDialogOpen, setDeclineDialogOpen] = React.useState(false)
  const [declineSession, setDeclineSession] =
    React.useState<TrainingSession | null>(null)
  const [declineReason, setDeclineReason] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch sessions
  const fetchSessions = React.useCallback(async () => {
    try {
      const { from, to } = get4WeeksRange()
      const response = await fetch(
        `/api/training/sessions?view=member&from=${from}&to=${to}`
      )
      if (!response.ok) {
        toast.error("Fehler beim Laden der Termine")
        return
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch {
      toast.error("Fehler beim Laden der Termine")
    }
  }, [])

  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      await fetchSessions()
      setIsLoading(false)
    }
    init()
  }, [fetchSessions])

  // === RSVP Handlers ===

  async function handleConfirm(session: TrainingSession) {
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/training/sessions/${session.id}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rsvp_status: "confirmed" }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler bei der Zusage")
      }

      toast.success("Zusage gespeichert")
      fetchSessions()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler bei der Zusage"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function openDeclineDialog(session: TrainingSession) {
    setDeclineSession(session)
    setDeclineReason("")
    setDeclineDialogOpen(true)
  }

  async function handleDecline() {
    if (!declineSession) return
    if (declineReason.length < 5) {
      toast.error("Bitte geben Sie einen Grund an (min. 5 Zeichen)")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/training/sessions/${declineSession.id}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rsvp_status: "declined",
            rsvp_reason: declineReason,
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler bei der Absage")
      }

      toast.success("Absage gespeichert")
      setDeclineDialogOpen(false)
      setDeclineSession(null)
      setDeclineReason("")
      fetchSessions()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler bei der Absage"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // === Render ===

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Termine</h1>
        <ScheduleSkeleton />
      </div>
    )
  }

  const weeks = groupByWeek(sessions)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Termine</h1>
        <p className="text-muted-foreground">
          Ihre anstehenden Trainings der n\u00e4chsten 4 Wochen.
        </p>
      </div>

      {/* Sessions grouped by week */}
      {weeks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Keine Termine</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              In den n\u00e4chsten 4 Wochen sind keine Trainings geplant.
            </p>
          </CardContent>
        </Card>
      ) : (
        weeks.map((week) => (
          <div key={week.weekLabel} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {week.weekLabel}
            </h2>
            {week.sessions.map((session) => {
              const isCancelled = session.is_cancelled
              const sessionPast = isPast(session.date)
              const myRsvp = session.my_rsvp?.rsvp_status as
                | RsvpStatus
                | undefined
              const rsvpBadge = getRsvpBadge(myRsvp)
              const canRsvp = !isCancelled && !sessionPast

              return (
                <Card
                  key={session.id}
                  className={
                    isCancelled ? "opacity-60 border-dashed" : undefined
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {session.group?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {session.group.name}
                            </Badge>
                          )}
                          <span
                            className={`font-medium ${isCancelled ? "line-through" : ""}`}
                          >
                            {formatDate(session.date)}
                          </span>
                          {isCancelled && (
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              Abgesagt
                            </Badge>
                          )}
                          {!isCancelled && isToday(session.date) && (
                            <Badge variant="default">Heute</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(session.start_time, session.end_time)}
                          </span>
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {session.location}
                            </span>
                          )}
                        </div>
                        {isCancelled && session.cancellation_reason && (
                          <p className="text-sm text-destructive">
                            Grund: {session.cancellation_reason}
                          </p>
                        )}
                        {session.description && !isCancelled && (
                          <p className="text-sm text-muted-foreground">
                            {session.description}
                          </p>
                        )}
                      </div>

                      {/* Right: RSVP */}
                      <div className="flex items-center gap-2">
                        {!isCancelled && (
                          <Badge variant={rsvpBadge.variant}>
                            {rsvpBadge.label}
                          </Badge>
                        )}
                        {canRsvp && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant={
                                myRsvp === "confirmed" ? "default" : "outline"
                              }
                              className={
                                myRsvp === "confirmed"
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : ""
                              }
                              onClick={() => handleConfirm(session)}
                              disabled={isSubmitting}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Zusagen
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                myRsvp === "declined" ? "default" : "outline"
                              }
                              className={
                                myRsvp === "declined"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : ""
                              }
                              onClick={() => openDeclineDialog(session)}
                              disabled={isSubmitting}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Absagen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ))
      )}

      {/* Decline Reason Dialog */}
      <ResponsiveDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Training absagen</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {declineSession && (
                <>
                  {declineSession.group?.name &&
                    `${declineSession.group.name} \u2022 `}
                  {formatDate(declineSession.date)},{" "}
                  {formatTime(
                    declineSession.start_time,
                    declineSession.end_time
                  )}
                </>
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">
                Grund der Abwesenheit *{" "}
                <span className="text-muted-foreground font-normal">
                  (min. 5 Zeichen)
                </span>
              </Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Bitte geben Sie einen Grund an..."
                rows={3}
              />
              {declineReason.length > 0 && declineReason.length < 5 && (
                <p className="text-xs text-destructive">
                  Mindestens 5 Zeichen erforderlich
                </p>
              )}
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineReason.length < 5 || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Absage senden
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
