"use client"

import { Users, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalActiveMembers: number
  newMembersThisMonth: number
}

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: typeof Users
  prefix?: string
}

function StatCard({ title, value, description, icon: Icon, prefix }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value}
        </div>
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

interface StatsWidgetsProps {
  stats: Stats | null
  isLoading: boolean
}

export function StatsWidgets({ stats, isLoading }: StatsWidgetsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 grid-cols-2">
      <StatCard
        title="Aktive Mitglieder"
        value={stats.totalActiveMembers}
        description="Registrierte aktive Mitglieder"
        icon={Users}
      />
      <StatCard
        title="Neu diesen Monat"
        value={stats.newMembersThisMonth}
        description="Diesen Monat beigetreten"
        icon={UserPlus}
        prefix="+"
      />
    </div>
  )
}
