"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventScheduleEntry } from "@/lib/validations/events"

interface EventScheduleTimelineProps {
  schedule: EventScheduleEntry[]
  eventDate: string
  className?: string
}

export function EventScheduleTimeline({
  schedule,
  eventDate,
  className,
}: EventScheduleTimelineProps) {
  if (!schedule || schedule.length === 0) {
    return null
  }

  // Sort by time
  const sortedSchedule = [...schedule].sort((a, b) => {
    return a.time.localeCompare(b.time)
  })

  // Check if event is today to highlight current/next item
  const isToday = eventDate === new Date().toISOString().split("T")[0]
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  // Find current or next item index
  let activeIndex = -1
  if (isToday) {
    for (let i = 0; i < sortedSchedule.length; i++) {
      const itemTime = sortedSchedule[i].time.slice(0, 5)
      if (itemTime >= currentTime) {
        activeIndex = i
        break
      }
    }
    // If all items are in the past, highlight the last one
    if (activeIndex === -1 && sortedSchedule.length > 0) {
      activeIndex = sortedSchedule.length - 1
    }
  }

  // Format time for display (handle HH:MM:SS and HH:MM)
  const formatTime = (time: string) => {
    const parts = time.split(":")
    if (parts[0] === "00" && parts[1] === "00") {
      return "tbd"
    }
    return `${parts[0]}:${parts[1]}`
  }

  return (
    <div className={cn("space-y-0", className)}>
      {/* Desktop Timeline */}
      <div className="hidden sm:block">
        {sortedSchedule.map((item, index) => {
          const isActive = index === activeIndex
          const isPast = isToday && index < activeIndex

          return (
            <div key={item.id} className="flex items-start gap-4">
              {/* Timeline Connector */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-colors",
                    isActive
                      ? "bg-primary border-primary"
                      : isPast
                      ? "bg-muted-foreground/30 border-muted-foreground/30"
                      : "bg-background border-muted-foreground/50"
                  )}
                />
                {index < sortedSchedule.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 my-1",
                      isPast ? "bg-muted-foreground/30" : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "flex-1 pb-4 transition-opacity",
                  isPast && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      isActive && "text-primary"
                    )}
                  >
                    {formatTime(item.time)}
                  </span>
                  {isActive && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Aktuell
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm mt-0.5",
                    isActive ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Timeline */}
      <div className="sm:hidden space-y-2">
        {sortedSchedule.map((item, index) => {
          const isActive = index === activeIndex
          const isPast = isToday && index < activeIndex

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                isActive
                  ? "border-primary bg-primary/5"
                  : isPast
                  ? "border-muted bg-muted/30 opacity-60"
                  : "border-border"
              )}
            >
              <Clock
                className={cn(
                  "h-4 w-4 mt-0.5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      isActive && "text-primary"
                    )}
                  >
                    {formatTime(item.time)}
                  </span>
                  {isActive && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Aktuell
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 break-words">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
