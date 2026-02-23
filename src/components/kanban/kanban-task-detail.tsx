"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  User,
  Tag,
  CheckSquare,
  Paperclip,
  Trash2,
  X,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { KanbanChecklist } from "./kanban-checklist"
import { KanbanLabelPicker } from "./kanban-label-picker"
import { KanbanAttachment } from "./kanban-attachment"
import {
  KanbanTask,
  KanbanTaskPatchData,
  KanbanLabel,
  KanbanColumnWithTasks,
  KanbanPriority,
  priorityConfig,
  kanbanTaskPatchSchema,
} from "@/lib/validations/kanban"

interface Member {
  profile_id: string
  first_name: string
  last_name: string
}

interface KanbanTaskDetailProps {
  task: KanbanTask | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onDelete: () => void
  workgroupId: string
  members: Member[]
  labels: KanbanLabel[]
  columns: KanbanColumnWithTasks[]
  isVorstand: boolean
  currentUserId: string
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function KanbanTaskDetail({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  workgroupId,
  members,
  labels,
  columns,
  isVorstand,
  currentUserId,
}: KanbanTaskDetailProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [taskData, setTaskData] = React.useState<KanbanTask | null>(null)
  const [localTitle, setLocalTitle] = React.useState("")
  const [localDescription, setLocalDescription] = React.useState("")
  const [hasChanges, setHasChanges] = React.useState(false)

  // Initialize local state when task changes
  React.useEffect(() => {
    if (task) {
      setTaskData(task)
      setLocalTitle(task.title)
      setLocalDescription(task.description || "")
      setHasChanges(false)
    }
  }, [task])

  const canDelete = task && (task.created_by === currentUserId || isVorstand)
  const currentColumn = columns.find((c) => c.id === taskData?.column_id)

  // Save task changes
  const saveChanges = async (updates: Partial<KanbanTaskPatchData>) => {
    if (!taskData) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      const { task: updatedTask } = await response.json()
      setTaskData(updatedTask)
      setHasChanges(false)
      toast.success("Änderungen gespeichert")
    } catch (err) {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  // Save title on blur
  const handleTitleBlur = () => {
    if (localTitle !== taskData?.title && localTitle.trim()) {
      saveChanges({ title: localTitle.trim() })
    }
  }

  // Save description on blur
  const handleDescriptionBlur = () => {
    if (localDescription !== (taskData?.description || "")) {
      saveChanges({ description: localDescription || null })
    }
  }

  // Update priority
  const handlePriorityChange = (priority: KanbanPriority) => {
    saveChanges({ priority })
  }

  // Update deadline
  const handleDeadlineChange = (dateString: string) => {
    const deadline = dateString ? new Date(dateString).toISOString() : null
    saveChanges({ deadline })
  }

  // Update column (move task)
  const handleColumnChange = (columnId: string) => {
    if (columnId !== taskData?.column_id) {
      saveChanges({ column_id: columnId })
    }
  }

  // Update assignees
  const handleAssigneesChange = async (profileIds: string[]) => {
    if (!taskData) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}/assignees`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_ids: profileIds }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      // Refresh task data
      const taskResponse = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}`
      )
      if (taskResponse.ok) {
        const { task: updatedTask } = await taskResponse.json()
        setTaskData(updatedTask)
      }
    } catch (err) {
      toast.error("Zuweisung konnte nicht gespeichert werden")
    }
  }

  // Update labels
  const handleLabelsChange = async (labelIds: string[]) => {
    if (!taskData) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}/labels`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label_ids: labelIds }),
        }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Speichern")
      }

      // Refresh task data
      const taskResponse = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}`
      )
      if (taskResponse.ok) {
        const { task: updatedTask } = await taskResponse.json()
        setTaskData(updatedTask)
      }
    } catch (err) {
      toast.error("Labels konnten nicht gespeichert werden")
    }
  }

  // Delete task
  const handleDelete = async () => {
    if (!taskData) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Löschen")
      }

      toast.success("Task gelöscht")
      onDelete()
    } catch (err) {
      toast.error("Task konnte nicht gelöscht werden")
    } finally {
      setIsDeleting(false)
    }
  }

  // Refresh checklist data
  const refreshTaskData = async () => {
    if (!taskData) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskData.id}`
      )
      if (response.ok) {
        const { task: updatedTask } = await response.json()
        setTaskData(updatedTask)
      }
    } catch (err) {
      console.error("Error refreshing task:", err)
    }
  }

  if (!taskData) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="sr-only">Task Details</SheetTitle>
            {currentColumn && (
              <Badge variant="outline" className="text-xs">
                {currentColumn.name}
              </Badge>
            )}
          </div>
          <SheetDescription className="sr-only">
            Bearbeite die Details dieses Tasks
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Input
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value)
                setHasChanges(true)
              }}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Task-Titel"
              maxLength={200}
            />
          </div>

          <Separator />

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={taskData.column_id}
                onValueChange={handleColumnChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priorität</Label>
              <Select
                value={taskData.priority}
                onValueChange={(v) => handlePriorityChange(v as KanbanPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(priorityConfig) as [KanbanPriority, typeof priorityConfig.low][]).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className={config.color}>{config.label}</span>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Deadline
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={
                  taskData.deadline
                    ? format(new Date(taskData.deadline), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="flex-1"
              />
              {taskData.deadline && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeadlineChange("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Beschreibung
            </Label>
            <Textarea
              value={localDescription}
              onChange={(e) => {
                setLocalDescription(e.target.value)
                setHasChanges(true)
              }}
              onBlur={handleDescriptionBlur}
              placeholder="Füge eine Beschreibung hinzu..."
              className="min-h-[100px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {localDescription.length}/2000
            </p>
          </div>

          <Separator />

          {/* Assignees */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" />
              Zugewiesen an
            </Label>
            <div className="flex flex-wrap gap-2">
              {taskData.assignees?.map((assignee) => (
                <Badge
                  key={assignee.profile_id}
                  variant="secondary"
                  className="gap-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {getInitials(assignee.first_name, assignee.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  {assignee.first_name} {assignee.last_name}
                  <button
                    onClick={() =>
                      handleAssigneesChange(
                        taskData.assignees
                          ?.filter((a) => a.profile_id !== assignee.profile_id)
                          .map((a) => a.profile_id) || []
                      )
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Select
                key={taskData.assignees?.length || 0}
                onValueChange={(profileId) => {
                  const currentIds = taskData.assignees?.map((a) => a.profile_id) || []
                  if (!currentIds.includes(profileId)) {
                    handleAssigneesChange([...currentIds, profileId])
                  }
                }}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <span className="text-muted-foreground">+ Hinzufügen</span>
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter(
                      (m) =>
                        !taskData.assignees?.some(
                          (a) => a.profile_id === m.profile_id
                        )
                    )
                    .map((member) => (
                      <SelectItem
                        key={member.profile_id}
                        value={member.profile_id}
                      >
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Labels */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Tag className="h-3 w-3" />
              Labels
            </Label>
            <KanbanLabelPicker
              selectedLabels={taskData.labels || []}
              availableLabels={labels}
              onLabelsChange={handleLabelsChange}
              workgroupId={workgroupId}
              isVorstand={isVorstand}
              onLabelsUpdated={refreshTaskData}
            />
          </div>

          <Separator />

          {/* Checklist */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-3 w-3" />
              Checkliste
              {taskData.checklist_items && taskData.checklist_items.length > 0 && (
                <span className="text-xs">
                  ({taskData.checklist_items.filter((i) => i.is_completed).length}/
                  {taskData.checklist_items.length})
                </span>
              )}
            </Label>
            <KanbanChecklist
              taskId={taskData.id}
              workgroupId={workgroupId}
              items={taskData.checklist_items || []}
              onItemsChange={refreshTaskData}
            />
          </div>

          <Separator />

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Paperclip className="h-3 w-3" />
              Anhänge
              {taskData.attachments && taskData.attachments.length > 0 && (
                <span className="text-xs">
                  ({taskData.attachments.length}/5)
                </span>
              )}
            </Label>
            <KanbanAttachment
              taskId={taskData.id}
              workgroupId={workgroupId}
              attachments={taskData.attachments || []}
              onAttachmentsChange={refreshTaskData}
              isVorstand={isVorstand}
              currentUserId={currentUserId}
            />
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Erstellt von {taskData.creator_name || "Unbekannt"} am{" "}
              {taskData.created_at ? format(new Date(taskData.created_at), "dd.MM.yyyy HH:mm", {
                locale: de,
              }) : "Unbekannt"}
            </div>
            {taskData.updated_at && taskData.updated_at !== taskData.created_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Zuletzt bearbeitet:{" "}
                {format(new Date(taskData.updated_at), "dd.MM.yyyy HH:mm", {
                  locale: de,
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Task löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Task löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Der Task
                      und alle zugehörigen Daten (Checkliste, Anhänge) werden
                      dauerhaft gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              onClick={() => {
                onSave()
                onClose()
              }}
              disabled={isSaving}
            >
              {isSaving ? "Wird gespeichert..." : "Schließen"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
