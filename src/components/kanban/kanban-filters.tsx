"use client"

import * as React from "react"
import { Search, X, Filter } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Separator } from "@/components/ui/separator"
import {
  KanbanFilterData,
  KanbanLabel,
  KanbanPriority,
  priorityConfig,
} from "@/lib/validations/kanban"

interface Member {
  profile_id: string
  first_name: string
  last_name: string
}

interface KanbanFiltersProps {
  filters: KanbanFilterData
  onFiltersChange: (filters: KanbanFilterData) => void
  members: Member[]
  labels: KanbanLabel[]
}

export function KanbanFilters({
  filters,
  onFiltersChange,
  members,
  labels,
}: KanbanFiltersProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search || "")
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue || undefined })
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchValue])

  const hasActiveFilters =
    filters.assignee_id ||
    filters.label_id ||
    filters.priority ||
    filters.only_mine ||
    filters.overdue

  const activeFilterCount = [
    filters.assignee_id,
    filters.label_id,
    filters.priority,
    filters.only_mine,
    filters.overdue,
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setSearchValue("")
    onFiltersChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchValue("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Suche leeren</span>
          </Button>
        )}
      </div>

      {/* Assignee Filter */}
      <Select
        value={filters.assignee_id || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            assignee_id: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Zugewiesen an" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Mitglieder</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.profile_id} value={member.profile_id}>
              {member.first_name} {member.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Label Filter */}
      {labels.length > 0 && (
        <Select
          value={filters.label_id || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              label_id: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Labels</SelectItem>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Priority Filter */}
      <Select
        value={filters.priority || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            priority: value === "all" ? undefined : (value as KanbanPriority),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priorität" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Prioritäten</SelectItem>
          {(Object.entries(priorityConfig) as [KanbanPriority, typeof priorityConfig.low][]).map(
            ([key, config]) => (
              <SelectItem key={key} value={key}>
                <span className={config.color}>{config.label}</span>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      {/* More Filters Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-10">
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-4">
            <div className="font-medium text-sm">Schnellfilter</div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="only-mine"
                  checked={filters.only_mine || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      only_mine: checked ? true : undefined,
                    })
                  }
                />
                <label
                  htmlFor="only-mine"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nur meine Tasks
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overdue"
                  checked={filters.overdue || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      overdue: checked ? true : undefined,
                    })
                  }
                />
                <label
                  htmlFor="overdue"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Überfällige Tasks
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Alle Filter löschen
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {filters.only_mine && (
            <Badge variant="secondary" className="gap-1">
              Meine Tasks
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, only_mine: undefined })
                }
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.overdue && (
            <Badge variant="secondary" className="gap-1 text-red-600">
              Überfällig
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, overdue: undefined })
                }
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
