import { Calendar, MapPin, Clock, UsersRound } from "lucide-react"
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

// Platzhalter-Daten - wird später mit echten Daten ersetzt
const PLACEHOLDER_TRAININGS: Array<{
  id: string
  date: string
  time: string
  group: string
  location: string
}> = []

export function UpcomingTrainings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Trainings diese Woche
        </CardTitle>
        <CardDescription>Deine anstehenden Trainingseinheiten</CardDescription>
      </CardHeader>
      <CardContent>
        {PLACEHOLDER_TRAININGS.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine anstehenden Trainings
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trainings werden angezeigt, sobald dir Gruppen zugeordnet sind
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
              {PLACEHOLDER_TRAININGS.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.date}</TableCell>
                  <TableCell>{training.time}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{training.group}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {training.location}
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
