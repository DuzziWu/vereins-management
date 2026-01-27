"use client"

import * as React from "react"
import { Loader2, Banknote, Building2, FileText } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/validations/membership-type"
import type { Payment } from "./payment-history"
import type { PaymentMethod } from "./payment-form"

const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  cash: { label: "Bar", icon: <Banknote className="h-4 w-4" /> },
  transfer: { label: "Überweisung", icon: <Building2 className="h-4 w-4" /> },
  other: { label: "Sonstiges", icon: <FileText className="h-4 w-4" /> },
}

const editSchema = z.object({
  paymentMethod: z.enum(["cash", "transfer", "other"], {
    error: "Bitte wählen Sie eine Zahlungsart",
  }),
  note: z
    .string()
    .max(500, "Notiz darf maximal 500 Zeichen lang sein")
    .optional(),
})

type EditFormData = z.infer<typeof editSchema>

export interface PaymentEditData {
  paymentMethod: PaymentMethod
  note?: string
}

interface PaymentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment | null
  onSubmit: (paymentId: string, data: PaymentEditData) => Promise<void>
}

export function PaymentEditDialog({
  open,
  onOpenChange,
  payment,
  onSubmit,
}: PaymentEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      paymentMethod: payment?.paymentMethod ?? "transfer",
      note: payment?.note ?? "",
    },
  })

  // Reset form when payment changes
  React.useEffect(() => {
    if (payment && open) {
      form.reset({
        paymentMethod: payment.paymentMethod,
        note: payment.note ?? "",
      })
    }
  }, [payment, open, form])

  async function handleSubmit(data: EditFormData) {
    if (!payment) return

    setIsSubmitting(true)
    try {
      await onSubmit(payment.id, {
        paymentMethod: data.paymentMethod,
        note: data.note || undefined,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!payment) return null

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zahlung bearbeiten</DialogTitle>
          <DialogDescription>
            Zahlung vom {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Readonly Amount and Date */}
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              <div className="text-sm font-medium text-muted-foreground">
                Betrag & Datum (nicht änderbar)
              </div>
              <div className="text-lg font-bold tabular-nums">
                {formatCurrency(payment.amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formattedDate}
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                Betrag und Datum können nicht geändert werden.
                Für Korrekturen: Stornieren und neu erfassen.
              </AlertDescription>
            </Alert>

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zahlungsart</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
