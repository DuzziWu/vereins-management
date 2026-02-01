"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, MapPin, MessageCircle, User, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUnreadMessages } from "@/hooks/use-unread-messages"

interface MemberGroup {
  id: string
  name: string
  description: string | null
  trainer: { id: string; first_name: string; last_name: string } | null
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
  training_location: string | null
  chat_enabled: boolean
}

function CardsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-56 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-44" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MemberGroupsPage() {
  const [groups, setGroups] = React.useState<MemberGroup[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { getUnreadForGroup } = useUnreadMessages()

  const fetchGroups = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/groups")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching groups:", errorData)
        toast.error("Fehler beim Laden der Gruppen")
        return
      }

      const data = await response.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
      toast.error("Fehler beim Laden der Gruppen")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  function formatTrainingTime(group: MemberGroup): string | null {
    if (!group.training_start_time || !group.training_end_time) return null
    return `${group.training_start_time}\u2013${group.training_end_time}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meine Gruppen</h1>
        <p className="text-muted-foreground">
          Deine Vereinsgruppen und Trainingszeiten.
        </p>
      </div>

      {/* Groups List */}
      {isLoading ? (
        <CardsSkeleton />
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              Du bist noch keiner Gruppe zugeordnet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sobald du einer Gruppe zugewiesen wirst, siehst du hier deine
              Trainingszeiten und Gruppeninformationen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const trainingTime = formatTrainingTime(group)
            return (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.trainer && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" />
                      <span>
                        Trainer: {group.trainer.first_name}{" "}
                        {group.trainer.last_name}
                      </span>
                    </div>
                  )}

                  {group.training_day && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        {group.training_day}
                        {trainingTime && `, ${trainingTime}`}
                      </span>
                    </div>
                  )}

                  {group.training_location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{group.training_location}</span>
                    </div>
                  )}

                  {group.chat_enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 relative"
                      asChild
                    >
                      <Link href={`/member/groups/${group.id}/chat`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Gruppen-Chat
                        {getUnreadForGroup(group.id) > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
                          >
                            {getUnreadForGroup(group.id) > 99
                              ? "99+"
                              : getUnreadForGroup(group.id)}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
