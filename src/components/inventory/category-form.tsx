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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Category, CategoryFormData, categorySchema } from "@/lib/validations/inventory"

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSubmit: (data: CategoryFormData) => Promise<void>
}

const EMOJI_SUGGESTIONS = ["📦", "👗", "🎭", "🎸", "🏋️", "🎪", "🎬", "🎤", "🎹", "⚽"]

export function CategoryForm({ open, onOpenChange, category, onSubmit }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      prefix: "",
    },
  })

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        prefix: category.prefix || "",
      })
    } else {
      form.reset({
        name: "",
        description: "",
        icon: "",
        prefix: "",
      })
    }
  }, [category, form])

  // Auto-generate prefix suggestion from name
  const suggestPrefix = (name: string): string => {
    if (!name) return ""
    // Take first 3 letters, uppercase
    const cleaned = name.replace(/[^a-zA-ZäöüÄÖÜß]/g, "")
    const prefix = cleaned.substring(0, 3).toUpperCase()
    // Replace German umlauts
    return prefix
      .replace(/Ä/g, "AE")
      .replace(/Ö/g, "OE")
      .replace(/Ü/g, "UE")
      .replace(/ß/g, "SS")
      .substring(0, 3)
  }

  async function handleSubmit(data: CategoryFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch {
      // Error is handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Kategorie bearbeiten" : "Neue Kategorie"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Ändern Sie die Kategorie-Details."
              : "Erstellen Sie eine neue Inventar-Kategorie."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Kostüme, Technik, Requisiten" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="Kurze Beschreibung der Kategorie..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon / Emoji</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="z.B. 📦"
                        {...field}
                        className="text-center text-lg"
                      />
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_SUGGESTIONS.map((emoji) => (
                          <Button
                            key={emoji}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-lg"
                            onClick={() => form.setValue("icon", emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Wählen Sie ein Emoji für schnelle Erkennung
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventarnummer-Präfix</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="z.B. KOS"
                        {...field}
                        className="uppercase font-mono"
                        maxLength={10}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const suggestion = suggestPrefix(form.getValues("name"))
                          if (suggestion) {
                            form.setValue("prefix", suggestion)
                          }
                        }}
                      >
                        Vorschlag
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Wird für automatische Inventarnummern verwendet (z.B. KOS-0001)
                  </FormDescription>
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
                {category ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
