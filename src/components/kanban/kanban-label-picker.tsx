"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Check, Pencil, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { KanbanLabel, KanbanTaskLabel, columnColors } from "@/lib/validations/kanban"

interface KanbanLabelPickerProps {
  selectedLabels: KanbanTaskLabel[]
  availableLabels: KanbanLabel[]
  onLabelsChange: (labelIds: string[]) => void
  workgroupId: string
  isVorstand: boolean
  onLabelsUpdated: () => void
}

const labelColors = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
]

export function KanbanLabelPicker({
  selectedLabels,
  availableLabels,
  onLabelsChange,
  workgroupId,
  isVorstand,
  onLabelsUpdated,
}: KanbanLabelPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [editingLabel, setEditingLabel] = React.useState<KanbanLabel | null>(null)
  const [deletingLabel, setDeletingLabel] = React.useState<KanbanLabel | null>(null)
  const [newLabelName, setNewLabelName] = React.useState("")
  const [newLabelColor, setNewLabelColor] = React.useState(labelColors[0])

  const selectedIds = selectedLabels.map((l) => l.id)

  // Toggle label selection
  const toggleLabel = (labelId: string) => {
    if (selectedIds.includes(labelId)) {
      onLabelsChange(selectedIds.filter((id) => id !== labelId))
    } else {
      onLabelsChange([...selectedIds, labelId])
    }
  }

  // Create new label
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return

    try {
      const response = await fetch(`/api/workgroups/${workgroupId}/kanban/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      toast.success("Label erstellt")
      setNewLabelName("")
      setNewLabelColor(labelColors[0])
      setIsCreating(false)
      onLabelsUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Label konnte nicht erstellt werden")
    }
  }

  // Update label
  const handleUpdateLabel = async () => {
    if (!editingLabel || !newLabelName.trim()) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/labels/${editingLabel.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newLabelName.trim(),
            color: newLabelColor,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      toast.success("Label aktualisiert")
      setEditingLabel(null)
      setNewLabelName("")
      onLabelsUpdated()
    } catch (err) {
      toast.error("Label konnte nicht aktualisiert werden")
    }
  }

  // Delete label
  const handleDeleteLabel = async () => {
    if (!deletingLabel) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/labels/${deletingLabel.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Löschen")
      }

      toast.success("Label gelöscht")
      setDeletingLabel(null)
      onLabelsUpdated()
    } catch (err) {
      toast.error("Label konnte nicht gelöscht werden")
    }
  }

  // Start editing
  const startEditing = (label: KanbanLabel) => {
    setEditingLabel(label)
    setNewLabelName(label.name)
    setNewLabelColor(label.color)
    setIsCreating(false)
  }

  // Cancel editing/creating
  const cancelEdit = () => {
    setIsCreating(false)
    setEditingLabel(null)
    setNewLabelName("")
    setNewLabelColor(labelColors[0])
  }

  return (
    <>
      <div className="space-y-2">
        {/* Selected Labels */}
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className="gap-1 cursor-pointer"
              style={{
                backgroundColor: `${label.color}20`,
                borderColor: label.color,
                color: label.color,
              }}
              onClick={() => toggleLabel(label.id)}
            >
              {label.name}
              <X className="h-3 w-3" />
            </Badge>
          ))}

          {/* Add Label Button */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Label
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                {/* Label List */}
                {!isCreating && !editingLabel && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground px-2">
                      Labels
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {availableLabels.map((label) => (
                        <div
                          key={label.id}
                          className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50"
                        >
                          <button
                            className="flex-1 flex items-center gap-2"
                            onClick={() => toggleLabel(label.id)}
                          >
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center"
                              style={{ backgroundColor: label.color }}
                            >
                              {selectedIds.includes(label.id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm flex-1 text-left">
                              {label.name}
                            </span>
                          </button>
                          {isVorstand && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditing(label)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeletingLabel(label)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {availableLabels.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Noch keine Labels vorhanden
                        </p>
                      )}
                    </div>

                    {/* Create new label button (Vorstand only) */}
                    {isVorstand && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setIsCreating(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Neues Label erstellen
                      </Button>
                    )}
                  </>
                )}

                {/* Create/Edit Form */}
                {(isCreating || editingLabel) && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      {editingLabel ? "Label bearbeiten" : "Neues Label"}
                    </div>

                    <Input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label-Name"
                      maxLength={50}
                      autoFocus
                    />

                    <div className="grid grid-cols-8 gap-1">
                      {labelColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "h-6 w-6 rounded transition-transform hover:scale-110",
                            newLabelColor === color && "ring-2 ring-offset-2 ring-foreground"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewLabelColor(color)}
                        />
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Vorschau:</span>
                      <Badge
                        style={{
                          backgroundColor: `${newLabelColor}20`,
                          borderColor: newLabelColor,
                          color: newLabelColor,
                        }}
                      >
                        {newLabelName || "Label"}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={editingLabel ? handleUpdateLabel : handleCreateLabel}
                        disabled={!newLabelName.trim()}
                      >
                        {editingLabel ? "Speichern" : "Erstellen"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLabel} onOpenChange={() => setDeletingLabel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Label löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Label &quot;{deletingLabel?.name}&quot; wird von allen Tasks entfernt
              und dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLabel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
