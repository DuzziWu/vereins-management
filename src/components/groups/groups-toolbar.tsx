"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface GroupsFilters {
  search: string
}

interface GroupsToolbarProps {
  filters: GroupsFilters
  onFiltersChange: (filters: GroupsFilters) => void
}

export function GroupsToolbar({ filters, onFiltersChange }: GroupsToolbarProps) {
  function handleSearchChange(value: string) {
    onFiltersChange({ ...filters, search: value })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Gruppe suchen..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}
