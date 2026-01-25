"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { UserRole } from "@/lib/database.types"

const ROLE_LABELS: Record<UserRole, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Mitglied",
}

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  vorstand: "default",
  trainer: "secondary",
  mitglied: "outline",
}

interface Member {
  id: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function RecentMembersTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching recent members:", error)
        setMembers([])
      } else {
        setMembers(data || [])
      }
      setIsLoading(false)
    }

    fetchMembers()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Letzte Mitglieder</CardTitle>
          <CardDescription>Neueste Mitglieder im Verein</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users" className="gap-1">
            Alle anzeigen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : members.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Noch keine Mitglieder vorhanden
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.first_name} {member.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[member.role as UserRole]}>
                      {ROLE_LABELS[member.role as UserRole]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
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
