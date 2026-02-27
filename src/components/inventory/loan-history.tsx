"use client"

import * as React from "react"
import { format, differenceInDays } from "date-fns"
import { de } from "date-fns/locale"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  User,
  FileText,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  RETURN_CONDITION_CONFIG,
  type InventoryLoan,
} from "@/lib/validations/inventory"

interface LoanHistoryProps {
  itemId: string
  loans: InventoryLoan[]
  isLoading?: boolean
  onExportCSV?: () => void
}

export function LoanHistory({
  loans,
  isLoading,
  onExportCSV,
}: LoanHistoryProps) {
  // Stats
  const totalLoans = loans.length
  const completedLoans = loans.filter((l) => l.returned_at).length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (loans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Verleih-Historie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Dieses Item wurde noch nie verliehen.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Verleih-Historie
            </CardTitle>
            <CardDescription>
              Dieses Item wurde {totalLoans}x verliehen
              {completedLoans < totalLoans && (
                <span className="text-orange-600"> ({totalLoans - completedLoans} aktuell)</span>
              )}
            </CardDescription>
          </div>
          {onExportCSV && (
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {loans.map((loan) => (
              <LoanHistoryEntry key={loan.id} loan={loan} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function LoanHistoryEntry({ loan }: { loan: InventoryLoan }) {
  const isActive = !loan.returned_at
  const duration = loan.returned_at
    ? differenceInDays(new Date(loan.returned_at), new Date(loan.loaned_at))
    : differenceInDays(new Date(), new Date(loan.loaned_at))

  return (
    <div
      className={`rounded-lg border p-4 ${
        isActive ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div
          className={`rounded-full p-2 ${
            isActive
              ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50"
              : "bg-green-100 text-green-600 dark:bg-green-900/50"
          }`}
        >
          {isActive ? (
            <Clock className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(new Date(loan.loaned_at), "dd.MM.yyyy", { locale: de })}
            </span>
            <span className="text-muted-foreground">-</span>
            {loan.returned_at ? (
              <span className="font-medium">
                {format(new Date(loan.returned_at), "dd.MM.yyyy", { locale: de })}
              </span>
            ) : (
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                Noch ausgeliehen
              </Badge>
            )}
            <span className="text-muted-foreground">
              ({duration} Tag{duration !== 1 ? "e" : ""})
            </span>
          </div>

          {/* Borrower */}
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              {loan.borrower?.first_name} {loan.borrower?.last_name}
            </span>
          </div>

          {/* Loan Note */}
          {loan.loan_note && (
            <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{loan.loan_note}</span>
            </div>
          )}

          {/* Return Info */}
          {loan.returned_at && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {loan.return_condition && (
                  <Badge
                    variant={
                      loan.return_condition === "good"
                        ? "default"
                        : loan.return_condition === "lost"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {RETURN_CONDITION_CONFIG[loan.return_condition].label}
                  </Badge>
                )}
                {loan.return_location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {loan.return_location.name}
                  </span>
                )}
              </div>
              {loan.return_note && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Rückgabe-Notiz: {loan.return_note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Table view variant for member profile page
interface LoanHistoryTableProps {
  loans: InventoryLoan[]
  isLoading?: boolean
  showItemColumn?: boolean
}

export function LoanHistoryTable({
  loans,
  isLoading,
  showItemColumn = true,
}: LoanHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Ausleihen vorhanden.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showItemColumn && <TableHead>Item</TableHead>}
          <TableHead>Verliehen am</TableHead>
          <TableHead>Zurückgegeben</TableHead>
          <TableHead>Dauer</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => {
          const isActive = !loan.returned_at
          const duration = loan.returned_at
            ? differenceInDays(new Date(loan.returned_at), new Date(loan.loaned_at))
            : differenceInDays(new Date(), new Date(loan.loaned_at))

          return (
            <TableRow key={loan.id}>
              {showItemColumn && (
                <TableCell>
                  <div>
                    <p className="font-medium">{loan.item?.name}</p>
                    {loan.item?.inventory_number && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {loan.item.inventory_number}
                      </p>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                {format(new Date(loan.loaned_at), "dd.MM.yyyy", { locale: de })}
              </TableCell>
              <TableCell>
                {loan.returned_at
                  ? format(new Date(loan.returned_at), "dd.MM.yyyy", { locale: de })
                  : "-"}
              </TableCell>
              <TableCell>
                {duration} Tag{duration !== 1 ? "e" : ""}
              </TableCell>
              <TableCell>
                {isActive ? (
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                    Ausgeliehen
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Zurückgegeben
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
