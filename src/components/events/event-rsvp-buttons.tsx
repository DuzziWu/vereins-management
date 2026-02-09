"use client"

import * as React from "react"
import { useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  type RsvpStatus,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_COLORS,
} from "@/lib/validations/events"

interface EventRsvpButtonsProps {
  eventId: string
  currentStatus: RsvpStatus
  eventDate: string
  eventStartTime: string
  onStatusChange?: (newStatus: RsvpStatus) => void
  className?: string
  variant?: "default" | "compact"
}

export function EventRsvpButtons({
  eventId,
  currentStatus,
  eventDate,
  eventStartTime,
  onStatusChange,
  className,
  variant = "default",
}: EventRsvpButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<RsvpStatus>(currentStatus)

  // Check if event has already started
  const eventDateTime = new Date(`${eventDate}T${eventStartTime}`)
  const hasStarted = eventDateTime <= new Date()

  async function handleRsvp(newStatus: "zugesagt" | "abgesagt") {
    if (hasStarted) {
      toast.error("Das Event hat bereits begonnen")
      return
    }

    if (newStatus === status) {
      return // No change needed
    }

    setIsSubmitting(true)
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

      setStatus(newStatus)
      onStatusChange?.(newStatus)
      toast.success(
        newStatus === "zugesagt"
          ? "Teilnahme bestätigt"
          : "Absage gespeichert"
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Event has started - show read-only status
  if (hasStarted) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className={cn("border", RSVP_STATUS_COLORS[status])}>
          {RSVP_STATUS_LABELS[status]}
        </Badge>
        <span className="text-xs text-muted-foreground">(Event bereits gestartet)</span>
      </div>
    )
  }

  // Compact variant (for lists/cards)
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {status === "ausstehend" ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => handleRsvp("zugesagt")}
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
              onClick={() => handleRsvp("abgesagt")}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Badge className={cn("border", RSVP_STATUS_COLORS[status])}>
            {RSVP_STATUS_LABELS[status]}
          </Badge>
        )}
      </div>
    )
  }

  // Default variant (for detail views)
  return (
    <div className={cn("space-y-3", className)}>
      {status !== "ausstehend" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Aktueller Status:</span>
          <Badge className={cn("border", RSVP_STATUS_COLORS[status])}>
            {RSVP_STATUS_LABELS[status]}
          </Badge>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={status === "zugesagt" ? "default" : "outline"}
          className={cn(
            status === "zugesagt" && "bg-green-600 hover:bg-green-700"
          )}
          onClick={() => handleRsvp("zugesagt")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1.5" />
          )}
          Zusagen
        </Button>
        <Button
          variant={status === "abgesagt" ? "secondary" : "outline"}
          onClick={() => handleRsvp("abgesagt")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1.5" />
          )}
          Absagen
        </Button>
      </div>

      {status !== "ausstehend" && (
        <p className="text-xs text-muted-foreground">
          Du kannst deine Antwort bis zum Eventbeginn ändern.
        </p>
      )}
    </div>
  )
}

// Status Badge Component for use in lists
export function EventRsvpStatusBadge({
  status,
  className,
}: {
  status: RsvpStatus
  className?: string
}) {
  return (
    <Badge className={cn("border", RSVP_STATUS_COLORS[status], className)}>
      {RSVP_STATUS_LABELS[status]}
    </Badge>
  )
}
