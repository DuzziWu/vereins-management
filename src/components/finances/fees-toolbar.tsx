"use client"

import { Search, Users, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FeeStatus = "all" | "paid" | "partial" | "open"
export type ViewMode = "all" | "families"

export interface FeesFilters {
  search: string
  status: FeeStatus
  year: number
  onlyOpen: boolean
  viewMode: ViewMode
}

interface FeesToolbarProps {
  filters: FeesFilters
  onFiltersChange: (filters: FeesFilters) => void
  availableYears: number[]
}

export function FeesToolbar({ filters, onFiltersChange, availableYears }: FeesToolbarProps) {
  function handleSearchChange(value: string) {
    onFiltersChange({ ...filters, search: value })
  }

  function handleStatusChange(value: string) {
    onFiltersChange({ ...filters, status: value as FeeStatus })
  }

  function handleYearChange(value: string) {
    onFiltersChange({ ...filters, year: parseInt(value, 10) })
  }

  function handleOnlyOpenChange(checked: boolean) {
    onFiltersChange({ ...filters, onlyOpen: checked })
  }

  function handleViewModeChange(mode: ViewMode) {
    onFiltersChange({ ...filters, viewMode: mode })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Nach Name suchen..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="paid">Bezahlt</SelectItem>
            <SelectItem value="partial">Teilweise</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.year.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Jahr" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="only-open"
            checked={filters.onlyOpen}
            onCheckedChange={handleOnlyOpenChange}
          />
          <Label htmlFor="only-open" className="text-sm cursor-pointer whitespace-nowrap">
            Nur offene
          </Label>
        </div>

        {/* BUG-1: Ansichtsmodi Toggle */}
        <div className="flex items-center rounded-lg border p-1">
          <Button
            variant={filters.viewMode === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleViewModeChange("all")}
          >
            <User className="mr-1 h-3.5 w-3.5" />
            Alle
          </Button>
          <Button
            variant={filters.viewMode === "families" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleViewModeChange("families")}
          >
            <Users className="mr-1 h-3.5 w-3.5" />
            Familien
          </Button>
        </div>
      </div>
    </div>
  )
}
