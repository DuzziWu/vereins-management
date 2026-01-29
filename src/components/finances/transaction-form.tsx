"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCurrencyInput } from "@/lib/validations/membership-type"
import type { TransactionType } from "@/lib/validations/treasury"
import type { TransactionCategory } from "./treasury-toolbar"
import type { TransactionEntry } from "./treasury-table"

// Form schema (client-side, slightly different from API schema)
const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z
    .number({ message: "Betrag erforderlich" })
    .positive("Betrag muss positiv sein")
    .max(999999.99, "Betrag zu hoch (max. 999.999,99 EUR)"),
  transaction_date: z.string().min(1, "Datum erforderlich"),
  description: z
    .string({ message: "Beschreibung erforderlich" })
    .min(3, "Beschreibung zu kurz (min. 3 Zeichen)")
    .max(500, "Beschreibung zu lang (max. 500 Zeichen)"),
  category_id: z.string().min(1, "Kategorie erforderlich"),
  receipt_reference: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
})

type TransactionFormData = z.infer<typeof transactionFormSchema>

export interface TransactionFormSubmitData {
  type: TransactionType
  amount: number
  transaction_date: string
  description: string
  category_id: string
  receipt_reference?: string | null
  note?: string | null
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionEntry | null // null = create, object = edit
  defaultType?: TransactionType
  categories: TransactionCategory[]
  onSubmit: (data: TransactionFormSubmitData) => Promise<void>
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  defaultType = "income",
  categories,
  onSubmit,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showHighAmountWarning, setShowHighAmountWarning] = React.useState(false)
  const [keepOpen, setKeepOpen] = React.useState(false)
  const [pendingAmountChangeData, setPendingAmountChangeData] = React.useState<TransactionFormData | null>(null)
  const isEditing = !!transaction

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      transaction_date: today,
      description: "",
      category_id: "",
      receipt_reference: "",
      note: "",
    },
  })

  const currentType = form.watch("type")

  // Filter categories by current type
  const filteredCategories = categories.filter((c) => c.type === currentType)

  // Reset form when dialog opens or transaction changes
  React.useEffect(() => {
    if (open) {
      if (transaction) {
        form.reset({
          type: transaction.type,
          amount: Number(transaction.amount),
          transaction_date: transaction.transaction_date,
          description: transaction.description,
          category_id: transaction.category?.id || "",
          receipt_reference: transaction.receipt_reference || "",
          note: transaction.note || "",
        })
      } else {
        form.reset({
          type: defaultType,
          amount: 0,
          transaction_date: today,
          description: "",
          category_id: "",
          receipt_reference: "",
          note: "",
        })
      }
      setShowHighAmountWarning(false)
    }
  }, [open, transaction, defaultType, form, today])

  // Reset category when type changes (if selected category doesn't match)
  React.useEffect(() => {
    const categoryId = form.getValues("category_id")
    if (categoryId) {
      const selectedCategory = categories.find((c) => c.id === categoryId)
      if (selectedCategory && selectedCategory.type !== currentType) {
        form.setValue("category_id", "")
      }
    }
  }, [currentType, categories, form])

  async function doSubmit(data: TransactionFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit({
        type: data.type,
        amount: data.amount,
        transaction_date: data.transaction_date,
        description: data.description,
        category_id: data.category_id,
        receipt_reference: data.receipt_reference || null,
        note: data.note || null,
      })

      if (keepOpen && !isEditing) {
        form.reset({
          type: data.type,
          amount: 0,
          transaction_date: today,
          description: "",
          category_id: "",
          receipt_reference: "",
          note: "",
        })
        setShowHighAmountWarning(false)
      } else {
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(data: TransactionFormData) {
    // Warn for very high amounts
    if (data.amount > 100000 && !showHighAmountWarning) {
      setShowHighAmountWarning(true)
      return
    }

    // Require confirmation when editing and amount changed
    const amountChanged = isEditing && transaction && Number(transaction.amount) !== data.amount && data.amount > 0
    if (amountChanged) {
      setPendingAmountChangeData(data)
      return
    }

    await doSubmit(data)
  }

  async function handleAmountChangeConfirmed() {
    if (pendingAmountChangeData) {
      const data = pendingAmountChangeData
      setPendingAmountChangeData(null)
      await doSubmit(data)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Buchung bearbeiten" : "Buchung erfassen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Bearbeiten Sie die Daten der Buchung."
              : "Erfassen Sie eine neue Einnahme oder Ausgabe."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Type Toggle */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Tabs
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="income"
                        className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
                      >
                        Einnahme
                      </TabsTrigger>
                      <TabsTrigger
                        value="expense"
                        className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900 dark:data-[state=active]:text-red-300"
                      >
                        Ausgabe
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betrag (EUR) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="z.B. 500,00"
                      value={field.value === 0 ? "" : field.value.toString().replace(".", ",")}
                      onChange={(e) => {
                        const value = parseCurrencyInput(e.target.value)
                        field.onChange(value)
                        if (value <= 100000) {
                          setShowHighAmountWarning(false)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showHighAmountWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Betrag ungewöhnlich hoch ({form.getValues("amount").toLocaleString("de-DE")} EUR).
                  Klicken Sie erneut auf Speichern, um fortzufahren.
                </AlertDescription>
              </Alert>
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum *</FormLabel>
                  <FormControl>
                    <Input type="date" max={today} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Sponsoring Firma XY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Reference */}
            <FormField
              control={form.control}
              name="receipt_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beleg-Referenz</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. R-2026-042" {...field} />
                  </FormControl>
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
                  <FormLabel>Notiz</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Zusätzliche Details..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keep Open Toggle (only for new entries) */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Switch
                  id="keep-open"
                  checked={keepOpen}
                  onCheckedChange={setKeepOpen}
                />
                <Label htmlFor="keep-open" className="text-sm cursor-pointer">
                  Nach Speichern weitere Buchung erfassen
                </Label>
              </div>
            )}

            {/* Amount change info for editing */}
            {isEditing && transaction && Number(transaction.amount) !== form.watch("amount") && form.watch("amount") > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Betrag wird von {Number(transaction.amount).toLocaleString("de-DE")} EUR auf{" "}
                  {form.watch("amount").toLocaleString("de-DE")} EUR geändert.
                </AlertDescription>
              </Alert>
            )}

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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Buchung speichern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Amount Change Confirmation Dialog */}
    <AlertDialog
      open={!!pendingAmountChangeData}
      onOpenChange={(open) => { if (!open) setPendingAmountChangeData(null) }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Betragsänderung bestätigen</AlertDialogTitle>
          <AlertDialogDescription>
            Betrag wirklich von{" "}
            <strong>{transaction ? Number(transaction.amount).toLocaleString("de-DE") : 0} EUR</strong>{" "}
            auf{" "}
            <strong>{pendingAmountChangeData?.amount.toLocaleString("de-DE")} EUR</strong>{" "}
            ändern?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleAmountChangeConfirmed}>
            Betrag ändern
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
