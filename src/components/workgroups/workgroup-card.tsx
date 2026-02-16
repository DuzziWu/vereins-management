"use client"

import * as React from "react"
import Link from "next/link"
import { Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WorkgroupListItem, WorkgroupCategory } from "./workgroup-form"

interface WorkgroupCardProps {
  workgroup: WorkgroupListItem
  href: string
  members?: { id: string; first_name: string; last_name: string }[]
}

function getCategoryBadgeColor(category: WorkgroupCategory | null): string {
  if (!category) return ""

  const colorMap: Record<string, string> = {
    "Wagenbau": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Event-Planung": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Kostüme": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "Organisation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Sonstiges": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  return colorMap[category.name] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function WorkgroupCard({ workgroup, href, members = [] }: WorkgroupCardProps) {
  const displayMembers = members.slice(0, 5)
  const remainingCount = members.length - displayMembers.length

  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{workgroup.name}</CardTitle>
            {workgroup.category && (
              <Badge
                className={getCategoryBadgeColor(workgroup.category)}
                variant="outline"
              >
                {workgroup.category.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          {workgroup.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {workgroup.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Keine Beschreibung
            </p>
          )}

          {/* Members */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {workgroup.member_count} Mitglieder
              </span>
            </div>

            {/* Member Avatars */}
            {displayMembers.length > 0 && (
              <div className="flex -space-x-2">
                {displayMembers.map((member) => (
                  <Avatar
                    key={member.id}
                    className="h-7 w-7 border-2 border-background"
                  >
                    <AvatarFallback className="text-xs">
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-xs bg-muted">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface WorkgroupCardsGridProps {
  workgroups: (WorkgroupListItem & {
    members?: { id: string; first_name: string; last_name: string }[]
  })[]
  getHref: (workgroup: WorkgroupListItem) => string
}

export function WorkgroupCardsGrid({ workgroups, getHref }: WorkgroupCardsGridProps) {
  if (workgroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">
          Du bist noch keiner Workgroup zugewiesen
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Workgroups sind Projektgruppen für Vereinsaufgaben wie Wagenbau oder Event-Planung.
          Du wirst benachrichtigt, sobald du einer Workgroup zugewiesen wirst.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workgroups.map((workgroup) => (
        <WorkgroupCard
          key={workgroup.id}
          workgroup={workgroup}
          href={getHref(workgroup)}
          members={workgroup.members}
        />
      ))}
    </div>
  )
}
