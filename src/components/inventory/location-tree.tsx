"use client"

import * as React from "react"
import { ChevronRight, MapPin, MoreHorizontal, QrCode, Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { InventoryLocation } from "@/lib/validations/inventory"

interface LocationWithChildren extends InventoryLocation {
  children: LocationWithChildren[]
}

interface LocationTreeProps {
  locations: LocationWithChildren[]
  selectedLocationId: string | null
  expandedLocationIds: Set<string>
  isVorstand: boolean
  isLoading?: boolean
  onLocationSelect: (locationId: string | null) => void
  onLocationExpand: (locationId: string) => void
  onLocationCollapse: (locationId: string) => void
  onLocationEdit?: (locationId: string) => void
  onLocationDelete?: (locationId: string) => void
  onLocationQRCode?: (locationId: string) => void
  onNewSubLocation?: (parentId: string | null) => void
}

export function LocationTree({
  locations,
  selectedLocationId,
  expandedLocationIds,
  isVorstand,
  isLoading,
  onLocationSelect,
  onLocationExpand,
  onLocationCollapse,
  onLocationEdit,
  onLocationDelete,
  onLocationQRCode,
  onNewSubLocation,
}: LocationTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>Keine Lagerorte vorhanden</p>
        {isVorstand && onNewSubLocation && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onNewSubLocation(null)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ersten Lagerort erstellen
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* Root level - All Items */}
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
          selectedLocationId === null && "bg-accent font-medium"
        )}
        onClick={() => onLocationSelect(null)}
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>Alle Lagerorte</span>
      </button>

      {locations.map((location) => (
        <LocationTreeNode
          key={location.id}
          location={location}
          depth={0}
          selectedLocationId={selectedLocationId}
          expandedLocationIds={expandedLocationIds}
          isVorstand={isVorstand}
          onLocationSelect={onLocationSelect}
          onLocationExpand={onLocationExpand}
          onLocationCollapse={onLocationCollapse}
          onLocationEdit={onLocationEdit}
          onLocationDelete={onLocationDelete}
          onLocationQRCode={onLocationQRCode}
          onNewSubLocation={onNewSubLocation}
        />
      ))}
    </div>
  )
}

interface LocationTreeNodeProps {
  location: LocationWithChildren
  depth: number
  selectedLocationId: string | null
  expandedLocationIds: Set<string>
  isVorstand: boolean
  onLocationSelect: (locationId: string | null) => void
  onLocationExpand: (locationId: string) => void
  onLocationCollapse: (locationId: string) => void
  onLocationEdit?: (locationId: string) => void
  onLocationDelete?: (locationId: string) => void
  onLocationQRCode?: (locationId: string) => void
  onNewSubLocation?: (parentId: string | null) => void
}

function LocationTreeNode({
  location,
  depth,
  selectedLocationId,
  expandedLocationIds,
  isVorstand,
  onLocationSelect,
  onLocationExpand,
  onLocationCollapse,
  onLocationEdit,
  onLocationDelete,
  onLocationQRCode,
  onNewSubLocation,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocationIds.has(location.id)
  const isSelected = selectedLocationId === location.id
  const hasChildren = location.children && location.children.length > 0
  const canDelete = isVorstand && !hasChildren && (location.item_count || 0) === 0
  const canAddChild = isVorstand && location.depth < 4 // Max 5 levels (0-4)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpanded) {
      onLocationCollapse(location.id)
    } else {
      onLocationExpand(location.id)
    }
  }

  return (
    <Collapsible open={isExpanded}>
      <div
        className={cn(
          "group flex items-center rounded-md hover:bg-accent",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/Collapse Button */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 shrink-0",
              !hasChildren && "invisible"
            )}
            onClick={handleToggle}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </Button>
        </CollapsibleTrigger>

        {/* Location Icon & Name */}
        <button
          className="flex flex-1 items-center gap-2 overflow-hidden py-1.5 pr-2"
          onClick={() => onLocationSelect(location.id)}
        >
          <MapPin className={cn(
            "h-4 w-4 shrink-0",
            isExpanded ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="truncate text-sm">{location.name}</span>
          {location.item_count !== undefined && location.item_count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {location.item_count}
            </Badge>
          )}
        </button>

        {/* Actions Menu (Vorstand only) */}
        {isVorstand && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Lagerort-Aktionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canAddChild && onNewSubLocation && (
                <DropdownMenuItem onClick={() => onNewSubLocation(location.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Unterlagerort
                </DropdownMenuItem>
              )}
              {onLocationQRCode && (
                <DropdownMenuItem onClick={() => onLocationQRCode(location.id)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR-Code
                </DropdownMenuItem>
              )}
              {onLocationEdit && (
                <DropdownMenuItem onClick={() => onLocationEdit(location.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
              )}
              {(canAddChild || onLocationQRCode || onLocationEdit) && canDelete && (
                <DropdownMenuSeparator />
              )}
              {canDelete && onLocationDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onLocationDelete(location.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              )}
              {!canDelete && (
                <DropdownMenuItem disabled>
                  {hasChildren
                    ? "Hat Unterlagerorte"
                    : (location.item_count || 0) > 0
                    ? "Enthält Items"
                    : "Kann nicht gelöscht werden"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <CollapsibleContent>
          {location.children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child as LocationWithChildren}
              depth={depth + 1}
              selectedLocationId={selectedLocationId}
              expandedLocationIds={expandedLocationIds}
              isVorstand={isVorstand}
              onLocationSelect={onLocationSelect}
              onLocationExpand={onLocationExpand}
              onLocationCollapse={onLocationCollapse}
              onLocationEdit={onLocationEdit}
              onLocationDelete={onLocationDelete}
              onLocationQRCode={onLocationQRCode}
              onNewSubLocation={onNewSubLocation}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
