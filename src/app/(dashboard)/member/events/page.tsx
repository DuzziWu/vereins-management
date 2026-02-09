"use client"

import * as React from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
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
  addDays,
  isToday,
  parseISO,
} from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { cn } from "@/lib/utils"
import { useSwipe } from "@/hooks/use-swipe"
import { EventRsvpButtons, EventRsvpStatusBadge } from "@/components/events"

import {
  type Event,
  type EventType,
  type RsvpStatus,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
} from "@/lib/validations/events"

// Extend Event type to include RSVP status for member view
interface MemberEvent extends Event {
  my_rsvp_status?: RsvpStatus
}

// === Helper Functions ===

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function formatDateRange(start: string, end: string | null): string {
  if (!end) return formatTime(start)
  return `${formatTime(start)} – ${formatTime(end)}`
}

function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

// === Loading Skeleton ===

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
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

export default function MemberEventsPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [events, setEvents] = React.useState<MemberEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Dialogs
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<MemberEvent | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  // === Data Fetching ===

  const fetchEvents = React.useCallback(async () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const from = format(subMonths(monthStart, 1), "yyyy-MM-dd")
    const to = format(addMonths(monthEnd, 1), "yyyy-MM-dd")

    try {
      const url = new URL("/api/events", window.location.origin)
      url.searchParams.set("from", from)
      url.searchParams.set("to", to)

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
  }, [currentMonth])

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
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  const getEventsForDay = (date: Date): MemberEvent[] => {
    const dateStr = format(date, "yyyy-MM-dd")
    return events.filter((e) => e.event_date === dateStr)
  }

  // Handler for RSVP status changes
  function handleRsvpChange(eventId: string, newStatus: RsvpStatus) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, my_rsvp_status: newStatus } : e
      )
    )
    if (selectedEvent?.id === eventId) {
      setSelectedEvent({ ...selectedEvent, my_rsvp_status: newStatus })
    }
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

  function openDetailDialog(event: Event) {
    setSelectedEvent(event)
    setDetailDialogOpen(true)
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
      <div>
        <h1 className="text-3xl font-bold">Veranstaltungen</h1>
        <p className="text-muted-foreground">
          Übersicht über alle anstehenden Vereins-Events.
        </p>
      </div>

      {/* Navigation */}
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
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, idx) => {
              const dayEvents = getEventsForDay(d)
              const isCurrentMonth = isSameMonth(d, currentMonth)
              const isCurrentDay = isToday(d)

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[80px] sm:min-h-[100px] p-1 border rounded-md transition-colors",
                    isCurrentMonth
                      ? "bg-background"
                      : "bg-muted/30 text-muted-foreground",
                    isCurrentDay && "ring-2 ring-primary",
                    dayEvents.length > 0 && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (dayEvents.length === 1) {
                      openDetailDialog(dayEvents[0])
                    } else if (dayEvents.length > 1) {
                      setSelectedDate(d)
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
                      {format(d, "d")}
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

      {/* Upcoming Events List (Mobile-freundlich) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Nächste Events</h2>
        {events
          .filter((e) => e.event_date >= format(new Date(), "yyyy-MM-dd"))
          .slice(0, 5)
          .map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => openDetailDialog(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <EventTypeDot type={event.event_type} />
                      <span className="font-medium">{event.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(event.event_date), "d. MMM yyyy", {
                          locale: de,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateRange(event.start_time, event.end_time)}
                      </span>
                    </div>
                    {event.location_name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location_name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={EVENT_STATUS_VARIANTS[event.status]}>
                      {EVENT_STATUS_LABELS[event.status]}
                    </Badge>
                    {event.my_rsvp_status && (
                      <EventRsvpStatusBadge status={event.my_rsvp_status} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        {events.filter((e) => e.event_date >= format(new Date(), "yyyy-MM-dd"))
          .length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Keine anstehenden Events</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aktuell sind keine Veranstaltungen geplant.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Day Detail Sheet */}
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
                    <div className="ml-6 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedEvent.address}
                      </span>
                      <a
                        href={buildGoogleMapsUrl(selectedEvent.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Route
                      </a>
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

                {/* RSVP Section - nur wenn Mitglied eingeladen ist */}
                {selectedEvent.my_rsvp_status && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Deine Teilnahme:</p>
                    <EventRsvpButtons
                      eventId={selectedEvent.id}
                      currentStatus={selectedEvent.my_rsvp_status}
                      eventDate={selectedEvent.event_date}
                      eventStartTime={selectedEvent.start_time}
                      onStatusChange={(newStatus) =>
                        handleRsvpChange(selectedEvent.id, newStatus)
                      }
                    />
                  </div>
                )}
              </div>

              <ResponsiveDialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Schließen
                </Button>
                {selectedEvent.address && (
                  <Button asChild>
                    <a
                      href={buildGoogleMapsUrl(selectedEvent.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4 mr-1.5" />
                      Route planen
                    </a>
                  </Button>
                )}
              </ResponsiveDialogFooter>
            </>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
