"use client"

import * as React from "react"
import { X, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Todo {
  id: string
  content: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

interface ManualTodosProps {
  todos: Todo[]
  isLoading: boolean
  onAddTodo: (content: string) => Promise<void>
  onToggleTodo: (id: string, isCompleted: boolean) => Promise<void>
  onDeleteTodo: (id: string) => Promise<void>
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo
  onToggle: (isCompleted: boolean) => void
  onDelete: () => void
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isToggling, setIsToggling] = React.useState(false)
  const contentTruncated = todo.content.length > 100

  async function handleToggle() {
    setIsToggling(true)
    try {
      await onToggle(!todo.is_completed)
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  const content = (
    <div className="group flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded px-1 -mx-1">
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Checkbox
          checked={todo.is_completed}
          onCheckedChange={handleToggle}
          className="flex-shrink-0"
        />
      )}
      <span
        className={`flex-1 text-sm truncate ${
          todo.is_completed
            ? "line-through text-muted-foreground"
            : ""
        }`}
      >
        {contentTruncated ? todo.content.slice(0, 100) + "…" : todo.content}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        <span className="sr-only">Löschen</span>
      </Button>
    </div>
  )

  if (contentTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{todo.content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

function TodosSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function ManualTodos({
  todos,
  isLoading,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}: ManualTodosProps) {
  const [newTodo, setNewTodo] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Separate open and completed todos
  const openTodos = todos.filter((t) => !t.is_completed)
  const completedTodos = todos.filter((t) => t.is_completed)
  const hasMaxTodos = openTodos.length >= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = newTodo.trim()
    if (!content || isAdding || hasMaxTodos) return

    setIsAdding(true)
    try {
      await onAddTodo(content)
      setNewTodo("")
      inputRef.current?.focus()
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Meine To-Dos
        </h4>
        <TodosSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">
        Meine To-Dos
      </h4>

      {/* Open Todos */}
      {openTodos.length > 0 && (
        <div className="space-y-0.5">
          {openTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={(isCompleted) => onToggleTodo(todo.id, isCompleted)}
              onDelete={() => onDeleteTodo(todo.id)}
            />
          ))}
        </div>
      )}

      {/* Max todos warning */}
      {hasMaxTodos && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Zu viele offene Aufgaben. Bitte erledige einige zuerst.
        </p>
      )}

      {/* Add new todo */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Neue Aufgabe..."
          disabled={isAdding || hasMaxTodos}
          maxLength={200}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newTodo.trim() || isAdding || hasMaxTodos}
          className="h-8"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "+"
          )}
        </Button>
      </form>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="space-y-0.5 pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">
            Erledigt ({completedTodos.length})
          </p>
          {completedTodos.slice(0, 5).map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={(isCompleted) => onToggleTodo(todo.id, isCompleted)}
              onDelete={() => onDeleteTodo(todo.id)}
            />
          ))}
          {completedTodos.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{completedTodos.length - 5} weitere
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Noch keine Aufgaben erstellt
        </p>
      )}
    </div>
  )
}
