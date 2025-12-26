'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

/**
 * Week calendar component showing events for the current week
 * @param {Object} props
 * @param {Array} props.events - Array of events with start_time, type, title
 * @param {string} props.linkPrefix - URL prefix for event links (e.g., '/admin', '/coach', '/player')
 */
export function WeekCalendar({ events = [], linkPrefix = '' }) {
  // Generate days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    // Adjust to get Monday (German week starts on Monday)
    const monday = new Date(today)
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
    monday.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      days.push(date)
    }
    return days
  }, [])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = {}
    weekDays.forEach(day => {
      const dateKey = day.toISOString().split('T')[0]
      grouped[dateKey] = []
    })

    events.forEach(event => {
      const eventDate = new Date(event.start_time)
      const dateKey = eventDate.toISOString().split('T')[0]
      if (grouped[dateKey]) {
        grouped[dateKey].push(event)
      }
    })

    return grouped
  }, [events, weekDays])

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getEventColor = (type) => {
    switch (type) {
      case 'training':
        return 'bg-primary/20 border-primary text-primary'
      case 'matchday':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'meeting':
        return 'bg-blue-500/20 border-blue-500 text-blue-400'
      default:
        return 'bg-muted border-border text-muted-foreground'
    }
  }

  return (
    <Card className="bg-card border-2 border-border energy-card">
      <CardHeader>
        <CardTitle className="text-foreground text-lg font-normal">Wochenübersicht</CardTitle>
        <CardDescription className="uppercase tracking-wider text-xs">
          {weekDays[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {weekDays[6].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((name, idx) => (
            <div
              key={name}
              className={`text-center text-xs uppercase tracking-wider py-2 ${
                weekDays[idx].getTime() === today.getTime()
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              {name}
            </div>
          ))}

          {/* Day cells */}
          {weekDays.map((day, idx) => {
            const dateKey = day.toISOString().split('T')[0]
            const dayEvents = eventsByDay[dateKey] || []
            const isToday = day.getTime() === today.getTime()
            const isPast = day < today

            return (
              <div
                key={dateKey}
                className={`min-h-[80px] p-1 border rounded-lg transition-all ${
                  isToday
                    ? 'border-primary bg-primary/5'
                    : isPast
                      ? 'border-border/50 bg-muted/20'
                      : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className={`text-center text-sm mb-1 ${
                    isToday
                      ? 'text-primary font-bold'
                      : isPast
                        ? 'text-muted-foreground/50'
                        : 'text-foreground'
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIdx) => (
                    <Link
                      key={event.id || eventIdx}
                      href={`${linkPrefix}/events/${event.id}`}
                      className={`block text-[10px] px-1 py-0.5 rounded border truncate ${getEventColor(event.type)} hover:opacity-80 transition-opacity`}
                    >
                      {event.title || EVENT_TYPE_LABELS[event.type]}
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary" />
            <span className="text-xs text-muted-foreground">Training</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
            <span className="text-xs text-muted-foreground">Spiel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500" />
            <span className="text-xs text-muted-foreground">Meeting</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
