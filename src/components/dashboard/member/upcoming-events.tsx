import { Calendar, MapPin, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Platzhalter-Daten - wird später mit echten Daten ersetzt
const PLACEHOLDER_EVENTS: Array<{
  id: string
  title: string
  date: string
  time: string
  location: string
}> = []

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nächste Termine
        </CardTitle>
        <CardDescription>Anstehende Trainings und Events</CardDescription>
      </CardHeader>
      <CardContent>
        {PLACEHOLDER_EVENTS.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine anstehenden Termine
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Termine werden angezeigt, sobald du einer Gruppe zugeordnet bist
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {PLACEHOLDER_EVENTS.map((event) => (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
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
