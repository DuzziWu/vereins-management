"use client"

import Link from "next/link"
import { Cake, PartyPopper } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Birthday {
  id: string
  firstName: string
  lastNameInitial: string
  date: string
  turnsAge: number
  isToday: boolean
  daysUntil: number
}

interface BirthdayWidgetProps {
  birthdays: Birthday[]
  hasMore: boolean
  totalCount: number
  isLoading: boolean
}

function formatRelativeDate(daysUntil: number, date: string): string {
  if (daysUntil === 0) return "Heute"
  if (daysUntil === 1) return "Morgen"
  if (daysUntil <= 7) return `in ${daysUntil} Tagen`

  // Format as DD.MM.
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
}

function BirthdayListItem({ birthday }: { birthday: Birthday }) {
  const Icon = birthday.isToday ? PartyPopper : Cake

  return (
    <Link
      href={`/admin/members/${birthday.id}`}
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted ${
        birthday.isToday ? "bg-amber-50 dark:bg-amber-950/20" : ""
      }`}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${
          birthday.isToday
            ? "text-amber-500"
            : "text-muted-foreground"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          birthday.isToday ? "text-amber-700 dark:text-amber-400" : ""
        }`}>
          {birthday.firstName} {birthday.lastNameInitial}
        </p>
        <p className="text-xs text-muted-foreground">
          wird {birthday.turnsAge} Jahre
        </p>
      </div>
      <span className={`text-xs font-medium flex-shrink-0 ${
        birthday.isToday
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground"
      }`}>
        {formatRelativeDate(birthday.daysUntil, birthday.date)}
      </span>
    </Link>
  )
}

function BirthdayWidgetSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function BirthdayWidget({ birthdays, hasMore, totalCount, isLoading }: BirthdayWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cake className="h-4 w-4" />
          Geburtstage
          {!isLoading && totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <BirthdayWidgetSkeleton />
        ) : birthdays.length === 0 ? (
          <div className="text-center py-6">
            <Cake className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine Geburtstage in den nächsten 14 Tagen
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {birthdays.map((birthday) => (
              <BirthdayListItem key={birthday.id} birthday={birthday} />
            ))}
            {hasMore && (
              <Link
                href="/admin/members?sort=birthday"
                className="block text-center text-sm text-primary hover:underline pt-2"
              >
                Alle {totalCount} Geburtstage anzeigen
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
