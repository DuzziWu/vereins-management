"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { TreasuryStatsCards, type TreasuryStats } from "@/components/finances/treasury-stats"
import { TreasuryToolbar, type TreasuryFilters, type TransactionCategory } from "@/components/finances/treasury-toolbar"
import { TreasuryTable, type TransactionEntry, type SortOrder } from "@/components/finances/treasury-table"
import { TransactionForm, type TransactionFormSubmitData } from "@/components/finances/transaction-form"
import { TransactionDeleteDialog } from "@/components/finances/transaction-delete-dialog"
import { TreasuryCharts, type MonthlyData, type CategoryBreakdownEntry } from "@/components/finances/treasury-charts"
import { TransactionHistoryDialog } from "@/components/finances/transaction-history-dialog"
import type { TransactionType } from "@/lib/validations/treasury"

const PAGE_SIZE = 50

function getDateRange(filters: TreasuryFilters): { dateFrom: string | null; dateTo: string | null } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  switch (filters.period) {
    case "month": {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      return {
        dateFrom: start.toISOString().split("T")[0],
        dateTo: end.toISOString().split("T")[0],
      }
    }
    case "quarter": {
      const quarterStart = Math.floor(month / 3) * 3
      const start = new Date(year, quarterStart, 1)
      const end = new Date(year, quarterStart + 3, 0)
      return {
        dateFrom: start.toISOString().split("T")[0],
        dateTo: end.toISOString().split("T")[0],
      }
    }
    case "year": {
      return {
        dateFrom: `${year}-01-01`,
        dateTo: `${year}-12-31`,
      }
    }
    case "custom": {
      return {
        dateFrom: filters.customDateFrom || null,
        dateTo: filters.customDateTo || null,
      }
    }
    case "all":
    default:
      return { dateFrom: null, dateTo: null }
  }
}

function getPeriodLabel(filters: TreasuryFilters): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (filters.period) {
    case "month":
      return now.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    case "quarter": {
      const quarter = Math.floor(month / 3) + 1
      return `Q${quarter} ${year}`
    }
    case "year":
      return `${year}`
    case "custom": {
      const from = filters.customDateFrom
        ? new Date(filters.customDateFrom).toLocaleDateString("de-DE")
        : "..."
      const to = filters.customDateTo
        ? new Date(filters.customDateTo).toLocaleDateString("de-DE")
        : "..."
      return `${from} – ${to}`
    }
    case "all":
    default:
      return "Gesamt"
  }
}

export default function TreasuryPage() {
  const supabase = createClient()

  // State
  const [transactions, setTransactions] = React.useState<TransactionEntry[]>([])
  const [categories, setCategories] = React.useState<TransactionCategory[]>([])
  const [stats, setStats] = React.useState<TreasuryStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingStats, setIsLoadingStats] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState(0)

  // Trash state
  const [activeTab, setActiveTab] = React.useState<"transactions" | "trash">("transactions")
  const [trashEntries, setTrashEntries] = React.useState<TransactionEntry[]>([])
  const [isLoadingTrash, setIsLoadingTrash] = React.useState(false)
  const [trashTotalCount, setTrashTotalCount] = React.useState(0)
  const [trashPage, setTrashPage] = React.useState(0)

  // Sort & Pagination
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = React.useState(0)

  // Filters
  const [filters, setFilters] = React.useState<TreasuryFilters>({
    search: "",
    type: "all",
    period: "month",
    categoryIds: [],
    showPayments: false,
  })

  // Transaction Form
  const [showForm, setShowForm] = React.useState(false)
  const [formDefaultType, setFormDefaultType] = React.useState<TransactionType>("income")
  const [editingTransaction, setEditingTransaction] = React.useState<TransactionEntry | null>(null)

  // Delete Dialog
  const [deletingTransaction, setDeletingTransaction] = React.useState<TransactionEntry | null>(null)

  // History Dialog
  const [historyTransaction, setHistoryTransaction] = React.useState<TransactionEntry | null>(null)

  // Charts data
  const [monthlyBreakdown, setMonthlyBreakdown] = React.useState<MonthlyData[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = React.useState<CategoryBreakdownEntry[]>([])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(0)
  }, [filters, sortOrder])

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch("/api/treasury/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Fehler beim Laden der Kategorien")
    }
  }, [])

  // Fetch stats
  const fetchStats = React.useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const { dateFrom, dateTo } = getDateRange(filters)
      const params = new URLSearchParams()
      if (dateFrom) params.set("date_from", dateFrom)
      if (dateTo) params.set("date_to", dateTo)
      if (filters.showPayments) params.set("show_payments", "true")

      const response = await fetch(`/api/treasury/stats?${params}`)
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()

      setStats({
        balance: data.balance,
        periodIncome: data.period.income,
        periodExpense: data.period.expense,
        periodDifference: data.period.difference,
      })
      setMonthlyBreakdown(data.monthly_breakdown || [])
      setCategoryBreakdown(data.category_breakdown || [])
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Fehler beim Laden der Statistiken")
    } finally {
      setIsLoadingStats(false)
    }
  }, [filters.period, filters.customDateFrom, filters.customDateTo, filters.showPayments])

  // Fetch transactions
  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { dateFrom, dateTo } = getDateRange(filters)
      const params = new URLSearchParams()
      if (filters.type !== "all") params.set("type", filters.type)
      if (filters.categoryIds.length > 0) params.set("category_id", filters.categoryIds.join(","))
      if (dateFrom) params.set("date_from", dateFrom)
      if (dateTo) params.set("date_to", dateTo)
      if (filters.search.trim()) params.set("search", filters.search.trim())
      if (filters.showPayments) params.set("show_payments", "true")
      if (sortOrder === "asc") params.set("sort", "asc")
      params.set("limit", String(PAGE_SIZE))
      params.set("offset", String(currentPage * PAGE_SIZE))

      const response = await fetch(`/api/treasury?${params}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()

      setTransactions(data.transactions || [])
      setTotalCount(data.total ?? 0)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Fehler beim Laden der Buchungen")
    } finally {
      setIsLoading(false)
    }
  }, [filters, sortOrder, currentPage])

  // Fetch trash entries
  const fetchTrash = React.useCallback(async () => {
    setIsLoadingTrash(true)
    try {
      const params = new URLSearchParams()
      params.set("only_deleted", "true")
      params.set("limit", String(PAGE_SIZE))
      params.set("offset", String(trashPage * PAGE_SIZE))

      const response = await fetch(`/api/treasury?${params}`)
      if (!response.ok) throw new Error("Failed to fetch deleted transactions")
      const data = await response.json()

      setTrashEntries(data.transactions || [])
      setTrashTotalCount(data.total ?? 0)
    } catch (error) {
      console.error("Error fetching trash:", error)
      toast.error("Fehler beim Laden des Papierkorbs")
    } finally {
      setIsLoadingTrash(false)
    }
  }, [trashPage])

  // Calculate running balances for the table
  const runningBalances = React.useMemo(() => {
    if (!stats) return transactions.map(() => 0)

    const reversed = [...transactions].reverse()
    const balances: number[] = []
    let totalDisplayed = 0
    for (const t of reversed) {
      totalDisplayed += t.type === "income" ? Number(t.amount) : -Number(t.amount)
    }
    let runningBalance = stats.balance - totalDisplayed

    for (const t of reversed) {
      if (t.type === "income") {
        runningBalance += Number(t.amount)
      } else {
        runningBalance -= Number(t.amount)
      }
      balances.push(runningBalance)
    }

    balances.reverse()
    return balances
  }, [transactions, stats])

  // Initial load
  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Load trash when tab switches
  React.useEffect(() => {
    if (activeTab === "trash") {
      fetchTrash()
    }
  }, [activeTab, fetchTrash])

  // Handlers
  function handleNewIncome() {
    setEditingTransaction(null)
    setFormDefaultType("income")
    setShowForm(true)
  }

  function handleNewExpense() {
    setEditingTransaction(null)
    setFormDefaultType("expense")
    setShowForm(true)
  }

  function handleEdit(entry: TransactionEntry) {
    setEditingTransaction(entry)
    setFormDefaultType(entry.type)
    setShowForm(true)
  }

  function handleDelete(entry: TransactionEntry) {
    setDeletingTransaction(entry)
  }

  function handleHistory(entry: TransactionEntry) {
    setHistoryTransaction(entry)
  }

  async function handleFormSubmit(data: TransactionFormSubmitData) {
    try {
      if (editingTransaction) {
        const response = await fetch(`/api/treasury/${editingTransaction.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update transaction")
        }
        toast.success("Buchung aktualisiert")
      } else {
        const response = await fetch("/api/treasury", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create transaction")
        }
        toast.success("Buchung erfasst")
      }

      await Promise.all([fetchTransactions(), fetchStats()])
    } catch (error) {
      console.error("Error submitting transaction:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
      throw error
    }
  }

  async function handleDeleteConfirm(id: string, reason: string) {
    try {
      const response = await fetch(`/api/treasury/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletion_reason: reason }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete transaction")
      }
      toast.success("Buchung gelöscht")
      await Promise.all([fetchTransactions(), fetchStats()])
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
      throw error
    }
  }

  async function handleRestore(entry: TransactionEntry) {
    try {
      const response = await fetch(`/api/treasury/${entry.id}/restore`, {
        method: "POST",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore transaction")
      }
      toast.success("Buchung wiederhergestellt")
      await Promise.all([fetchTrash(), fetchTransactions(), fetchStats()])
    } catch (error) {
      console.error("Error restoring transaction:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Wiederherstellen")
    }
  }

  const periodLabel = getPeriodLabel(filters)

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const trashTotalPages = Math.ceil(trashTotalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vereinskasse</h1>
          <p className="text-muted-foreground">
            Einnahmen und Ausgaben verwalten
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewIncome} className="bg-green-600 hover:bg-green-700">
            <TrendingUp className="mr-2 h-4 w-4" />
            Einnahme
          </Button>
          <Button onClick={handleNewExpense} variant="destructive">
            <TrendingDown className="mr-2 h-4 w-4" />
            Ausgabe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <TreasuryStatsCards
        stats={stats}
        isLoading={isLoadingStats}
        periodLabel={periodLabel}
      />

      {/* Charts */}
      <TreasuryCharts
        monthlyBreakdown={monthlyBreakdown}
        categoryBreakdown={categoryBreakdown}
        isLoading={isLoadingStats}
      />

      {/* Tabs: Buchungen / Papierkorb */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "transactions" | "trash")}>
        <TabsList>
          <TabsTrigger value="transactions">
            Buchungen
            {totalCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({totalCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="trash">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Papierkorb
            {trashTotalCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({trashTotalCount})</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "transactions" && (
        <>
          {/* Toolbar */}
          <TreasuryToolbar
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <TreasuryTable
              entries={transactions}
              runningBalances={runningBalances}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onHistory={handleHistory}
              isLoading={isLoading}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Seite {currentPage + 1} von {totalPages} ({totalCount} Buchungen)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "trash" && (
        <>
          <p className="text-sm text-muted-foreground">
            Gelöschte Buchungen können innerhalb von 30 Tagen wiederhergestellt werden.
          </p>

          {isLoadingTrash ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <TreasuryTable
              entries={trashEntries}
              runningBalances={trashEntries.map(() => 0)}
              onEdit={() => {}}
              onDelete={() => {}}
              isLoading={isLoadingTrash}
              trashView
              onRestore={handleRestore}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          )}

          {/* Trash Pagination */}
          {trashTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Seite {trashPage + 1} von {trashTotalPages} ({trashTotalCount} gelöschte Buchungen)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={trashPage === 0}
                  onClick={() => setTrashPage((p) => Math.max(0, p - 1))}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={trashPage >= trashTotalPages - 1}
                  onClick={() => setTrashPage((p) => p + 1)}
                >
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        defaultType={formDefaultType}
        categories={categories}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Dialog */}
      <TransactionDeleteDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        transaction={deletingTransaction}
        onConfirm={handleDeleteConfirm}
      />

      {/* History Dialog */}
      <TransactionHistoryDialog
        open={!!historyTransaction}
        onOpenChange={(open) => !open && setHistoryTransaction(null)}
        transactionId={historyTransaction?.id ?? null}
        transactionDescription={historyTransaction?.description}
      />
    </div>
  )
}
