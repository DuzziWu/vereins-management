import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
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
