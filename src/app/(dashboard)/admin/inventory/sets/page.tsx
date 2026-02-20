"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Package, Filter, LayoutGrid, MoreHorizontal, Pencil, Trash2, Play } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  STATUS_CONFIG,
} from "@/lib/validations/inventory"

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      ))}
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

export default function SetsPage() {
  const [sets, setSets] = React.useState<InventorySet[]>([])
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Form state
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingSet, setEditingSet] = React.useState<InventorySet | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [setToDelete, setSetToDelete] = React.useState<InventorySet | null>(null)

  // Loan dialog state
  const [loanDialogOpen, setLoanDialogOpen] = React.useState(false)
  const [setToLoan, setSetToLoan] = React.useState<InventorySet | null>(null)

  // Fetch sets
  const fetchSets = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/inventory/sets")
      if (!response.ok) throw new Error("Failed to fetch sets")
      const data = await response.json()
      setSets(data.sets || [])
    } catch (error) {
      console.error("Error fetching sets:", error)
      toast.error("Fehler beim Laden der Sets")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch items for form
  const fetchItems = React.useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/items?limit=1000")
      if (!response.ok) throw new Error("Failed to fetch items")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }, [])

  React.useEffect(() => {
    fetchSets()
    fetchItems()
  }, [fetchSets, fetchItems])

  function handleNewSet() {
    setEditingSet(null)
    setFormOpen(true)
  }

  function handleEditSet(set: InventorySet) {
    setEditingSet(set)
    setFormOpen(true)
  }

  function handleDeleteClick(set: InventorySet) {
    setSetToDelete(set)
    setDeleteDialogOpen(true)
  }

  function handleLoanClick(set: InventorySet) {
    // Check if any items are already loaned
    const loanedItems = set.items?.filter((item) => item.status === "loaned") || []
    if (loanedItems.length > 0 && loanedItems.length < (set.items?.length || 0)) {
      toast.warning(`${loanedItems.length} von ${set.items?.length} Items sind bereits verliehen`)
    }
    setSetToLoan(set)
    setLoanDialogOpen(true)
  }

  async function handleSetSubmit(data: SetFormData) {
    try {
      if (editingSet) {
        // Update existing set
        const response = await fetch(`/api/inventory/sets/${editingSet.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }

        toast.success("Set erfolgreich aktualisiert")
      } else {
        // Create new set
        const response = await fetch("/api/inventory/sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success("Set erfolgreich erstellt")
      }

      await fetchSets()
    } catch (error) {
      console.error("Error saving set:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
      throw error
    }
  }

  async function handleDeleteSet() {
    if (!setToDelete) return

    try {
      const response = await fetch(`/api/inventory/sets/${setToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Set erfolgreich gelöscht")
      await fetchSets()
    } catch (error) {
      console.error("Error deleting set:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    } finally {
      setDeleteDialogOpen(false)
      setSetToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Inventar</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Item-Sets für zusammengehörige Gegenstände.
          </p>
        </div>
        <Button onClick={handleNewSet} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Neues Set
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" asChild>
            <Link href="/admin/inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Items
            </Link>
          </TabsTrigger>
          <TabsTrigger value="categories" asChild>
            <Link href="/admin/inventory/categories" className="gap-2">
              <Filter className="h-4 w-4" />
              Kategorien
            </Link>
          </TabsTrigger>
          <TabsTrigger value="sets" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Sets
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Alle Sets</CardTitle>
            <CardDescription>
              {sets.length} Sets definiert
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Keine Sets vorhanden. Erstellen Sie Ihr erstes Set.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sets.map((set) => {
                        const setStatus = computeSetStatus(set.items)
                        return (
                          <TableRow key={set.id}>
                            <TableCell>
                              <Link
                                href={`/admin/inventory/sets/${set.id}`}
                                className="font-medium hover:underline"
                              >
                                {set.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {set.description || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{set.item_count || set.items?.length || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={setStatus} />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleLoanClick(set)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Set verleihen
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEditSet(set)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(set)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Set Form Dialog */}
      <SetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        set={editingSet}
        items={items}
        onSubmit={handleSetSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das Set &quot;{setToDelete?.name}&quot; löschen möchten?
              Die Items bleiben erhalten, nur die Gruppierung wird aufgelöst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loan Dialog - simplified for now */}
      <AlertDialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set verleihen</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Funktion wird in einer zukünftigen Version verfügbar sein.
              Aktuell können Sie einzelne Items über die Items-Übersicht verleihen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Schließen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
