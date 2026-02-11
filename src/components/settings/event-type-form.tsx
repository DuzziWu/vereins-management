"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  type EventType,
  type CreateEventTypeInput,
  createEventTypeSchema,
  EVENT_TYPE_COLOR_PALETTE,
} from "@/lib/validations/event-types"

interface EventTypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventType: EventType | null
  onSubmit: (data: CreateEventTypeInput) => Promise<void>
}

export function EventTypeForm({
  open,
  onOpenChange,
  eventType,
  onSubmit,
}: EventTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreateEventTypeInput>({
    resolver: zodResolver(createEventTypeSchema),
    defaultValues: {
      name: "",
      color: "#3B82F6",
      icon: null,
    },
  })

  // Reset form when dialog opens/closes or eventType changes
  React.useEffect(() => {
    if (open) {
      if (eventType) {
        form.reset({
          name: eventType.name,
          color: eventType.color,
          icon: eventType.icon,
        })
      } else {
        form.reset({
          name: "",
          color: "#3B82F6",
          icon: null,
        })
      }
    }
  }, [open, eventType, form])

  async function handleSubmit(data: CreateEventTypeInput) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedColor = form.watch("color")
  const name = form.watch("name")
  const icon = form.watch("icon")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {eventType ? "Event-Typ bearbeiten" : "Neuer Event-Typ"}
          </DialogTitle>
          <DialogDescription>
            {eventType
              ? "Bearbeiten Sie die Eigenschaften dieses Event-Typs."
              : "Erstellen Sie einen neuen Event-Typ für Ihre Veranstaltungen."}
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
                    <Input placeholder="z.B. Probe, Workshop..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Farbe */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farbe *</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Farbpalette */}
                      <div className="grid grid-cols-6 gap-2">
                        {EVENT_TYPE_COLOR_PALETTE.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => field.onChange(color.value)}
                            className={cn(
                              "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                              field.value === color.value
                                ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                      {/* Custom Hex */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="#000000"
                          value={field.value}
                          onChange={field.onChange}
                          className="font-mono w-28"
                          maxLength={7}
                        />
                        <div
                          className="h-8 w-8 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon/Emoji */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon/Emoji (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. 🎭, 🏆, 🎉..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Emoji oder kurzes Symbol (max. 10 Zeichen)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vorschau auf hell und dunkel */}
            <div className="space-y-2">
              <FormLabel>Vorschau</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {/* Heller Hintergrund */}
                <div className="flex items-center gap-2 p-3 bg-white border rounded-md">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Badge
                    variant="outline"
                    className="border-2"
                    style={{ borderColor: selectedColor, color: selectedColor }}
                  >
                    {icon && <span className="mr-1">{icon}</span>}
                    {name || "Event-Typ Name"}
                  </Badge>
                </div>
                {/* Dunkler Hintergrund */}
                <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-md">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Badge
                    variant="outline"
                    className="border-2"
                    style={{ borderColor: selectedColor, color: selectedColor }}
                  >
                    {icon && <span className="mr-1">{icon}</span>}
                    {name || "Event-Typ Name"}
                  </Badge>
                </div>
              </div>
            </div>

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
                {isSubmitting
                  ? "Speichern..."
                  : eventType
                    ? "Speichern"
                    : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
