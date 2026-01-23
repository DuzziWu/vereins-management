import Link from "next/link"
import { Plus } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvitationsTable } from "@/components/admin/invitations-table"
import { listInvitations } from "@/lib/actions"

export default async function InvitationsPage() {
  const result = await listInvitations()
  const invitations = result.invitations || []
  const pendingCount = invitations.filter((i) => i.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Einladungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie ausstehende und vergangene Einladungen.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/invite">
            <Plus className="mr-2 h-4 w-4" />
            Neue Einladung
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alle Einladungen</CardTitle>
              <CardDescription>
                Übersicht aller versendeten Einladungen
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Badge variant="secondary">
                {pendingCount} ausstehend
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <InvitationsTable invitations={invitations} />
        </CardContent>
      </Card>
    </div>
  )
}
