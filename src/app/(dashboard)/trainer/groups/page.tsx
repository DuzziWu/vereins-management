"use client"

import * as React from "react"
import { Clock, MapPin, Pencil, Users, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { GroupForm } from "@/components/groups/group-form"
import { GroupListItem } from "@/components/groups/groups-table"
import { GroupFormData } from "@/lib/validations/group"

interface MemberOption {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  functional_tags: string[] | null
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function TrainerGroupsPage() {
  const [groups, setGroups] = React.useState<GroupListItem[]>([])
  const [allMembers, setAllMembers] = React.useState<MemberOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Form states
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<GroupListItem | null>(null)
  const [existingCoTrainers, setExistingCoTrainers] = React.useState<string[]>([])
  const [existingMembers, setExistingMembers] = React.useState<string[]>([])

  // Fetch own groups
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

  // Fetch all active members for assignment
  const fetchAllMembers = React.useCallback(async () => {
    try {
      const response = await fetch("/api/members?limit=999&statuses=active")

      if (!response.ok) {
        console.error("Error fetching members")
        return
      }

      const data = await response.json()
      const memberList: MemberOption[] = (data.members || []).map(
        (m: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string
          functional_tags: string[] | null
        }) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          date_of_birth: m.date_of_birth,
          functional_tags: m.functional_tags,
        })
      )
      setAllMembers(memberList)
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  React.useEffect(() => {
    fetchAllMembers()
  }, [fetchAllMembers])

  async function handleEditGroup(group: GroupListItem) {
    setEditingGroup(group)

    // Fetch group details to get co-trainers and members
    try {
      const response = await fetch(`/api/groups/${group.id}`)
      if (response.ok) {
        const data = await response.json()
        // API returns data.group.co_trainers (array of objects) and data.group.members (array of objects)
        const coTrainerIds = (data.group?.co_trainers || []).map(
          (ct: { id: string }) => ct.id
        )
        const memberIds = (data.group?.members || []).map(
          (m: { id: string }) => m.id
        )
        setExistingCoTrainers(coTrainerIds)
        setExistingMembers(memberIds)
      } else {
        setExistingCoTrainers([])
        setExistingMembers([])
      }
    } catch {
      setExistingCoTrainers([])
      setExistingMembers([])
    }

    setFormOpen(true)
  }

  async function handleGroupSubmit(
    data: GroupFormData & { co_trainer_ids: string[]; member_ids: string[] }
  ) {
    if (!editingGroup) return

    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      toast.success("Gruppe erfolgreich aktualisiert")
      await fetchGroups()
    } catch (error) {
      console.error("Error saving group:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern der Gruppe"
      )
      throw error
    }
  }

  function formatTrainingTime(group: GroupListItem): string | null {
    if (!group.training_start_time || !group.training_end_time) return null
    return `${group.training_start_time}\u2013${group.training_end_time}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meine Gruppen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre zugewiesenen Gruppen.
        </p>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <GridSkeleton />
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Keine Gruppen zugewiesen</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sie sind aktuell keiner Gruppe als Trainer oder Co-Trainer zugeordnet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const trainingTime = formatTrainingTime(group)
            return (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Bearbeiten</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
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

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      {group.member_count} Mitglieder
                      {group.max_members && ` / ${group.max_members}`}
                    </span>
                  </div>

                  {group.age_range && group.age_range !== "Keine Mitglieder" && (
                    <Badge variant="outline" className="text-xs">
                      {group.age_range}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog (simplified, no trainer tab) */}
      <GroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editingGroup}
        trainers={[]}
        allMembers={allMembers}
        existingCoTrainers={existingCoTrainers}
        existingMembers={existingMembers}
        onSubmit={handleGroupSubmit}
        isVorstand={false}
      />
    </div>
  )
}
