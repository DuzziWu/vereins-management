"use client"

import * as React from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
  parseISO,
  isPast,
  startOfDay,
} from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSwipe } from "@/hooks/use-swipe"

import {
  type Event,
  type EventType,
  type EventStatus,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
} from "@/lib/validations/events"

// === Helper Functions ===

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function formatDateRange(start: string, end: string | null): string {
  if (!end) return formatTime(start)
  return `${formatTime(start)} – ${formatTime(end)}`
}

// === Loading Skeleton ===

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}

// === Event Type Icon ===

function EventTypeDot({ type }: { type: EventType }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", EVENT_TYPE_COLORS[type])}
      title={EVENT_TYPE_LABELS[type]}
    />
  )
}

// === Main Component ===

export default function AdminEventsPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [events, setEvents] = React.useState<Event[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all")

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  // Form state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    event_type: "club_event" as EventType,
    event_date: "",
    start_time: "",
    end_time: "",
    location_name: "",
    address: "",
    meeting_point: "",
  })

  // === Data Fetching ===

  const fetchEvents = React.useCallback(async () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    // Lade einen Monat vor/nach für Kalender-Überlauf
    const from = format(subMonths(monthStart, 1), "yyyy-MM-dd")
    const to = format(addMonths(monthEnd, 1), "yyyy-MM-dd")

    try {
      const url = new URL("/api/events", window.location.origin)
      url.searchParams.set("from", from)
      url.searchParams.set("to", to)
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter)
      }

      const response = await fetch(url)
      if (!response.ok) {
        toast.error("Fehler beim Laden der Events")
        return
      }
      const data = await response.json()
      setEvents(data.events || [])
    } catch {
      toast.error("Fehler beim Laden der Events")
    }
  }, [currentMonth, statusFilter])

  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      await fetchEvents()
      setIsLoading(false)
    }
    init()
  }, [fetchEvents])

  // === Calendar Logic ===

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Montag
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  const getEventsForDay = (date: Date): Event[] => {
    const dateStr = format(date, "yyyy-MM-dd")
    return events.filter((e) => e.event_date === dateStr)
  }

  // === Event Handlers ===

  function handlePrevMonth() {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  function handleNextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  function handleToday() {
    setCurrentMonth(new Date())
  }

  // Mobile Swipe-Gesten für Monatswechsel
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNextMonth,
    onSwipeRight: handlePrevMonth,
    threshold: 50,
  })

  function openCreateDialog(date?: Date) {
    setSelectedEvent(null)
    setFormData({
      title: "",
      description: "",
      event_type: "club_event",
      event_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      start_time: "18:00",
      end_time: "",
      location_name: "",
      address: "",
      meeting_point: "",
    })
    setCreateDialogOpen(true)
  }

  function openEditDialog(event: Event) {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time?.slice(0, 5) || "",
      location_name: event.location_name || "",
      address: event.address || "",
      meeting_point: event.meeting_point || "",
    })
    setCreateDialogOpen(true)
  }

  function openDetailDialog(event: Event) {
    setSelectedEvent(event)
    setDetailDialogOpen(true)
  }

  function openDeleteDialog(event: Event) {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  // Prüfe ob das Datum in der Vergangenheit liegt
  const isDateInPast = React.useMemo(() => {
    if (!formData.event_date) return false
    const eventDate = parseISO(formData.event_date)
    return isPast(startOfDay(eventDate)) && !isToday(eventDate)
  }, [formData.event_date])

  // Prüfe ob es überlappende Events gibt
  const overlappingEvents = React.useMemo(() => {
    if (!formData.event_date || !formData.start_time) return []
    return events.filter((e) => {
      if (selectedEvent && e.id === selectedEvent.id) return false
      if (e.event_date !== formData.event_date) return false
      // Einfache Zeitüberlappungs-Prüfung
      const newStart = formData.start_time
      const newEnd = formData.end_time || "23:59"
      const existingStart = e.start_time.slice(0, 5)
      const existingEnd = e.end_time?.slice(0, 5) || "23:59"
      return newStart < existingEnd && newEnd > existingStart
    })
  }, [formData.event_date, formData.start_time, formData.end_time, events, selectedEvent])

  async function handleSubmit() {
    if (!formData.title || !formData.event_date || !formData.start_time) {
      toast.error("Bitte fülle alle Pflichtfelder aus")
      return
    }

    setIsSubmitting(true)
    try {
      const url = selectedEvent
        ? `/api/events/${selectedEvent.id}`
        : "/api/events"
      const method = selectedEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          end_time: formData.end_time || null,
          description: formData.description || null,
          location_name: formData.location_name || null,
          address: formData.address || null,
          meeting_point: formData.meeting_point || null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      toast.success(selectedEvent ? "Event aktualisiert" : "Event erstellt")
      setCreateDialogOpen(false)
      fetchEvents()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!selectedEvent) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Löschen")
      }

      toast.success("Event gelöscht")
      setDeleteDialogOpen(false)
      setDetailDialogOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Löschen"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(newStatus: EventStatus) {
    if (!selectedEvent) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Status-Update")
      }

      toast.success(`Status auf "${EVENT_STATUS_LABELS[newStatus]}" geändert`)
      setDetailDialogOpen(false)
      fetchEvents()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Status-Update"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // === Render ===

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Veranstaltungen</h1>
        <CalendarSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Veranstaltungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Auftritte, Wettkämpfe und Vereins-Events.
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Neues Event
        </Button>
      </div>

      {/* Filter & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: de })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {EVENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {EVENT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Legende:</span>
        {EVENT_TYPES.map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <EventTypeDot type={type} />
            {EVENT_TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card {...swipeHandlers}>
        <CardContent className="p-2 sm:p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[80px] sm:min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors",
                    isCurrentMonth
                      ? "bg-background hover:bg-muted/50"
                      : "bg-muted/30 text-muted-foreground",
                    isCurrentDay && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    if (dayEvents.length === 0) {
                      openCreateDialog(day)
                    } else if (dayEvents.length === 1) {
                      openDetailDialog(dayEvents[0])
                    } else {
                      setSelectedDate(day)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium",
                        isCurrentDay &&
                          "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1">
                        +{dayEvents.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-[10px] sm:text-xs px-1 py-0.5 rounded truncate flex items-center gap-1",
                          event.status === "abgesagt" && "line-through opacity-60"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetailDialog(event)
                        }}
                      >
                        <EventTypeDot type={event.event_type} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Sheet (wenn mehrere Events an einem Tag) */}
      {selectedDate && (
        <ResponsiveDialog
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
        >
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>
                {format(selectedDate, "EEEE, d. MMMM yyyy", { locale: de })}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {getEventsForDay(selectedDate).length} Events an diesem Tag
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
              {getEventsForDay(selectedDate).map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedDate(null)
                    openDetailDialog(event)
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <EventTypeDot type={event.event_type} />
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateRange(event.start_time, event.end_time)}
                        </div>
                      </div>
                      <Badge variant={EVENT_STATUS_VARIANTS[event.status]}>
                        {EVENT_STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const date = selectedDate
                  setSelectedDate(null)
                  openCreateDialog(date)
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Neues Event an diesem Tag
              </Button>
            </div>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}

      {/* Event Detail Dialog */}
      <ResponsiveDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-lg">
          {selectedEvent && (
            <>
              <ResponsiveDialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <EventTypeDot type={selectedEvent.event_type} />
                  <Badge variant="outline">
                    {EVENT_TYPE_LABELS[selectedEvent.event_type]}
                  </Badge>
                  <Badge variant={EVENT_STATUS_VARIANTS[selectedEvent.status]}>
                    {EVENT_STATUS_LABELS[selectedEvent.status]}
                  </Badge>
                </div>
                <ResponsiveDialogTitle className="mt-2">
                  {selectedEvent.title}
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  {format(parseISO(selectedEvent.event_date), "EEEE, d. MMMM yyyy", {
                    locale: de,
                  })}
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>

              <div className="space-y-4 py-4">
                {/* Zeit & Ort */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDateRange(selectedEvent.start_time, selectedEvent.end_time)} Uhr
                    </span>
                  </div>
                  {selectedEvent.location_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location_name}</span>
                    </div>
                  )}
                  {selectedEvent.address && (
                    <div className="ml-6 text-sm text-muted-foreground">
                      {selectedEvent.address}
                    </div>
                  )}
                  {selectedEvent.meeting_point && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Treffpunkt: {selectedEvent.meeting_point}</span>
                    </div>
                  )}
                </div>

                {/* Beschreibung */}
                {selectedEvent.description && (
                  <div className="text-sm border-t pt-4">
                    <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Status-Aktionen */}
                {selectedEvent.status === "anfrage" && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium">Status ändern:</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange("bestaetigt")}
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Bestätigen
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange("abgesagt")}
                        disabled={isSubmitting}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Absagen
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEvent.status === "bestaetigt" && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium">Status ändern:</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange("abgeschlossen")}
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Abschließen
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange("abgesagt")}
                        disabled={isSubmitting}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Absagen
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <ResponsiveDialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => openDeleteDialog(selectedEvent)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Löschen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailDialogOpen(false)
                    openEditDialog(selectedEvent)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Bearbeiten
                </Button>
              </ResponsiveDialogFooter>
            </>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Create/Edit Event Dialog */}
      <ResponsiveDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {selectedEvent ? "Event bearbeiten" : "Neues Event erstellen"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {selectedEvent
                ? "Ändern Sie die Event-Details."
                : "Füllen Sie die Details für das neue Event aus."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Warnung bei Vergangenheits-Datum */}
            {isDateInPast && (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                  Das gewählte Datum liegt in der Vergangenheit.
                </AlertDescription>
              </Alert>
            )}

            {/* Warnung bei überlappenden Events */}
            {overlappingEvents.length > 0 && (
              <Alert variant="default" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  Es gibt bereits {overlappingEvents.length === 1 ? "ein Event" : `${overlappingEvents.length} Events`} zur gleichen Zeit:{" "}
                  {overlappingEvents.map((e) => e.title).join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Titel */}
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="z.B. Stadtfest Auftritt"
              />
            </div>

            {/* Event-Typ */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Event-Typ *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(v) =>
                  setFormData({ ...formData, event_type: v as EventType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <EventTypeDot type={type} />
                        {EVENT_TYPE_LABELS[type]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Datum & Zeit */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Datum *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Startzeit *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Endzeit</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Ort */}
            <div className="space-y-2">
              <Label htmlFor="location_name">Veranstaltungsort</Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) =>
                  setFormData({ ...formData, location_name: e.target.value })
                }
                placeholder="z.B. Stadthalle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="z.B. Marktplatz 1, 12345 Musterstadt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_point">Treffpunkt</Label>
              <Input
                id="meeting_point"
                value={formData.meeting_point}
                onChange={(e) =>
                  setFormData({ ...formData, meeting_point: e.target.value })
                }
                placeholder="z.B. Parkplatz hinter dem Rathaus"
              />
            </div>

            {/* Beschreibung */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Weitere Informationen zum Event..."
                rows={3}
              />
            </div>
          </div>

          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {selectedEvent ? "Speichern" : "Erstellen"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie &quot;{selectedEvent?.title}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
