import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/dashboard/board - Get all dashboard data for board members
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (board member)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Fetch all dashboard data in parallel
  const [statsResult, birthdaysResult, hintsResult] = await Promise.all([
    fetchStats(supabase),
    fetchBirthdays(supabase),
    fetchHints(supabase)
  ])

  return NextResponse.json({
    stats: statsResult,
    birthdays: birthdaysResult,
    hints: hintsResult
  })
}

// Fetch member statistics
async function fetchStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Get total active members
  const { count: totalActive } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Get new members this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: newThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', startOfMonth.toISOString())

  return {
    totalActiveMembers: totalActive || 0,
    newMembersThisMonth: newThisMonth || 0
  }
}

// Fetch upcoming birthdays (next 14 days)
async function fetchBirthdays(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Get all active members with birthdays
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, date_of_birth')
    .eq('status', 'active')
    .not('date_of_birth', 'is', null)

  if (error || !members) {
    console.error('Error fetching birthdays:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedMembers = members as any[]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const in14Days = new Date(today)
  in14Days.setDate(in14Days.getDate() + 14)

  // Filter and calculate upcoming birthdays
  const upcomingBirthdays = typedMembers
    .map(member => {
      const dob = new Date(member.date_of_birth!)
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())

      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1)
      }

      // Check if within 14 days
      if (thisYearBirthday >= today && thisYearBirthday <= in14Days) {
        const age = thisYearBirthday.getFullYear() - dob.getFullYear()
        const isToday = thisYearBirthday.getTime() === today.getTime()

        return {
          id: member.id,
          firstName: member.first_name,
          lastNameInitial: member.last_name.charAt(0) + '.',
          date: thisYearBirthday.toISOString().split('T')[0],
          turnsAge: age,
          isToday,
          daysUntil: Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
      return null
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const totalCount = upcomingBirthdays.length
  const displayedBirthdays = upcomingBirthdays.slice(0, 10) // Max 10 entries

  return {
    items: displayedBirthdays,
    totalCount,
    hasMore: totalCount > 10
  }
}

// Fetch automatic hints (open fees, incomplete profiles, expiring invitations)
async function fetchHints(supabase: Awaited<ReturnType<typeof createClient>>) {
  const hints: Array<{
    type: string
    icon: string
    message: string
    count: number
    link: string
  }> = []

  // 1. Open fees (amount_paid < amount_due)
  const currentYear = new Date().getFullYear()
  const { count: openFeesCount } = await supabase
    .from('membership_fees')
    .select('*', { count: 'exact', head: true })
    .eq('year', currentYear)
    .not('amount_due', 'eq', 0)
    .filter('amount_paid', 'lt', 'amount_due')

  // Since we can't use raw SQL comparison in supabase-js, we need to fetch and filter
  const { data: fees } = await supabase
    .from('membership_fees')
    .select('amount_due, amount_paid')
    .eq('year', currentYear)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedFees = fees as any[]
  const actualOpenFees = typedFees?.filter(f =>
    Number(f.amount_paid) < Number(f.amount_due)
  ).length || 0

  if (actualOpenFees > 0) {
    hints.push({
      type: 'open_fees',
      icon: 'warning',
      message: actualOpenFees === 1
        ? '1 offener Beitrag'
        : `${actualOpenFees} offene Beiträge`,
      count: actualOpenFees,
      link: '/admin/finances/fees?filter=open'
    })
  }

  // 2. Incomplete profiles (missing required fields)
  const { data: incompleteProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('status', 'active')
    .or('date_of_birth.is.null,address_street.is.null,address_zip.is.null,address_city.is.null')

  const incompleteCount = incompleteProfiles?.length || 0
  if (incompleteCount > 0) {
    hints.push({
      type: 'incomplete_profiles',
      icon: 'edit',
      message: incompleteCount === 1
        ? '1 unvollständiges Profil'
        : `${incompleteCount} unvollständige Profile`,
      count: incompleteCount,
      link: '/admin/members?filter=incomplete'
    })
  }

  // 3. Expiring invitations (< 7 days)
  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)

  const { data: expiringInvitations } = await supabase
    .from('invitations')
    .select('id')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .lt('expires_at', in7Days.toISOString())

  const expiringCount = expiringInvitations?.length || 0
  if (expiringCount > 0) {
    hints.push({
      type: 'expiring_invitations',
      icon: 'clock',
      message: expiringCount === 1
        ? '1 Einladung läuft bald ab'
        : `${expiringCount} Einladungen laufen bald ab`,
      count: expiringCount,
      link: '/admin/users/invitations'
    })
  }

  return hints
}
