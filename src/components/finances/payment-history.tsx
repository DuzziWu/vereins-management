"use client"

import * as React from "react"
import {
  Banknote,
  Building2,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  X,
  Loader2,
  Receipt,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/validations/membership-type"
import type { FeeEntry } from "./fees-table"
import type { PaymentMethod } from "./payment-form"

export interface Payment {
  id: string
  feeId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  paymentMethodLabel: string
  note: string | null
  isCancelled: boolean
  cancellationReason: string | null
  cancelledAt: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string | null
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  transfer: <Building2 className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Bar",
  transfer: "Überweisung",
  other: "Sonstiges",
}

interface PaymentRowProps {
  payment: Payment
  onEdit: (payment: Payment) => void
  onCancel: (payment: Payment) => void
  isReadonly?: boolean
}

function PaymentRow({ payment, onEdit, onCancel, isReadonly }: PaymentRowProps) {
  const formattedDate = new Date(payment.paymentDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  if (payment.isCancelled) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formattedDate}
              </span>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Storniert
              </Badge>
            </div>
            <div className="text-lg font-medium tabular-nums text-muted-foreground line-through">
              {formatCurrency(payment.amount)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {paymentMethodIcons[payment.paymentMethod]}
              <span>{payment.paymentMethodLabel}</span>
            </div>
            {payment.cancellationReason && (
              <div className="mt-2 text-sm text-muted-foreground italic">
                Grund: {payment.cancellationReason}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{formattedDate}</div>
          <div className="text-lg font-bold tabular-nums">
            {formatCurrency(payment.amount)}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {paymentMethodIcons[payment.paymentMethod]}
            <span>{payment.paymentMethodLabel}</span>
          </div>
          {payment.note && (
            <div className="mt-1 text-sm text-muted-foreground">
              &quot;{payment.note}&quot;
            </div>
          )}
          {payment.createdByName && (
            <div className="text-xs text-muted-foreground">
              Erfasst von: {payment.createdByName}
            </div>
          )}
        </div>
        {!isReadonly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aktionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(payment)}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onCancel(payment)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Stornieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

interface PaymentHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: FeeEntry | null
  year: number
  payments: Payment[]
  isLoading: boolean
  isReadonly?: boolean
  onRecordPayment: () => void
  onEditPayment: (payment: Payment) => void
  onCancelPayment: (payment: Payment) => void
}

export function PaymentHistory({
  open,
  onOpenChange,
  entry,
  year,
  payments,
  isLoading,
  isReadonly,
  onRecordPayment,
  onEditPayment,
  onCancelPayment,
}: PaymentHistoryProps) {
  if (!entry) return null

  const totalPaid = payments
    .filter((p) => !p.isCancelled)
    .reduce((sum, p) => sum + p.amount, 0)

  const isOverpaid = totalPaid > entry.amountDue

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Zahlungshistorie</SheetTitle>
          <SheetDescription>
            {entry.name} - Beitrag {year}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Soll</div>
              <div className="text-lg font-bold tabular-nums">
                {formatCurrency(entry.amountDue)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Bezahlt</div>
              <div className="text-lg font-bold tabular-nums text-green-600">
                {formatCurrency(entry.amountPaid)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {isOverpaid ? "Guthaben" : "Offen"}
              </div>
              <div className={`text-lg font-bold tabular-nums ${isOverpaid ? "text-blue-600" : entry.amountOpen > 0 ? "text-destructive" : ""}`}>
                {isOverpaid
                  ? `+${formatCurrency(entry.amountPaid - entry.amountDue)}`
                  : formatCurrency(entry.amountOpen)}
              </div>
            </div>
          </div>

          {isOverpaid && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Überzahlung: +{formatCurrency(entry.amountPaid - entry.amountDue)} Guthaben
            </div>
          )}

          <Separator />

          {/* Payments List */}
          <div className="space-y-3">
            <h4 className="font-medium">Zahlungen</h4>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Noch keine Zahlungen erfasst
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onEdit={onEditPayment}
                    onCancel={onCancelPayment}
                    isReadonly={isReadonly}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add Payment Button */}
          {!isReadonly && (
            <>
              <Separator />
              <Button
                onClick={onRecordPayment}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Zahlung erfassen
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { paymentMethodLabels }
