'use client'

import Link from 'next/link'
import { Calendar, MapPin, Clock, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS } from '@/lib/constants'

/**
 * Large next event widget
 * @param {Object} props
 * @param {Object} props.event - The next upcoming event
 * @param {string} props.linkPrefix - URL prefix for event links
 * @param {number} props.attendanceCount - Number of confirmed attendees
 * @param {boolean} props.showRsvpButtons - Whether to show RSVP buttons
 * @param {Function} props.onConfirm - Callback for confirm action
 * @param {Function} props.onDecline - Callback for decline action
 */
export function NextEvent({
  event,
  linkPrefix = '',
  attendanceCount = 0,
  showRsvpButtons = false,
  onConfirm,
  onDecline
}) {
  if (!event) {
    return (
      <Card className="bg-card border-2 border-border energy-card cut-corner">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">Keine anstehenden Termine</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Es wurden noch keine Events geplant</p>
        </CardContent>
      </Card>
    )
  }

  const eventDate = new Date(event.start_time)
  const now = new Date()
  const diffMs = eventDate - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  // Countdown display
  let countdownValue, countdownUnit
  if (diffDays > 0) {
    countdownValue = diffDays
    countdownUnit = diffDays === 1 ? 'Tag' : 'Tage'
  } else if (diffHours > 0) {
    countdownValue = diffHours
    countdownUnit = diffHours === 1 ? 'Stunde' : 'Stunden'
  } else if (diffMinutes > 0) {
    countdownValue = diffMinutes
    countdownUnit = diffMinutes === 1 ? 'Minute' : 'Minuten'
  } else {
    countdownValue = 'Jetzt'
    countdownUnit = ''
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'training':
        return 'bg-primary text-primary-foreground'
      case 'matchday':
        return 'bg-red-500 text-white'
      case 'meeting':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getEventTypeBorder = (type) => {
    switch (type) {
      case 'training':
        return 'border-l-primary'
      case 'matchday':
        return 'border-l-red-500'
      case 'meeting':
        return 'border-l-blue-500'
      default:
        return 'border-l-muted'
    }
  }

  return (
    <Card className={`bg-card border-2 border-border border-l-4 ${getEventTypeBorder(event.type)} cut-corner overflow-hidden`}>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-start justify-between mb-4">
              <Badge className={`${getEventTypeColor(event.type)} uppercase tracking-wider text-xs`}>
                {EVENT_TYPE_LABELS[event.type] || event.type}
              </Badge>
              {attendanceCount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{attendanceCount} Zusagen</span>
                </div>
              )}
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
              {event.title || EVENT_TYPE_LABELS[event.type]}
            </h2>

            {/* Match specific info */}
            {event.type === 'matchday' && event.matches?.[0] && (
              <div className="mb-4">
                <p className="text-xl text-muted-foreground">
                  vs. <span className="text-foreground font-semibold">{event.matches[0].opponent}</span>
                </p>
                <Badge variant="outline" className="mt-2 border-border">
                  {event.matches[0].is_home ? 'Heimspiel' : 'Auswärtsspiel'}
                </Badge>
              </div>
            )}

            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-foreground">
                  {eventDate.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-foreground">
                  {eventDate.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} Uhr
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-foreground">{event.location.name}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {showRsvpButtons ? (
                <>
                  <Button
                    onClick={onConfirm}
                    className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground h-12 px-6 text-sm uppercase tracking-wider"
                  >
                    Zusagen
                  </Button>
                  <Button
                    onClick={onDecline}
                    variant="outline"
                    className="border-border hover:border-muted-foreground hover:bg-card h-12 px-6 text-sm uppercase tracking-wider bg-transparent"
                  >
                    Absagen
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground h-12 px-6 text-sm uppercase tracking-wider"
                >
                  <Link href={`${linkPrefix}/events/${event.id}`}>
                    Details anzeigen
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Countdown sidebar */}
          <div className="lg:w-48 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6 lg:p-8 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Countdown</p>
            <span className="text-6xl lg:text-7xl font-light tabular-nums text-foreground">
              {countdownValue}
            </span>
            {countdownUnit && (
              <span className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
                {countdownUnit}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
