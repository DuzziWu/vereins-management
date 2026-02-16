"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkgroupsTable } from "@/components/workgroups/workgroups-table"
import { WorkgroupsToolbar, WorkgroupsFilters } from "@/components/workgroups/workgroups-toolbar"
import { WorkgroupForm, WorkgroupListItem, WorkgroupCategory, MemberOption } from "@/components/workgroups/workgroup-form"
import { MembersPagination } from "@/components/members/members-pagination"
import { WorkgroupFormData } from "@/lib/validations/workgroups"
import { createClient } from "@/lib/supabase/client"

const PAGE_SIZE = 20

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

export default function AdminWorkgroupsPage() {
  const [workgroups, setWorkgroups] = React.useState<WorkgroupListItem[]>([])
  const [categories, setCategories] = React.useState<WorkgroupCategory[]>([])
  const [allMembers, setAllMembers] = React.useState<MemberOption[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState<"active" | "archived">("active")

  const [filters, setFilters] = React.useState<WorkgroupsFilters>({
    search: "",
    categoryId: null,
  })

  // Form states
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingWorkgroup, setEditingWorkgroup] = React.useState<WorkgroupListItem | null>(null)
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

  // Fetch current user's profile ID
  React.useEffect(() => {
    async function fetchCurrentUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get the profile ID (not auth UID) for workgroup_members
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        setCurrentUserId(profile?.id || "")
      }
    }
    fetchCurrentUser()
  }, [])

  // Fetch workgroups
  const fetchWorkgroups = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", currentPage.toString())
      params.set("limit", PAGE_SIZE.toString())
      params.set("status", activeTab)

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }
      if (filters.categoryId) {
        params.set("category_id", filters.categoryId)
      }

      const response = await fetch(`/api/workgroups?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching workgroups:", errorData)
        toast.error("Fehler beim Laden der Workgroups")
        return
      }

      const data = await response.json()
      setWorkgroups(data.workgroups || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching workgroups:", error)
      toast.error("Fehler beim Laden der Workgroups")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.categoryId, activeTab])

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/workgroup-categories")

      if (!response.ok) {
        console.error("Error fetching categories")
        return
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  // Fetch all members
  const fetchAllMembers = React.useCallback(async () => {
    try {
      const response = await fetch("/api/members?limit=999&statuses=active")

      if (!response.ok) {
        console.error("Error fetching members")
        return
      }

      const data = await response.json()
      const memberList: MemberOption[] = (data.members || []).map(
        (m: { id: string; first_name: string; last_name: string }) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
        })
      )
      setAllMembers(memberList)
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchWorkgroups()
  }, [fetchWorkgroups])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  React.useEffect(() => {
    fetchAllMembers()
  }, [fetchAllMembers])

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Handlers
  function handleNewWorkgroup() {
    setEditingWorkgroup(null)
    setExistingMembers([])
    setFormOpen(true)
  }

  async function handleEditWorkgroup(workgroup: WorkgroupListItem) {
    setEditingWorkgroup(workgroup)

    // Fetch workgroup details to get members
    try {
      const response = await fetch(`/api/workgroups/${workgroup.id}`)
      if (response.ok) {
        const data = await response.json()
        const memberIds = (data.workgroup?.members || []).map(
          (m: { profile_id: string }) => m.profile_id
        )
        setExistingMembers(memberIds)
      } else {
        setExistingMembers([])
      }
    } catch {
      setExistingMembers([])
    }

    setFormOpen(true)
  }

  function handleManageMembers(workgroup: WorkgroupListItem) {
    handleEditWorkgroup(workgroup)
  }

  async function handleWorkgroupSubmit(data: WorkgroupFormData) {
    try {
      if (editingWorkgroup) {
        // Update existing workgroup
        const response = await fetch(`/api/workgroups/${editingWorkgroup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }

        toast.success("Workgroup erfolgreich aktualisiert")
      } else {
        // Create new workgroup
        const response = await fetch("/api/workgroups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success(`Workgroup "${data.name}" wurde erstellt`)
      }

      await fetchWorkgroups()
    } catch (error) {
      console.error("Error saving workgroup:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern der Workgroup"
      )
      throw error
    }
  }

  async function handleArchive(id: string) {
    try {
      const response = await fetch(`/api/workgroups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Archivieren")
      }

      toast.success("Workgroup erfolgreich archiviert")
      await fetchWorkgroups()
    } catch (error) {
      console.error("Error archiving workgroup:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Archivieren der Workgroup"
      )
    }
  }

  async function handleRestore(id: string) {
    try {
      const response = await fetch(`/api/workgroups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Wiederherstellen")
      }

      toast.success("Workgroup erfolgreich wiederhergestellt")
      await fetchWorkgroups()
    } catch (error) {
      console.error("Error restoring workgroup:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Wiederherstellen der Workgroup"
      )
    }
  }

  async function handleCreateCategory(name: string): Promise<WorkgroupCategory | null> {
    try {
      const response = await fetch("/api/workgroup-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Erstellen der Kategorie")
      }

      const data = await response.json()
      toast.success(`Kategorie "${name}" wurde erstellt`)
      await fetchCategories()
      return data.category
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Erstellen der Kategorie"
      )
      return null
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Workgroups</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Projektgruppen für Vereinsaufgaben.
          </p>
        </div>
        <Button onClick={handleNewWorkgroup} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Neue Workgroup
        </Button>
      </div>

      {/* Workgroups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Workgroups</CardTitle>
          <CardDescription>{totalCount} Workgroups insgesamt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")}>
            <TabsList>
              <TabsTrigger value="active">Aktiv</TabsTrigger>
              <TabsTrigger value="archived">Archiviert</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <WorkgroupsToolbar
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>

            <TabsContent value="active" className="mt-4">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <WorkgroupsTable
                  workgroups={workgroups}
                  onEdit={handleEditWorkgroup}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onManageMembers={handleManageMembers}
                />
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-4">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <WorkgroupsTable
                  workgroups={workgroups}
                  onEdit={handleEditWorkgroup}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onManageMembers={handleManageMembers}
                  showArchived
                />
              )}
            </TabsContent>
          </Tabs>

          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Workgroup Form Dialog */}
      <WorkgroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        workgroup={editingWorkgroup}
        categories={categories}
        allMembers={allMembers}
        existingMembers={existingMembers}
        currentUserId={currentUserId}
        onSubmit={handleWorkgroupSubmit}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  )
}
