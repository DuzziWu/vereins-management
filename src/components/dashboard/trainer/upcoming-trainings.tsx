"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import {
  getMyUpcomingTrainerSessions,
  type TrainerUpcomingSession,
} from "@/lib/actions/trainer-dashboard"

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

function TrainingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function UpcomingTrainings() {
  const [sessions, setSessions] = useState<TrainerUpcomingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function loadSessions() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyUpcomingTrainerSessions()
      setSessions(data)
    } catch {
      setError("Trainings konnten nicht geladen werden")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  if (isLoading) return <TrainingsSkeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Kommende Trainings
        </CardTitle>
        <CardDescription>Deine nächsten 5 Trainingseinheiten</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine kommenden Trainings geplant
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Zeit</TableHead>
                <TableHead>Gruppe</TableHead>
                <TableHead>Ort</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow
                  key={session.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/trainer/groups/${session.group_id}`)
                  }
                >
                  <TableCell className="font-medium">
                    {formatDate(session.date)}
                  </TableCell>
                  <TableCell>
                    {formatTime(session.start_time, session.end_time)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{session.group_name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location || "Kein Ort"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
