import Link from "next/link"
import { UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/admin/users/invite" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Mitglied einladen
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/admin/users" className="gap-2">
          <Users className="h-4 w-4" />
          Mitgliederverwaltung
        </Link>
      </Button>
    </div>
  )
}
