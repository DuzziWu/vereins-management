"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronsUpDown, Loader2, Star, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { familySchema, FamilyFormData } from "@/lib/validations/member"
import { Member } from "./members-table"

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  role: string
  status: string
}

interface Family {
  id: string
  name: string
  primary_member_id: string | null
  member_count: number
  members?: FamilyMember[]
}

interface FamilyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  family?: Family | null
  members: Member[]
  onSubmit: (data: FamilyFormData) => Promise<void>
}

export function FamilyForm({
  open,
  onOpenChange,
  family,
  members,
  onSubmit,
}: FamilyFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoadingFamily, setIsLoadingFamily] = React.useState(false)
  const [memberSelectOpen, setMemberSelectOpen] = React.useState(false)
  const isEditing = !!family

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      primary_member_id: "",
      member_ids: [],
    },
  })

  const selectedMemberIds = form.watch("member_ids")
  const selectedMembers = members.filter((m) => selectedMemberIds.includes(m.id))
  const primaryMemberId = form.watch("primary_member_id")

  // Reset form and fetch family details when editing
  React.useEffect(() => {
    if (open) {
      if (family) {
        // Fetch full family details including members
        setIsLoadingFamily(true)
        fetch(`/api/families/${family.id}`)
          .then((res) => res.json())
          .then((data) => {
            const familyData = data.family
            const memberIds = familyData.members?.map((m: FamilyMember) => m.id) || []
            form.reset({
              name: familyData.name,
              primary_member_id: familyData.primary_member_id || "",
              member_ids: memberIds,
            })
          })
          .catch((error) => {
            console.error("Error fetching family:", error)
            // Fall back to basic data
            form.reset({
              name: family.name,
              primary_member_id: family.primary_member_id || "",
              member_ids: [],
            })
          })
          .finally(() => {
            setIsLoadingFamily(false)
          })
      } else {
        form.reset({
          name: "",
          primary_member_id: "",
          member_ids: [],
        })
      }
    }
  }, [open, family, form])

  function handleMemberToggle(memberId: string) {
    const current = form.getValues("member_ids")
    const isSelected = current.includes(memberId)

    if (isSelected) {
      // Remove member
      const newIds = current.filter((id) => id !== memberId)
      form.setValue("member_ids", newIds)

      // If removed member was primary, clear primary
      if (memberId === form.getValues("primary_member_id")) {
        form.setValue("primary_member_id", newIds[0] || "")
      }
    } else {
      // Add member
      const newIds = [...current, memberId]
      form.setValue("member_ids", newIds)

      // If first member, set as primary
      if (newIds.length === 1) {
        form.setValue("primary_member_id", memberId)
      }
    }
  }

  function handleSetPrimary(memberId: string) {
    form.setValue("primary_member_id", memberId)
  }

  function handleRemoveMember(memberId: string) {
    handleMemberToggle(memberId)
  }

  async function handleSubmit(data: FamilyFormData) {
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Familie bearbeiten" : "Neue Familie erstellen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Bearbeiten Sie die Familiendetails."
              : "Erstellen Sie eine neue Familie und weisen Sie Mitglieder zu."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {isLoadingFamily ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Lade Familiendetails...</span>
              </div>
            ) : (
              <>
            {/* Family Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Familienname *</FormLabel>
                  <FormControl>
                    <Input placeholder="Familie Müller" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Selection */}
            <FormField
              control={form.control}
              name="member_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Mitglieder *</FormLabel>
                  <Popover open={memberSelectOpen} onOpenChange={setMemberSelectOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedMemberIds.length > 0
                            ? `${selectedMemberIds.length} Mitglieder ausgewählt`
                            : "Mitglieder auswählen..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Mitglied suchen..." />
                        <CommandList>
                          <CommandEmpty>Keine Mitglieder gefunden</CommandEmpty>
                          <CommandGroup>
                            {members.map((member) => {
                              const isSelected = selectedMemberIds.includes(member.id)
                              return (
                                <CommandItem
                                  key={member.id}
                                  value={`${member.first_name} ${member.last_name}`}
                                  onSelect={() => handleMemberToggle(member.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {member.first_name} {member.last_name}
                                  {member.family_name && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({member.family_name})
                                    </span>
                                  )}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Wählen Sie mindestens 1 Mitglied aus
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Members with Primary Selection */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Ausgewählte Mitglieder</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => {
                    const isPrimary = member.id === primaryMemberId
                    return (
                      <Badge
                        key={member.id}
                        variant={isPrimary ? "default" : "secondary"}
                        className="flex items-center gap-1 pl-2 pr-1 py-1"
                      >
                        {isPrimary && <Star className="h-3 w-3" />}
                        {member.first_name} {member.last_name}
                        <div className="flex items-center ml-1">
                          {!isPrimary && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 hover:bg-transparent"
                              onClick={() => handleSetPrimary(member.id)}
                              title="Als Primärkontakt setzen"
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-transparent"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </Badge>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Klicken Sie auf das Stern-Symbol, um den Primärkontakt zu ändern.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingFamily}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Familie erstellen"}
              </Button>
            </DialogFooter>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
