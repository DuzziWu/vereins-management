"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Banknote, Building2, FileText } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, parseCurrencyInput } from "@/lib/validations/membership-type"
import type { FeeEntry } from "./fees-table"

export type PaymentMethod = "cash" | "transfer" | "other"

const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  cash: { label: "Bar", icon: <Banknote className="h-4 w-4" /> },
  transfer: { label: "Überweisung", icon: <Building2 className="h-4 w-4" /> },
  other: { label: "Sonstiges", icon: <FileText className="h-4 w-4" /> },
}

const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Betrag muss größer als 0 € sein"),
  paymentDate: z
    .string()
    .min(1, "Bitte wählen Sie ein Datum"),
  paymentMethod: z.enum(["cash", "transfer", "other"], {
    error: "Bitte wählen Sie eine Zahlungsart",
  }),
  note: z
    .string()
    .max(500, "Notiz darf maximal 500 Zeichen lang sein")
    .optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export interface PaymentFormSubmitData {
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  note?: string
}

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: FeeEntry | null
  year: number
  onSubmit: (feeId: string, data: PaymentFormSubmitData) => Promise<void>
}

export function PaymentForm({
  open,
  onOpenChange,
  entry,
  year,
  onSubmit,
}: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const today = new Date().toISOString().split("T")[0]
  const yearStart = `${year}-01-01`

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: entry?.amountOpen ?? 0,
      paymentDate: today,
      paymentMethod: "transfer",
      note: "",
    },
  })

  // Reset form when entry changes
  React.useEffect(() => {
    if (entry && open) {
      form.reset({
        amount: entry.amountOpen > 0 ? entry.amountOpen : 0,
        paymentDate: today,
        paymentMethod: "transfer",
        note: "",
      })
    }
  }, [entry, open, form, today])

  async function handleSubmit(data: PaymentFormData) {
    if (!entry) return

    // Validate date is not in the future
    if (data.paymentDate > today) {
      form.setError("paymentDate", {
        type: "manual",
        message: "Datum darf nicht in der Zukunft liegen",
      })
      return
    }

    // Validate date is not before fee year
    if (data.paymentDate < yearStart) {
      form.setError("paymentDate", {
        type: "manual",
        message: `Datum muss im Jahr ${year} oder später liegen`,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(entry.id, {
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        note: data.note || undefined,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!entry) return null

  const amount = form.watch("amount")
  const isHighAmount = amount > 10000
  const willOverpay = amount > entry.amountOpen && entry.amountOpen > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zahlung erfassen</DialogTitle>
          <DialogDescription>
            für: <strong>{entry.name}</strong> ({year})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Open Amount (readonly) */}
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              <label className="text-sm font-medium text-muted-foreground">
                Offener Betrag
              </label>
              <div className="text-xl font-bold tabular-nums">
                {formatCurrency(entry.amountOpen)}
              </div>
              <div className="text-xs text-muted-foreground">
                Soll: {formatCurrency(entry.amountDue)} | Bezahlt: {formatCurrency(entry.amountPaid)}
              </div>
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betrag *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        className="pr-8"
                        value={field.value === 0 ? "" : field.value.toString().replace(".", ",")}
                        onChange={(e) => {
                          const parsed = parseCurrencyInput(e.target.value)
                          field.onChange(parsed)
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning for high amount */}
            {isHighAmount && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Hoher Betrag: {formatCurrency(amount)}. Bitte prüfen Sie die Eingabe.
                </AlertDescription>
              </Alert>
            )}

            {/* Info for overpayment */}
            {willOverpay && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Diese Zahlung führt zu einer Überzahlung von{" "}
                  <strong>{formatCurrency(amount - entry.amountOpen)}</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zahlungsdatum *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max={today}
                      min={yearStart}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zahlungsart *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Zahlungsart wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(paymentMethodLabels) as [PaymentMethod, { label: string; icon: React.ReactNode }][]).map(
                        ([value, { label, icon }]) => (
                          <SelectItem key={value} value={value}>
                            <span className="flex items-center gap-2">
                              {icon}
                              {label}
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notiz (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Ref: VMS-2026-001, Bar beim Vereinsabend erhalten..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Zahlung erfassen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
