import { UsersRound, Users, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Platzhalter-Daten - wird später mit echten Daten ersetzt
const PLACEHOLDER_GROUPS: Array<{
  id: string
  name: string
  memberCount: number
  ageRange: string
  schedule: string
}> = []

export function MyGroupsGrid() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UsersRound className="h-5 w-5" />
        Meine Gruppen
      </h2>

      {PLACEHOLDER_GROUPS.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Dir sind noch keine Gruppen zugeordnet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gruppen werden in einer zukünftigen Version verfügbar sein
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_GROUPS.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant="outline">{group.ageRange}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.memberCount} Mitglieder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {group.schedule}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
