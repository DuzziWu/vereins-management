"use client"

import * as React from "react"
import { Search, ChevronsUpDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export type TransactionTypeFilter = "all" | "income" | "expense"
export type TreasuryPeriod = "month" | "quarter" | "year" | "all" | "custom"

export interface TreasuryFilters {
  search: string
  type: TransactionTypeFilter
  period: TreasuryPeriod
  categoryIds: string[] // empty = all
  customDateFrom?: string
  customDateTo?: string
  showPayments: boolean
}

export interface TransactionCategory {
  id: string
  name: string
  type: "income" | "expense"
  icon: string | null
  color: string | null
  is_system: boolean
}

interface TreasuryToolbarProps {
  filters: TreasuryFilters
  onFiltersChange: (filters: TreasuryFilters) => void
  categories: TransactionCategory[]
}

export function TreasuryToolbar({ filters, onFiltersChange, categories }: TreasuryToolbarProps) {
  const [categoryPopoverOpen, setCategoryPopoverOpen] = React.useState(false)

  function handleSearchChange(value: string) {
    onFiltersChange({ ...filters, search: value })
  }

  function handleTypeChange(value: string) {
    onFiltersChange({ ...filters, type: value as TransactionTypeFilter, categoryIds: [] })
  }

  function handlePeriodChange(value: string) {
    const period = value as TreasuryPeriod
    if (period === "custom") {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      onFiltersChange({
        ...filters,
        period,
        customDateFrom: `${year}-${month}-01`,
        customDateTo: now.toISOString().split("T")[0],
      })
    } else {
      onFiltersChange({ ...filters, period, customDateFrom: undefined, customDateTo: undefined })
    }
  }

  function handleCategoryToggle(categoryId: string) {
    const current = filters.categoryIds
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    onFiltersChange({ ...filters, categoryIds: updated })
  }

  function handleClearCategories() {
    onFiltersChange({ ...filters, categoryIds: [] })
  }

  function handleShowPaymentsChange(checked: boolean) {
    onFiltersChange({ ...filters, showPayments: checked })
  }

  // Filter categories based on selected type
  const filteredCategories = filters.type === "all"
    ? categories
    : categories.filter((c) => c.type === filters.type)

  const selectedCategoryCount = filters.categoryIds.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach Beschreibung suchen..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <Select value={filters.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monat</SelectItem>
              <SelectItem value="quarter">Quartal</SelectItem>
              <SelectItem value="year">Jahr</SelectItem>
              <SelectItem value="all">Gesamt</SelectItem>
              <SelectItem value="custom">Benutzerdefiniert</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="income">Einnahmen</SelectItem>
              <SelectItem value="expense">Ausgaben</SelectItem>
            </SelectContent>
          </Select>

          {/* Multi-Select Category Filter */}
          <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categoryPopoverOpen}
                className="col-span-2 w-full justify-between font-normal sm:col-span-1 sm:w-[200px]"
              >
                {selectedCategoryCount === 0
                  ? "Alle Kategorien"
                  : `${selectedCategoryCount} Kategorie${selectedCategoryCount > 1 ? "n" : ""}`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {selectedCategoryCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start mb-1 text-muted-foreground"
                    onClick={handleClearCategories}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Auswahl aufheben
                  </Button>
                )}
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Keine Kategorien verfügbar.</p>
                ) : (
                  filteredCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                    >
                      <Checkbox
                        checked={filters.categoryIds.includes(cat.id)}
                        onCheckedChange={() => handleCategoryToggle(cat.id)}
                      />
                      <span className="flex-1">{cat.name}</span>
                      {cat.color && (
                        <span
                          className="h-3 w-3 rounded-sm border shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                    </label>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Beiträge anzeigen Toggle */}
          <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
            <Switch
              id="show-payments"
              checked={filters.showPayments}
              onCheckedChange={handleShowPaymentsChange}
            />
            <Label htmlFor="show-payments" className="text-sm cursor-pointer whitespace-nowrap">
              Beiträge anzeigen
            </Label>
          </div>
        </div>
      </div>

      {/* Custom date range inputs */}
      {filters.period === "custom" && (
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">Von:</span>
          <Input
            type="date"
            value={filters.customDateFrom || ""}
            onChange={(e) => onFiltersChange({ ...filters, customDateFrom: e.target.value })}
            className="w-full sm:w-[160px]"
          />
          <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">Bis:</span>
          <Input
            type="date"
            value={filters.customDateTo || ""}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => onFiltersChange({ ...filters, customDateTo: e.target.value })}
            className="w-full sm:w-[160px]"
          />
        </div>
      )}

      {/* Selected category badges */}
      {selectedCategoryCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.categoryIds.map((id) => {
            const cat = categories.find((c) => c.id === id)
            if (!cat) return null
            return (
              <Badge key={id} variant="secondary" className="gap-1">
                {cat.name}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  onClick={() => handleCategoryToggle(id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Entfernen</span>
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
