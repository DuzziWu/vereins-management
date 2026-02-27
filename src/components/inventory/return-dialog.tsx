"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LocationSelect } from "./location-select"
import {
  RETURN_CONDITION,
  RETURN_CONDITION_CONFIG,
  type ReturnCondition,
  type InventoryItem,
  type InventoryLocation,
  type InventoryLoan,
} from "@/lib/validations/inventory"

// Form schema
const returnFormSchema = z.object({
  return_location_id: z.string().uuid().optional().nullable(),
  return_note: z.string().max(500, "Maximal 500 Zeichen").optional().or(z.literal("")),
  return_condition: z.enum(RETURN_CONDITION).optional(),
})

type ReturnFormData = z.infer<typeof returnFormSchema>

interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  loan: InventoryLoan
  locations: InventoryLocation[]
  onSubmit: (data: ReturnFormData) => Promise<void>
}

export function ReturnDialog({
  open,
  onOpenChange,
  item,
  loan,
  locations,
  onSubmit,
}: ReturnDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      return_location_id: item.location_id || null,
      return_note: "",
      return_condition: "good",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        return_location_id: item.location_id || null,
        return_note: "",
        return_condition: "good",
      })
    }
  }, [open, item.location_id, form])

  async function handleSubmit(data: ReturnFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate loan duration
  const loanDuration = React.useMemo(() => {
    const start = new Date(loan.loaned_at)
    const end = new Date()
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }, [loan.loaned_at])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rückgabe erfassen</DialogTitle>
          <DialogDescription>
            {item.name}
            {item.inventory_number && (
              <span className="block font-mono text-sm">{item.inventory_number}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Loan Info */}
        <div className="rounded-md border p-3 bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Verliehen an:</span>
              <p className="font-medium">
                {loan.borrower?.first_name} {loan.borrower?.last_name}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Seit:</span>
              <p className="font-medium">
                {format(new Date(loan.loaned_at), "dd.MM.yyyy", { locale: de })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Dauer:</span>
              <p className="font-medium">{loanDuration} Tag{loanDuration !== 1 ? "e" : ""}</p>
            </div>
            {loan.expected_return_date && (
              <div>
                <span className="text-muted-foreground">Geplant:</span>
                <p className="font-medium">
                  {format(new Date(loan.expected_return_date), "dd.MM.yyyy", { locale: de })}
                </p>
              </div>
            )}
          </div>
          {loan.loan_note && (
            <div className="mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Notiz:</span>
              <p className="text-sm">{loan.loan_note}</p>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Return Condition */}
            <FormField
              control={form.control}
              name="return_condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zustand bei Rückgabe</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {RETURN_CONDITION.map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <RadioGroupItem value={condition} id={condition} />
                          <label
                            htmlFor={condition}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {RETURN_CONDITION_CONFIG[condition].label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Return Location */}
            <FormField
              control={form.control}
              name="return_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wohin zurücklegen?</FormLabel>
                  <FormControl>
                    <LocationSelect
                      locations={locations}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Lagerort wählen"
                      allowClear
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="return_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notiz zur Rückgabe</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Fleck auf der Vorderseite"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rückgabe erfassen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
