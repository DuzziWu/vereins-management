import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteUserForm } from "@/components/admin/invite-user-form"

export default function InviteUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Neues Mitglied einladen</h1>
        <p className="text-muted-foreground">
          Laden Sie ein neues Mitglied per Email ein, dem Verein beizutreten.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Einladung erstellen</CardTitle>
          <CardDescription>
            Der eingeladene User erhält eine Email mit einem Registrierungslink.
            Der Link ist 7 Tage gültig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm />
        </CardContent>
      </Card>
    </div>
  )
}
