"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type UserRole = "vorstand" | "trainer" | "mitglied"

interface RoleSelectProps {
  value?: UserRole
  onValueChange?: (value: UserRole) => void
  disabled?: boolean
}

const roleLabels: Record<UserRole, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Mitglied",
}

const roleDescriptions: Record<UserRole, string> = {
  vorstand: "Volle Administrationsrechte",
  trainer: "Kann Trainings verwalten",
  mitglied: "Basis-Zugriff",
}

export function RoleSelect({ value, onValueChange, disabled }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Rolle auswählen" />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
          <SelectItem key={role} value={role}>
            <div className="flex flex-col">
              <span>{roleLabels[role]}</span>
              <span className="text-xs text-muted-foreground">
                {roleDescriptions[role]}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
