import Link from 'next/link'
import { Calendar, MapPin, Clock, Check, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EVENT_TYPE_LABELS, ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { updateAttendance } from '@/actions/events'

export const metadata = {
  title: 'Meine Termine | Vereins-Master',
}

export default async function PlayerEventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  // Get upcoming events with user's attendance
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(name, address_link),
      attendance!inner(status, reason)
    `)
    .eq('club_id', profile.club_id)
    .eq('attendance.profile_id', user.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(20)

  // Also get events without attendance record (pending)
  const { data: eventsWithoutResponse } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(name, address_link)
    `)
    .eq('club_id', profile.club_id)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(20)

  // Combine and deduplicate, marking events without attendance as pending
  const eventIds = new Set(upcomingEvents?.map(e => e.id) || [])
  const pendingEvents = eventsWithoutResponse
    ?.filter(e => !eventIds.has(e.id))
    .map(e => ({ ...e, attendance: [{ status: 'pending' }] })) || []

  const allEvents = [...pendingEvents, ...(upcomingEvents || [])].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  )

  // Get past events
  const { data: pastEvents } = await supabase
    .from('events')
    .select(`
      *,
      attendance!inner(status)
    `)
    .eq('club_id', profile.club_id)
    .eq('attendance.profile_id', user.id)
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Meine Termine</h1>
        <p className="text-muted-foreground">
          Deine anstehenden Trainings und Spiele
        </p>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kommende Termine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allEvents.length > 0 ? (
            <div className="space-y-4">
              {allEvents.map((event) => {
                const attendance = event.attendance?.[0]
                const isPending = attendance?.status === ATTENDANCE_STATUS.PENDING

                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${
                      isPending ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {event.title || EVENT_TYPE_LABELS[event.type]}
                          </h3>
                          <Badge variant="secondary">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                          {!isPending && (
                            <Badge
                              variant={
                                attendance?.status === ATTENDANCE_STATUS.CONFIRMED
                                  ? 'success'
                                  : 'destructive'
                              }
                            >
                              {ATTENDANCE_STATUS_LABELS[attendance?.status]}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.start_time).toLocaleDateString('de-DE', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(event.start_time).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location.name}
                              {event.location.address_link && (
                                <a
                                  href={event.location.address_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline ml-1"
                                >
                                  Route
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* RSVP Buttons */}
                      <div className="flex gap-2">
                        <form action={updateAttendance}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="confirmed" />
                          <Button
                            type="submit"
                            size="sm"
                            variant={attendance?.status === ATTENDANCE_STATUS.CONFIRMED ? 'success' : 'outline'}
                            className="gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Zusagen
                          </Button>
                        </form>
                        <form action={updateAttendance}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="status" value="declined" />
                          <Button
                            type="submit"
                            size="sm"
                            variant={attendance?.status === ATTENDANCE_STATUS.DECLINED ? 'destructive' : 'outline'}
                            className="gap-1"
                          >
                            <X className="h-4 w-4" />
                            Absagen
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Keine anstehenden Termine
            </p>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      {pastEvents && pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Vergangene Termine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">
                      {event.title || EVENT_TYPE_LABELS[event.type]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_time).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.attendance?.[0]?.status === ATTENDANCE_STATUS.CONFIRMED
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {ATTENDANCE_STATUS_LABELS[event.attendance?.[0]?.status] || 'Keine Antwort'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
