"use client"

import * as React from "react"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Palette } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KanbanTaskCard, KanbanTaskCardSkeleton } from "./kanban-task-card"
import { KanbanColumnWithTasks, KanbanTask, columnColors } from "@/lib/validations/kanban"

interface KanbanColumnProps {
  column: KanbanColumnWithTasks
  onAddTask: (columnId: string) => void
  onTaskClick: (task: KanbanTask) => void
  onEditColumn: (column: KanbanColumnWithTasks) => void
  onDeleteColumn: (column: KanbanColumnWithTasks) => void
  isVorstand: boolean
  isLoading?: boolean
}

export function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
  onEditColumn,
  onDeleteColumn,
  isVorstand,
  isLoading,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedName, setEditedName] = React.useState(column.name)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
    disabled: !isVorstand,
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${column.id}`,
    data: {
      type: "column",
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const taskIds = column.tasks.map((task) => task.id)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEditSubmit = () => {
    if (editedName.trim() && editedName !== column.name) {
      onEditColumn({ ...column, name: editedName.trim() })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSubmit()
    } else if (e.key === "Escape") {
      setEditedName(column.name)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex flex-col w-72 min-w-72 rounded-xl border transition-all duration-200",
        "bg-gradient-to-b from-muted/40 to-muted/20 dark:from-muted/20 dark:to-muted/10",
        "shadow-sm hover:shadow-md",
        isDragging && "opacity-60 rotate-2 scale-105 shadow-xl",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-t-xl border-b transition-colors",
          column.color ? "border-l-4" : ""
        )}
        style={{
          borderLeftColor: column.color || undefined,
          backgroundColor: column.color ? `${column.color}08` : undefined,
        }}
      >
        {/* Drag Handle (Vorstand only) */}
        {isVorstand && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-0.5"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Column Name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm font-semibold"
              maxLength={100}
            />
          ) : (
            <div
              className={cn(
                "text-sm font-semibold truncate",
                isVorstand && "cursor-pointer hover:text-primary"
              )}
              onDoubleClick={() => isVorstand && setIsEditing(true)}
            >
              {column.name}
            </div>
          )}
        </div>

        {/* Task Count */}
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
            column.tasks.length > 0
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {column.tasks.length}
        </span>

        {/* Column Menu (Vorstand only) */}
        {isVorstand && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Spaltenoptionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Umbenennen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Palette className="h-4 w-4 mr-2" />
                Farbe ändern
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteColumn(column)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Add Task Button */}
      <div className="px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-muted-foreground",
            "hover:text-foreground hover:bg-primary/10",
            "transition-all duration-200",
            "border border-dashed border-transparent hover:border-primary/30"
          )}
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Task
        </Button>
      </div>

      {/* Tasks Container */}
      <div ref={setDroppableRef} className="flex-1 min-h-0">
        <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
          <div className="p-2 space-y-2">
            {isLoading ? (
              <>
                <KanbanTaskCardSkeleton />
                <KanbanTaskCardSkeleton />
                <KanbanTaskCardSkeleton />
              </>
            ) : (
              <SortableContext
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                {column.tasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </SortableContext>
            )}

            {!isLoading && column.tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground/60">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <span>Keine Tasks</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// Color picker for column editing
interface ColumnColorPickerProps {
  selectedColor: string | null
  onSelect: (color: string | null) => void
}

export function ColumnColorPicker({ selectedColor, onSelect }: ColumnColorPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {columnColors.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
            selectedColor === color ? "border-foreground ring-2 ring-offset-2" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
          aria-label={`Farbe ${color}`}
        />
      ))}
      <button
        type="button"
        className={cn(
          "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700",
          selectedColor === null ? "border-foreground ring-2 ring-offset-2" : "border-transparent"
        )}
        onClick={() => onSelect(null)}
        aria-label="Keine Farbe"
      >
        <span className="text-xs text-muted-foreground">/</span>
      </button>
    </div>
  )
}

// Skeleton for column loading
export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col w-72 min-w-72 bg-muted/30 rounded-lg border animate-pulse">
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="h-5 bg-muted rounded w-24" />
        <div className="h-5 bg-muted rounded-full w-8" />
      </div>
      <div className="p-2 border-b">
        <div className="h-8 bg-muted rounded" />
      </div>
      <div className="p-2 space-y-2">
        <KanbanTaskCardSkeleton />
        <KanbanTaskCardSkeleton />
      </div>
    </div>
  )
}
