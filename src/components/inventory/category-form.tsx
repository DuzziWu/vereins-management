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
    },
  })

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
      })
    } else {
      form.reset({
        name: "",
        description: "",
        icon: "",
      })
    }
  }, [category, form])

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
