import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Check, X, HelpCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/avatar'
import { EVENT_TYPE_LABELS, ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants'

export const metadata = {
  title: 'Termin Details | Vereins-Master',
}

export default async function EventDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  // Get event with attendance
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(*),
      team:teams(name),
      attendance(
        status,
        reason,
        responded_at,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .eq('club_id', profile.club_id)
    .single()

  if (error || !event) {
    notFound()
  }

  // Group attendance by status
  const attendanceByStatus = {
    confirmed: event.attendance?.filter(a => a.status === ATTENDANCE_STATUS.CONFIRMED) || [],
    declined: event.attendance?.filter(a => a.status === ATTENDANCE_STATUS.DECLINED) || [],
    pending: event.attendance?.filter(a => a.status === ATTENDANCE_STATUS.PENDING) || [],
  }

  const isPast = new Date(event.start_time) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/coach/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">
            {event.title || EVENT_TYPE_LABELS[event.type]}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPast ? 'secondary' : 'default'}>
              {EVENT_TYPE_LABELS[event.type]}
            </Badge>
            {isPast && <Badge variant="outline">Vergangen</Badge>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Event Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {new Date(event.start_time).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {new Date(event.start_time).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' - '}
                  {new Date(event.end_time).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{event.location.name}</p>
                  {event.location.address_link && (
                    <a
                      href={event.location.address_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Route anzeigen
                    </a>
                  )}
                </div>
              </div>
            )}

            {event.team && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{event.team.name}</p>
              </div>
            )}

            {event.description && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Anwesenheit
              <Badge variant="success" className="ml-2">
                {attendanceByStatus.confirmed.length}
              </Badge>
              <Badge variant="destructive">
                {attendanceByStatus.declined.length}
              </Badge>
              <Badge variant="secondary">
                {attendanceByStatus.pending.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Confirmed */}
            {attendanceByStatus.confirmed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-success flex items-center gap-2 mb-3">
                  <Check className="h-4 w-4" />
                  Zugesagt ({attendanceByStatus.confirmed.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {attendanceByStatus.confirmed.map((a) => (
                    <div
                      key={a.profile.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-success/10"
                    >
                      <UserAvatar user={a.profile} size="sm" />
                      <span className="text-sm truncate">{a.profile.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Declined */}
            {attendanceByStatus.declined.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-destructive flex items-center gap-2 mb-3">
                  <X className="h-4 w-4" />
                  Abgesagt ({attendanceByStatus.declined.length})
                </h3>
                <div className="space-y-2">
                  {attendanceByStatus.declined.map((a) => (
                    <div
                      key={a.profile.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10"
                    >
                      <UserAvatar user={a.profile} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{a.profile.full_name}</span>
                        {a.reason && (
                          <p className="text-xs text-muted-foreground truncate">
                            {a.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending */}
            {attendanceByStatus.pending.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                  <HelpCircle className="h-4 w-4" />
                  Ausstehend ({attendanceByStatus.pending.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {attendanceByStatus.pending.map((a) => (
                    <div
                      key={a.profile.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                    >
                      <UserAvatar user={a.profile} size="sm" />
                      <span className="text-sm truncate text-muted-foreground">
                        {a.profile.full_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.attendance?.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Noch keine Antworten
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
