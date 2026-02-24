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
  AlertCircle,
  Clock,
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

function getPriorityStyles(priority: string): { stripe: string; glow: string; badge: string } {
  const styles: Record<string, { stripe: string; glow: string; badge: string }> = {
    low: {
      stripe: "bg-slate-400",
      glow: "",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    normal: {
      stripe: "bg-blue-500",
      glow: "",
      badge: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    },
    high: {
      stripe: "bg-amber-500",
      glow: "shadow-amber-200/50 dark:shadow-amber-500/20",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    },
    urgent: {
      stripe: "bg-red-500",
      glow: "shadow-red-200/50 dark:shadow-red-500/30",
      badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  }
  return styles[priority] || styles.normal
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
  const priorityStyles = getPriorityStyles(task.priority)
  const isUrgentOrHigh = task.priority === "urgent" || task.priority === "high"

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all duration-200",
        "border border-border/50 bg-card",
        "hover:shadow-lg hover:scale-[1.02] hover:border-border",
        "active:scale-[0.98]",
        isUrgentOrHigh && priorityStyles.glow,
        isOverdue && "ring-1 ring-red-300 dark:ring-red-800",
        (isDragging || isSortableDragging) && "opacity-60 shadow-2xl ring-2 ring-primary rotate-2 scale-105"
      )}
      onClick={onClick}
    >
      {/* Priority Stripe with gradient */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-all duration-200",
          "group-hover:w-1.5",
          priorityStyles.stripe
        )}
      />

      <div className="flex">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center px-1.5 cursor-grab active:cursor-grabbing",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "hover:bg-muted/80 rounded-l"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/70" />
        </div>

        {/* Content */}
        <div className="flex-1 p-3 pl-2 space-y-2.5">
          {/* Title with priority indicator for urgent */}
          <div className="flex items-start gap-2">
            {task.priority === "urgent" && (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            )}
            <p className="text-sm font-medium line-clamp-2 group-hover:text-foreground/90 transition-colors">
              {task.title}
            </p>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.slice(0, 3).map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full transition-transform hover:scale-105"
                  style={{
                    backgroundColor: `${label.color}25`,
                    color: label.color,
                    boxShadow: `inset 0 0 0 1px ${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  +{task.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Bottom Row: Metadata */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Left: Deadline, Attachments, Checklist */}
            <div className="flex items-center gap-3 text-muted-foreground">
              {/* Deadline */}
              {task.deadline && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded transition-colors",
                          isOverdue && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                          isDueToday && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                          !isOverdue && !isDueToday && "hover:bg-muted"
                        )}
                      >
                        {isOverdue ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : isDueToday ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <Calendar className="h-3 w-3" />
                        )}
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
                <div className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors">
                  <Paperclip className="h-3 w-3" />
                  <span>{attachmentCount}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {checklistTotal > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    checklistCompleted === checklistTotal
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground/80 hover:text-muted-foreground"
                  )}
                >
                  <CheckSquare className={cn(
                    "h-3 w-3",
                    checklistCompleted === checklistTotal && "fill-current"
                  )} />
                  <span className="font-medium">
                    {checklistCompleted}/{checklistTotal}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Assignees */}
            {displayedAssignees.length > 0 && (
              <div className="flex -space-x-2 group/avatars">
                {displayedAssignees.map((assignee, index) => (
                  <TooltipProvider key={assignee.profile_id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar
                          className={cn(
                            "h-6 w-6 border-2 border-background ring-0 transition-all duration-200",
                            "hover:scale-110 hover:z-10 hover:ring-2 hover:ring-primary/50"
                          )}
                          style={{ zIndex: displayedAssignees.length - index }}
                        >
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 font-medium">
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
                    <AvatarFallback className="text-[10px] bg-muted font-medium">
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
