"use client"

import * as React from "react"
import { Plus, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
import { CategoryList } from "@/components/finances/category-list"
import { CategoryForm, type CategoryFormSubmitData } from "@/components/finances/category-form"
import type { TransactionCategory } from "@/components/finances/treasury-toolbar"

export default function TreasuryCategoriesPage() {
  const [categories, setCategories] = React.useState<TransactionCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"income" | "expense">("income")

  // Form state
  const [showForm, setShowForm] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<TransactionCategory | null>(null)

  // Delete dialog state
  const [deletingCategory, setDeletingCategory] = React.useState<TransactionCategory | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/treasury/categories")
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

  // Handlers
  function handleNew() {
    setEditingCategory(null)
    setShowForm(true)
  }

  function handleEdit(category: TransactionCategory) {
    setEditingCategory(category)
    setShowForm(true)
  }

  function handleDelete(category: TransactionCategory) {
    setDeletingCategory(category)
  }

  async function handleFormSubmit(data: CategoryFormSubmitData) {
    try {
      if (editingCategory) {
        // Update
        const response = await fetch(`/api/treasury/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            icon: data.icon,
            color: data.color,
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update category")
        }
        toast.success("Kategorie aktualisiert")
      } else {
        // Create
        const response = await fetch("/api/treasury/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create category")
        }
        toast.success("Kategorie erstellt")
      }

      await fetchCategories()
    } catch (error) {
      console.error("Error submitting category:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
      throw error
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCategory) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/treasury/categories/${deletingCategory.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete category")
      }
      toast.success("Kategorie gelöscht")
      setDeletingCategory(null)
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/finances/treasury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Zurück</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kategorien</h1>
            <p className="text-muted-foreground">
              Einnahme- und Ausgabe-Kategorien verwalten
            </p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Kategorie
        </Button>
      </div>

      {/* Tabs: Income / Expense */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "income" | "expense")}>
          <TabsList>
            <TabsTrigger value="income">
              Einnahmen ({categories.filter((c) => c.type === "income").length})
            </TabsTrigger>
            <TabsTrigger value="expense">
              Ausgaben ({categories.filter((c) => c.type === "expense").length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="income" className="mt-4">
            <CategoryList
              categories={categories}
              type="income"
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="expense" className="mt-4">
            <CategoryList
              categories={categories}
              type="expense"
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Category Form Modal */}
      <CategoryForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingCategory(null)
        }}
        category={editingCategory}
        defaultType={activeTab}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Kategorie &quot;{deletingCategory?.name}&quot; wirklich löschen?
              Dies ist nur möglich, wenn keine Buchungen dieser Kategorie zugeordnet sind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
