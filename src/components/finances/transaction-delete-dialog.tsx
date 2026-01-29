"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, AlertTriangle } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deleteTransactionSchema, type DeleteTransactionData } from "@/lib/validations/treasury"
import { formatCurrency } from "@/lib/validations/membership-type"
import type { TransactionEntry } from "./treasury-table"

interface TransactionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionEntry | null
  onConfirm: (id: string, reason: string) => Promise<void>
}

export function TransactionDeleteDialog({
  open,
  onOpenChange,
  transaction,
  onConfirm,
}: TransactionDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<DeleteTransactionData>({
    resolver: zodResolver(deleteTransactionSchema),
    defaultValues: {
      deletion_reason: "",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({ deletion_reason: "" })
    }
  }, [open, form])

  async function handleSubmit(data: DeleteTransactionData) {
    if (!transaction) return

    setIsSubmitting(true)
    try {
      await onConfirm(transaction.id, data.deletion_reason)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buchung löschen</DialogTitle>
          <DialogDescription>
            Die Buchung wird als gelöscht markiert und kann innerhalb von 30 Tagen wiederhergestellt werden.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{transaction.description}</strong>
            <br />
            <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
              {transaction.type === "income" ? "+" : "−"}
              {formatCurrency(transaction.amount)}
            </span>
            {" "}am {new Date(transaction.transaction_date).toLocaleDateString("de-DE")}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deletion_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Löschgrund *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Doppelt erfasst, Fehlbuchung..."
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
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buchung löschen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
