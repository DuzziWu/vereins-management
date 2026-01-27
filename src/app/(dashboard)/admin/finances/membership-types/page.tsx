"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MembershipTypesTable,
  MembershipTypeWithCount,
  MembershipTypeForm,
} from "@/components/finances"
import { MembershipTypeFormData } from "@/lib/validations/membership-type"
import { createClient } from "@/lib/supabase/client"

export default function MembershipTypesPage() {
  const [membershipTypes, setMembershipTypes] = React.useState<MembershipTypeWithCount[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingType, setEditingType] = React.useState<MembershipTypeWithCount | null>(null)

  const supabase = createClient()

  // Fetch membership types with member counts
  const fetchMembershipTypes = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch membership types
      const { data: types, error: typesError } = await supabase
        .from("membership_types")
        .select("*")
        .order("name")

      if (typesError) throw typesError

      // Fetch member counts for each type
      const typesWithCounts: MembershipTypeWithCount[] = await Promise.all(
        (types || []).map(async (type) => {
          const { data: countData } = await supabase
            .rpc("get_membership_type_member_count", { type_id: type.id })

          return {
            ...type,
            member_count: countData ?? 0,
          }
        })
      )

      setMembershipTypes(typesWithCounts)
    } catch (error) {
      console.error("Error fetching membership types:", error)
      toast.error("Fehler beim Laden der Beitragsarten")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchMembershipTypes()
  }, [fetchMembershipTypes])

  // Create or update membership type
  async function handleSubmit(data: MembershipTypeFormData) {
    try {
      if (editingType) {
        // Update existing
        const { error } = await supabase
          .from("membership_types")
          .update({
            name: data.name,
            annual_fee: data.annual_fee,
            description: data.description || null,
          })
          .eq("id", editingType.id)

        if (error) {
          if (error.code === "23505") {
            toast.error("Eine Beitragsart mit diesem Namen existiert bereits")
            return
          }
          throw error
        }

        toast.success("Beitragsart aktualisiert")
      } else {
        // Create new
        const { error } = await supabase.from("membership_types").insert({
          name: data.name,
          annual_fee: data.annual_fee,
          description: data.description || null,
        })

        if (error) {
          if (error.code === "23505") {
            toast.error("Eine Beitragsart mit diesem Namen existiert bereits")
            return
          }
          throw error
        }

        toast.success("Beitragsart erstellt")
      }

      await fetchMembershipTypes()
      setEditingType(null)
    } catch (error) {
      console.error("Error saving membership type:", error)
      toast.error("Fehler beim Speichern der Beitragsart")
      throw error
    }
  }

  // Delete membership type
  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("membership_types").delete().eq("id", id)

      if (error) throw error

      toast.success("Beitragsart gelöscht")
      await fetchMembershipTypes()
    } catch (error) {
      console.error("Error deleting membership type:", error)
      toast.error("Fehler beim Löschen der Beitragsart")
    }
  }

  function handleEdit(type: MembershipTypeWithCount) {
    setEditingType(type)
    setIsFormOpen(true)
  }

  function handleOpenChange(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingType(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beitragsarten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Beitragsarten für Ihre Vereinsmitglieder
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Beitragsart
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <MembershipTypesTable
          membershipTypes={membershipTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      )}

      {/* Form Modal */}
      <MembershipTypeForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        membershipType={editingType}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
