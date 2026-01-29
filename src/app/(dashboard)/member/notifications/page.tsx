import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function MemberNotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Benachrichtigungen</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
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
