"use client"

import { useState, useEffect } from "react"
import { UsersRound, Users, Clock, MapPin, RefreshCw } from "lucide-react"
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
import {
  getMyTrainerGroups,
  type TrainerGroup,
} from "@/lib/actions/trainer-dashboard"

function formatSchedule(group: TrainerGroup): string {
  const day = group.training_day || null

  if (!day && !group.training_start_time) return "Noch nicht festgelegt"

  const time =
    group.training_start_time && group.training_end_time
      ? `${group.training_start_time.slice(0, 5)}–${group.training_end_time.slice(0, 5)}`
      : ""

  return day && time ? `${day}, ${time}` : day || time || "Noch nicht festgelegt"
}

function GridSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-44 mb-1" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function MyGroupsGrid() {
  const [groups, setGroups] = useState<TrainerGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadGroups() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyTrainerGroups()
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

  if (isLoading) return <GridSkeleton />

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UsersRound className="h-5 w-5" />
        Meine Gruppen
      </h2>

      {error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={loadGroups}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Dir wurden noch keine Gruppen zugewiesen
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/trainer/groups/${group.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.member_count} Mitglieder
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatSchedule(group)}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {group.training_location || "Kein Ort festgelegt"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
