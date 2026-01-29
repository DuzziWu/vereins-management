"use client"

import { MoreHorizontal, Pencil, Trash2, BookOpen, ArrowUp, ArrowDown, RotateCcw, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/validations/membership-type"
import { cn } from "@/lib/utils"

export type SortOrder = "desc" | "asc"

export interface TransactionEntry {
  id: string
  type: "income" | "expense"
  amount: number
  transaction_date: string
  description: string
  category: {
    id: string
    name: string
    type: string
    icon: string | null
    color: string | null
  } | null
  receipt_reference: string | null
  note: string | null
  is_deleted: boolean
  created_by_profile: {
    id: string
    first_name: string
    last_name: string
  } | null
  payment_id: string | null
  deleted_at?: string | null
  deletion_reason?: string | null
  deleted_by_profile?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface TreasuryTableProps {
  entries: TransactionEntry[]
  runningBalances: number[]
  onEdit: (entry: TransactionEntry) => void
  onDelete: (entry: TransactionEntry) => void
  onHistory?: (entry: TransactionEntry) => void
  isLoading?: boolean
  sortOrder?: SortOrder
  onSortChange?: (order: SortOrder) => void
  /** Show trash view with restore actions instead of edit/delete */
  trashView?: boolean
  onRestore?: (entry: TransactionEntry) => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

function CategoryBadge({ category }: { category: TransactionEntry["category"] }) {
  if (!category) {
    return <span className="text-muted-foreground">&ndash;</span>
  }

  return (
    <Badge
      variant="outline"
      className="font-normal"
      style={category.color ? { borderColor: category.color, color: category.color } : undefined}
    >
      {category.name}
    </Badge>
  )
}

export function TreasuryTable({
  entries,
  runningBalances,
  onEdit,
  onDelete,
  onHistory,
  isLoading,
  sortOrder = "desc",
  onSortChange,
  trashView,
  onRestore,
}: TreasuryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">
          {trashView ? "Keine gelöschten Buchungen" : "Keine Buchungen gefunden"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {trashView
            ? "Es befinden sich keine gelöschten Buchungen im Papierkorb."
            : "Es wurden noch keine Buchungen erfasst oder es gibt keine Treffer für Ihre Suche."}
        </p>
      </div>
    )
  }

  function handleSortToggle() {
    onSortChange?.(sortOrder === "desc" ? "asc" : "desc")
  }

  const SortIcon = sortOrder === "desc" ? ArrowDown : ArrowUp

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={handleSortToggle}
              >
                Datum
                <SortIcon className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead>Beschreibung</TableHead>
            <TableHead className="hidden md:table-cell">Kategorie</TableHead>
            {trashView ? (
              <TableHead className="hidden lg:table-cell">Löschgrund</TableHead>
            ) : (
              <TableHead className="hidden lg:table-cell">Beleg</TableHead>
            )}
            <TableHead className="text-right">Betrag</TableHead>
            {!trashView && (
              <TableHead className="text-right hidden sm:table-cell">Saldo</TableHead>
            )}
            {trashView && (
              <TableHead className="hidden sm:table-cell">Gelöscht am</TableHead>
            )}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isSystemGenerated = !!entry.payment_id
            return (
              <TableRow
                key={entry.id}
                className={cn(
                  trashView && "opacity-70",
                  isSystemGenerated && !trashView && "bg-muted/30",
                )}
              >
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatDate(entry.transaction_date)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      {entry.description}
                      {isSystemGenerated && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          Beitrag
                        </Badge>
                      )}
                    </span>
                    {entry.note && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {entry.note}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <CategoryBadge category={entry.category} />
                </TableCell>
                {trashView ? (
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                    {entry.deletion_reason || "–"}
                  </TableCell>
                ) : (
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {entry.receipt_reference || "–"}
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums font-medium">
                  <span className={entry.type === "income" ? "text-green-600" : "text-red-600"}>
                    {entry.type === "income" ? "+" : "\u2212"}
                    {formatCurrency(entry.amount)}
                  </span>
                </TableCell>
                {!trashView && (
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    <span className={runningBalances[index] < 0 ? "text-red-600" : ""}>
                      {formatCurrency(runningBalances[index])}
                    </span>
                  </TableCell>
                )}
                {trashView && (
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {entry.deleted_at ? formatDate(entry.deleted_at) : "–"}
                  </TableCell>
                )}
                <TableCell>
                  {trashView ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRestore?.(entry)}
                            disabled={isLoading}
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Wiederherstellen</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wiederherstellen</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    !isSystemGenerated && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Aktionen</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(entry)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onHistory?.(entry)}>
                            <History className="mr-2 h-4 w-4" />
                            Historie
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(entry)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
