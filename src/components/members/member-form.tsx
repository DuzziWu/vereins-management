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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { memberSchema, MemberFormData, FUNCTIONAL_TAGS } from "@/lib/validations/member"
import { Member } from "./members-table"

interface Family {
  id: string
  name: string
}

interface MemberFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: Member | null
  families: Family[]
  onSubmit: (data: MemberFormData) => Promise<void>
}

export function MemberForm({
  open,
  onOpenChange,
  member,
  families,
  onSubmit,
}: MemberFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!member

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      email: "",
      phone: "",
      role: "mitglied",
      address_street: "",
      address_zip: "",
      address_city: "",
      functional_tags: [],
      family_id: "",
      notes: "",
    },
  })

  // Reset form when member changes
  React.useEffect(() => {
    if (open) {
      if (member) {
        // Format date_of_birth for the date input (YYYY-MM-DD)
        let formattedDate = ""
        if (member.date_of_birth) {
          const date = new Date(member.date_of_birth)
          formattedDate = date.toISOString().split("T")[0]
        }

        form.reset({
          first_name: member.first_name,
          last_name: member.last_name,
          date_of_birth: formattedDate,
          email: member.email || "",
          phone: member.phone || "",
          role: member.role as "vorstand" | "trainer" | "mitglied",
          address_street: member.address_street || "",
          address_zip: member.address_zip || "",
          address_city: member.address_city || "",
          functional_tags: member.functional_tags || [],
          family_id: member.family_id || "",
          notes: member.notes || "",
        })
      } else {
        form.reset({
          first_name: "",
          last_name: "",
          date_of_birth: "",
          email: "",
          phone: "",
          role: "mitglied",
          address_street: "",
          address_zip: "",
          address_city: "",
          functional_tags: [],
          family_id: "",
          notes: "",
        })
      }
    }
  }, [open, member, form])

  async function handleSubmit(data: MemberFormData) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Mitglied bearbeiten" : "Neues Mitglied anlegen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ändern Sie die Daten des Mitglieds."
              : "Erfassen Sie ein neues Mitglied im System."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Section */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Max" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mustermann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Birth Date & Role */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geburtsdatum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Systemrolle *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rolle auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vorstand">Vorstand</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="mitglied">Mitglied</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="max@beispiel.de"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional für Kinder ohne eigene E-Mail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+49 123 456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße und Hausnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterstraße 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address_zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input placeholder="Musterstadt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Functional Tags */}
            <FormField
              control={form.control}
              name="functional_tags"
              render={() => (
                <FormItem>
                  <FormLabel>Funktionale Tags</FormLabel>
                  <FormDescription>
                    Wählen Sie alle zutreffenden Rollen
                  </FormDescription>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FUNCTIONAL_TAGS.map((tag) => (
                      <FormField
                        key={tag.value}
                        control={form.control}
                        name="functional_tags"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tag.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, tag.value])
                                  } else {
                                    field.onChange(
                                      current.filter((v) => v !== tag.value)
                                    )
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {tag.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Family */}
            <FormField
              control={form.control}
              name="family_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Familie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Familie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Keine Familie</SelectItem>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interne Notizen zum Mitglied..."
                      className="resize-none"
                      rows={3}
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
                {isEditing ? "Speichern" : "Mitglied anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
