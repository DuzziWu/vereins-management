"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { Plus, GripVertical, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { KanbanChecklistItem } from "@/lib/validations/kanban"

interface KanbanChecklistProps {
  taskId: string
  workgroupId: string
  items: KanbanChecklistItem[]
  onItemsChange: () => void
}

interface SortableItemProps {
  item: KanbanChecklistItem
  onToggle: (id: string, isCompleted: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string) => void
}

function SortableChecklistItem({ item, onToggle, onDelete, onUpdate }: SortableItemProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editText, setEditText] = React.useState(item.text)
  const inputRef = React.useRef<HTMLInputElement>(null)

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

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(item.id, editText.trim())
    } else {
      setEditText(item.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setEditText(item.text)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
        className="shrink-0"
      />

      {/* Text */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 flex-1"
          maxLength={500}
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm cursor-pointer",
            item.is_completed && "line-through text-muted-foreground"
          )}
          onClick={() => setIsEditing(true)}
        >
          {item.text}
        </span>
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        <span className="sr-only">Löschen</span>
      </Button>
    </div>
  )
}

export function KanbanChecklist({
  taskId,
  workgroupId,
  items,
  onItemsChange,
}: KanbanChecklistProps) {
  const [localItems, setLocalItems] = React.useState<KanbanChecklistItem[]>(items)
  const [newItemText, setNewItemText] = React.useState("")
  const [isAddingItem, setIsAddingItem] = React.useState(false)
  const newItemInputRef = React.useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sync local items with props
  React.useEffect(() => {
    setLocalItems(items)
  }, [items])

  // Focus new item input
  React.useEffect(() => {
    if (isAddingItem && newItemInputRef.current) {
      newItemInputRef.current.focus()
    }
  }, [isAddingItem])

  const completedCount = localItems.filter((item) => item.is_completed).length
  const totalCount = localItems.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Add new item
  const handleAddItem = async () => {
    if (!newItemText.trim()) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/checklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newItemText.trim(),
            sort_order: localItems.length,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Hinzufügen")
      }

      setNewItemText("")
      onItemsChange()
    } catch (err) {
      toast.error("Eintrag konnte nicht hinzugefügt werden")
    }
  }

  // Toggle item completion
  const handleToggle = async (id: string, isCompleted: boolean) => {
    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_completed: isCompleted } : item
      )
    )

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/checklist/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_completed: isCompleted }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      onItemsChange()
    } catch (err) {
      toast.error("Status konnte nicht geändert werden")
      // Revert optimistic update
      setLocalItems(items)
    }
  }

  // Update item text
  const handleUpdate = async (id: string, text: string) => {
    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    )

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/checklist/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      onItemsChange()
    } catch (err) {
      toast.error("Text konnte nicht geändert werden")
      setLocalItems(items)
    }
  }

  // Delete item
  const handleDelete = async (id: string) => {
    // Optimistic update
    setLocalItems((prev) => prev.filter((item) => item.id !== id))

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/checklist/${id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Löschen")
      }

      onItemsChange()
    } catch (err) {
      toast.error("Eintrag konnte nicht gelöscht werden")
      setLocalItems(items)
    }
  }

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localItems.findIndex((item) => item.id === active.id)
    const newIndex = localItems.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(localItems, oldIndex, newIndex)
    setLocalItems(newItems)

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/checklist/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_ids: newItems.map((item) => item.id),
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      onItemsChange()
    } catch (err) {
      toast.error("Reihenfolge konnte nicht gespeichert werden")
      setLocalItems(items)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem()
    } else if (e.key === "Escape") {
      setNewItemText("")
      setIsAddingItem(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {completedCount} von {totalCount} erledigt
          </p>
        </div>
      )}

      {/* Items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {localItems.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new item */}
      {isAddingItem ? (
        <div className="flex items-center gap-2">
          <Input
            ref={newItemInputRef}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Neuer Punkt..."
            className="flex-1"
            maxLength={500}
          />
          <Button size="sm" onClick={handleAddItem} disabled={!newItemText.trim()}>
            Hinzufügen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewItemText("")
              setIsAddingItem(false)
            }}
          >
            Abbrechen
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingItem(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Punkt hinzufügen
        </Button>
      )}
    </div>
  )
}
