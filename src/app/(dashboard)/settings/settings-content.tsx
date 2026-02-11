"use client"

import { Building2, CreditCard, Shield, CalendarDays } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClubDataForm } from "@/components/settings/club-data-form"
import { RoleManagement } from "@/components/settings/role-management"
import { MembershipTypesTab } from "@/components/settings/membership-types-tab"
import { EventTypesManagement } from "@/components/settings/event-types-management"

export function SettingsContent() {
  return (
    <Tabs defaultValue="stammdaten" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="stammdaten" className="gap-2">
          <Building2 className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">Stammdaten</span>
          <span className="sm:hidden">Stamm</span>
        </TabsTrigger>
        <TabsTrigger value="mitgliedschaftstypen" className="gap-2">
          <CreditCard className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">Beitragsarten</span>
          <span className="sm:hidden">Beiträge</span>
        </TabsTrigger>
        <TabsTrigger value="eventtypen" className="gap-2">
          <CalendarDays className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">Event-Typen</span>
          <span className="sm:hidden">Events</span>
        </TabsTrigger>
        <TabsTrigger value="rollenverwaltung" className="gap-2">
          <Shield className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">Rollen</span>
          <span className="sm:hidden">Rollen</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stammdaten">
        <ClubDataForm />
      </TabsContent>

      <TabsContent value="mitgliedschaftstypen">
        <MembershipTypesTab />
      </TabsContent>

      <TabsContent value="eventtypen">
        <EventTypesManagement />
      </TabsContent>

      <TabsContent value="rollenverwaltung">
        <RoleManagement />
      </TabsContent>
    </Tabs>
  )
}
