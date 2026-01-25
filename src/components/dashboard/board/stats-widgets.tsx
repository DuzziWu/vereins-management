"use client"

import { useEffect, useState } from "react"
import { Users, UserPlus, Mail, Home } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

interface Stats {
  activeMembers: number
  newMembers: number
  pendingInvitations: number
  familiesCount: number
}

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: typeof Users
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function StatsWidgets() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      // Aktive Mitglieder
      const { count: activeMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      // Neue Mitglieder diesen Monat
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString())

      // Offene Einladungen
      const { count: pendingInvitations } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .is("used_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())

      setStats({
        activeMembers: activeMembers ?? 0,
        newMembers: newMembers ?? 0,
        pendingInvitations: pendingInvitations ?? 0,
        familiesCount: 0, // Platzhalter bis PROJ-4/5
      })
      setIsLoading(false)
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Aktive Mitglieder"
        value={stats.activeMembers}
        description="Registrierte aktive Mitglieder"
        icon={Users}
      />
      <StatCard
        title="Neue Mitglieder"
        value={stats.newMembers}
        description="Diesen Monat beigetreten"
        icon={UserPlus}
      />
      <StatCard
        title="Offene Einladungen"
        value={stats.pendingInvitations}
        description="Ausstehende Einladungen"
        icon={Mail}
      />
      <StatCard
        title="Familien"
        value={stats.familiesCount}
        description={stats.familiesCount === 0 ? "Noch keine Familien" : "Registrierte Familien"}
        icon={Home}
      />
    </div>
  )
}
