"use client"

import * as React from "react"
import {
  ClipboardList,
  Filter,
  Info,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"

import type { GroupWithTrainer } from "@/lib/actions/groups"
import type { AttendanceMatrixEntry } from "@/lib/validations/training"

// === Types ===

interface MatrixSession {
  id: string
  date: string
}

type Period = "4weeks" | "1month" | "3months"

// === Helpers ===

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case "present":
      return "bg-green-500"
    case "absent":
      return "bg-red-500"
    case "excused":
      return "bg-yellow-500"
    default:
      return "bg-gray-300 dark:bg-gray-600"
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "present":
      return "Anwesend"
    case "absent":
      return "Abwesend"
    case "excused":
      return "Entschuldigt"
    default:
      return "Keine Daten"
  }
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "4weeks", label: "Letzte 4 Wochen" },
  { value: "1month", label: "Letzter Monat" },
  { value: "3months", label: "Letzte 3 Monate" },
]

// === Loading Skeleton ===

function AttendanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardContent className="p-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// === Main Component ===

export default function TrainerAttendancePage() {
  const isMobile = useIsMobile()
  const [groups, setGroups] = React.useState<GroupWithTrainer[]>([])
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("")
  const [period, setPeriod] = React.useState<Period>("4weeks")
  const [matrix, setMatrix] = React.useState<AttendanceMatrixEntry[]>([])
  const [matrixSessions, setMatrixSessions] = React.useState<MatrixSession[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMatrix, setIsLoadingMatrix] = React.useState(false)

  // Fetch groups
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
      if (groupList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupList[0].id)
      }
    } catch {
      toast.error("Fehler beim Laden der Gruppen")
    }
  }, [selectedGroupId])

  // Fetch attendance matrix
  const fetchMatrix = React.useCallback(
    async (groupId: string, p: Period) => {
      if (!groupId) return
      setIsLoadingMatrix(true)
      try {
        const response = await fetch(
          `/api/training/attendance?group_id=${groupId}&period=${p}`
        )
        if (!response.ok) {
          toast.error("Fehler beim Laden der Anwesenheitsdaten")
          return
        }
        const data = await response.json()
        setMatrix(data.matrix || [])
        setMatrixSessions(data.sessions || [])
      } catch {
        toast.error("Fehler beim Laden der Anwesenheitsdaten")
      } finally {
        setIsLoadingMatrix(false)
      }
    },
    []
  )

  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      await fetchGroups()
      setIsLoading(false)
    }
    init()
  }, [fetchGroups])

  React.useEffect(() => {
    if (selectedGroupId) {
      fetchMatrix(selectedGroupId, period)
    }
  }, [selectedGroupId, period, fetchMatrix])

  // === Render ===

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Anwesenheit</h1>
        <AttendanceSkeleton />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Anwesenheit</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Anwesenheit</h1>
        <p className="text-muted-foreground">
          Anwesenheits\u00fcbersicht und -muster Ihrer Gruppen.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Gruppe w\u00e4hlen" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Content */}
      {isLoadingMatrix ? (
        <Card>
          <CardContent className="p-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      ) : matrix.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              Keine Anwesenheitsdaten
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              F\u00fcr den gew\u00e4hlten Zeitraum liegen keine Trainings oder
              Anwesenheitsdaten vor.
            </p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: Card View */
        <div className="space-y-3">
          {matrix.map((entry) => (
            <Card key={entry.profile_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">
                    {entry.first_name} {entry.last_name}
                  </span>
                  <Badge
                    variant={
                      entry.attendance_rate >= 75
                        ? "default"
                        : entry.attendance_rate >= 50
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {Math.round(entry.attendance_rate)}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <TooltipProvider>
                    {entry.sessions.map((s) => (
                      <Tooltip key={s.session_id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-5 w-5 rounded-full ${getStatusColor(s.actual_status)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">
                            {formatShortDate(s.date)}
                          </p>
                          <p>{getStatusLabel(s.actual_status)}</p>
                          {s.rsvp_reason && (
                            <p className="text-xs opacity-75">
                              Grund: {s.rsvp_reason}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop: Matrix Table */
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="w-full">
              <TooltipProvider>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium sticky left-0 bg-card z-10 min-w-[160px]">
                        Mitglied
                      </th>
                      {matrixSessions.map((s) => (
                        <th
                          key={s.id}
                          className="text-center p-2 font-medium min-w-[48px]"
                        >
                          {formatShortDate(s.date)}
                        </th>
                      ))}
                      <th className="text-center p-2 font-medium min-w-[60px]">
                        Quote
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((entry) => (
                      <tr key={entry.profile_id} className="border-b last:border-0">
                        <td className="p-2 sticky left-0 bg-card z-10">
                          {entry.first_name} {entry.last_name}
                        </td>
                        {matrixSessions.map((ms) => {
                          const s = entry.sessions.find(
                            (sess) => sess.session_id === ms.id
                          )
                          return (
                            <td key={ms.id} className="p-2 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`mx-auto h-4 w-4 rounded-full ${getStatusColor(s?.actual_status ?? null)} cursor-default`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    {formatShortDate(ms.date)}
                                  </p>
                                  <p>
                                    {getStatusLabel(
                                      s?.actual_status ?? null
                                    )}
                                  </p>
                                  {s?.rsvp_reason && (
                                    <p className="text-xs opacity-75">
                                      Grund: {s.rsvp_reason}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          )
                        })}
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              entry.attendance_rate >= 75
                                ? "default"
                                : entry.attendance_rate >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {Math.round(entry.attendance_rate)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TooltipProvider>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Legend + DSGVO Notice */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Legende:</span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" /> Anwesend
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500" /> Abwesend
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-yellow-500" /> Entschuldigt
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />{" "}
            Keine Daten
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Abwesenheitsgr\u00fcnde werden nach 4 Wochen automatisch gel\u00f6scht
            (DSGVO).
          </span>
        </div>
      </div>
    </div>
  )
}
