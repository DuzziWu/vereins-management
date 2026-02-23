"use client"

import * as React from "react"
import Link from "next/link"
import { format, isPast, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { ListTodo, Calendar, ChevronRight, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { KanbanPriority, priorityConfig } from "@/lib/validations/kanban"

interface MyTask {
  id: string
  title: string
  priority: KanbanPriority
  deadline: string | null
  workgroup_id: string
  workgroup_name: string
  column_name: string
}

interface MyTasksWidgetProps {
  basePath: string // e.g., "/member" or "/admin"
}

function getPriorityIcon(priority: KanbanPriority) {
  const colors: Record<KanbanPriority, string> = {
    low: "text-gray-400",
    normal: "text-blue-500",
    high: "text-orange-500",
    urgent: "text-red-500",
  }

  return (
    <div
      className={cn("w-2 h-2 rounded-full", {
        "bg-gray-400": priority === "low",
        "bg-blue-500": priority === "normal",
        "bg-orange-500": priority === "high",
        "bg-red-500": priority === "urgent",
      })}
    />
  )
}

export function MyTasksWidget({ basePath }: MyTasksWidgetProps) {
  const [tasks, setTasks] = React.useState<MyTask[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchMyTasks() {
      try {
        const response = await fetch("/api/kanban/my-tasks?limit=5")

        if (!response.ok) {
          throw new Error("Fehler beim Laden der Tasks")
        }

        const data = await response.json()
        setTasks(data.tasks)
        setTotalCount(data.total_count)
      } catch (err) {
        console.error("Error fetching my tasks:", err)
        setError("Tasks konnten nicht geladen werden")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyTasks()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Meine Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Meine Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-5 w-5" />
            Meine Tasks
          </CardTitle>
          <CardDescription>
            {totalCount === 0
              ? "Keine offenen Tasks"
              : totalCount === 1
              ? "1 Task zugewiesen"
              : `${totalCount} Tasks zugewiesen`}
          </CardDescription>
        </div>
        {totalCount > 5 && (
          <Link href={`${basePath}/tasks`}>
            <Button variant="ghost" size="sm" className="gap-1">
              Alle anzeigen
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListTodo className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine offenen Tasks
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aufgaben, die dir zugewiesen werden, erscheinen hier
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline))
              const isDueToday = task.deadline && isToday(new Date(task.deadline))

              return (
                <Link
                  key={task.id}
                  href={`${basePath}/workgroups/${task.workgroup_id}?task=${task.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    {/* Priority Indicator */}
                    <div className="mt-1.5">
                      {getPriorityIcon(task.priority)}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.workgroup_name}</span>
                        <span>•</span>
                        <span>{task.column_name}</span>
                      </div>
                    </div>

                    {/* Deadline */}
                    {task.deadline && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs shrink-0",
                          isOverdue && "text-red-500",
                          isDueToday && "text-yellow-600",
                          !isOverdue && !isDueToday && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>
                          {isToday(new Date(task.deadline))
                            ? "Heute"
                            : format(new Date(task.deadline), "dd.MM.", {
                                locale: de,
                              })}
                        </span>
                      </div>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
