"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, RefreshCw, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  type RsvpStatus,
  RSVP_STATUS_COLORS,
  EVENT_TYPE_LABELS,
  type EventType,
} from "@/lib/validations/events"

interface MyEvent {
  id: string
  title: string
  event_type: EventType
  event_date: string
  start_time: string
  end_time: string | null
  location_name: string | null
  rsvp_status: RsvpStatus
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

function formatTime(start: string, end: string | null): string {
  const startFormatted = start.slice(0, 5)
  if (!end) return startFormatted
  return `${startFormatted}–${end.slice(0, 5)}`
}

function EventsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MyUpcomingEvents() {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingEventId, setSubmittingEventId] = useState<string | null>(null)

  async function loadEvents() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/events/my-events?limit=5")
      if (!response.ok) {
        throw new Error("Fehler beim Laden")
      }
      const data = await response.json()
      setEvents(data.events || [])
    } catch {
      setError("Events konnten nicht geladen werden")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  async function handleRsvp(eventId: string, newStatus: "zugesagt" | "abgesagt") {
    setSubmittingEventId(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, rsvp_status: newStatus } : e
        )
      )

      toast.success(
        newStatus === "zugesagt" ? "Teilnahme bestätigt" : "Absage gespeichert"
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setSubmittingEventId(null)
    }
  }

  if (isLoading) return <EventsSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Meine nächsten Events
        </CardTitle>
        <CardDescription>Events zu denen du eingeladen bist</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadEvents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine kommenden Events
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => {
              const isSubmitting = submittingEventId === event.id
              const showQuickActions = event.rsvp_status === "ausstehend"

              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{event.title}</p>
                      {showQuickActions ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleRsvp(event.id, "zugesagt")}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => handleRsvp(event.id, "abgesagt")}
                            disabled={isSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          className={cn(
                            "border shrink-0",
                            RSVP_STATUS_COLORS[event.rsvp_status]
                          )}
                        >
                          {event.rsvp_status === "zugesagt"
                            ? "Zugesagt"
                            : "Abgesagt"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.event_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.start_time, event.end_time)}
                      </span>
                      {event.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location_name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {events.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/member/events">Alle Events anzeigen</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
