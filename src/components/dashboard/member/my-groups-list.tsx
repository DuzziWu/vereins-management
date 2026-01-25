import { UsersRound, User, Calendar } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Platzhalter-Daten - wird in PROJ-4/5 mit echten Daten ersetzt
const PLACEHOLDER_GROUPS: Array<{
  id: string
  name: string
  trainer: string
  nextTraining: string | null
}> = []

export function MyGroupsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-5 w-5" />
          Meine Gruppen
        </CardTitle>
        <CardDescription>Gruppen in denen du Mitglied bist</CardDescription>
      </CardHeader>
      <CardContent>
        {PLACEHOLDER_GROUPS.length === 0 ? (
          <div className="text-center py-6">
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Du bist noch keiner Gruppe zugeordnet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Gruppen werden in einer zukünftigen Version verfügbar sein
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {PLACEHOLDER_GROUPS.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Trainer: {group.trainer}
                  </p>
                </div>
                {group.nextTraining && (
                  <div className="text-right text-sm">
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Nächstes Training
                    </p>
                    <p className="font-medium">{group.nextTraining}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
