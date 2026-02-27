"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { InventoryLocation } from "@/lib/validations/inventory"

interface LocationSelectProps {
  locations: InventoryLocation[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
  className?: string
}

interface FlatLocation {
  id: string
  name: string
  fullPath: string
  depth: number
}

export function LocationSelect({
  locations,
  value,
  onChange,
  placeholder = "Lagerort auswählen",
  allowClear = false,
  disabled = false,
  className,
}: LocationSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Flatten the location tree for the dropdown
  const flatLocations = React.useMemo(() => {
    const result: FlatLocation[] = []

    function flatten(locs: InventoryLocation[], parentPath: string = "") {
      for (const loc of locs) {
        const fullPath = parentPath ? `${parentPath} > ${loc.name}` : loc.name
        result.push({
          id: loc.id,
          name: loc.name,
          fullPath,
          depth: loc.depth,
        })
        if (loc.children && loc.children.length > 0) {
          flatten(loc.children, fullPath)
        }
      }
    }

    flatten(locations)
    return result
  }, [locations])

  // Find the selected location
  const selectedLocation = React.useMemo(() => {
    if (!value) return null
    return flatLocations.find((loc) => loc.id === value) || null
  }, [value, flatLocations])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedLocation ? (
              <>
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedLocation.fullPath}</span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {allowClear && value && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Lagerort suchen..." />
          <CommandList>
            <CommandEmpty>Kein Lagerort gefunden.</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">{placeholder}</span>
                </CommandItem>
              )}
              {flatLocations.map((loc) => (
                <CommandItem
                  key={loc.id}
                  value={loc.fullPath}
                  onSelect={() => {
                    onChange(loc.id)
                    setOpen(false)
                  }}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === loc.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <MapPin
                    className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                    style={{ marginLeft: `${loc.depth * 12}px` }}
                  />
                  <span className="truncate">{loc.fullPath}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
