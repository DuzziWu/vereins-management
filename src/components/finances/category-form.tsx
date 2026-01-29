"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { z } from "zod"
import type { TransactionCategory } from "./treasury-toolbar"

// Local form schema (without transforms that produce null, which conflicts with useForm)
const categoryFormSchema = z.object({
  name: z
    .string({ message: "Name erforderlich" })
    .min(2, "Name zu kurz (min. 2 Zeichen)")
    .max(50, "Name zu lang (max. 50 Zeichen)"),
  type: z.enum(["income", "expense"], {
    message: "Typ muss 'income' oder 'expense' sein",
  }),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^#[0-9A-Fa-f]{6}$/.test(val),
      "Ungültiges Farbformat (z.B. #10B981)"
    ),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

// Icons that users can choose from
const AVAILABLE_ICONS = [
  { value: "users", label: "Personen" },
  { value: "handshake", label: "Handschlag" },
  { value: "heart", label: "Herz" },
  { value: "calendar", label: "Kalender" },
  { value: "package", label: "Paket" },
  { value: "home", label: "Haus" },
  { value: "car", label: "Auto" },
  { value: "shield", label: "Schild" },
  { value: "file-text", label: "Dokument" },
  { value: "more-horizontal", label: "Sonstiges" },
  { value: "trophy", label: "Pokal" },
  { value: "gift", label: "Geschenk" },
  { value: "music", label: "Musik" },
  { value: "shirt", label: "Kleidung" },
  { value: "wrench", label: "Werkzeug" },
]

export interface CategoryFormSubmitData {
  name: string
  type: "income" | "expense"
  icon?: string | null
  color?: string | null
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: TransactionCategory | null // null = create, object = edit
  defaultType?: "income" | "expense"
  onSubmit: (data: CategoryFormSubmitData) => Promise<void>
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  defaultType = "income",
  onSubmit,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!category

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: defaultType,
      icon: "",
      color: "",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          type: category.type,
          icon: category.icon || "",
          color: category.color || "",
        })
      } else {
        form.reset({
          name: "",
          type: defaultType,
          icon: "",
          color: "",
        })
      }
    }
  }, [open, category, defaultType, form])

  async function handleSubmit(data: CategoryFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: data.name,
        type: data.type,
        icon: data.icon || null,
        color: data.color || null,
      })
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
            {isEditing ? "Kategorie bearbeiten" : "Neue Kategorie erstellen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ändern Sie die Daten der Kategorie."
              : "Erstellen Sie eine neue Einnahme- oder Ausgabe-Kategorie."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Sponsoring" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type (disabled when editing) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ wählen..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Einnahme</SelectItem>
                      <SelectItem value="expense">Ausgabe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Icon wählen (optional)..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Kein Icon</SelectItem>
                      {AVAILABLE_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farbe</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="z.B. #10B981"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    {field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) && (
                      <div
                        className="h-9 w-9 rounded-md border shrink-0"
                        style={{ backgroundColor: field.value }}
                      />
                    )}
                  </div>
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
                {isEditing ? "Speichern" : "Kategorie erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
