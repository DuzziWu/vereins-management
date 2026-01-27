"use client"

import * as React from "react"
import { Loader2, AlertTriangle } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, parseCurrencyInput } from "@/lib/validations/membership-type"
import type { FeeEntry } from "./fees-table"

const adjustmentSchema = z.object({
  newAmount: z
    .number()
    .min(0, "Betrag darf nicht negativ sein"),
  reason: z
    .string()
    .min(3, "Bitte geben Sie einen Grund an (mind. 3 Zeichen)")
    .max(500, "Grund darf maximal 500 Zeichen lang sein"),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

interface FeeAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: FeeEntry | null
  onSubmit: (feeId: string, newAmount: number, reason: string) => Promise<void>
}

export function FeeAdjustmentModal({
  open,
  onOpenChange,
  entry,
  onSubmit,
}: FeeAdjustmentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      newAmount: entry?.amountDue ?? 0,
      reason: "",
    },
  })

  // Reset form when entry changes
  React.useEffect(() => {
    if (entry) {
      form.reset({
        newAmount: entry.amountDue,
        reason: "",
      })
    }
  }, [entry, form])

  async function handleSubmit(data: AdjustmentFormData) {
    if (!entry) return

    setIsSubmitting(true)
    try {
      await onSubmit(entry.id, data.newAmount, data.reason)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!entry) return null

  const newAmount = form.watch("newAmount")
  const hasPayments = entry.amountPaid > 0
  const isReducingBelowPaid = newAmount < entry.amountPaid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beitrag anpassen</DialogTitle>
          <DialogDescription>
            Passen Sie den Sollbetrag für <strong>{entry.name}</strong> an.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Current Amount (readonly) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Aktueller Soll-Betrag
              </label>
              <div className="text-lg font-medium tabular-nums">
                {formatCurrency(entry.amountDue)}
              </div>
            </div>

            {/* New Amount */}
            <FormField
              control={form.control}
              name="newAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neuer Soll-Betrag</FormLabel>
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

            {/* Warning if reducing below paid amount */}
            {hasPayments && isReducingBelowPaid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Achtung: Es wurden bereits {formatCurrency(entry.amountPaid)} bezahlt.
                  Der neue Soll-Betrag liegt darunter.
                </AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grund für Anpassung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Beitritt Mitte des Jahres, Härtefall, Ermäßigung..."
                      className="resize-none"
                      rows={3}
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
                  "Speichern"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
