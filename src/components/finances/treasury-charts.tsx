"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

// --- Types ---

export interface MonthlyData {
  month: number
  year: number
  income: number
  expense: number
}

export interface CategoryBreakdownEntry {
  category_id: string
  name: string
  icon: string | null
  color: string | null
  type: string
  total: number
  count: number
}

interface TreasuryChartsProps {
  monthlyBreakdown: MonthlyData[]
  categoryBreakdown: CategoryBreakdownEntry[]
  isLoading?: boolean
}

// --- Helpers ---

const MONTH_NAMES = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
]

const DEFAULT_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#14b8a6",
]

function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatEuro(entry.value)}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="mb-1 font-medium">{data.name}</p>
      <p className="text-sm">{formatEuro(data.value)}</p>
      <p className="text-xs text-muted-foreground">{data.payload.count} Buchungen</p>
    </div>
  )
}

// --- Bar Chart: Monthly Income vs Expense ---

function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  const [viewYear, setViewYear] = React.useState<"current" | "comparison">("current")

  const currentYearData = data.filter((d) => d.year === currentYear)
  const previousYearData = data.filter((d) => d.year === previousYear)

  const chartData = currentYearData.map((d) => {
    const prev = previousYearData.find((p) => p.month === d.month)
    return {
      name: MONTH_NAMES[d.month - 1],
      Einnahmen: d.income,
      Ausgaben: d.expense,
      "Einnahmen Vorjahr": prev?.income ?? 0,
      "Ausgaben Vorjahr": prev?.expense ?? 0,
    }
  })

  const hasComparison = previousYearData.some((d) => d.income > 0 || d.expense > 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Monatsübersicht</CardTitle>
        {hasComparison && (
          <Tabs value={viewYear} onValueChange={(v) => setViewYear(v as "current" | "comparison")}>
            <TabsList className="h-8">
              <TabsTrigger value="current" className="text-xs px-2 py-1">
                {currentYear}
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs px-2 py-1">
                Vergleich
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Einnahmen" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Ausgaben" fill="#ef4444" radius={[2, 2, 0, 0]} />
              {viewYear === "comparison" && (
                <>
                  <Bar dataKey="Einnahmen Vorjahr" fill="#86efac" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Ausgaben Vorjahr" fill="#fca5a5" radius={[2, 2, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Pie Chart: Category Breakdown ---

function CategoryPieChart({ data, type }: { data: CategoryBreakdownEntry[]; type: "expense" | "income" }) {
  const filtered = data
    .filter((d) => d.type === type)
    .sort((a, b) => b.total - a.total)

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Keine {type === "expense" ? "Ausgaben" : "Einnahmen"} im Zeitraum
      </div>
    )
  }

  const pieData = filtered.map((d, i) => ({
    name: d.name,
    value: d.total,
    count: d.count,
    fill: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={{ strokeWidth: 1 }}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Main Component ---

export function TreasuryCharts({ monthlyBreakdown, categoryBreakdown, isLoading }: TreasuryChartsProps) {
  const [pieType, setPieType] = React.useState<"expense" | "income">("expense")

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* BUG-1 + BUG-3: Bar chart with year comparison */}
      <MonthlyBarChart data={monthlyBreakdown} />

      {/* BUG-2: Pie chart category breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Nach Kategorie</CardTitle>
          <Tabs value={pieType} onValueChange={(v) => setPieType(v as "expense" | "income")}>
            <TabsList className="h-8">
              <TabsTrigger value="expense" className="text-xs px-2 py-1">
                Ausgaben
              </TabsTrigger>
              <TabsTrigger value="income" className="text-xs px-2 py-1">
                Einnahmen
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <CategoryPieChart data={categoryBreakdown} type={pieType} />
        </CardContent>
      </Card>
    </div>
  )
}
