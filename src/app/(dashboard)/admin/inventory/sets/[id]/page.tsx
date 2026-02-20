"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, Package } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatusBadge } from "@/components/inventory/status-badge"
import { SetForm } from "@/components/inventory/set-form"
import {
  InventoryItem,
  InventorySet,
  SetFormData,
  ItemStatus,
} from "@/lib/validations/inventory"

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  )
}

// Compute worst status from set items
function computeSetStatus(items: InventoryItem[] | undefined): ItemStatus {
  if (!items || items.length === 0) return "available"

  const statusPriority: ItemStatus[] = ["defective", "loaned", "in_cleaning", "reserved", "available"]

  for (const status of statusPriority) {
    if (items.some((item) => item.status === status)) {
      return status
    }
  }

  return "available"
}

export default function SetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const setId = params.id as string

  const [set, setSet] = React.useState<InventorySet | null>(null)
  const [allItems, setAllItems] = React.useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Dialogs
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Fetch set
  const fetchSet = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/sets/${setId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Set nicht gefunden")
          router.push("/admin/inventory/sets")
          return
        }
        throw new Error("Failed to fetch set")
      }
      const data = await response.json()
      setSet(data.set)
    } catch (error) {
      console.error("Error fetching set:", error)
      toast.error("Fehler beim Laden des Sets")
    }
  }, [setId, router])

  // Fetch all items for editing
  const fetchItems = React.useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/items?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch items")
      const data = await response.json()
      setAllItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }, [])

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await Promise.all([fetchSet(), fetchItems()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchSet, fetchItems])

  async function handleUpdate(data: SetFormData) {
    try {
      const response = await fetch(`/api/inventory/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      toast.success("Set erfolgreich aktualisiert")
      setFormOpen(false)
      await fetchSet()
    } catch (error) {
      console.error("Error updating set:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren")
      throw error
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/inventory/sets/${setId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Set erfolgreich gelöscht")
      router.push("/admin/inventory/sets")
    } catch (error) {
      console.error("Error deleting set:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    }
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!set) {
    return null
  }

  const setStatus = computeSetStatus(set.items)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/inventory/sets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{set.name}</h1>
              <StatusBadge status={setStatus} />
            </div>
            {set.description && (
              <p className="text-muted-foreground">{set.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Enthaltene Items</CardTitle>
          <CardDescription>
            {set.items?.length || 0} Items in diesem Set
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!set.items || set.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Items in diesem Set.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Größe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {set.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0].public_url || ""}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.status === "loaned" && item.current_holder && (
                          <p className="text-xs text-muted-foreground">
                            an {item.current_holder.first_name} {item.current_holder.last_name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.category?.icon && <span>{item.category.icon}</span>}
                          <span>{item.category?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{item.size_info || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Erstellt am: {new Date(set.created_at).toLocaleDateString("de-DE")}</p>
            <p>Aktualisiert am: {new Date(set.updated_at).toLocaleDateString("de-DE")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <SetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        set={set}
        items={allItems}
        onSubmit={handleUpdate}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das Set &quot;{set.name}&quot; löschen möchten?
              Die Items bleiben erhalten, nur die Gruppierung wird aufgelöst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
