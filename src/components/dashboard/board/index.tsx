"use client"

import * as React from "react"
import { StatsWidgets } from "./stats-widgets"
import { QuickActions } from "./quick-actions"
import { BirthdayWidget } from "./birthday-widget"
import { TasksWidget } from "./tasks-widget"

interface Birthday {
  id: string
  firstName: string
  lastNameInitial: string
  date: string
  turnsAge: number
  isToday: boolean
  daysUntil: number
}

interface Hint {
  type: string
  icon: string
  message: string
  count: number
  link: string
}

interface BirthdaysData {
  items: Birthday[]
  totalCount: number
  hasMore: boolean
}

interface DashboardData {
  stats: {
    totalActiveMembers: number
    newMembersThisMonth: number
  }
  birthdays: BirthdaysData
  hints: Hint[]
}

interface Todo {
  id: string
  content: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export function BoardDashboard() {
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null)
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isTodosLoading, setIsTodosLoading] = React.useState(true)

  // Fetch dashboard data
  React.useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard/board")
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  // Fetch todos
  React.useEffect(() => {
    async function fetchTodos() {
      try {
        const response = await fetch("/api/todos")
        if (response.ok) {
          const data = await response.json()
          setTodos(data.todos || [])
        }
      } catch (error) {
        console.error("Error fetching todos:", error)
      } finally {
        setIsTodosLoading(false)
      }
    }

    fetchTodos()
  }, [])

  async function handleAddTodo(content: string) {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })

    if (response.ok) {
      const data = await response.json()
      setTodos((prev) => [data.todo, ...prev])
    } else {
      const error = await response.json()
      throw new Error(error.error || "Fehler beim Erstellen")
    }
  }

  async function handleToggleTodo(id: string, isCompleted: boolean) {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: isCompleted }),
    })

    if (response.ok) {
      const data = await response.json()
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? data.todo : t))
      )
    }
  }

  async function handleDeleteTodo(id: string) {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht und Schnellaktionen
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats */}
      <StatsWidgets
        stats={dashboardData?.stats || null}
        isLoading={isLoading}
      />

      {/* Two Column Layout: Birthdays | Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BirthdayWidget
          birthdays={dashboardData?.birthdays?.items || []}
          hasMore={dashboardData?.birthdays?.hasMore || false}
          totalCount={dashboardData?.birthdays?.totalCount || 0}
          isLoading={isLoading}
        />
        <TasksWidget
          hints={dashboardData?.hints || []}
          todos={todos}
          isLoading={isLoading}
          isTodosLoading={isTodosLoading}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
        />
      </div>
    </div>
  )
}
