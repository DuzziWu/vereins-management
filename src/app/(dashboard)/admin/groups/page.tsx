import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersRound } from "lucide-react"

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Gruppen</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Gruppenverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Diese Seite wird in einem zukünftigen Update verfügbar sein.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
