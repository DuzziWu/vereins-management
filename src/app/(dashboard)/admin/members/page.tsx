"use client"

import * as React from "react"
import { Plus, Users, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MembersTable, Member, SortConfig, SortColumn, SortOrder } from "@/components/members/members-table"
import { MembersToolbar, MembersFilters } from "@/components/members/members-toolbar"
import { MembersPagination } from "@/components/members/members-pagination"
import { MemberForm } from "@/components/members/member-form"
import { FamiliesList } from "@/components/members/families-list"
import { FamilyForm } from "@/components/members/family-form"
import { MemberFormData, MemberStatus } from "@/lib/validations/member"

const PAGE_SIZE = 20

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  role: string
  status: MemberStatus
}

interface Family {
  id: string
  name: string
  primary_member_id: string | null
  member_count: number
  primary_member?: {
    id: string
    first_name: string
    last_name: string
  } | null
  members?: FamilyMember[]
}

interface MembershipType {
  id: string
  name: string
  annual_fee: number
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

export default function MembersPage() {
  const [members, setMembers] = React.useState<Member[]>([])
  const [families, setFamilies] = React.useState<Family[]>([])
  const [membershipTypes, setMembershipTypes] = React.useState<MembershipType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [filters, setFilters] = React.useState<MembersFilters>({
    search: "",
    role: null,
    status: null,
    hasFamily: null,
  })
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    column: "last_name",
    order: "asc",
  })

  // Form states
  const [memberFormOpen, setMemberFormOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<Member | null>(null)
  const [familyFormOpen, setFamilyFormOpen] = React.useState(false)
  const [editingFamily, setEditingFamily] = React.useState<Family | null>(null)

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

  // Fetch members from API
  const fetchMembers = React.useCallback(async () => {
    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      params.set("page", currentPage.toString())
      params.set("limit", PAGE_SIZE.toString())

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }
      if (filters.role) {
        params.set("roles", filters.role)
      }
      if (filters.status) {
        params.set("statuses", filters.status)
      }
      if (filters.hasFamily !== null) {
        params.set("hasFamily", filters.hasFamily.toString())
      }

      // Add sorting parameters
      params.set("sortBy", sortConfig.column)
      params.set("sortOrder", sortConfig.order)

      const response = await fetch(`/api/members?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching members:", errorData)
        toast.error("Fehler beim Laden der Mitglieder")
        return
      }

      const data = await response.json()

      // Map API response to Member type
      const mappedMembers: Member[] = (data.members || []).map((profile: Member & { families?: { id: string; name: string; primary_member_id: string | null } | null; membership_types?: { id: string; name: string; annual_fee: number } | null }) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || null,
        role: profile.role,
        status: profile.status || "active",
        family_id: profile.family_id || null,
        family_name: profile.families?.name || null,
        membership_type_id: profile.membership_type_id || null,
        membership_type_name: profile.membership_types?.name || null,
        date_of_birth: profile.date_of_birth,
        phone: profile.phone,
        address_street: profile.address_street,
        address_zip: profile.address_zip,
        address_city: profile.address_city,
        functional_tags: profile.functional_tags,
        notes: profile.notes,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        families: profile.families,
        membership_types: profile.membership_types,
      }))

      setMembers(mappedMembers)
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.role, filters.status, filters.hasFamily, sortConfig])

  // Fetch families from API
  const fetchFamilies = React.useCallback(async () => {
    try {
      const response = await fetch("/api/families")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching families:", errorData)
        // Don't show error toast for families since it's not critical
        return
      }

      const data = await response.json()
      setFamilies(data.families || [])
    } catch (error) {
      console.error("Error fetching families:", error)
    }
  }, [])

  // Fetch membership types from API
  const fetchMembershipTypes = React.useCallback(async () => {
    try {
      const response = await fetch("/api/membership-types")

      if (!response.ok) {
        console.error("Error fetching membership types")
        return
      }

      const data = await response.json()
      setMembershipTypes(data.membershipTypes || [])
    } catch (error) {
      console.error("Error fetching membership types:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  React.useEffect(() => {
    fetchFamilies()
  }, [fetchFamilies])

  React.useEffect(() => {
    fetchMembershipTypes()
  }, [fetchMembershipTypes])

  // Handlers
  function handleEditMember(member: Member) {
    setEditingMember(member)
    setMemberFormOpen(true)
  }

  function handleNewMember() {
    setEditingMember(null)
    setMemberFormOpen(true)
  }

  async function handleMemberSubmit(data: MemberFormData) {
    try {
      // Clean up family_id and membership_type_id if they're "none" or empty
      const cleanedData = {
        ...data,
        family_id: data.family_id && data.family_id !== "none" ? data.family_id : undefined,
        membership_type_id: data.membership_type_id && data.membership_type_id !== "none" ? data.membership_type_id : undefined,
      }

      if (editingMember) {
        // Update existing member
        const response = await fetch(`/api/members/${editingMember.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }

        toast.success("Mitglied erfolgreich aktualisiert")
      } else {
        // Create new member
        const response = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success("Mitglied erfolgreich angelegt")
      }

      await fetchMembers()
      await fetchFamilies() // Refresh families in case member was assigned to one
    } catch (error) {
      console.error("Error saving member:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern des Mitglieds")
      throw error
    }
  }

  async function handleStatusChange(id: string, newStatus: MemberStatus) {
    try {
      const response = await fetch(`/api/members/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Ändern des Status")
      }

      toast.success(
        newStatus === "active"
          ? "Mitglied erfolgreich aktiviert"
          : "Mitglied erfolgreich deaktiviert"
      )
      await fetchMembers()
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Ändern des Status")
    }
  }

  async function handleBulkStatusChange(ids: string[], newStatus: MemberStatus) {
    try {
      // Process all status changes in parallel
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/members/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      )

      const successCount = results.filter((r) => r.status === "fulfilled").length
      const failCount = results.filter((r) => r.status === "rejected").length

      if (failCount > 0) {
        toast.warning(`${successCount} Mitglieder deaktiviert, ${failCount} fehlgeschlagen`)
      } else {
        toast.success(`${successCount} Mitglieder erfolgreich deaktiviert`)
      }

      await fetchMembers()
    } catch (error) {
      console.error("Error bulk changing status:", error)
      toast.error("Fehler bei der Massenänderung")
    }
  }

  async function handleAssignToFamily(memberId: string, familyId: string) {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: familyId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Zuweisen zur Familie")
      }

      toast.success("Mitglied erfolgreich zur Familie hinzugefügt")
      await fetchMembers()
      await fetchFamilies()
    } catch (error) {
      console.error("Error assigning to family:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Zuweisen zur Familie")
    }
  }

  function handleEditFamily(family: Family) {
    setEditingFamily(family)
    setFamilyFormOpen(true)
  }

  function handleNewFamily() {
    setEditingFamily(null)
    setFamilyFormOpen(true)
  }

  async function handleFamilySubmit(data: { name: string; primary_member_id: string; member_ids: string[] }) {
    try {
      if (editingFamily) {
        // Update existing family
        const response = await fetch(`/api/families/${editingFamily.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }

        toast.success("Familie erfolgreich aktualisiert")
      } else {
        // Create new family
        const response = await fetch("/api/families", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success("Familie erfolgreich erstellt")
      }

      await fetchFamilies()
      await fetchMembers() // Refresh members to update family assignments
    } catch (error) {
      console.error("Error saving family:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern der Familie")
      throw error
    }
  }

  async function handleDeleteFamily(familyId: string) {
    try {
      const response = await fetch(`/api/families/${familyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Auflösen")
      }

      toast.success("Familie erfolgreich aufgelöst")
      await fetchFamilies()
      await fetchMembers() // Refresh members to clear family assignments
    } catch (error) {
      console.error("Error deleting family:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Auflösen der Familie")
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mitgliederverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Vereinsmitglieder und Familien.
          </p>
        </div>
        <Button onClick={handleNewMember}>
          <Plus className="mr-2 h-4 w-4" />
          Mitglied anlegen
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Mitglieder
          </TabsTrigger>
          <TabsTrigger value="families" className="gap-2">
            <UsersRound className="h-4 w-4" />
            Familien
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alle Mitglieder</CardTitle>
              <CardDescription>
                {totalCount} Mitglieder insgesamt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MembersToolbar filters={filters} onFiltersChange={setFilters} />

              {isLoading ? (
                <TableSkeleton />
              ) : (
                <MembersTable
                  members={members}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onEdit={handleEditMember}
                  onStatusChange={handleStatusChange}
                  onBulkStatusChange={handleBulkStatusChange}
                  onAssignToFamily={handleAssignToFamily}
                  families={families.map((f) => ({ id: f.id, name: f.name }))}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
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
        </TabsContent>

        {/* Families Tab */}
        <TabsContent value="families" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alle Familien</CardTitle>
                <CardDescription>
                  {families.length} Familien insgesamt
                </CardDescription>
              </div>
              <Button onClick={handleNewFamily} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Familie erstellen
              </Button>
            </CardHeader>
            <CardContent>
              <FamiliesList
                families={families}
                members={members}
                onEdit={handleEditFamily}
                onDelete={handleDeleteFamily}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Form Modal */}
      <MemberForm
        open={memberFormOpen}
        onOpenChange={setMemberFormOpen}
        member={editingMember}
        families={families.map((f) => ({ id: f.id, name: f.name }))}
        membershipTypes={membershipTypes}
        onSubmit={handleMemberSubmit}
      />

      {/* Family Form Modal */}
      <FamilyForm
        open={familyFormOpen}
        onOpenChange={setFamilyFormOpen}
        family={editingFamily}
        members={members}
        onSubmit={handleFamilySubmit}
      />
    </div>
  )
}
