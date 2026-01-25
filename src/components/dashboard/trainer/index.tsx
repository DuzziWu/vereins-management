"use client"

import { MyGroupsGrid } from "./my-groups-grid"
import { UpcomingTrainings } from "./upcoming-trainings"
import { TrainerNotes } from "./trainer-notes"

export function TrainerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
        <p className="text-muted-foreground">
          Deine Gruppen und Trainingsübersicht
        </p>
      </div>

      <MyGroupsGrid />

      <UpcomingTrainings />

      <TrainerNotes />
    </div>
  )
}
