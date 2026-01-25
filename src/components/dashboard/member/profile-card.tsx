"use client"

import Link from "next/link"
import { Pencil, Mail, Phone, Calendar, Shield } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useDashboardView, ROLE_LABELS } from "@/contexts/dashboard-view-context"
import { UserRole } from "@/lib/database.types"

export function ProfileCard() {
  const { profile, email } = useDashboardView()

  if (!profile) {
    return null
  }

  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
  const memberSince = new Date(profile.created_at).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {ROLE_LABELS[profile.role as UserRole]}
              </Badge>
              {profile.is_active ? (
                <Badge variant="default">Aktiv</Badge>
              ) : (
                <Badge variant="outline">Inaktiv</Badge>
              )}
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Profil bearbeiten</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          {email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Mitglied seit {memberSince}</span>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
