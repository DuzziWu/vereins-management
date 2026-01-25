"use client"

import { useDashboardView } from "@/contexts/dashboard-view-context"
import { BoardDashboard } from "./board"
import { TrainerDashboard } from "./trainer"
import { MemberDashboard } from "./member"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export function DashboardContent() {
  const { activeView, isLoading } = useDashboardView()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  switch (activeView) {
    case "vorstand":
      return <BoardDashboard />
    case "trainer":
      return <TrainerDashboard />
    case "mitglied":
      return <MemberDashboard />
    default:
      return <MemberDashboard />
  }
}
