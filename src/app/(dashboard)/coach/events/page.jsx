import Link from 'next/link'
import { Calendar, Plus, MapPin, Users } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EVENT_TYPE_LABELS, ATTENDANCE_STATUS } from '@/lib/constants'

export const metadata = {
  title: 'Termine | ClubGrid',
}

export default async function CoachEventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(name, address_link),
      team:teams(name),
      attendance(status)
    `)
    .eq('club_id', profile.club_id)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(20)

  // Get past events (last 10)
  const { data: pastEvents } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(name),
      team:teams(name),
      attendance(status)
    `)
    .eq('club_id', profile.club_id)
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(10)

  function getAttendanceStats(attendance) {
    if (!attendance || attendance.length === 0) return null
    const confirmed = attendance.filter(a => a.status === ATTENDANCE_STATUS.CONFIRMED).length
    const declined = attendance.filter(a => a.status === ATTENDANCE_STATUS.DECLINED).length
    const pending = attendance.filter(a => a.status === ATTENDANCE_STATUS.PENDING).length
    return { confirmed, declined, pending, total: attendance.length }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Termine</h1>
          <p className="text-muted-foreground">
            Verwalte Trainings, Spieltage und Veranstaltungen
          </p>
        </div>
        <Button asChild>
          <Link href="/coach/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Termin
          </Link>
        </Button>
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
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const stats = getAttendanceStats(event.attendance)
                return (
                  <Link
                    key={event.id}
                    href={`/coach/events/${event.id}`}
                    className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {event.title || EVENT_TYPE_LABELS[event.type]}
                          </h3>
                          <Badge variant="secondary">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_time).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location.name}
                          </p>
                        )}
                      </div>
                      {stats && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-success">{stats.confirmed}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-destructive">{stats.declined}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-muted-foreground">{stats.pending}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Keine kommenden Termine</p>
              <Button asChild>
                <Link href="/coach/events/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ersten Termin erstellen
                </Link>
              </Button>
            </div>
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
              {pastEvents.map((event) => {
                const stats = getAttendanceStats(event.attendance)
                return (
                  <Link
                    key={event.id}
                    href={`/coach/events/${event.id}`}
                    className="block p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
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
                      {stats && (
                        <Badge variant={stats.confirmed >= stats.total * 0.5 ? 'success' : 'secondary'}>
                          {stats.confirmed}/{stats.total}
                        </Badge>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
