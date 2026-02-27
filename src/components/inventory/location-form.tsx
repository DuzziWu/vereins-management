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
import {
  InventoryLocation,
  LocationFormData,
  locationSchema,
} from "@/lib/validations/inventory"
import { LocationSelect } from "./location-select"

interface LocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location?: InventoryLocation | null
  parentId?: string | null
  locations: InventoryLocation[]
  onSubmit: (data: LocationFormData) => Promise<void>
}

export function LocationForm({
  open,
  onOpenChange,
  location,
  parentId,
  locations,
  onSubmit,
}: LocationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!location

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || "",
      description: location?.description || "",
      notes: location?.notes || "",
      parent_id: location?.parent_id || parentId || null,
    },
  })

  // Reset form when dialog opens or location changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: location?.name || "",
        description: location?.description || "",
        notes: location?.notes || "",
        parent_id: location?.parent_id || parentId || null,
      })
    }
  }, [open, location, parentId, form])

  async function handleSubmit(data: LocationFormData) {
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

  // Filter out the current location and its children from parent options
  const availableParentLocations = React.useMemo(() => {
    if (!location) return locations

    const excludeIds = new Set<string>()
    excludeIds.add(location.id)

    // Add all children recursively
    function addChildren(loc: InventoryLocation) {
      if (loc.children) {
        for (const child of loc.children) {
          excludeIds.add(child.id)
          addChildren(child)
        }
      }
    }

    const currentLoc = locations.find((l) => l.id === location.id)
    if (currentLoc) {
      addChildren(currentLoc)
    }

    return locations.filter((l) => !excludeIds.has(l.id))
  }, [locations, location])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Lagerort bearbeiten" : "Neuer Lagerort"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Bearbeiten Sie die Lagerort-Details."
              : "Erstellen Sie einen neuen Lagerort für Ihr Inventar."}
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
                    <Input
                      placeholder="z.B. Schrank 1, Lagerraum A"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Übergeordneter Lagerort</FormLabel>
                  <FormControl>
                    <LocationSelect
                      locations={availableParentLocations}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Kein übergeordneter Lagerort"
                      allowClear
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Lagerort in einer Hierarchie einordnen
                  </FormDescription>
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
                      placeholder="z.B. Weißer Schrank neben der Eingangstür"
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interne Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nur für Vorstand sichtbar..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Nur für Vorstand sichtbar</FormDescription>
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
                {isEditing ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
