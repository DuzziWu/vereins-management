"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, UsersRound, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getMyUpcomingTrainings,
  type MemberUpcomingTraining,
} from "@/lib/actions/member-dashboard"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

function formatTime(start: string, end: string): string {
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`
}

function RsvpBadge({ status }: { status: MemberUpcomingTraining["rsvp_status"] }) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Zugesagt</Badge>
    case "declined":
      return <Badge variant="destructive">Abgesagt</Badge>
    default:
      return <Badge variant="secondary">Offen</Badge>
  }
}

function EventsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function UpcomingEvents() {
  const [trainings, setTrainings] = useState<MemberUpcomingTraining[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadTrainings() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyUpcomingTrainings()
      setTrainings(data)
    } catch {
      setError("Termine konnten nicht geladen werden")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTrainings()
  }, [])

  if (isLoading) return <EventsSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nächste Termine
        </CardTitle>
        <CardDescription>Deine nächsten 5 Trainingstermine</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadTrainings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine kommenden Termine
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {trainings.map((training) => (
              <li
                key={training.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{formatDate(training.date)}</p>
                    <RsvpBadge status={training.rsvp_status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(training.start_time, training.end_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersRound className="h-3 w-3" />
                      {training.group_name}
                    </span>
                    {training.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {training.location}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
