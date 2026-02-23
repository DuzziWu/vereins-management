"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, isToday } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  Paperclip,
  CheckSquare,
  GripVertical,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  KanbanTask,
  KanbanPriority,
  priorityConfig,
} from "@/lib/validations/kanban"

interface KanbanTaskCardProps {
  task: KanbanTask
  onClick: () => void
  isDragging?: boolean
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function getPriorityStripeColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-400",
    normal: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }
  return colors[priority] || "bg-gray-400"
}

export function KanbanTaskCard({ task, onClick, isDragging }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline))
  const isDueToday = task.deadline && isToday(new Date(task.deadline))

  const displayedAssignees = task.assignees?.slice(0, 3) || []
  const remainingAssignees = (task.assignees?.length || 0) - 3

  const checklistTotal = task.checklist_total || task.checklist_items?.length || 0
  const checklistCompleted = task.checklist_completed ||
    task.checklist_items?.filter(item => item.is_completed).length || 0

  const attachmentCount = task.attachment_count || task.attachments?.length || 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative cursor-pointer overflow-hidden transition-all hover:shadow-md",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      {/* Priority Stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          getPriorityStripeColor(task.priority)
        )}
      />

      <div className="flex">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center px-1 cursor-grab active:cursor-grabbing hover:bg-muted/50"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 p-3 pl-2 space-y-2">
          {/* Title */}
          <p className="text-sm font-medium line-clamp-2">{task.title}</p>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={{
                    backgroundColor: `${label.color}20`,
                    borderColor: label.color,
                    color: label.color,
                  }}
                >
                  {label.name}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  +{task.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Bottom Row: Metadata */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Deadline, Attachments, Checklist */}
            <div className="flex items-center gap-2 text-muted-foreground">
              {/* Deadline */}
              {task.deadline && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isOverdue && "text-red-500",
                          isDueToday && "text-yellow-600"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>
                          {isToday(new Date(task.deadline))
                            ? "Heute"
                            : format(new Date(task.deadline), "dd.MM.", { locale: de })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isOverdue ? "Überfällig: " : isDueToday ? "Fällig heute: " : "Fällig: "}
                        {format(new Date(task.deadline), "dd.MM.yyyy HH:mm", { locale: de })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Attachments */}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span>{attachmentCount}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {checklistTotal > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    checklistCompleted === checklistTotal && "text-green-600"
                  )}
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>
                    {checklistCompleted}/{checklistTotal}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Assignees */}
            {displayedAssignees.length > 0 && (
              <div className="flex -space-x-2">
                {displayedAssignees.map((assignee) => (
                  <TooltipProvider key={assignee.profile_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(assignee.first_name, assignee.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{assignee.first_name} {assignee.last_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {remainingAssignees > 0 && (
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-muted">
                      +{remainingAssignees}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Skeleton for loading state
export function KanbanTaskCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 animate-pulse" />
      <div className="p-3 pl-4 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
          <div className="h-6 w-6 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </Card>
  )
}
