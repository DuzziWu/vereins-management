"use client"

import { Shield, Dumbbell, User, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboardView, ROLE_LABELS } from "@/contexts/dashboard-view-context"
import { UserRole } from "@/lib/database.types"

// Icons für jede Rolle
const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  vorstand: Shield,
  trainer: Dumbbell,
  mitglied: User,
}

// Beschreibungen für jede Rolle
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  vorstand: "Vereinsverwaltung",
  trainer: "Gruppen & Training",
  mitglied: "Persönliche Daten",
}

export function RoleSwitcher() {
  const { activeView, setActiveView, availableViews, hasMultipleViews, isLoading } =
    useDashboardView()

  // Während des Ladens oder wenn nur eine Rolle verfügbar ist
  if (isLoading) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
    )
  }

  const ActiveIcon = ROLE_ICONS[activeView]

  // Nur ein Label anzeigen wenn User nur eine Rolle hat
  if (!hasMultipleViews) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <ActiveIcon className="h-4 w-4" />
        <span>{ROLE_LABELS[activeView]}</span>
      </div>
    )
  }

  // Dropdown für mehrere Rollen
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ActiveIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{ROLE_LABELS[activeView]}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableViews.map((view) => {
          const Icon = ROLE_ICONS[view]
          const isActive = view === activeView

          return (
            <DropdownMenuItem
              key={view}
              onClick={() => setActiveView(view)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{ROLE_LABELS[view]}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_DESCRIPTIONS[view]}
                  </span>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
