"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, isToday } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  Paperclip,
  CheckCircle2,
  Circle,
  GripVertical,
  AlertTriangle,
  Clock,
  Flag,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { KanbanTask } from "@/lib/validations/kanban"

interface KanbanTaskCardProps {
  task: KanbanTask
  onClick: () => void
  isDragging?: boolean
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const priorityConfig = {
  low: {
    color: "bg-slate-400",
    icon: null,
    label: "Niedrig",
  },
  normal: {
    color: "bg-blue-500",
    icon: null,
    label: "Normal",
  },
  high: {
    color: "bg-amber-500",
    icon: Flag,
    label: "Hoch",
  },
  urgent: {
    color: "bg-red-500",
    icon: AlertTriangle,
    label: "Dringend",
  },
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
  const checklistProgress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0

  const attachmentCount = task.attachment_count || task.attachments?.length || 0
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal
  const PriorityIcon = priority.icon

  const hasMetadata = task.deadline || attachmentCount > 0 || checklistTotal > 0
  const hasLabels = task.labels && task.labels.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card rounded-lg border cursor-pointer",
        "transition-all duration-150 ease-out",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:shadow-sm active:translate-y-0",
        isOverdue && "border-red-200 dark:border-red-900/50",
        (isDragging || isSortableDragging) && "opacity-50 shadow-xl rotate-1 scale-[1.02]"
      )}
      onClick={onClick}
    >
      {/* Priority indicator line */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", priority.color)} />

      {/* Drag handle - appears on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-0.5 top-1/2 -translate-y-1/2 z-10",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "p-0.5 rounded bg-card border shadow-sm cursor-grab active:cursor-grabbing"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      <div className="pl-2.5 pr-2 py-2 space-y-1.5">
        {/* Header: Priority icon + Title */}
        <div className="flex items-start gap-1.5">
          {PriorityIcon && (
            <PriorityIcon className={cn(
              "h-3.5 w-3.5 shrink-0 mt-0.5",
              task.priority === "urgent" ? "text-red-500 animate-pulse" : "text-amber-500"
            )} />
          )}
          <h3 className="text-[13px] font-medium leading-snug line-clamp-2 text-foreground">
            {task.title}
          </h3>
        </div>

        {/* Labels - compact inline display */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1 pl-0.5">
            {task.labels!.slice(0, 4).map((label) => (
              <span
                key={label.id}
                className="inline-block h-1.5 w-6 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
            {task.labels!.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.labels!.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Progress bar for checklist */}
        {checklistTotal > 0 && (
          <div className="flex items-center gap-1.5 pl-0.5">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  checklistCompleted === checklistTotal
                    ? "bg-emerald-500"
                    : "bg-primary"
                )}
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <span className={cn(
              "text-[10px] font-medium tabular-nums",
              checklistCompleted === checklistTotal
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}>
              {checklistCompleted}/{checklistTotal}
            </span>
          </div>
        )}

        {/* Footer: Metadata + Assignees */}
        {(hasMetadata || displayedAssignees.length > 0) && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Left: Deadline & Attachments */}
            <div className="flex items-center gap-2">
              {/* Deadline badge */}
              {task.deadline && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                          isOverdue && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                          isDueToday && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                          !isOverdue && !isDueToday && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="h-2.5 w-2.5" />
                        ) : isDueToday ? (
                          <Clock className="h-2.5 w-2.5" />
                        ) : (
                          <Calendar className="h-2.5 w-2.5" />
                        )}
                        {isToday(new Date(task.deadline))
                          ? "Heute"
                          : format(new Date(task.deadline), "dd.MM.", { locale: de })}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {isOverdue ? "Überfällig: " : isDueToday ? "Fällig heute: " : "Fällig: "}
                      {format(new Date(task.deadline), "dd.MM.yyyy HH:mm", { locale: de })}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Attachment count */}
              {attachmentCount > 0 && (
                <div className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Paperclip className="h-2.5 w-2.5" />
                  {attachmentCount}
                </div>
              )}
            </div>

            {/* Right: Assignees */}
            {displayedAssignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {displayedAssignees.map((assignee) => (
                  <TooltipProvider key={assignee.profile_id} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-5 w-5 border border-background">
                          <AvatarFallback className="text-[8px] font-medium bg-muted">
                            {getInitials(assignee.first_name, assignee.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {assignee.first_name} {assignee.last_name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {remainingAssignees > 0 && (
                  <Avatar className="h-5 w-5 border border-background">
                    <AvatarFallback className="text-[8px] font-medium bg-muted">
                      +{remainingAssignees}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Skeleton for loading state
export function KanbanTaskCardSkeleton() {
  return (
    <div className="relative bg-card rounded-lg border overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted animate-pulse" />
      <div className="pl-2.5 pr-2 py-2 space-y-1.5">
        <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
        <div className="h-1.5 bg-muted rounded-full animate-pulse w-1/3" />
        <div className="flex justify-between pt-0.5">
          <div className="h-4 bg-muted rounded animate-pulse w-12" />
          <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
