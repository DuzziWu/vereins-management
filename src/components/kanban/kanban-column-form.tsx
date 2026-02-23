"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ColumnColorPicker } from "./kanban-column"
import {
  KanbanColumnWithTasks,
  KanbanColumnFormData,
  kanbanColumnSchema,
  columnColors,
} from "@/lib/validations/kanban"

interface KanbanColumnFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  column: KanbanColumnWithTasks | null
  workgroupId: string
}

export function KanbanColumnForm({
  isOpen,
  onClose,
  onSave,
  column,
  workgroupId,
}: KanbanColumnFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null)

  const isEditing = !!column

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KanbanColumnFormData>({
    resolver: zodResolver(kanbanColumnSchema),
    defaultValues: {
      name: "",
      color: null,
    },
  })

  // Reset form when dialog opens/closes or column changes
  React.useEffect(() => {
    if (isOpen) {
      if (column) {
        reset({
          name: column.name,
          color: column.color,
        })
        setSelectedColor(column.color)
      } else {
        reset({
          name: "",
          color: null,
        })
        setSelectedColor(null)
      }
    }
  }, [isOpen, column, reset])

  const onSubmit = async (data: KanbanColumnFormData) => {
    setIsSaving(true)

    try {
      const payload = {
        ...data,
        color: selectedColor,
      }

      const url = isEditing
        ? `/api/workgroups/${workgroupId}/kanban/columns/${column.id}`
        : `/api/workgroups/${workgroupId}/kanban/columns`

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      toast.success(isEditing ? "Spalte aktualisiert" : "Spalte erstellt")
      onSave()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Spalte konnte nicht gespeichert werden")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Spalte bearbeiten" : "Neue Spalte erstellen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ändere den Namen oder die Farbe dieser Spalte."
              : "Erstelle eine neue Spalte für dein Kanban-Board."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="z.B. In Bearbeitung"
              maxLength={100}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Farbe (optional)</Label>
            <ColumnColorPicker
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Vorschau</Label>
            <div
              className="h-8 rounded-md border flex items-center px-3"
              style={{
                borderLeftColor: selectedColor || undefined,
                borderLeftWidth: selectedColor ? "4px" : undefined,
              }}
            >
              <span className="text-sm font-medium text-muted-foreground">
                Spaltenname
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Wird gespeichert..."
                : isEditing
                ? "Speichern"
                : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
