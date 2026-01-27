"use client"

import { Euro, TrendingUp, AlertCircle, Percent } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/validations/membership-type"

export interface FeeStats {
  totalDue: number      // Gesamt-Soll
  totalPaid: number     // Eingegangen
  totalOpen: number     // Offen (Soll - Eingegangen)
  paymentRate: number   // Zahlungsquote in %
}

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: typeof Euro
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

interface FeeStatsCardsProps {
  stats: FeeStats | null
  isLoading?: boolean
  year: number
}

export function FeeStatsCards({ stats, isLoading, year }: FeeStatsCardsProps) {
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

  const getPaymentRateVariant = (rate: number): "success" | "warning" | "destructive" => {
    if (rate >= 80) return "success"
    if (rate >= 50) return "warning"
    return "destructive"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Gesamt-Soll"
        value={formatCurrency(stats.totalDue)}
        description={`Erwartete Beiträge ${year}`}
        icon={Euro}
      />
      <StatCard
        title="Eingegangen"
        value={formatCurrency(stats.totalPaid)}
        description="Summe aller Zahlungen"
        icon={TrendingUp}
        variant="success"
      />
      <StatCard
        title="Offen"
        value={formatCurrency(stats.totalOpen)}
        description="Noch ausstehend"
        icon={AlertCircle}
        variant={stats.totalOpen > 0 ? "destructive" : "success"}
      />
      <StatCard
        title="Zahlungsquote"
        value={`${stats.paymentRate.toFixed(1)}%`}
        description="Anteil bezahlt"
        icon={Percent}
        variant={getPaymentRateVariant(stats.paymentRate)}
      />
    </div>
  )
}
