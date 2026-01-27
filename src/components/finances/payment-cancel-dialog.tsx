"use client"

import * as React from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/validations/membership-type"
import type { Payment } from "./payment-history"

const cancelSchema = z.object({
  reason: z
    .string()
    .min(3, "Bitte geben Sie einen Storno-Grund an (mind. 3 Zeichen)")
    .max(500, "Grund darf maximal 500 Zeichen lang sein"),
})

type CancelFormData = z.infer<typeof cancelSchema>

interface PaymentCancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment | null
  onConfirm: (paymentId: string, reason: string) => Promise<void>
}

export function PaymentCancelDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
}: PaymentCancelDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: "",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({ reason: "" })
    }
  }, [open, form])

  async function handleSubmit(data: CancelFormData) {
    if (!payment) return

    setIsSubmitting(true)
    try {
      await onConfirm(payment.id, data.reason)
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zahlung stornieren?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Möchten Sie diese Zahlung wirklich stornieren?
              </p>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium text-foreground">
                  {formatCurrency(payment.amount)}
                </div>
                <div className="text-muted-foreground">
                  vom {formattedDate} ({payment.paymentMethodLabel})
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Die Zahlung wird als storniert markiert und der Betrag vom "Bezahlt"-Wert abgezogen.
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storno-Grund *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Falscher Betrag erfasst, Doppelte Erfassung..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Stornieren...
                  </>
                ) : (
                  "Zahlung stornieren"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
