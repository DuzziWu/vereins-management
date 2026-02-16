"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WorkgroupCategory } from "./workgroup-form"

export interface WorkgroupsFilters {
  search: string
  categoryId: string | null
}

interface WorkgroupsToolbarProps {
  filters: WorkgroupsFilters
  onFiltersChange: (filters: WorkgroupsFilters) => void
  categories: WorkgroupCategory[]
}

export function WorkgroupsToolbar({
  filters,
  onFiltersChange,
  categories,
}: WorkgroupsToolbarProps) {
  const hasFilters = filters.search || filters.categoryId

  function handleReset() {
    onFiltersChange({ search: "", categoryId: null })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select
          value={filters.categoryId || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              categoryId: value === "all" ? null : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8"
        >
          <X className="mr-1 h-4 w-4" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  )
}
