"use client"

import { Building2, CreditCard, Shield } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClubDataForm } from "@/components/settings/club-data-form"
import { RoleManagement } from "@/components/settings/role-management"
import { MembershipTypesTab } from "@/components/settings/membership-types-tab"

export function SettingsContent() {
  return (
    <Tabs defaultValue="stammdaten" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="stammdaten" className="gap-2">
          <Building2 className="h-4 w-4 hidden sm:block" />
          Stammdaten
        </TabsTrigger>
        <TabsTrigger value="mitgliedschaftstypen" className="gap-2">
          <CreditCard className="h-4 w-4 hidden sm:block" />
          Beitragsarten
        </TabsTrigger>
        <TabsTrigger value="rollenverwaltung" className="gap-2">
          <Shield className="h-4 w-4 hidden sm:block" />
          Rollen
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stammdaten">
        <ClubDataForm />
      </TabsContent>

      <TabsContent value="mitgliedschaftstypen">
        <MembershipTypesTab />
      </TabsContent>

      <TabsContent value="rollenverwaltung">
        <RoleManagement />
      </TabsContent>
    </Tabs>
  )
}
