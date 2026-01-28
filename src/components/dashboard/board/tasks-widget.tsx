"use client"

import Link from "next/link"
import { AlertTriangle, FileEdit, Clock, CheckCircle2, ListTodo } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ManualTodos } from "./manual-todos"

interface Hint {
  type: string
  icon: string
  message: string
  count: number
  link: string
}

interface Todo {
  id: string
  content: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

interface TasksWidgetProps {
  hints: Hint[]
  todos: Todo[]
  isLoading: boolean
  isTodosLoading: boolean
  onAddTodo: (content: string) => Promise<void>
  onToggleTodo: (id: string, isCompleted: boolean) => Promise<void>
  onDeleteTodo: (id: string) => Promise<void>
}

const ICON_MAP: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  edit: FileEdit,
  clock: Clock,
}

function HintItem({ hint }: { hint: Hint }) {
  const Icon = ICON_MAP[hint.icon] || AlertTriangle

  return (
    <Link
      href={hint.link}
      className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <span className="flex-1 text-sm">{hint.message}</span>
    </Link>
  )
}

function HintsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function TasksWidget({
  hints,
  todos,
  isLoading,
  isTodosLoading,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}: TasksWidgetProps) {
  const hasHints = hints.length > 0
  const allClear = !isLoading && hints.length === 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Aufgaben
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Automatic Hints Section */}
        {isLoading ? (
          <HintsSkeleton />
        ) : allClear ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Alles erledigt!</span>
          </div>
        ) : hasHints ? (
          <div className="space-y-1">
            {hints.map((hint) => (
              <HintItem key={hint.type} hint={hint} />
            ))}
          </div>
        ) : null}

        {/* Separator */}
        {(hasHints || allClear) && (
          <div className="border-t" />
        )}

        {/* Manual Todos Section */}
        <ManualTodos
          todos={todos}
          isLoading={isTodosLoading}
          onAddTodo={onAddTodo}
          onToggleTodo={onToggleTodo}
          onDeleteTodo={onDeleteTodo}
        />
      </CardContent>
    </Card>
  )
}
