"use client"

import { StatsWidgets } from "./stats-widgets"
import { RecentMembersTable } from "./recent-members-table"
import { QuickActions } from "./quick-actions"

export function BoardDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vorstand Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht über alle Vereinsdaten
        </p>
      </div>

      <StatsWidgets />

      <RecentMembersTable />

      <QuickActions />
    </div>
  )
}
