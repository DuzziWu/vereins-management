"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GroupsTable, GroupListItem } from "@/components/groups/groups-table"
import { GroupsToolbar, GroupsFilters } from "@/components/groups/groups-toolbar"
import { GroupForm } from "@/components/groups/group-form"
import { MembersPagination } from "@/components/members/members-pagination"
import { GroupFormData } from "@/lib/validations/group"

const PAGE_SIZE = 20

interface TrainerOption {
  id: string
  first_name: string
  last_name: string
}

interface MemberOption {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  functional_tags: string[] | null
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  )
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = React.useState<GroupListItem[]>([])
  const [trainers, setTrainers] = React.useState<TrainerOption[]>([])
  const [allMembers, setAllMembers] = React.useState<MemberOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  const [filters, setFilters] = React.useState<GroupsFilters>({
    search: "",
  })

  // Form states
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<GroupListItem | null>(null)
  const [existingCoTrainers, setExistingCoTrainers] = React.useState<string[]>([])
  const [existingMembers, setExistingMembers] = React.useState<string[]>([])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.length >= 2 || filters.search.length === 0) {
        setDebouncedSearch(filters.search)
        setCurrentPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch groups from API
  const fetchGroups = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", currentPage.toString())
      params.set("limit", PAGE_SIZE.toString())

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }

      const response = await fetch(`/api/groups?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching groups:", errorData)
        toast.error("Fehler beim Laden der Gruppen")
        return
      }

      const data = await response.json()
      setGroups(data.groups || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching groups:", error)
      toast.error("Fehler beim Laden der Gruppen")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedSearch])

  // Fetch trainers (profiles with trainer/vorstand role)
  const fetchTrainers = React.useCallback(async () => {
    try {
      const response = await fetch("/api/members?roles=trainer,vorstand&limit=999")

      if (!response.ok) {
        console.error("Error fetching trainers")
        return
      }

      const data = await response.json()
      const trainerList: TrainerOption[] = (data.members || []).map(
        (m: { id: string; first_name: string; last_name: string }) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
        })
      )
      setTrainers(trainerList)
    } catch (error) {
      console.error("Error fetching trainers:", error)
    }
  }, [])

  // Fetch all members for assignment
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
    fetchTrainers()
  }, [fetchTrainers])

  React.useEffect(() => {
    fetchAllMembers()
  }, [fetchAllMembers])

  // Handlers
  function handleNewGroup() {
    setEditingGroup(null)
    setExistingCoTrainers([])
    setExistingMembers([])
    setFormOpen(true)
  }

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

  function handleManageMembers(group: GroupListItem) {
    // Open the form directly on the members tab by editing the group
    handleEditGroup(group)
  }

  async function handleGroupSubmit(
    data: GroupFormData & { co_trainer_ids: string[]; member_ids: string[] }
  ) {
    try {
      if (editingGroup) {
        // Update existing group
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
      } else {
        // Create new group
        const response = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success(`Gruppe "${data.name}" wurde erstellt`)
      }

      await fetchGroups()
    } catch (error) {
      console.error("Error saving group:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern der Gruppe"
      )
      throw error
    }
  }

  async function handleToggleStatus(id: string, newStatus: boolean) {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Ändern des Status")
      }

      toast.success(
        newStatus
          ? "Gruppe erfolgreich aktiviert"
          : "Gruppe erfolgreich deaktiviert"
      )
      await fetchGroups()
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Ändern des Status"
      )
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gruppenverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Vereinsgruppen.
          </p>
        </div>
        <Button onClick={handleNewGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Gruppe
        </Button>
      </div>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Gruppen</CardTitle>
          <CardDescription>{totalCount} Gruppen insgesamt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupsToolbar filters={filters} onFiltersChange={setFilters} />

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <GroupsTable
              groups={groups}
              onEdit={handleEditGroup}
              onToggleStatus={handleToggleStatus}
              onManageMembers={handleManageMembers}
            />
          )}

          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Group Form Dialog */}
      <GroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editingGroup}
        trainers={trainers}
        allMembers={allMembers}
        existingCoTrainers={existingCoTrainers}
        existingMembers={existingMembers}
        onSubmit={handleGroupSubmit}
        isVorstand={true}
      />
    </div>
  )
}
