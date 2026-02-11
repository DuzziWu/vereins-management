"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  Flag,
  ChevronDown,
  Pencil,
  Clock3,
  Truck,
  Paperclip,
  Upload,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import {
  type EventWithDetails,
  type EventScheduleEntry,
  type EventAttachment,
  type EventStatus,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
} from "@/lib/validations/events"

// PROJ-23: Erweitertes Event mit dynamischen Event-Typ-Infos
interface EventTypeInfo {
  id: string
  name: string
  color: string
  icon: string | null
}

interface EventWithDynamicType extends EventWithDetails {
  event_type_id?: string
  event_type_info?: EventTypeInfo
}

import { EventScheduleTimeline } from "./event-schedule-timeline"
import { EventScheduleEditor } from "./event-schedule-editor"
import { EventLogisticsEditor, EventLogisticsDisplay } from "./event-logistics-editor"
import { EventAttachmentList, EventAttachmentUpload } from "./event-attachments"
import { EventMapsLink } from "./event-maps-link"
import { EventRsvpButtons } from "./event-rsvp-buttons"

// Helper: Format time range
function formatTimeRange(start: string, end: string | null): string {
  const formatTime = (t: string) => t.slice(0, 5)
  if (!end) return `${formatTime(start)} Uhr`
  return `${formatTime(start)} – ${formatTime(end)} Uhr`
}

// PROJ-23: Event Type Dot mit dynamischer Farbe
function EventTypeDot({ color, name }: { color: string; name?: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
      title={name}
    />
  )
}

interface EventDetailViewProps {
  eventId: string
  canEdit?: boolean
  currentUserId?: string
  onRefresh?: () => void
  className?: string
}

export function EventDetailView({
  eventId,
  canEdit = false,
  currentUserId,
  onRefresh,
  className,
}: EventDetailViewProps) {
  const [event, setEvent] = useState<EventWithDynamicType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false)
  const [logisticsEditorOpen, setLogisticsEditorOpen] = useState(false)

  // Collapsible states
  const [scheduleOpen, setScheduleOpen] = useState(true)
  const [logisticsOpen, setLogisticsOpen] = useState(true)
  const [attachmentsOpen, setAttachmentsOpen] = useState(true)

  // Fetch event details (including RSVP status for current user)
  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}?include=schedule,attachments,rsvp`)
      if (!response.ok) {
        throw new Error("Event nicht gefunden")
      }
      const data = await response.json()
      setEvent(data.event)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Laden")
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  React.useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleRefresh = useCallback(() => {
    fetchEvent()
    onRefresh?.()
  }, [fetchEvent, onRefresh])

  const handleAttachmentDelete = useCallback(
    (deletedId: string) => {
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments?.filter((a) => a.id !== deletedId),
            }
          : null
      )
    },
    []
  )

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        Event nicht gefunden
      </div>
    )
  }

  const hasSchedule = event.schedule && event.schedule.length > 0
  const hasLogistics = !!event.logistics_info
  const hasAttachments = event.attachments && event.attachments.length > 0

  // PROJ-23: Event-Typ-Info mit Fallback
  const eventTypeInfo = event.event_type_info || {
    name: "Event",
    color: "#6B7280",
    icon: null,
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EventTypeDot color={eventTypeInfo.color} name={eventTypeInfo.name} />
          <Badge
            variant="outline"
            className="border-2"
            style={{ borderColor: eventTypeInfo.color }}
          >
            {eventTypeInfo.icon && <span className="mr-1">{eventTypeInfo.icon}</span>}
            {eventTypeInfo.name}
          </Badge>
          <Badge variant={EVENT_STATUS_VARIANTS[event.status]}>
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-muted-foreground">
          {format(parseISO(event.event_date), "EEEE, d. MMMM yyyy", { locale: de })}
        </p>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(parseISO(event.event_date), "d. MMMM yyyy", { locale: de })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {formatTimeRange(event.start_time, event.end_time)}
            </span>
          </div>

          {/* Location */}
          {(event.location_name || event.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                {event.location_name && (
                  <span className="text-sm font-medium block">
                    {event.location_name}
                  </span>
                )}
                {event.address && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {event.address}
                    </span>
                    <EventMapsLink address={event.address} variant="icon" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meeting Point */}
          {event.meeting_point && (
            <div className="flex items-center gap-3">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Treffpunkt:</span>{" "}
                {event.meeting_point}
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-3 border-t">
              <p className="text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Section */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <Card>
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    Ablaufplan
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        scheduleOpen && "rotate-180"
                      )}
                    />
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScheduleEditorOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-4 pt-3">
              {hasSchedule ? (
                <EventScheduleTimeline
                  schedule={event.schedule!}
                  eventDate={event.event_date}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Noch kein Ablaufplan vorhanden.
                  {canEdit && " Klicke auf 'Bearbeiten' um einen zu erstellen."}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Logistics Section */}
      <Collapsible open={logisticsOpen} onOpenChange={setLogisticsOpen}>
        <Card>
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Logistik & Anfahrt
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        logisticsOpen && "rotate-180"
                      )}
                    />
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogisticsEditorOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-4 pt-3">
              {hasLogistics ? (
                <EventLogisticsDisplay logistics={event.logistics_info} />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Keine Logistik-Informationen vorhanden.
                  {canEdit && " Klicke auf 'Bearbeiten' um welche hinzuzufügen."}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Attachments Section */}
      <Collapsible open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
        <Card>
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anhänge
                    {hasAttachments && (
                      <Badge variant="secondary" className="ml-1">
                        {event.attachments!.length}
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        attachmentsOpen && "rotate-180"
                      )}
                    />
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-4 pt-3 space-y-4">
              {hasAttachments && (
                <EventAttachmentList
                  attachments={event.attachments!}
                  canDelete={canEdit}
                  currentUserId={currentUserId}
                  onDelete={handleAttachmentDelete}
                />
              )}

              {!hasAttachments && !canEdit && (
                <p className="text-sm text-muted-foreground italic">
                  Keine Anhänge vorhanden.
                </p>
              )}

              {canEdit && (
                <EventAttachmentUpload
                  eventId={eventId}
                  currentCount={event.attachments?.length || 0}
                  onUploadComplete={handleRefresh}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* RSVP Section - Only show if user is invited */}
      {event.is_invited && event.my_rsvp_status && (
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-base">Deine Teilnahme</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <EventRsvpButtons
              eventId={eventId}
              currentStatus={event.my_rsvp_status}
              eventDate={event.event_date}
              eventStartTime={event.start_time}
              onStatusChange={(newStatus) => {
                setEvent((prev) =>
                  prev ? { ...prev, my_rsvp_status: newStatus } : null
                )
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Editors */}
      <EventScheduleEditor
        open={scheduleEditorOpen}
        onOpenChange={setScheduleEditorOpen}
        eventId={eventId}
        eventTitle={event.title}
        initialSchedule={event.schedule || []}
        onSuccess={handleRefresh}
      />

      <EventLogisticsEditor
        open={logisticsEditorOpen}
        onOpenChange={setLogisticsEditorOpen}
        eventId={eventId}
        eventTitle={event.title}
        initialLogistics={event.logistics_info}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
