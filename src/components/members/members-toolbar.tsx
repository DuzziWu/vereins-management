"use client"

import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"

export interface MembersFilters {
  search: string
  role: string | null
  status: string | null
  hasFamily: string | null
}

interface MembersToolbarProps {
  filters: MembersFilters
  onFiltersChange: (filters: MembersFilters) => void
}

export function MembersToolbar({ filters, onFiltersChange }: MembersToolbarProps) {
  const activeFilterCount = [filters.role, filters.status, filters.hasFamily].filter(Boolean).length

  function handleSearchChange(value: string) {
    onFiltersChange({ ...filters, search: value })
  }

  function handleRoleChange(value: string) {
    onFiltersChange({ ...filters, role: value === "all" ? null : value })
  }

  function handleStatusChange(value: string) {
    onFiltersChange({ ...filters, status: value === "all" ? null : value })
  }

  function handleFamilyChange(value: string) {
    onFiltersChange({ ...filters, hasFamily: value === "all" ? null : value })
  }

  function clearFilters() {
    onFiltersChange({ search: "", role: null, status: null, hasFamily: null })
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

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rolle</label>
                <Select value={filters.role || "all"} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Rollen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rollen</SelectItem>
                    <SelectItem value="vorstand">Vorstand</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="mitglied">Mitglied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Familie</label>
                <Select value={filters.hasFamily || "all"} onValueChange={handleFamilyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="with">Mit Familie</SelectItem>
                    <SelectItem value="without">Ohne Familie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
