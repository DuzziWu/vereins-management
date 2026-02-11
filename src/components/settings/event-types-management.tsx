"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { EventTypeForm } from "./event-type-form"
import {
  type EventType,
  type CreateEventTypeInput,
} from "@/lib/validations/event-types"
import { createClient } from "@/lib/supabase/client"

interface EventTypeWithCount extends EventType {
  event_count: number
}

export function EventTypesManagement() {
  const [eventTypes, setEventTypes] = React.useState<EventTypeWithCount[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingType, setEditingType] = React.useState<EventTypeWithCount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [typeToDelete, setTypeToDelete] = React.useState<EventTypeWithCount | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const supabase = createClient()

  const fetchEventTypes = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch event types with event count
      const { data: types, error: typesError } = await supabase
        .from("event_types")
        .select("*")
        .order("sort_order")

      if (typesError) throw typesError

      // Get event count for each type
      const typesWithCounts: EventTypeWithCount[] = await Promise.all(
        (types || []).map(async (type) => {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("event_type_id", type.id)

          return {
            ...type,
            event_count: count ?? 0,
          }
        })
      )

      setEventTypes(typesWithCounts)
    } catch (error) {
      console.error("Error fetching event types:", error)
      toast.error("Fehler beim Laden der Event-Typen")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchEventTypes()
  }, [fetchEventTypes])

  async function handleSubmit(data: CreateEventTypeInput) {
    try {
      if (editingType) {
        // Update existing
        const { error } = await supabase
          .from("event_types")
          .update({
            name: data.name,
            color: data.color,
            icon: data.icon,
          })
          .eq("id", editingType.id)

        if (error) {
          if (error.code === "23505") {
            toast.error("Ein Event-Typ mit diesem Namen existiert bereits")
            return
          }
          throw error
        }

        toast.success("Event-Typ aktualisiert")
      } else {
        // Create new
        // Get max sort_order
        const maxSort = Math.max(...eventTypes.map((t) => t.sort_order), 0)

        const { error } = await supabase.from("event_types").insert({
          name: data.name,
          color: data.color,
          icon: data.icon,
          sort_order: maxSort + 1,
        })

        if (error) {
          if (error.code === "23505") {
            toast.error("Ein Event-Typ mit diesem Namen existiert bereits")
            return
          }
          throw error
        }

        toast.success("Event-Typ erstellt")
      }

      await fetchEventTypes()
      setEditingType(null)
    } catch (error) {
      console.error("Error saving event type:", error)
      toast.error("Fehler beim Speichern des Event-Typs")
      throw error
    }
  }

  function handleEdit(type: EventTypeWithCount) {
    setEditingType(type)
    setIsFormOpen(true)
  }

  function handleDeleteClick(type: EventTypeWithCount) {
    setTypeToDelete(type)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!typeToDelete) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("event_types")
        .delete()
        .eq("id", typeToDelete.id)

      if (error) throw error

      toast.success("Event-Typ gelöscht")
      await fetchEventTypes()
    } catch (error) {
      console.error("Error deleting event type:", error)
      toast.error("Fehler beim Löschen des Event-Typs")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTypeToDelete(null)
    }
  }

  function handleFormOpenChange(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingType(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Verwalten Sie die Event-Typen für Ihre Vereinsveranstaltungen.
        </p>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Neuer Typ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : eventTypes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Event-Typen vorhanden.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Icon</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="font-medium">{type.name}</span>
                      {type.is_system_default && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Standard-Typ (kann nicht gelöscht werden)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {type.icon ? (
                      <span className="text-lg">{type.icon}</span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{type.event_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(type)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Bearbeiten</span>
                      </Button>
                      {!type.is_system_default && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(type)}
                                  disabled={type.event_count > 0}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Löschen</span>
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {type.event_count > 0 && (
                              <TooltipContent>
                                Typ wird von {type.event_count} Event(s) verwendet
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <EventTypeForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        eventType={editingType}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event-Typ löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Event-Typ &quot;{typeToDelete?.name}&quot; wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
