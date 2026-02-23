"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { toast } from "sonner"
import { Plus, RefreshCw, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KanbanColumn, KanbanColumnSkeleton } from "./kanban-column"
import { KanbanTaskCard } from "./kanban-task-card"
import { KanbanFilters } from "./kanban-filters"
import { KanbanTaskDetail } from "./kanban-task-detail"
import { KanbanColumnForm } from "./kanban-column-form"
import { KanbanTaskForm } from "./kanban-task-form"
import {
  KanbanBoardData,
  KanbanColumnWithTasks,
  KanbanTask,
  KanbanFilterData,
} from "@/lib/validations/kanban"

interface KanbanBoardProps {
  workgroupId: string
  isVorstand: boolean
  currentUserId: string
}

export function KanbanBoard({ workgroupId, isVorstand, currentUserId }: KanbanBoardProps) {
  // State
  const [boardData, setBoardData] = React.useState<KanbanBoardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [hasConflict, setHasConflict] = React.useState(false)

  // Drag state
  const [activeTask, setActiveTask] = React.useState<KanbanTask | null>(null)
  const [activeColumn, setActiveColumn] = React.useState<KanbanColumnWithTasks | null>(null)

  // Filter state
  const [filters, setFilters] = React.useState<KanbanFilterData>({})

  // Dialog state
  const [selectedTask, setSelectedTask] = React.useState<KanbanTask | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = React.useState(false)
  const [isColumnFormOpen, setIsColumnFormOpen] = React.useState(false)
  const [editingColumn, setEditingColumn] = React.useState<KanbanColumnWithTasks | null>(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = React.useState(false)
  const [newTaskColumnId, setNewTaskColumnId] = React.useState<string | null>(null)

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch board data
  const fetchBoardData = React.useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/workgroups/${workgroupId}/kanban/board`)

      if (!response.ok) {
        throw new Error("Fehler beim Laden des Kanban-Boards")
      }

      const data = await response.json()
      setBoardData(data.board)
      setHasConflict(false)
    } catch (err) {
      console.error("Error fetching kanban board:", err)
      setError("Das Kanban-Board konnte nicht geladen werden")
    } finally {
      setIsLoading(false)
    }
  }, [workgroupId])

  React.useEffect(() => {
    fetchBoardData()
  }, [fetchBoardData])

  // Filter tasks
  const getFilteredColumns = React.useCallback((): KanbanColumnWithTasks[] => {
    if (!boardData) return []

    return boardData.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        // Search filter
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
          return false
        }

        // Assignee filter
        if (filters.assignee_id) {
          const isAssigned = task.assignees?.some(a => a.profile_id === filters.assignee_id)
          if (!isAssigned) return false
        }

        // Label filter
        if (filters.label_id) {
          const hasLabel = task.labels?.some(l => l.id === filters.label_id)
          if (!hasLabel) return false
        }

        // Priority filter
        if (filters.priority && task.priority !== filters.priority) {
          return false
        }

        // Only mine filter
        if (filters.only_mine) {
          const isAssignedToMe = task.assignees?.some(a => a.profile_id === currentUserId)
          if (!isAssignedToMe) return false
        }

        // Overdue filter
        if (filters.overdue) {
          if (!task.deadline) return false
          const deadline = new Date(task.deadline)
          const now = new Date()
          if (deadline >= now) return false
        }

        return true
      }),
    }))
  }, [boardData, filters, currentUserId])

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === "task") {
      setActiveTask(activeData.task)
    } else if (activeData?.type === "column") {
      setActiveColumn(activeData.column)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !boardData) return

    const activeData = active.data.current
    const overData = over.data.current

    // Only handle task dragging
    if (activeData?.type !== "task") return

    const activeTask = activeData.task as KanbanTask
    const activeColumnId = activeTask.column_id

    // Determine target column
    let overColumnId: string | null = null
    if (overData?.type === "column") {
      overColumnId = overData.column.id
    } else if (overData?.type === "task") {
      overColumnId = (overData.task as KanbanTask).column_id
    } else if (over.id.toString().startsWith("droppable-")) {
      overColumnId = over.id.toString().replace("droppable-", "")
    }

    if (!overColumnId || activeColumnId === overColumnId) return

    // Optimistic update - move task to new column
    setBoardData((prev) => {
      if (!prev) return prev

      const newColumns = prev.columns.map((col) => {
        if (col.id === activeColumnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeTask.id),
          }
        }
        if (col.id === overColumnId) {
          // Find insertion index
          let insertIndex = col.tasks.length
          if (overData?.type === "task") {
            const overTaskIndex = col.tasks.findIndex(
              (t) => t.id === (overData.task as KanbanTask).id
            )
            if (overTaskIndex !== -1) {
              insertIndex = overTaskIndex
            }
          }

          const updatedTask = { ...activeTask, column_id: overColumnId }
          const newTasks = [...col.tasks]
          newTasks.splice(insertIndex, 0, updatedTask)
          return {
            ...col,
            tasks: newTasks,
          }
        }
        return col
      })

      return { ...prev, columns: newColumns }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)
    setActiveColumn(null)

    if (!over || !boardData) return

    const activeData = active.data.current
    const overData = over.data.current

    // Handle column reordering
    if (activeData?.type === "column" && isVorstand) {
      const activeColumnId = activeData.column.id
      const overColumnId = overData?.type === "column"
        ? overData.column.id
        : over.id.toString().replace("column-", "")

      if (activeColumnId !== overColumnId) {
        const oldIndex = boardData.columns.findIndex((c) => c.id === activeColumnId)
        const newIndex = boardData.columns.findIndex((c) => c.id === overColumnId)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumns = arrayMove(boardData.columns, oldIndex, newIndex)
          setBoardData({ ...boardData, columns: newColumns })

          // Sync to server
          try {
            const response = await fetch(`/api/workgroups/${workgroupId}/kanban/columns`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                column_ids: newColumns.map((c) => c.id),
              }),
            })

            if (!response.ok) {
              throw new Error("Fehler beim Speichern")
            }
          } catch (err) {
            toast.error("Spaltenreihenfolge konnte nicht gespeichert werden")
            fetchBoardData()
          }
        }
      }
      return
    }

    // Handle task movement
    if (activeData?.type === "task") {
      const taskId = active.id as string
      let targetColumnId: string | null = null
      let newSortOrder = 0

      // Find target column
      if (overData?.type === "column") {
        targetColumnId = overData.column.id
        const targetColumn = boardData.columns.find((c) => c.id === targetColumnId)
        newSortOrder = targetColumn?.tasks.length || 0
      } else if (overData?.type === "task") {
        const overTask = overData.task as KanbanTask
        targetColumnId = overTask.column_id
        const targetColumn = boardData.columns.find((c) => c.id === targetColumnId)
        const overIndex = targetColumn?.tasks.findIndex((t) => t.id === overTask.id) || 0
        newSortOrder = overIndex
      } else if (over.id.toString().startsWith("droppable-")) {
        targetColumnId = over.id.toString().replace("droppable-", "")
        const targetColumn = boardData.columns.find((c) => c.id === targetColumnId)
        newSortOrder = targetColumn?.tasks.length || 0
      }

      if (!targetColumnId) return

      // Sync to server
      try {
        const response = await fetch(
          `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              column_id: targetColumnId,
              sort_order: newSortOrder,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 409) {
            setHasConflict(true)
            toast.error("Konflikt erkannt - Board wird aktualisiert")
            fetchBoardData()
          } else {
            throw new Error(errorData.error || "Fehler beim Verschieben")
          }
        }
      } catch (err) {
        toast.error("Task konnte nicht verschoben werden")
        fetchBoardData()
      }
    }
  }

  // Column handlers
  const handleAddColumn = () => {
    setEditingColumn(null)
    setIsColumnFormOpen(true)
  }

  const handleEditColumn = (column: KanbanColumnWithTasks) => {
    setEditingColumn(column)
    setIsColumnFormOpen(true)
  }

  const handleDeleteColumn = async (column: KanbanColumnWithTasks) => {
    if (boardData && boardData.columns.length <= 1) {
      toast.error("Mindestens eine Spalte muss existieren")
      return
    }

    if (column.tasks.length > 0) {
      toast.error("Bitte verschiebe erst alle Tasks aus dieser Spalte")
      return
    }

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/columns/${column.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Löschen")
      }

      toast.success("Spalte gelöscht")
      fetchBoardData()
    } catch (err) {
      toast.error("Spalte konnte nicht gelöscht werden")
    }
  }

  const handleColumnSaved = () => {
    setIsColumnFormOpen(false)
    setEditingColumn(null)
    fetchBoardData()
  }

  // Task handlers
  const handleAddTask = (columnId: string) => {
    setNewTaskColumnId(columnId)
    setSelectedTask(null)
    setIsTaskFormOpen(true)
  }

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleTaskSaved = () => {
    setIsTaskFormOpen(false)
    setIsTaskDetailOpen(false)
    setSelectedTask(null)
    setNewTaskColumnId(null)
    fetchBoardData()
  }

  const handleTaskDeleted = () => {
    setIsTaskDetailOpen(false)
    setSelectedTask(null)
    fetchBoardData()
  }

  // Render
  const filteredColumns = getFilteredColumns()
  const columnIds = filteredColumns.map((col) => `column-${col.id}`)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse w-full" />
        <div className="flex gap-4 overflow-hidden">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={fetchBoardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!boardData) return null

  return (
    <div className="space-y-4">
      {/* Conflict Banner */}
      {hasConflict && (
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Board aktualisiert</AlertTitle>
          <AlertDescription>
            Das Board wurde von einem anderen Benutzer geändert.
            <Button
              variant="link"
              size="sm"
              className="px-2"
              onClick={fetchBoardData}
            >
              Jetzt aktualisieren
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <KanbanFilters
        filters={filters}
        onFiltersChange={setFilters}
        members={boardData.members}
        labels={boardData.labels}
      />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {filteredColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddTask={handleAddTask}
                  onTaskClick={handleTaskClick}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                  isVorstand={isVorstand}
                />
              ))}
            </SortableContext>

            {/* Add Column Button (Vorstand only) */}
            {isVorstand && boardData.columns.length < 10 && (
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  className="w-72 h-12 border-dashed"
                  onClick={handleAddColumn}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Spalte
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 shadow-2xl">
              <KanbanTaskCard
                task={activeTask}
                onClick={() => {}}
                isDragging
              />
            </div>
          )}
          {activeColumn && (
            <div className="rotate-2 opacity-90">
              <KanbanColumn
                column={activeColumn}
                onAddTask={() => {}}
                onTaskClick={() => {}}
                onEditColumn={() => {}}
                onDeleteColumn={() => {}}
                isVorstand={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Sheet */}
      <KanbanTaskDetail
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        onSave={handleTaskSaved}
        onDelete={handleTaskDeleted}
        workgroupId={workgroupId}
        members={boardData.members}
        labels={boardData.labels}
        columns={boardData.columns}
        isVorstand={isVorstand}
        currentUserId={currentUserId}
      />

      {/* Column Form Dialog */}
      <KanbanColumnForm
        isOpen={isColumnFormOpen}
        onClose={() => {
          setIsColumnFormOpen(false)
          setEditingColumn(null)
        }}
        onSave={handleColumnSaved}
        column={editingColumn}
        workgroupId={workgroupId}
      />

      {/* Quick Add Task Form */}
      <KanbanTaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false)
          setNewTaskColumnId(null)
        }}
        onSave={handleTaskSaved}
        workgroupId={workgroupId}
        columnId={newTaskColumnId}
        members={boardData.members}
      />
    </div>
  )
}
