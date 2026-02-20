"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ItemForm } from "@/components/inventory/item-form"
import { Category, ItemFormData } from "@/lib/validations/inventory"

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[200px]" />
    </div>
  )
}

export default function NewItemPage() {
  const router = useRouter()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/inventory/categories")
        if (!response.ok) throw new Error("Failed to fetch categories")
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error("Error loading categories:", error)
        toast.error("Fehler beim Laden der Kategorien")
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [])

  async function handleSubmit(data: ItemFormData, images: File[]) {
    try {
      // First create the item
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          purchase_price: data.purchase_price ? parseFloat(String(data.purchase_price)) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Erstellen")
      }

      const { item } = await response.json()

      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData()
          formData.append("file", image)

          const uploadResponse = await fetch(`/api/inventory/items/${item.id}/images`, {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            console.error("Failed to upload image:", image.name)
          }
        }
      }

      toast.success("Item erfolgreich erstellt")
      router.push("/admin/inventory")
    } catch (error) {
      console.error("Error creating item:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen")
      throw error
    }
  }

  function handleCancel() {
    router.push("/admin/inventory")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Neues Item erfassen</h1>
          <p className="text-muted-foreground">
            Erfassen Sie ein neues Inventar-Item mit allen Details.
          </p>
        </div>
      </div>

      {/* Form */}
      {isLoading ? (
        <FormSkeleton />
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Keine Kategorien vorhanden. Bitte erstellen Sie zuerst eine Kategorie.
          </p>
          <Button asChild>
            <Link href="/admin/inventory/categories">Kategorien verwalten</Link>
          </Button>
        </div>
      ) : (
        <ItemForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
