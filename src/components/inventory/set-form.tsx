"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Package, Check } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "./status-badge"
import {
  InventoryItem,
  InventorySet,
  SetFormData,
  setSchema,
} from "@/lib/validations/inventory"
import { cn } from "@/lib/utils"

interface SetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  set: InventorySet | null
  items: InventoryItem[]
  onSubmit: (data: SetFormData) => Promise<void>
}

export function SetForm({ open, onOpenChange, set, items, onSubmit }: SetFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<SetFormData>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      name: "",
      description: "",
      item_ids: [],
    },
  })

  React.useEffect(() => {
    if (set) {
      form.reset({
        name: set.name,
        description: set.description || "",
        item_ids: set.items?.map((item) => item.id) || [],
      })
    } else {
      form.reset({
        name: "",
        description: "",
        item_ids: [],
      })
    }
  }, [set, form])

  const selectedItemIds = form.watch("item_ids")

  async function handleSubmit(data: SetFormData) {
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

  function toggleItem(itemId: string) {
    const current = form.getValues("item_ids")
    if (current.includes(itemId)) {
      form.setValue("item_ids", current.filter((id) => id !== itemId))
    } else {
      form.setValue("item_ids", [...current, itemId])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {set ? "Set bearbeiten" : "Neues Set"}
          </DialogTitle>
          <DialogDescription>
            {set
              ? "Ändern Sie die Set-Details und zugehörigen Items."
              : "Erstellen Sie ein neues Set mit mehreren Items."}
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
                    <Input placeholder="z.B. Garde-Uniform, Trainer-Set" {...field} />
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
                      placeholder="Kurze Beschreibung des Sets..."
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
              name="item_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Items auswählen *</FormLabel>
                  <FormDescription>
                    {selectedItemIds.length} von {items.length} Items ausgewählt
                  </FormDescription>
                  <ScrollArea className="h-[250px] rounded-md border p-2">
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Keine Items verfügbar
                        </p>
                      ) : (
                        items.map((item) => {
                          const isSelected = selectedItemIds.includes(item.id)
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                                isSelected && "bg-muted"
                              )}
                              onClick={() => toggleItem(item.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={() => toggleItem(item.id)}
                              />
                              <div className="h-8 w-8 rounded bg-muted-foreground/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.images && item.images.length > 0 ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.images[0].public_url || ""}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {item.category?.icon && <span>{item.category.icon}</span>}
                                  <span>{item.category?.name}</span>
                                </div>
                              </div>
                              <StatusBadge status={item.status} showDot={false} />
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
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
                {set ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
