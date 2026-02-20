"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2, Package, Filter, LayoutGrid } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { CategoryForm } from "@/components/inventory/category-form"
import { Category, CategoryFormData } from "@/lib/validations/inventory"

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Form state
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/inventory/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Fehler beim Laden der Kategorien")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function handleNewCategory() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setFormOpen(true)
  }

  function handleDeleteClick(category: Category) {
    if (category.item_count && category.item_count > 0) {
      toast.error(`Diese Kategorie enthält ${category.item_count} Items. Bitte zuerst alle Items löschen oder einer anderen Kategorie zuweisen.`)
      return
    }
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  async function handleCategorySubmit(data: CategoryFormData) {
    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/inventory/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Aktualisieren")
        }

        toast.success("Kategorie erfolgreich aktualisiert")
      } else {
        // Create new category
        const response = await fetch("/api/inventory/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Fehler beim Erstellen")
        }

        toast.success("Kategorie erfolgreich erstellt")
      }

      await fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
      throw error
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/inventory/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Kategorie erfolgreich gelöscht")
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Inventar</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Inventar-Kategorien.
          </p>
        </div>
        <Button onClick={handleNewCategory} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Neue Kategorie
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" asChild>
            <Link href="/admin/inventory" className="gap-2">
              <Package className="h-4 w-4" />
              Items
            </Link>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Filter className="h-4 w-4" />
            Kategorien
          </TabsTrigger>
          <TabsTrigger value="sets" asChild>
            <Link href="/admin/inventory/sets" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Sets
            </Link>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Alle Kategorien</CardTitle>
            <CardDescription>
              {categories.length} Kategorien definiert
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
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Keine Kategorien vorhanden. Erstellen Sie Ihre erste Kategorie.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 font-medium">
                              {category.icon && <span className="text-lg">{category.icon}</span>}
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.item_count || 0}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(category)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSubmit={handleCategorySubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Kategorie &quot;{categoryToDelete?.name}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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
