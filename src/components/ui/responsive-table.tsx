"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

export interface ResponsiveTableColumn<T> {
  /** Column header label */
  header: string
  /** Key to access data or render function */
  accessorKey?: keyof T
  /** Custom cell renderer */
  cell?: (item: T) => React.ReactNode
  /** Show this column on mobile card view (default: false) */
  showOnMobile?: boolean
  /** CSS class for the table cell */
  className?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ResponsiveTableColumn<T>[]
  /** Render function for mobile card view. If not provided, uses showOnMobile columns. */
  renderCard?: (item: T, index: number) => React.ReactNode
  /** Called when a card/row is clicked */
  onRowClick?: (item: T) => void
  /** Key extractor for list items */
  keyExtractor: (item: T) => string
  /** Empty state message */
  emptyMessage?: string
  className?: string
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderCard,
  onRowClick,
  keyExtractor,
  emptyMessage = "Keine Einträge vorhanden.",
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  // Mobile: Card-based view
  if (isMobile) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {data.map((item, index) => {
          if (renderCard) {
            return (
              <div key={keyExtractor(item)}>{renderCard(item, index)}</div>
            )
          }

          const mobileColumns = columns.filter((col) => col.showOnMobile)
          return (
            <Card
              key={keyExtractor(item)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer active:bg-accent"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-1.5">
                  {mobileColumns.map((col) => {
                    const value = col.cell
                      ? col.cell(item)
                      : col.accessorKey
                        ? String(item[col.accessorKey] ?? "")
                        : null
                    return (
                      <div key={col.header} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {col.header}:
                        </span>
                        <span className="text-sm">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Desktop: Standard table
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.header} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={keyExtractor(item)}
            className={cn(onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <TableCell key={col.header} className={col.className}>
                {col.cell
                  ? col.cell(item)
                  : col.accessorKey
                    ? String(item[col.accessorKey] ?? "")
                    : null}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
