"use client"

import { useState, useEffect } from "react"
import { UsersRound, User, Calendar, MessageCircle, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { getMyMemberGroups, type MemberGroup } from "@/lib/actions/member-dashboard"

function formatTrainingTime(group: MemberGroup): string {
  const day = group.training_day || null

  if (!day && !group.training_start_time) return "Noch nicht festgelegt"

  const time =
    group.training_start_time && group.training_end_time
      ? `${group.training_start_time.slice(0, 5)}–${group.training_end_time.slice(0, 5)}`
      : ""

  return day && time ? `${day}, ${time}` : day || time || "Noch nicht festgelegt"
}

function GroupsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-44" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MyGroupsList() {
  const [groups, setGroups] = useState<MemberGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadGroups() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyMemberGroups()
      setGroups(data)
    } catch {
      setError("Gruppen konnten nicht geladen werden")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  if (isLoading) return <GroupsListSkeleton />

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
        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadGroups}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-6">
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Du wurdest noch keiner Gruppe zugewiesen
            </p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{group.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3 shrink-0" />
                    {group.trainer_name || "Kein Trainer zugewiesen"}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatTrainingTime(group)}
                  </p>
                </div>
                {group.chat_enabled && (
                  <Link
                    href={`/member/groups/${group.id}/chat`}
                    className="ml-3 shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Gruppen-Chat öffnen"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
