import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Users, Package, DollarSign, Clock, Shield } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import DashboardHeader from '@/components/dashboard-header'
import { WeekCalendar } from '@/components/dashboard/week-calendar'
import { NextEvent } from '@/components/dashboard/next-event'
import { formatCurrency } from '@/lib/utils'
import { USER_ROLE_LABELS } from '@/lib/constants'

export const metadata = {
  title: 'Admin Dashboard | Vereins-Master',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get current user and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, club:clubs(*)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect(`/${profile?.role || 'player'}`)
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

  // Fetch dashboard data in parallel
  const [
    { count: memberCount },
    { count: teamCount },
    { data: activeModules },
    { data: openFinances },
    { data: pendingTasks },
    { data: unassignedMembers },
    { data: weekEvents },
    { data: nextEvent },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
    supabase.from('club_modules').select('module_id').eq('club_id', clubId).eq('is_active', true),
    supabase.from('finances').select('amount, type, status, description, profile_id, profiles(full_name)').eq('club_id', clubId).eq('status', 'open').limit(10),
    supabase.from('tasks').select('*').eq('club_id', clubId).eq('status', 'open').limit(5),
    // Get non-admin members without team assignment
    supabase
      .from('profiles')
      .select('id, full_name, role, team_members(team_id)')
      .eq('club_id', clubId)
      .neq('role', 'admin')
      .limit(20),
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
  const confirmedCount = nextEvent?.attendance?.filter(a => a.status === 'confirmed').length || 0

  // Calculate financial stats
  const totalPaid = 24500 // This would come from actual paid finances query
  const totalOpen = openFinances?.reduce((sum, f) => sum + Number(f.amount), 0) || 0
  const paidPercentage = totalPaid > 0 ? Math.round((totalPaid / (totalPaid + totalOpen)) * 100) : 0

  // Get recent member growth (placeholder - would need actual query)
  const memberGrowth = 12

  // Filter members without team assignment (non-admins only)
  const membersWithoutTeam = unassignedMembers?.filter(
    member => !member.team_members || member.team_members.length === 0
  ) || []

  // Combine pending items for action center
  const actionItems = [
    // Members without team assignment
    ...membersWithoutTeam.map(member => ({
      type: 'member_unassigned',
      title: 'Mannschaftszuordnung fehlt',
      user: member.full_name || 'Unbekannt',
      amount: null,
      href: '/admin/members',
    })),
    // Open expenses
    ...(openFinances?.filter(f => f.type === 'expense').map(f => ({
      type: 'expense',
      title: f.description || 'Auslagenerstattung',
      user: f.profiles?.full_name || 'Unbekannt',
      amount: formatCurrency(Number(f.amount)),
    })) || []),
    // Open tasks
    ...(pendingTasks?.map(t => ({
      type: 'task',
      title: t.title,
      user: 'Unzugewiesen',
      amount: null,
    })) || []),
  ].slice(0, 6)

  return (
    <div className="min-h-screen bg-background diagonal-lines">
      <DashboardHeader
        userName={profile.full_name || 'Admin'}
        userRole={USER_ROLE_LABELS[profile.role] || 'Vereins-Admin'}
        clubName={profile.club?.name || 'FC Digital'}
        isAdmin={true}
        avatarUrl={profile.avatar_url}
        clubLogoUrl={profile.club?.logo_url}
      />

      <main className="container mx-auto px-6 py-12">
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-4">Übersicht</h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-24 bg-primary rounded-full" />
            <p className="text-muted-foreground font-medium">Vereinsmanagement Dashboard</p>
          </div>
        </div>

        {/* Next Event - Full Width */}
        <div className="mb-8">
          <NextEvent
            event={nextEvent}
            linkPrefix="/admin"
            attendanceCount={confirmedCount}
          />
        </div>

        {/* Week Calendar */}
        <div className="mb-12">
          <WeekCalendar events={weekEvents || []} linkPrefix="/admin" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card border-2 border-border hover-lift-sport md:col-span-2 energy-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-normal">
                Finanz-Ticker
              </CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Beitragssituation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Bezahlt</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light tabular-nums text-foreground">{formatCurrency(totalPaid)}</span>
                  </div>
                  <Progress value={paidPercentage} className="h-1" />
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Offen</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light tabular-nums text-muted-foreground">{formatCurrency(totalOpen)}</span>
                  </div>
                  <Progress value={100 - paidPercentage} className="h-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Growth */}
          <Link href="/admin/members" className="block">
            <Card className="bg-card border-2 border-border hover-lift-sport cursor-pointer transition-all hover:border-primary h-full">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-lg font-normal">
                  Mitglieder
                </CardTitle>
                <CardDescription className="uppercase tracking-wider text-xs">Aktueller Stand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <span className="text-5xl font-light tabular-nums text-foreground block">{memberCount || 0}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span className="uppercase tracking-wider">+{memberGrowth} diesen Monat</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Pending Actions */}
          <Card className="bg-card border-2 border-border hover-lift-sport">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg font-normal">Aktionen</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Ausstehend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <span className="text-5xl font-light tabular-nums text-foreground block">{actionItems.length}</span>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Benötigen Freigabe</p>
              </div>
            </CardContent>
          </Card>

          {/* Teams Widget */}
          <Link href="/admin/teams" className="block">
            <Card className="bg-card border-2 border-border hover-lift-sport cursor-pointer transition-all hover:border-primary h-full">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-lg font-normal">
                  Mannschaften
                </CardTitle>
                <CardDescription className="uppercase tracking-wider text-xs">Teams verwalten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <span className="text-5xl font-light tabular-nums text-foreground block">{teamCount || 0}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span className="uppercase tracking-wider">Aktive Teams</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Action Center</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Offene Genehmigungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 numbered-list pl-8">
                {actionItems.length > 0 ? (
                  actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-6 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-normal text-sm mb-1 truncate">{item.title}</h4>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">{item.user}</p>
                      </div>
                      {item.amount && <span className="text-sm tabular-nums text-foreground ml-4">{item.amount}</span>}
                      {item.type === 'member_unassigned' ? (
                        <Button
                          size="sm"
                          className="ml-4 h-8 px-4 bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-wider"
                          asChild
                        >
                          <Link href="/admin/members">Zuordnen</Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="ml-4 h-8 px-4 bg-foreground text-background hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-wider"
                        >
                          Prüfen
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine offenen Aktionen</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-normal">Quick Actions</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Häufig genutzt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Users, label: 'Mitglied einladen', href: '/admin/members/invite' },
                { icon: Package, label: 'Modul-Shop', href: '/admin/modules' },
                { icon: Clock, label: 'Task erstellen', href: '/admin/tasks' },
                { icon: DollarSign, label: 'Finanzen', href: '/admin/finances' },
              ].map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start h-12 border-border hover:border-primary hover:bg-card text-sm bg-transparent"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon className="mr-3 h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
