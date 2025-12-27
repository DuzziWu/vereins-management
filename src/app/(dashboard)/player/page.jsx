import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import DashboardHeader from '@/components/dashboard-header'
import { WeekCalendar } from '@/components/dashboard/week-calendar'
import { NextEvent } from '@/components/dashboard/next-event'
import { USER_ROLE_LABELS, EVENT_TYPE_LABELS, ATTENDANCE_STATUS } from '@/lib/constants'
import { updateAttendance } from '@/actions/events'

export const metadata = {
  title: 'Mein Dashboard | Vereins-Master',
}

export default async function PlayerDashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, club:clubs(*)')
    .eq('id', user.id)
    .single()

  const clubId = profile.club_id
  const firstName = profile.full_name?.split(' ')[0] || 'Spieler'

  // Calculate week range for calendar
  const today = new Date()
  const currentDay = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  // Fetch week events for calendar
  const { data: weekEvents } = await supabase
    .from('events')
    .select('id, title, type, start_time, location:locations(name)')
    .eq('club_id', clubId)
    .gte('start_time', monday.toISOString())
    .lte('start_time', sunday.toISOString())
    .order('start_time')

  // Fetch next event with details for NextEvent component
  const { data: nextEvent } = await supabase
    .from('events')
    .select('id, title, type, start_time, location:locations(name), matches(*), attendance(status)')
    .eq('club_id', clubId)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(1)
    .single()

  // Count confirmed attendees for next event
  const nextEventConfirmedCount = nextEvent?.attendance?.filter(a => a.status === 'confirmed').length || 0

  // Fetch upcoming events with user's attendance - single optimized query
  // Using inner subquery to get user-specific attendance
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      *,
      location:locations(name),
      attendance!left(status, reason, profile_id)
    `)
    .eq('club_id', clubId)
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(10)

  // Filter attendance to only include current user's record
  const eventsWithUserAttendance = upcomingEvents?.map(event => ({
    ...event,
    attendance: event.attendance?.filter(a => a.profile_id === user.id) || []
  })) || []

  // Get next event that needs response
  const nextPendingEvent = eventsWithUserAttendance.find(
    e => !e.attendance?.[0]?.status || e.attendance?.[0]?.status === ATTENDANCE_STATUS.PENDING
  )

  // Calculate attendance stats (mock data for MVP)
  const attendanceRate = 92
  const attendedCount = 23
  const totalEvents = 25

  // Mock skill arena data (would come from skill_progress table when module is active)
  const skillLevel = 'Bronze II'
  const skillXP = 1240
  const skillXPMax = 2000
  const skillLevelNum = 7
  const trainingsCount = 24
  const matchesCount = 12
  const challengesCount = 8

  // Mock challenges data
  const challenges = [
    { title: 'Laufe 10km', progress: 75, reward: '+50 XP', completed: false },
    { title: '5 Trainings besuchen', progress: 100, reward: '+75 XP', completed: true },
    { title: 'Triff die Latte', progress: 0, reward: '+100 XP', completed: false },
  ]

  // Get first 4 events for the list
  const allUpcomingEvents = eventsWithUserAttendance.slice(0, 4)

  // Count how many confirmed
  const confirmedCount = eventsWithUserAttendance
    .filter(e => e.attendance?.[0]?.status === ATTENDANCE_STATUS.CONFIRMED)
    .length

  // Format event date
  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Spieler'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Spieler'}
        clubName={profile.club?.name || 'FC Digital'}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={profile.club?.logo_url}
      />

      <main className="container mx-auto px-6 py-12">
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-4">Hey {firstName}</h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-24 bg-primary rounded-full" />
            <p className="text-muted-foreground font-medium">Bereit für das nächste Training?</p>
          </div>
        </div>

        {/* Next Event - Full Width */}
        <div className="mb-8">
          <NextEvent
            event={nextEvent}
            linkPrefix="/player"
            attendanceCount={nextEventConfirmedCount}
          />
        </div>

        {/* Week Calendar */}
        <div className="mb-12">
          <WeekCalendar events={weekEvents || []} linkPrefix="/player" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card border-2 border-border hover-lift-sport md:col-span-2 energy-card">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Skill Arena</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Dein Fortschritt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Aktuelles Level</p>
                  <span className="text-4xl font-light tracking-tight text-foreground block">{skillLevel}</span>
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                    Level {skillLevelNum}
                  </Badge>
                </div>
                <div className="p-4 border-2 border-border">
                  <Star className="h-8 w-8 text-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider">
                  <span className="text-muted-foreground">Fortschritt</span>
                  <span className="text-foreground tabular-nums">{skillXP.toLocaleString()} / {skillXPMax.toLocaleString()} XP</span>
                </div>
                <Progress value={(skillXP / skillXPMax) * 100} className="h-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 border border-border text-center">
                  <p className="text-3xl font-light tabular-nums text-foreground">{trainingsCount}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Trainings</p>
                </div>
                <div className="p-4 border border-border text-center">
                  <p className="text-3xl font-light tabular-nums text-foreground">{matchesCount}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Spiele</p>
                </div>
                <div className="p-4 border border-border text-center">
                  <p className="text-3xl font-light tabular-nums text-foreground">{challengesCount}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card className="bg-card border-2 border-border hover-lift-sport energy-card">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Anwesenheit</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Letzter Monat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <span className="text-5xl font-light tabular-nums text-foreground block">{attendanceRate}%</span>
                <Progress value={attendanceRate} className="h-1" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{attendedCount} von {totalEvents} Terminen</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="bg-card border-2 border-border hover-lift-sport energy-card">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Challenges</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Diese Woche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <span className="text-5xl font-light tabular-nums text-foreground block">
                  {challenges.filter(c => c.completed).length}/{challenges.length}
                </span>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">+150 XP bei Abschluss</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-border lg:col-span-2 energy-card">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Meine Termine</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Nächste Events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {allUpcomingEvents.length > 0 ? (
                  allUpcomingEvents.map((event, idx) => {
                    const attendance = event.attendance?.[0]
                    const isPending = !attendance?.status || attendance?.status === ATTENDANCE_STATUS.PENDING

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-4 border-b border-border last:border-0"
                      >
                        <div className="flex-1">
                          <h4 className="text-foreground font-normal text-sm">{event.title || EVENT_TYPE_LABELS[event.type]}</h4>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">
                            {formatEventDate(event.start_time)} · {event.location?.name || 'TBD'}
                          </p>
                        </div>
                        {isPending ? (
                          <div className="flex gap-2">
                            <form action={updateAttendance}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <input type="hidden" name="status" value="confirmed" />
                              <Button
                                type="submit"
                                size="sm"
                                className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </form>
                            <form action={updateAttendance}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <input type="hidden" name="status" value="declined" />
                              <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground h-8 w-8 p-0">
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <div className={`w-2 h-2 ${attendance?.status === ATTENDANCE_STATUS.CONFIRMED ? 'bg-foreground' : 'bg-muted-foreground'}`} />
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine Termine</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border energy-card">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Aktive Challenges</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">XP verdienen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {challenges.map((challenge, idx) => (
                <div key={idx} className="py-4 border-b border-border last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-foreground text-sm font-normal flex-1">{challenge.title}</p>
                    <span className="text-xs tabular-nums text-muted-foreground uppercase tracking-wider">
                      {challenge.reward}
                    </span>
                  </div>
                  <Progress value={challenge.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    {challenge.progress}% abgeschlossen
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
