"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2, Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { cn } from "@/lib/utils"
import type { EventScheduleEntry } from "@/lib/validations/events"

interface ScheduleItem {
  id: string
  time: string
  description: string
}

interface SortableItemProps {
  item: ScheduleItem
  onUpdate: (id: string, field: "time" | "description", value: string) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

function SortableItem({ item, onUpdate, onDelete, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-background border rounded-md",
        isDragging && "opacity-50 shadow-lg",
        disabled && "opacity-60"
      )}
    >
      <button
        type="button"
        className="touch-none p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Input
        type="time"
        value={item.time}
        onChange={(e) => onUpdate(item.id, "time", e.target.value)}
        className="w-24 flex-shrink-0"
        disabled={disabled}
        step="300"
      />

      <Input
        type="text"
        value={item.description}
        onChange={(e) => onUpdate(item.id, "description", e.target.value)}
        placeholder="Beschreibung..."
        className="flex-1"
        disabled={disabled}
        maxLength={500}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        disabled={disabled}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface EventScheduleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
  initialSchedule: EventScheduleEntry[]
  onSuccess?: () => void
}

export function EventScheduleEditor({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  initialSchedule,
  onSuccess,
}: EventScheduleEditorProps) {
  const [items, setItems] = useState<ScheduleItem[]>(() =>
    initialSchedule.map((entry) => ({
      id: entry.id,
      time: entry.time.slice(0, 5), // Trim seconds
      description: entry.description,
    }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset items when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setItems(
        initialSchedule.map((entry) => ({
          id: entry.id,
          time: entry.time.slice(0, 5),
          description: entry.description,
        }))
      )
    }
  }, [open, initialSchedule])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleAddItem = useCallback(() => {
    if (items.length >= 20) {
      toast.error("Maximal 20 Einträge erlaubt")
      return
    }

    setItems((prev) => [
      ...prev,
      {
        id: nanoid(),
        time: "18:00",
        description: "",
      },
    ])
  }, [items.length])

  const handleUpdateItem = useCallback(
    (id: string, field: "time" | "description", value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      )
    },
    []
  )

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleSubmit = async () => {
    // Validate: mindestens 1 Eintrag
    if (items.length === 0) {
      toast.error("Mindestens 1 Eintrag erforderlich")
      return
    }

    // Validate items
    const invalidItems = items.filter(
      (item) => !item.time || !item.description.trim()
    )
    if (invalidItems.length > 0) {
      toast.error("Bitte fülle alle Felder aus")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: items.map((item, index) => ({
            id: item.id.includes("-") ? item.id : undefined, // Only send UUIDs
            time: item.time,
            description: item.description.trim(),
            sort_order: index,
          })),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      toast.success("Ablaufplan gespeichert")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ablaufplan bearbeiten</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {eventTitle}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              {items.length}/20 Einträge
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={isSubmitting || items.length >= 20}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Eintrag hinzufügen
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Noch keine Einträge vorhanden.</p>
              <p className="text-sm mt-1">
                Klicke auf &quot;Eintrag hinzufügen&quot; um zu beginnen.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <p className="text-xs text-muted-foreground">
            Ziehe die Einträge um sie umzusortieren. Die Reihenfolge wird
            automatisch nach Uhrzeit sortiert angezeigt.
          </p>
        </div>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-1.5" />
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Speichern
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
