"use client"

import { Wallet, TrendingUp, TrendingDown, ArrowUpDown, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/validations/membership-type"

export interface TreasuryStats {
  balance: number        // Kassenstand (Gesamt)
  periodIncome: number   // Einnahmen im Zeitraum
  periodExpense: number  // Ausgaben im Zeitraum
  periodDifference: number // Differenz im Zeitraum
}

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: typeof Wallet
  variant?: "default" | "success" | "warning" | "destructive"
}

function StatCard({ title, value, description, icon: Icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    destructive: "text-red-600",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variantStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
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
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

interface TreasuryStatsCardsProps {
  stats: TreasuryStats | null
  isLoading?: boolean
  periodLabel: string
}

export function TreasuryStatsCards({ stats, isLoading, periodLabel }: TreasuryStatsCardsProps) {
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

  const balanceVariant = stats.balance < 0 ? "destructive" : "default"
  const differenceVariant: "success" | "warning" | "destructive" =
    stats.periodDifference > 0 ? "success" :
    stats.periodDifference === 0 ? "warning" : "destructive"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <StatCard
          title="Kassenstand"
          value={formatCurrency(stats.balance)}
          description="Gesamtsaldo"
          icon={Wallet}
          variant={balanceVariant}
        />
        {stats.balance < 0 && (
          <div className="absolute top-2 right-10">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        )}
      </div>
      <StatCard
        title="Einnahmen"
        value={formatCurrency(stats.periodIncome)}
        description={periodLabel}
        icon={TrendingUp}
        variant="success"
      />
      <StatCard
        title="Ausgaben"
        value={formatCurrency(stats.periodExpense)}
        description={periodLabel}
        icon={TrendingDown}
        variant="destructive"
      />
      <StatCard
        title="Differenz"
        value={formatCurrency(stats.periodDifference)}
        description={periodLabel}
        icon={ArrowUpDown}
        variant={differenceVariant}
      />
    </div>
  )
}
