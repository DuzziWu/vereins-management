"use client"

import * as React from "react"
import { History, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/validations/membership-type"

interface AuditEntry {
  id: string
  change_type: string
  changes: Record<string, unknown> | null
  changed_fields: string[] | null
  changed_at: string
  changed_by_profile: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface TransactionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string | null
  transactionDescription?: string
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  update: "Bearbeitet",
  delete: "Gelöscht",
  restore: "Wiederhergestellt",
}

const CHANGE_TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  update: "secondary",
  delete: "destructive",
  restore: "default",
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Betrag",
  description: "Beschreibung",
  transaction_date: "Datum",
  type: "Typ",
  category_id: "Kategorie",
  receipt_reference: "Beleg-Referenz",
  note: "Notiz",
  deletion_reason: "Löschgrund",
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "–"
  if (field === "amount") return formatCurrency(Number(value))
  if (field === "transaction_date") {
    return new Date(String(value)).toLocaleDateString("de-DE")
  }
  if (field === "type") {
    return value === "income" ? "Einnahme" : "Ausgabe"
  }
  return String(value)
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function TransactionHistoryDialog({
  open,
  onOpenChange,
  transactionId,
  transactionDescription,
}: TransactionHistoryDialogProps) {
  const [history, setHistory] = React.useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !transactionId) return

    async function fetchHistory() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/treasury/${transactionId}/history`)
        if (!response.ok) throw new Error("Failed to fetch history")
        const data = await response.json()
        setHistory(data.history || [])
      } catch (error) {
        console.error("Error fetching history:", error)
        toast.error("Fehler beim Laden der Änderungshistorie")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [open, transactionId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Änderungshistorie
          </DialogTitle>
          {transactionDescription && (
            <DialogDescription>
              {transactionDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine Änderungen vorhanden.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <Badge variant={CHANGE_TYPE_VARIANTS[entry.change_type] || "outline"}>
                        {CHANGE_TYPE_LABELS[entry.change_type] || entry.change_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.changed_at)}
                      </span>
                    </div>

                    {/* User */}
                    {entry.changed_by_profile != null ? (
                      <p className="text-xs text-muted-foreground">
                        von {entry.changed_by_profile.first_name} {entry.changed_by_profile.last_name}
                      </p>
                    ) : null}

                    {/* Changes */}
                    {entry.change_type === "update" && entry.changes != null && entry.changed_fields != null ? (
                      <div className="space-y-1.5 mt-2">
                        {entry.changed_fields.map((field) => {
                          const change = entry.changes?.[field] as { old?: unknown; new?: unknown } | undefined
                          const oldVal = change?.old
                          const newVal = change?.new
                          return (
                            <div key={field} className="text-sm flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-muted-foreground">
                                {FIELD_LABELS[field] || field}:
                              </span>
                              <span className="text-muted-foreground line-through">
                                {formatFieldValue(field, oldVal)}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>{formatFieldValue(field, newVal)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}

                    {/* Delete reason */}
                    {entry.change_type === "delete" && entry.changes?.deletion_reason != null ? (
                      <p className="text-sm text-muted-foreground">
                        Grund: {String(entry.changes.deletion_reason)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
