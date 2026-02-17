"use client"

import * as React from "react"
import { Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BreadcrumbItem as BreadcrumbItemType } from "./types"

interface FolderBreadcrumbProps {
  items: BreadcrumbItemType[]
  maxVisibleItems?: number
  onNavigate: (folderId: string | null) => void
}

export function FolderBreadcrumb({
  items,
  maxVisibleItems = 4,
  onNavigate,
}: FolderBreadcrumbProps) {
  // Always show Home, and collapse middle items if needed
  const needsCollapse = items.length > maxVisibleItems

  // Items to show in collapsed dropdown
  const collapsedItems = needsCollapse
    ? items.slice(1, items.length - (maxVisibleItems - 2))
    : []

  // Visible items (first item, collapsed indicator, last few items)
  const visibleStartItems = needsCollapse ? items.slice(0, 1) : items.slice(0, -1)
  const visibleEndItems = needsCollapse
    ? items.slice(items.length - (maxVisibleItems - 2))
    : []
  const currentItem = items[items.length - 1]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home / Root */}
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onNavigate(null)
            }}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Dokumente</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.length > 0 && <BreadcrumbSeparator />}

        {/* Start items (before collapse) */}
        {visibleStartItems.map((item) => (
          <React.Fragment key={item.id || "root"}>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(item.id)
                }}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}

        {/* Collapsed items dropdown */}
        {needsCollapse && collapsedItems.length > 0 && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Weitere Ordner</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {collapsedItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id || "root"}
                      onClick={() => onNavigate(item.id)}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {/* End items (after collapse, excluding current) */}
        {visibleEndItems.slice(0, -1).map((item) => (
          <React.Fragment key={item.id || "root"}>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(item.id)
                }}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}

        {/* Current page */}
        {currentItem && (
          <BreadcrumbItem>
            <BreadcrumbPage>{currentItem.name}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
