"use client"

import { ProfileCard } from "./profile-card"
import { MyGroupsList } from "./my-groups-list"
import { UpcomingEvents } from "./upcoming-events"
import { NotificationsCard } from "./notifications-card"

export function MemberDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mein Dashboard</h1>
        <p className="text-muted-foreground">
          Deine persönlichen Daten und Termine
        </p>
      </div>

      <ProfileCard />

      <div className="grid gap-6 md:grid-cols-2">
        <MyGroupsList />
        <UpcomingEvents />
      </div>

      <NotificationsCard />
    </div>
  )
}
