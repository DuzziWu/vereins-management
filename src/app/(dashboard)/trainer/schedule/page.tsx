"use client"

import * as React from "react"
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Plus,
  Repeat,
  Users,
  X,
  ClipboardCheck,
  Ban,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Info,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"

import { useDashboardView } from "@/contexts/dashboard-view-context"
import type { GroupWithTrainer } from "@/lib/actions/groups"
import type {
  TrainingSession,
  AttendanceRecord,
  ActualStatus,
} from "@/lib/validations/training"
import { WEEKDAY_MAP } from "@/lib/validations/training"
import { QuickAddNoteButton } from "@/components/trainer/quick-add-note-button"

// === Helper Functions ===

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

// Matches backend isWithinAttendanceWindow: training day 00:00 to 2 days later 00:00
// (= day of training + 24h after end of day)
function canRecordAttendance(dateStr: string): boolean {
  const now = new Date()
  const windowStart = new Date(dateStr + "T00:00:00")
  const windowEnd = new Date(windowStart)
  windowEnd.setDate(windowEnd.getDate() + 2)
  return now >= windowStart && now <= windowEnd
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

// === Loading Skeleton ===

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// === Main Component ===

export default function TrainerSchedulePage() {
  // User role
  const { profile: dashboardProfile } = useDashboardView()
  const isVorstand = dashboardProfile?.role === "vorstand"

  // Data
  const [groups, setGroups] = React.useState<GroupWithTrainer[]>([])
  const [sessions, setSessions] = React.useState<TrainingSession[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeGroupId, setActiveGroupId] = React.useState<string>("")

  // Dialog states
  const [seriesDialogOpen, setSeriesDialogOpen] = React.useState(false)
  const [sessionDialogOpen, setSessionDialogOpen] = React.useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = React.useState(false)
  const [endSeriesDialogOpen, setEndSeriesDialogOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] =
    React.useState<TrainingSession | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<string | null>(
    null
  )

  // Correction mode (Vorstand only)
  const [isCorrection, setIsCorrection] = React.useState(false)

  // Form states
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Series form
  const [seriesStartDate, setSeriesStartDate] = React.useState("")
  const [seriesEndDate, setSeriesEndDate] = React.useState("")

  // Session form
  const [sessionDate, setSessionDate] = React.useState("")
  const [sessionStartTime, setSessionStartTime] = React.useState("")
  const [sessionEndTime, setSessionEndTime] = React.useState("")
  const [sessionLocation, setSessionLocation] = React.useState("")
  const [sessionDescription, setSessionDescription] = React.useState("")

  // Cancel form
  const [cancelReason, setCancelReason] = React.useState("")

  // Attendance form
  const [attendanceRecords, setAttendanceRecords] = React.useState<
    AttendanceRecord[]
  >([])
  const [attendanceUpdates, setAttendanceUpdates] = React.useState<
    Record<string, ActualStatus>
  >({})
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(false)

  // === Data Fetching ===

  const fetchGroups = React.useCallback(async () => {
    try {
      const response = await fetch("/api/groups")
      if (!response.ok) {
        toast.error("Fehler beim Laden der Gruppen")
        return
      }
      const data = await response.json()
      const groupList = (data.groups || []) as GroupWithTrainer[]
      setGroups(groupList)
      if (groupList.length > 0 && !activeGroupId) {
        setActiveGroupId(groupList[0].id)
      }
    } catch {
      toast.error("Fehler beim Laden der Gruppen")
    }
  }, [activeGroupId])

  const fetchSessions = React.useCallback(async (groupId: string) => {
    if (!groupId) return
    try {
      const { from, to } = get4WeeksRange()
      const response = await fetch(
        `/api/training/sessions?group_id=${groupId}&from=${from}&to=${to}`
      )
      if (!response.ok) {
        toast.error("Fehler beim Laden der Trainings")
        return
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch {
      toast.error("Fehler beim Laden der Trainings")
    }
  }, [])

  const fetchAttendance = React.useCallback(async (sessionId: string) => {
    setIsLoadingAttendance(true)
    try {
      const response = await fetch(
        `/api/training/sessions/${sessionId}/attendance`
      )
      if (!response.ok) {
        toast.error("Fehler beim Laden der Anwesenheitsliste")
        return
      }
      const data = await response.json()
      const records = (data.attendance || []) as AttendanceRecord[]
      setAttendanceRecords(records)

      // Pre-fill based on RSVP status
      const updates: Record<string, ActualStatus> = {}
      records.forEach((r) => {
        if (r.actual_status) {
          updates[r.profile_id] = r.actual_status
        } else if (r.rsvp_status === "confirmed") {
          updates[r.profile_id] = "present"
        } else if (r.rsvp_status === "declined") {
          updates[r.profile_id] = "excused"
        }
      })
      setAttendanceUpdates(updates)
    } catch {
      toast.error("Fehler beim Laden der Anwesenheitsliste")
    } finally {
      setIsLoadingAttendance(false)
    }
  }, [])

  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      await fetchGroups()
      setIsLoading(false)
    }
    init()
  }, [fetchGroups])

  React.useEffect(() => {
    if (activeGroupId) {
      fetchSessions(activeGroupId)
    }
  }, [activeGroupId, fetchSessions])

  // === Active Group Helper ===

  const activeGroup = groups.find((g) => g.id === activeGroupId)

  // === Event Handlers ===

  async function handleCreateSeries() {
    if (!activeGroup) return
    setIsSubmitting(true)
    try {
      const dayOfWeek = activeGroup.training_day
        ? WEEKDAY_MAP[activeGroup.training_day] ?? 0
        : 0

      const response = await fetch("/api/training/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: activeGroup.id,
          start_date: seriesStartDate,
          end_date: seriesEndDate || undefined,
          day_of_week: dayOfWeek,
          start_time:
            activeGroup.training_start_time?.slice(0, 5) || "18:00",
          end_time: activeGroup.training_end_time?.slice(0, 5) || "19:30",
          location: activeGroup.training_location || "",
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Erstellen")
      }

      const data = await response.json()
      toast.success(
        `Serie erstellt: ${data.sessions_created || 0} Termine generiert`
      )
      setSeriesDialogOpen(false)
      setSeriesStartDate("")
      setSeriesEndDate("")
      fetchSessions(activeGroupId)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Erstellen der Serie"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateSession() {
    if (!activeGroup) return
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: activeGroup.id,
          date: sessionDate,
          start_time: sessionStartTime,
          end_time: sessionEndTime,
          location: sessionLocation || activeGroup.training_location || "",
          description: sessionDescription || "",
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Erstellen")
      }

      toast.success("Einzeltermin erstellt")
      setSessionDialogOpen(false)
      setSessionDate("")
      setSessionStartTime("")
      setSessionEndTime("")
      setSessionLocation("")
      setSessionDescription("")
      fetchSessions(activeGroupId)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Erstellen des Termins"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelSession() {
    if (!selectedSession) return
    if (cancelReason.length < 3) {
      toast.error("Bitte geben Sie einen Absagegrund an (min. 3 Zeichen)")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/training/sessions/${selectedSession.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_cancelled: true,
            cancellation_reason: cancelReason,
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Absagen")
      }

      toast.success("Training abgesagt")
      setCancelDialogOpen(false)
      setCancelReason("")
      setSelectedSession(null)
      fetchSessions(activeGroupId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Absagen"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRecordAttendance() {
    if (!selectedSession) return
    setIsSubmitting(true)
    try {
      const attendance = Object.entries(attendanceUpdates).map(
        ([profile_id, actual_status]) => ({ profile_id, actual_status })
      )

      const response = await fetch(
        `/api/training/sessions/${selectedSession.id}/attendance`,
        {
          method: isCorrection ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendance }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      toast.success(
        isCorrection ? "Anwesenheit korrigiert" : "Anwesenheit erfasst"
      )
      setAttendanceDialogOpen(false)
      setSelectedSession(null)
      setAttendanceRecords([])
      setAttendanceUpdates({})
      setIsCorrection(false)
      fetchSessions(activeGroupId)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern der Anwesenheit"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEndSeries() {
    if (!selectedSeriesId) return
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/training/series", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series_id: selectedSeriesId }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Beenden der Serie")
      }

      const data = await response.json()
      toast.success(
        `Serie beendet: ${data.sessions_deleted} zukünftige Termine entfernt`
      )
      setEndSeriesDialogOpen(false)
      setSelectedSeriesId(null)
      fetchSessions(activeGroupId)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Beenden der Serie"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCancelDialog(session: TrainingSession) {
    setSelectedSession(session)
    setCancelReason("")
    setCancelDialogOpen(true)
  }

  function openAttendanceDialog(session: TrainingSession) {
    setSelectedSession(session)
    setAttendanceUpdates({})
    setAttendanceDialogOpen(true)
    fetchAttendance(session.id)
  }

  function openCorrectionDialog(session: TrainingSession) {
    setSelectedSession(session)
    setIsCorrection(true)
    setAttendanceUpdates({})
    setAttendanceDialogOpen(true)
    fetchAttendance(session.id)
  }

  function openEndSeriesDialog(seriesId: string) {
    setSelectedSeriesId(seriesId)
    setEndSeriesDialogOpen(true)
  }

  function openSeriesDialog() {
    setSeriesStartDate("")
    setSeriesEndDate("")
    setSeriesDialogOpen(true)
  }

  function openSessionDialog() {
    setSessionDate("")
    setSessionStartTime(activeGroup?.training_start_time?.slice(0, 5) || "")
    setSessionEndTime(activeGroup?.training_end_time?.slice(0, 5) || "")
    setSessionLocation(activeGroup?.training_location || "")
    setSessionDescription("")
    setSessionDialogOpen(true)
  }

  // === Render ===

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Trainingsplan</h1>
        <ScheduleSkeleton />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Trainingsplan</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              Keine Gruppen zugewiesen
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sie sind aktuell keiner Gruppe als Trainer zugeordnet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const groupSessions = sessions
    .filter((s) => s.group_id === activeGroupId)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Trainingsplan</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Trainingseinheiten und erfassen Sie die Anwesenheit.
        </p>
      </div>

      {/* Group Tabs */}
      <Tabs value={activeGroupId} onValueChange={setActiveGroupId}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="space-y-4">
            {/* Group Info Header */}
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{group.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {group.training_day && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {group.training_day}
                        {group.training_start_time &&
                          group.training_end_time &&
                          `, ${group.training_start_time.slice(0, 5)}\u2013${group.training_end_time.slice(0, 5)}`}
                      </span>
                    )}
                    {group.training_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {group.training_location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {group.member_count || 0} Mitglieder
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSeriesDialog}
                  >
                    <Repeat className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Wiederkehrend</span>
                    <span className="sm:hidden">Serie</span>
                  </Button>
                  <Button size="sm" onClick={openSessionDialog}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Einzeltermin
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Training Sessions List */}
            {groupSessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarPlus className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">
                    Keine Trainings geplant
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Erstellen Sie ein wiederkehrendes Training oder einen
                    Einzeltermin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupSessions.map((session) => {
                  const isCancelled = session.is_cancelled
                  const canRecord =
                    !isCancelled && canRecordAttendance(session.date)
                  const isPast =
                    new Date(session.date + "T23:59:59") < new Date()
                  const rsvp = session.rsvp_summary

                  return (
                    <Card
                      key={session.id}
                      className={
                        isCancelled ? "opacity-60 border-dashed" : undefined
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          {/* Session Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-medium ${isCancelled ? "line-through" : ""}`}
                              >
                                {formatDate(session.date)}
                              </span>
                              {isCancelled && (
                                <Badge variant="destructive">Abgesagt</Badge>
                              )}
                              {!isCancelled && isToday(session.date) && (
                                <Badge variant="default">Heute</Badge>
                              )}
                              {session.series_id && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <Repeat className="h-3 w-3 mr-1" />
                                  Serie
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(
                                  session.start_time,
                                  session.end_time
                                )}
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

                          {/* RSVP Summary + Actions */}
                          <div className="flex flex-col items-start sm:items-end gap-2">
                            {rsvp && !isCancelled && (
                              <TooltipProvider>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="bg-green-500/10 text-green-600 border-green-500/30"
                                      >
                                        {rsvp.confirmed} ✓
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {rsvp.confirmed} Zusagen
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="bg-red-500/10 text-red-600 border-red-500/30"
                                      >
                                        {rsvp.declined} ✗
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {rsvp.declined} Absagen
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="bg-gray-500/10 text-gray-500 border-gray-500/30"
                                      >
                                        {rsvp.pending} ?
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {rsvp.pending} Offen
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {!isCancelled && !isPast && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCancelDialog(session)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Ban className="h-3.5 w-3.5 mr-1" />
                                  Absagen
                                </Button>
                              )}
                              {!isCancelled &&
                                !isPast &&
                                session.series_id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEndSeriesDialog(
                                        session.series_id!
                                      )
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Serie beenden
                                  </Button>
                                )}
                              {canRecord && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    openAttendanceDialog(session)
                                  }
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                  Anwesenheit
                                </Button>
                              )}
                              {!isCancelled &&
                                isPast &&
                                !canRecord &&
                                isVorstand && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openCorrectionDialog(session)
                                    }
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Korrigieren
                                  </Button>
                                )}
                              {/* Quick-Add Note Button for past sessions */}
                              {!isCancelled && isPast && (
                                <QuickAddNoteButton
                                  groupId={session.group_id}
                                  sessionId={session.id}
                                  sessionDate={session.date}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* === Dialogs === */}

      {/* Create Recurring Series Dialog */}
      <ResponsiveDialog
        open={seriesDialogOpen}
        onOpenChange={setSeriesDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Wiederkehrendes Training erstellen
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Erstellt automatisch Termine basierend auf den
              Gruppen-Trainingszeiten.
              {activeGroup?.training_day && (
                <>
                  <br />
                  <strong>
                    {activeGroup.training_day}
                    {activeGroup.training_start_time &&
                      activeGroup.training_end_time &&
                      `, ${activeGroup.training_start_time.slice(0, 5)}\u2013${activeGroup.training_end_time.slice(0, 5)}`}
                    {activeGroup.training_location &&
                      ` \u2022 ${activeGroup.training_location}`}
                  </strong>
                </>
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="series-start">Startdatum *</Label>
              <Input
                id="series-start"
                type="date"
                value={seriesStartDate}
                onChange={(e) => setSeriesStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-end">
                Enddatum{" "}
                <span className="text-muted-foreground font-normal">
                  (leer = 6 Monate)
                </span>
              </Label>
              <Input
                id="series-end"
                type="date"
                value={seriesEndDate}
                onChange={(e) => setSeriesEndDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Überprüfen Sie wiederkehrende Termine auf Feiertage. Diese werden
              nicht automatisch erkannt.
            </p>
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setSeriesDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSeries}
              disabled={!seriesStartDate || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Erstellen
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Create Single Session Dialog */}
      <ResponsiveDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Einzeltermin erstellen
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Erstellen Sie einen einzelnen Trainingstermin f\u00fcr{" "}
              {activeGroup?.name}.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-date">Datum *</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-start-time">Startzeit *</Label>
                <Input
                  id="session-start-time"
                  type="time"
                  value={sessionStartTime}
                  onChange={(e) => setSessionStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-end-time">Endzeit *</Label>
                <Input
                  id="session-end-time"
                  type="time"
                  value={sessionEndTime}
                  onChange={(e) => setSessionEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-location">Ort</Label>
              <Input
                id="session-location"
                value={sessionLocation}
                onChange={(e) => setSessionLocation(e.target.value)}
                placeholder={
                  activeGroup?.training_location || "Trainingsort"
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-desc">Beschreibung / Notiz</Label>
              <Textarea
                id="session-desc"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Optionale Beschreibung..."
                rows={2}
              />
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setSessionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={
                !sessionDate ||
                !sessionStartTime ||
                !sessionEndTime ||
                isSubmitting
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Erstellen
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Cancel Session Dialog */}
      <ResponsiveDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Training absagen</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {selectedSession && (
                <>
                  {formatDate(selectedSession.date)},{" "}
                  {formatTime(
                    selectedSession.start_time,
                    selectedSession.end_time
                  )}
                </>
              )}
              <br />
              Die Mitglieder werden \u00fcber die Absage benachrichtigt.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Absagegrund *</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Grund der Absage..."
                rows={3}
              />
              {cancelReason.length > 0 && cancelReason.length < 3 && (
                <p className="text-xs text-destructive">
                  Mindestens 3 Zeichen erforderlich
                </p>
              )}
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSession}
              disabled={cancelReason.length < 3 || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Training absagen
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Record Attendance Dialog */}
      <ResponsiveDialog
        open={attendanceDialogOpen}
        onOpenChange={(open) => {
          setAttendanceDialogOpen(open)
          if (!open) setIsCorrection(false)
        }}
      >
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isCorrection
                ? "Anwesenheit korrigieren"
                : "Anwesenheit erfassen"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {selectedSession && (
                <>
                  {formatDate(selectedSession.date)},{" "}
                  {formatTime(
                    selectedSession.start_time,
                    selectedSession.end_time
                  )}{" "}
                  \u2022 {activeGroup?.name}
                </>
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isLoadingAttendance ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Keine Mitglieder in dieser Gruppe</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.map((record) => {
                  const status = attendanceUpdates[record.profile_id]
                  const rsvpHint =
                    record.rsvp_status === "confirmed"
                      ? "Zugesagt"
                      : record.rsvp_status === "declined"
                        ? "Abgesagt"
                        : "Offen"

                  return (
                    <div
                      key={record.profile_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {record.profile?.first_name}{" "}
                          {record.profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          RSVP: {rsvpHint}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant={
                            status === "present" ? "default" : "outline"
                          }
                          className={
                            status === "present"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : ""
                          }
                          onClick={() =>
                            setAttendanceUpdates((prev) => ({
                              ...prev,
                              [record.profile_id]: "present",
                            }))
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">
                            Da
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            status === "absent" ? "default" : "outline"
                          }
                          className={
                            status === "absent"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : ""
                          }
                          onClick={() =>
                            setAttendanceUpdates((prev) => ({
                              ...prev,
                              [record.profile_id]: "absent",
                            }))
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">
                            Fehlt
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            status === "excused" ? "default" : "outline"
                          }
                          className={
                            status === "excused"
                              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                              : ""
                          }
                          onClick={() =>
                            setAttendanceUpdates((prev) => ({
                              ...prev,
                              [record.profile_id]: "excused",
                            }))
                          }
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">
                            Entsch.
                          </span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleRecordAttendance}
              disabled={
                Object.keys(attendanceUpdates).length === 0 || isSubmitting
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Speichern
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* End Series Confirmation Dialog */}
      <ResponsiveDialog
        open={endSeriesDialogOpen}
        onOpenChange={setEndSeriesDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Serie beenden</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Alle zukünftigen Termine dieser Serie werden unwiderruflich
              entfernt. Vergangene Termine und deren Anwesenheitsdaten bleiben
              erhalten.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setEndSeriesDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSeries}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Serie beenden
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
