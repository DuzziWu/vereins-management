"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, History } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
import { ItemForm } from "@/components/inventory/item-form"
import { StatusBadge } from "@/components/inventory/status-badge"
import { ItemStatusDialog } from "@/components/inventory/item-status-dialog"
import {
  Category,
  InventoryItem,
  ItemFormData,
  ItemStatus,
  CONDITION_CONFIG,
  STATUS_CONFIG,
  StatusLogEntry,
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
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  )
}

export default function ItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string

  const [item, setItem] = React.useState<InventoryItem | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [statusLog, setStatusLog] = React.useState<StatusLogEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)

  // Fetch item
  const fetchItem = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Item nicht gefunden")
          router.push("/admin/inventory")
          return
        }
        throw new Error("Failed to fetch item")
      }
      const data = await response.json()
      setItem(data.item)
    } catch (error) {
      console.error("Error fetching item:", error)
      toast.error("Fehler beim Laden des Items")
    }
  }, [itemId, router])

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/inventory/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  // Fetch status log
  const fetchStatusLog = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}/status-log`)
      if (!response.ok) throw new Error("Failed to fetch status log")
      const data = await response.json()
      setStatusLog(data.log || [])
    } catch (error) {
      console.error("Error fetching status log:", error)
    }
  }, [itemId])

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await Promise.all([fetchItem(), fetchCategories()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchItem, fetchCategories])

  React.useEffect(() => {
    if (showHistory) {
      fetchStatusLog()
    }
  }, [showHistory, fetchStatusLog])

  async function handleUpdate(data: ItemFormData, images: File[]) {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          purchase_price: data.purchase_price ? parseFloat(String(data.purchase_price)) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      // Upload new images if any
      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData()
          formData.append("file", image)

          const uploadResponse = await fetch(`/api/inventory/items/${itemId}/images`, {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            console.error("Failed to upload image:", image.name)
          }
        }
      }

      toast.success("Item erfolgreich aktualisiert")
      setIsEditing(false)
      await fetchItem()
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren")
      throw error
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Item erfolgreich archiviert")
      router.push("/admin/inventory")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
    }
  }

  async function handleStatusChange(data: { status: ItemStatus; holder_id?: string | null; note?: string }) {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Ändern des Status")
      }

      toast.success(`Status geändert auf "${STATUS_CONFIG[data.status].label}"`)
      await fetchItem()
      if (showHistory) {
        await fetchStatusLog()
      }
    } catch (error) {
      console.error("Error changing status:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Ändern des Status")
      throw error
    }
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!item) {
    return null
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Item bearbeiten</h1>
            <p className="text-muted-foreground">{item.name}</p>
          </div>
        </div>
        <ItemForm
          item={item}
          categories={categories}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">{item.name}</h1>
              <button onClick={() => setStatusDialogOpen(true)}>
                <StatusBadge status={item.status} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {item.category?.icon && <span>{item.category.icon}</span>}
              <span>{item.category?.name}</span>
              {item.inventory_number && (
                <>
                  <span>•</span>
                  <span className="font-mono">{item.inventory_number}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {item.images && item.images.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {item.images.map((image, index) => (
                    <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.public_url}
                        alt={`${item.name} - Bild ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {item.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{item.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Status-Verlauf</CardTitle>
                <CardDescription>Änderungen am Status</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="mr-2 h-4 w-4" />
                {showHistory ? "Ausblenden" : "Anzeigen"}
              </Button>
            </CardHeader>
            {showHistory && (
              <CardContent>
                {statusLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Statusänderungen vorhanden.</p>
                ) : (
                  <div className="space-y-4">
                    {statusLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-4 text-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {entry.old_status && (
                              <>
                                <StatusBadge status={entry.old_status} showDot={false} />
                                <span>→</span>
                              </>
                            )}
                            <StatusBadge status={entry.new_status} showDot={false} />
                          </div>
                          {entry.holder && (
                            <p className="text-muted-foreground mt-1">
                              Verliehen an: {entry.holder.first_name} {entry.holder.last_name}
                            </p>
                          )}
                          {entry.note && (
                            <p className="text-muted-foreground mt-1">{entry.note}</p>
                          )}
                        </div>
                        <div className="text-right text-muted-foreground">
                          <p>{new Date(entry.created_at).toLocaleDateString("de-DE")}</p>
                          <p className="text-xs">
                            {entry.changed_by_profile?.first_name} {entry.changed_by_profile?.last_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Zustand</span>
                <span>{CONDITION_CONFIG[item.condition].label}</span>

                {item.size_info && (
                  <>
                    <span className="text-muted-foreground">Größe/Maße</span>
                    <span>{item.size_info}</span>
                  </>
                )}

                {item.purchase_date && (
                  <>
                    <span className="text-muted-foreground">Anschaffungsdatum</span>
                    <span>{new Date(item.purchase_date).toLocaleDateString("de-DE")}</span>
                  </>
                )}

                {item.purchase_price !== null && (
                  <>
                    <span className="text-muted-foreground">Anschaffungspreis</span>
                    <span>{item.purchase_price.toFixed(2)} €</span>
                  </>
                )}
              </div>

              {item.status === "loaned" && item.current_holder && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Verliehen an</p>
                    <p className="font-medium">
                      {item.current_holder.first_name} {item.current_holder.last_name}
                    </p>
                    {item.loaned_at && (
                      <p className="text-xs text-muted-foreground">
                        seit {new Date(item.loaned_at).toLocaleDateString("de-DE")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {item.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Interne Notizen</CardTitle>
                <CardDescription>Nur für Vorstand sichtbar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Erstellt am: {new Date(item.created_at).toLocaleDateString("de-DE")}</p>
                <p>Aktualisiert am: {new Date(item.updated_at).toLocaleDateString("de-DE")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Dialog */}
      <ItemStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        item={item}
        onSubmit={handleStatusChange}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.status === "loaned" ? (
                <span className="text-destructive">
                  Dieses Item ist aktuell verliehen an {item.current_holder?.first_name} {item.current_holder?.last_name}.
                  Bitte zuerst die Rückgabe erfassen.
                </span>
              ) : (
                <>
                  Das Item &quot;{item.name}&quot; wird archiviert und ist nicht mehr in der Liste sichtbar.
                  Diese Aktion kann rückgängig gemacht werden.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={item.status === "loaned"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
