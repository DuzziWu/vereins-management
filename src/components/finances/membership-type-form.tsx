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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import {
  membershipTypeSchema,
  MembershipTypeFormData,
  parseCurrencyInput,
} from "@/lib/validations/membership-type"
import { MembershipTypeWithCount } from "./membership-types-table"

interface MembershipTypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  membershipType?: MembershipTypeWithCount | null
  onSubmit: (data: MembershipTypeFormData) => Promise<void>
}

export function MembershipTypeForm({
  open,
  onOpenChange,
  membershipType,
  onSubmit,
}: MembershipTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showHighAmountWarning, setShowHighAmountWarning] = React.useState(false)
  const isEditing = !!membershipType

  const form = useForm<MembershipTypeFormData>({
    resolver: zodResolver(membershipTypeSchema),
    defaultValues: {
      name: "",
      annual_fee: 0,
      description: "",
      is_family_flat: false,
    },
  })

  // Reset form when membershipType changes
  React.useEffect(() => {
    if (open) {
      if (membershipType) {
        form.reset({
          name: membershipType.name,
          annual_fee: membershipType.annual_fee,
          description: membershipType.description || "",
          is_family_flat: membershipType.is_family_flat ?? false,
        })
      } else {
        form.reset({
          name: "",
          annual_fee: 0,
          description: "",
          is_family_flat: false,
        })
      }
      setShowHighAmountWarning(false)
    }
  }, [open, membershipType, form])

  async function handleSubmit(data: MembershipTypeFormData) {
    // Warnung bei sehr hohem Betrag
    if (data.annual_fee > 10000 && !showHighAmountWarning) {
      setShowHighAmountWarning(true)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Beitragsart bearbeiten" : "Neue Beitragsart erstellen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ändern Sie die Daten der Beitragsart. Änderungen gelten für zukünftige Beiträge."
              : "Definieren Sie eine neue Beitragsart für Ihre Vereinsmitglieder."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isEditing && membershipType && membershipType.member_count > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Änderungen gelten für zukünftige Beiträge. Bereits generierte Beiträge bleiben unverändert.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Erwachsener, Kind unter 14" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="annual_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jahresbetrag (EUR) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="z.B. 120,00"
                      value={field.value === 0 ? "" : field.value.toString().replace(".", ",")}
                      onChange={(e) => {
                        const value = parseCurrencyInput(e.target.value)
                        field.onChange(value)
                        if (value <= 10000) {
                          setShowHighAmountWarning(false)
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Für beitragsfreie Mitglieder (z.B. Ehrenmitglieder) 0 eingeben.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showHighAmountWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Betrag ungewöhnlich hoch ({form.getValues("annual_fee").toLocaleString("de-DE")} EUR).
                  Klicken Sie erneut auf Speichern, um fortzufahren.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="is_family_flat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Familien-Flatrate</FormLabel>
                    <FormDescription>
                      Beitrag gilt fuer die gesamte Familie (ein Beitrag pro Familie).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Für Mitglieder ab 18 Jahren"
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Beitragsart erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
