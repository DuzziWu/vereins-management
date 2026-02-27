"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Loader2, Search, User } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { InventoryItem } from "@/lib/validations/inventory"

// Simple member type for the select
interface Member {
  id: string
  first_name: string
  last_name: string
  email?: string
}

// Form schema
const loanFormSchema = z.object({
  borrower_id: z.string().uuid("Bitte ein Mitglied auswählen"),
  expected_return_date: z.string().optional().or(z.literal("")),
  loan_note: z.string().max(500, "Maximal 500 Zeichen").optional().or(z.literal("")),
})

type LoanFormData = z.infer<typeof loanFormSchema>

interface LoanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onSubmit: (data: LoanFormData) => Promise<void>
}

export function LoanDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: LoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [members, setMembers] = React.useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false)
  const [memberSearch, setMemberSearch] = React.useState("")
  const [memberPopoverOpen, setMemberPopoverOpen] = React.useState(false)

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      borrower_id: "",
      expected_return_date: "",
      loan_note: "",
    },
  })

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        borrower_id: "",
        expected_return_date: "",
        loan_note: "",
      })
      setMemberSearch("")
    }
  }, [open, form])

  // Load members for autocomplete
  React.useEffect(() => {
    async function fetchMembers() {
      setIsLoadingMembers(true)
      try {
        const params = new URLSearchParams()
        if (memberSearch) {
          params.set("search", memberSearch)
        }
        params.set("limit", "20")

        const response = await fetch(`/api/members?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error("Error fetching members:", error)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    if (open) {
      const timer = setTimeout(fetchMembers, 300)
      return () => clearTimeout(timer)
    }
  }, [open, memberSearch])

  async function handleSubmit(data: LoanFormData) {
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

  const selectedMember = members.find((m) => m.id === form.watch("borrower_id"))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Item verleihen</DialogTitle>
          <DialogDescription>
            {item.name}
            {item.inventory_number && (
              <span className="block font-mono text-sm">{item.inventory_number}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Member Select */}
            <FormField
              control={form.control}
              name="borrower_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Verleihen an *</FormLabel>
                  <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedMember ? (
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {selectedMember.first_name} {selectedMember.last_name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Mitglied suchen...
                            </span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Name eingeben..."
                          value={memberSearch}
                          onValueChange={setMemberSearch}
                        />
                        <CommandList>
                          {isLoadingMembers ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              Lade Mitglieder...
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>Keine Mitglieder gefunden.</CommandEmpty>
                              <CommandGroup>
                                {members.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={`${member.first_name} ${member.last_name}`}
                                    onSelect={() => {
                                      field.onChange(member.id)
                                      setMemberPopoverOpen(false)
                                    }}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <div>
                                      <p className="font-medium">
                                        {member.first_name} {member.last_name}
                                      </p>
                                      {member.email && (
                                        <p className="text-xs text-muted-foreground">
                                          {member.email}
                                        </p>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected Return Date */}
            <FormField
              control={form.control}
              name="expected_return_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geplante Rückgabe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        min={format(new Date(), "yyyy-MM-dd")}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="loan_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notiz</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Für Auftritt am 20.02."
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
                Verleihen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
