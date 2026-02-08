"use client"

import { Shield, Users, Calendar, Wallet } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ROLE_LABELS, ROLE_VARIANTS } from "@/lib/validations/member"
import { MyGroupInfo, MyFeeInfo } from "@/lib/actions/profile"
import { formatCurrency } from "@/lib/validations/membership-type"

// Day labels in German
const DAY_LABELS: Record<string, string> = {
  monday: "Montag",
  tuesday: "Dienstag",
  wednesday: "Mittwoch",
  thursday: "Donnerstag",
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag",
}

interface ClubInfoSectionProps {
  profile: {
    role: string
    is_active: boolean
    created_at: string
  }
  groups: MyGroupInfo[]
  fees: MyFeeInfo[]
}

export function ClubInfoSection({ profile, groups, fees }: ClubInfoSectionProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const formatTime = (time: string | null) => {
    if (!time) return null
    return time.slice(0, 5) // HH:MM
  }

  const formatTrainingInfo = (group: MyGroupInfo) => {
    const day = group.training_day ? DAY_LABELS[group.training_day] || group.training_day : null
    const start = formatTime(group.training_start_time)
    const end = formatTime(group.training_end_time)

    if (day && start && end) {
      return `${day}, ${start} - ${end}`
    }
    if (day) {
      return day
    }
    return "Kein Training eingetragen"
  }

  const getStatusBadgeVariant = (status: "unpaid" | "partial" | "paid") => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "unpaid":
        return "destructive"
    }
  }

  const getStatusLabel = (status: "unpaid" | "partial" | "paid") => {
    switch (status) {
      case "paid":
        return "Bezahlt"
      case "partial":
        return "Teilweise"
      case "unpaid":
        return "Offen"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Meine Vereins-Info
        </CardTitle>
        <CardDescription>
          Deine Mitgliedschaft im Verein
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Bar */}
        <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Rolle</p>
            <Badge variant={ROLE_VARIANTS[profile.role] || "outline"}>
              {ROLE_LABELS[profile.role] || profile.role}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mitglied seit</p>
            <p className="text-sm font-medium">{memberSince}</p>
          </div>
        </div>

        {/* Groups Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Meine Gruppen
          </h3>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
              Keiner Gruppe zugewiesen
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{group.name}</p>
                    {group.trainer_name && (
                      <p className="text-xs text-muted-foreground">
                        Trainer: {group.trainer_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTrainingInfo(group)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fees Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="h-4 w-4" />
            Meine Beiträge
          </h3>
          {fees.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
              Keine Beiträge vorhanden
            </p>
          ) : (
            <ScrollArea className="h-[200px] rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jahr</TableHead>
                    <TableHead>Beitragsart</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead className="text-right">Bezahlt</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.year}</TableCell>
                      <TableCell>{fee.membership_type_name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(fee.amount_due)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(fee.amount_paid)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusBadgeVariant(fee.status)}>
                          {getStatusLabel(fee.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
