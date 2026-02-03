import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

import { getMyProfile } from "@/lib/actions"
import { SettingsContent } from "./settings-content"

export default async function SettingsPage() {
  const profile = await getMyProfile()

  if (!profile || profile.role !== "vorstand") {
    redirect("/dashboard?error=unauthorized")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-bold tracking-tight">
          Vereins-Einstellungen
        </h1>
      </div>

      <SettingsContent />
    </div>
  )
}
