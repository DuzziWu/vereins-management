"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"

// Quick add schema - simplified for fast task creation
const quickAddTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Maximal 200 Zeichen"),
})

type QuickAddTaskData = z.infer<typeof quickAddTaskSchema>

interface Member {
  profile_id: string
  first_name: string
  last_name: string
}

interface KanbanTaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  workgroupId: string
  columnId: string | null
  members: Member[]
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function KanbanTaskForm({
  isOpen,
  onClose,
  onSave,
  workgroupId,
  columnId,
  members,
}: KanbanTaskFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [selectedAssignees, setSelectedAssignees] = React.useState<string[]>([])
  const [assignToSelf, setAssignToSelf] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickAddTaskData>({
    resolver: zodResolver(quickAddTaskSchema),
    defaultValues: {
      title: "",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      reset({ title: "" })
      setSelectedAssignees([])
      setAssignToSelf(false)
    }
  }, [isOpen, reset])

  const onSubmit = async (data: QuickAddTaskData) => {
    if (!columnId) return

    setIsSaving(true)

    try {
      // Create task
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            column_id: columnId,
            priority: "normal",
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      const { task } = await response.json()

      // Assign users if selected
      if (selectedAssignees.length > 0) {
        await fetch(
          `/api/workgroups/${workgroupId}/kanban/tasks/${task.id}/assignees`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile_ids: selectedAssignees }),
          }
        )
      }

      toast.success("Task erstellt")
      onSave()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Task konnte nicht erstellt werden")
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle assignee selection
  const toggleAssignee = (profileId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Task</DialogTitle>
          <DialogDescription>
            Erstelle schnell einen neuen Task. Details können später hinzugefügt werden.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Was muss erledigt werden?"
              maxLength={200}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Quick Assignee Selection */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Zuweisen an (optional)</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.profile_id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleAssignee(member.profile_id)}
                  >
                    <Checkbox
                      checked={selectedAssignees.includes(member.profile_id)}
                      onCheckedChange={() => toggleAssignee(member.profile_id)}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedAssignees.length} ausgewählt
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
