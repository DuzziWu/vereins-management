import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Clock } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DashboardHeader from '@/components/dashboard-header'
import { WeekCalendar } from '@/components/dashboard/week-calendar'
import { NextEvent } from '@/components/dashboard/next-event'
import { USER_ROLE_LABELS, EVENT_TYPE_LABELS, ATTENDANCE_STATUS } from '@/lib/constants'
import { getInitials } from '@/lib/utils'

export const metadata = {
  title: 'Trainer Dashboard | Vereins-Master',
}

export default async function CoachDashboardPage() {
  const supabase = await createClient()

  // Get current user and verify coach role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, club:clubs(*)')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'player') {
    redirect('/player')
  }

  const clubId = profile.club_id

  // Calculate week range for calendar
  const today = new Date()
  const currentDay = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  // Fetch dashboard data
  const [
    { data: nextMatch },
    { data: nextTraining },
    { data: recentEvents },
    { data: upcomingEvents },
    { data: weekEvents },
    { data: nextEvent },
  ] = await Promise.all([
    // Next match
    supabase
      .from('events')
      .select('*, location:locations(*), matches(*)')
      .eq('club_id', clubId)
      .eq('type', 'matchday')
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(1)
      .single(),
    // Next training with attendance
    supabase
      .from('events')
      .select(`
        *,
        location:locations(*),
        attendance(status, reason, profile:profiles(id, full_name, avatar_url))
      `)
      .eq('club_id', clubId)
      .eq('type', 'training')
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(1)
      .single(),
    // Recent events for attendance stats
    supabase
      .from('events')
      .select('attendance(status)')
      .eq('club_id', clubId)
      .lt('start_time', new Date().toISOString())
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10),
    // Upcoming events
    supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(4),
    // Events for the current week
    supabase
      .from('events')
      .select('id, title, type, start_time, location:locations(name)')
      .eq('club_id', clubId)
      .gte('start_time', monday.toISOString())
      .lte('start_time', sunday.toISOString())
      .order('start_time'),
    // Next upcoming event with details
    supabase
      .from('events')
      .select('id, title, type, start_time, location:locations(name), matches(*), attendance(status)')
      .eq('club_id', clubId)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(1)
      .single(),
  ])

  // Count confirmed attendees for next event
  const nextEventConfirmedCount = nextEvent?.attendance?.filter(a => a.status === 'confirmed').length || 0

  // Calculate attendance rate for last 7 days
  let attendanceRate = 87 // Default placeholder
  let confirmedCount = 0
  let totalCount = 0
  if (recentEvents && recentEvents.length > 0) {
    recentEvents.forEach(e => {
      if (e.attendance) {
        totalCount += e.attendance.length
        confirmedCount += e.attendance.filter(a => a.status === ATTENDANCE_STATUS.CONFIRMED).length
      }
    })
    if (totalCount > 0) {
      attendanceRate = Math.round((confirmedCount / totalCount) * 100)
    }
  }

  // Calculate countdown to next match
  let matchCountdown = { value: 2, unit: 'Tage' }
  if (nextMatch) {
    const eventDate = new Date(nextMatch.start_time)
    const now = new Date()
    const diffMs = eventDate - now
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      matchCountdown = { value: diffDays, unit: diffDays === 1 ? 'Tag' : 'Tage' }
    } else if (diffHours > 0) {
      matchCountdown = { value: diffHours, unit: diffHours === 1 ? 'Stunde' : 'Stunden' }
    } else {
      matchCountdown = { value: 'Jetzt', unit: '' }
    }
  }

  // Process training attendance
  const trainingAttendance = nextTraining?.attendance || []
  const presentCount = trainingAttendance.filter(a => a.status === ATTENDANCE_STATUS.CONFIRMED).length
  const absentCount = trainingAttendance.filter(a => a.status === ATTENDANCE_STATUS.DECLINED).length
  const maybeCount = trainingAttendance.filter(a => a.status === ATTENDANCE_STATUS.PENDING).length

  // Format event date
  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    return `${days[date.getDay()]}, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Coach'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Trainer'}
        clubName={profile.club?.name || 'FC Digital'}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={profile.club?.logo_url}
      />

      <main className="container mx-auto px-6 py-12">
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-4">Trainings-Hub</h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-24 bg-primary rounded-full" />
            <p className="text-muted-foreground font-medium">Mannschaft 1. Herren</p>
          </div>
        </div>

        {/* Next Event - Full Width */}
        <div className="mb-8">
          <NextEvent
            event={nextEvent}
            linkPrefix="/coach"
            attendanceCount={nextEventConfirmedCount}
          />
        </div>

        {/* Week Calendar */}
        <div className="mb-12">
          <WeekCalendar events={weekEvents || []} linkPrefix="/coach" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card border-2 border-border hover-lift-sport md:col-span-2 energy-card cut-corner">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Nächstes Spiel</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Countdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-light tracking-tight text-foreground">
                    {nextMatch ? (
                      nextMatch.matches?.[0]?.opponent
                        ? `${profile.club?.name} vs. ${nextMatch.matches[0].opponent}`
                        : nextMatch.title || 'Spieltag'
                    ) : (
                      'Kein Spiel geplant'
                    )}
                  </h3>
                  {nextMatch && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="uppercase tracking-wider text-xs">
                          {nextMatch.matches?.[0]?.is_home ? 'Heimspiel' : 'Auswärtsspiel'}
                          {nextMatch.location && `, ${nextMatch.location.name}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="uppercase tracking-wider text-xs">
                          {formatEventDate(nextMatch.start_time)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center p-8 border border-border">
                  <span className="text-6xl font-light tabular-nums text-foreground">{matchCountdown.value}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{matchCountdown.unit}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground flex-1 h-12 text-sm uppercase tracking-wider">
                  Aufstellung
                </Button>
                <Button
                  variant="outline"
                  className="border-border hover:border-primary hover:bg-card flex-1 h-12 text-sm uppercase tracking-wider bg-transparent"
                >
                  Zusagen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Training Participation */}
          <Card className="bg-card border-2 border-border hover-lift-sport energy-card cut-corner">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Beteiligung</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Letzte 7 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <span className="text-5xl font-light tabular-nums text-foreground block">{attendanceRate}%</span>
                <Progress value={attendanceRate} className="h-1" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {confirmedCount} von {totalCount || 23} Spielern
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-border lg:col-span-2 energy-card cut-corner">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">
                Nächstes Training — {nextTraining ? formatEventDate(nextTraining.start_time) : 'Nicht geplant'}
              </CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Live-Status der Spieler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-lime-400" />
                  <span className="text-xs uppercase tracking-wider text-foreground font-medium">{presentCount} Zusagen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs uppercase tracking-wider text-foreground font-medium">{absentCount} Absagen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-xs uppercase tracking-wider text-foreground font-medium">{maybeCount} Unsicher</span>
                </div>
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {trainingAttendance.length > 0 ? (
                  trainingAttendance.map((attendance, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-4 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarImage src={attendance.profile?.avatar_url} />
                          <AvatarFallback className="bg-card text-foreground text-xs">
                            {getInitials(attendance.profile?.full_name || 'NN')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-normal">{attendance.profile?.full_name || 'Unbekannt'}</p>
                          {attendance.reason && (
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{attendance.reason}</p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          attendance.status === ATTENDANCE_STATUS.CONFIRMED
                            ? 'bg-lime-400 shadow-lg shadow-lime-400/50'
                            : attendance.status === ATTENDANCE_STATUS.DECLINED
                              ? 'bg-red-500 shadow-lg shadow-red-500/50'
                              : 'bg-orange-400 shadow-lg shadow-orange-400/50'
                        }`}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine Rückmeldungen</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-card border-2 border-border hover-lift-sport energy-card cut-corner">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Termine</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Anstehende Events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => (
                  <Link
                    key={idx}
                    href={`/coach/events/${event.id}`}
                    className="flex items-center justify-between py-4 border-b border-border last:border-0 hover:bg-card/50 transition-colors -mx-2 px-2 rounded"
                  >
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-normal">
                        {event.title || EVENT_TYPE_LABELS[event.type]}
                      </p>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">
                        {formatEventDate(event.start_time)}
                      </p>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">Keine Termine</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
