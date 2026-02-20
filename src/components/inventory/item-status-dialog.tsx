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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "./status-badge"
import {
  InventoryItem,
  ItemStatus,
  ITEM_STATUS,
  STATUS_CONFIG,
  statusChangeSchema,
  StatusChangeFormData,
} from "@/lib/validations/inventory"

interface Member {
  id: string
  first_name: string
  last_name: string
}

interface ItemStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onSubmit: (data: { status: ItemStatus; holder_id?: string | null; note?: string }) => Promise<void>
}

export function ItemStatusDialog({ open, onOpenChange, item, onSubmit }: ItemStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [members, setMembers] = React.useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false)

  const form = useForm<StatusChangeFormData>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: item.status,
      holder_id: item.current_holder_id || null,
      note: "",
    },
  })

  const watchedStatus = form.watch("status")

  // Fetch members when status is "loaned"
  React.useEffect(() => {
    if (watchedStatus === "loaned" && members.length === 0) {
      setIsLoadingMembers(true)
      fetch("/api/members?limit=1000")
        .then((res) => res.json())
        .then((data) => {
          setMembers(data.members || [])
        })
        .catch(console.error)
        .finally(() => setIsLoadingMembers(false))
    }
  }, [watchedStatus, members.length])

  // Reset form when item changes
  React.useEffect(() => {
    form.reset({
      status: item.status,
      holder_id: item.current_holder_id || null,
      note: "",
    })
  }, [item, form])

  async function handleSubmit(data: StatusChangeFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit({
        status: data.status,
        holder_id: data.status === "loaned" ? data.holder_id : null,
        note: data.note || undefined,
      })
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
          <DialogTitle>Status ändern</DialogTitle>
          <DialogDescription>
            {item.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <span className="text-sm text-muted-foreground">Aktueller Status:</span>
          <StatusBadge status={item.status} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neuer Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {ITEM_STATUS.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <RadioGroupItem value={status} id={status} />
                          <label
                            htmlFor={status}
                            className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                          >
                            <StatusBadge status={status} showDot={false} />
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedStatus === "loaned" && (
              <FormField
                control={form.control}
                name="holder_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verliehen an *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isLoadingMembers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingMembers ? "Lade Mitglieder..." : "Mitglied auswählen"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notiz (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Für Auftritt am 15.02."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
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
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
