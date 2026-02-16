"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search, Plus, X } from "lucide-react"

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { workgroupSchema, WorkgroupFormData } from "@/lib/validations/workgroups"

export interface WorkgroupCategory {
  id: string
  name: string
  is_system_default: boolean
  sort_order: number
}

export interface WorkgroupListItem {
  id: string
  name: string
  description: string | null
  category_id: string | null
  category: WorkgroupCategory | null
  status: "active" | "archived"
  member_count: number
  created_by: string
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface MemberOption {
  id: string
  first_name: string
  last_name: string
}

interface WorkgroupFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workgroup?: WorkgroupListItem | null
  categories: WorkgroupCategory[]
  allMembers: MemberOption[]
  existingMembers?: string[]
  currentUserId: string
  onSubmit: (data: WorkgroupFormData) => Promise<void>
  onCreateCategory?: (name: string) => Promise<WorkgroupCategory | null>
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function WorkgroupForm({
  open,
  onOpenChange,
  workgroup,
  categories,
  allMembers,
  existingMembers = [],
  currentUserId,
  onSubmit,
  onCreateCategory,
}: WorkgroupFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])
  const [memberSearch, setMemberSearch] = React.useState("")
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false)
  const [showDuplicateWarning, setShowDuplicateWarning] = React.useState(false)
  const [pendingSubmitData, setPendingSubmitData] = React.useState<WorkgroupFormData | null>(null)
  const isEditing = !!workgroup

  const form = useForm<WorkgroupFormData>({
    resolver: zodResolver(workgroupSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: null,
      member_ids: [],
    },
  })

  // Reset form when workgroup changes
  React.useEffect(() => {
    if (open) {
      if (workgroup) {
        form.reset({
          name: workgroup.name,
          description: workgroup.description || "",
          category_id: workgroup.category_id,
          member_ids: existingMembers,
        })
        setSelectedMembers(existingMembers)
      } else {
        form.reset({
          name: "",
          description: "",
          category_id: null,
          member_ids: [currentUserId], // Auto-add current user
        })
        setSelectedMembers([currentUserId])
      }
      setMemberSearch("")
      setShowNewCategoryInput(false)
      setNewCategoryName("")
    }
  }, [open, workgroup, form, existingMembers, currentUserId])

  async function handleSubmit(data: WorkgroupFormData) {
    // Check for duplicate name (only when creating new)
    if (!isEditing) {
      const existingWorkgroups = await checkDuplicateName(data.name)
      if (existingWorkgroups) {
        setPendingSubmitData({ ...data, member_ids: selectedMembers })
        setShowDuplicateWarning(true)
        return
      }
    }

    await submitForm({ ...data, member_ids: selectedMembers })
  }

  async function submitForm(data: WorkgroupFormData) {
    // Validate minimum 1 member
    if (data.member_ids.length < 1) {
      form.setError("member_ids", {
        message: "Mindestens ein Mitglied muss zugewiesen sein",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if a workgroup with the same name already exists
  async function checkDuplicateName(name: string): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/workgroups?search=${encodeURIComponent(name)}&status=active&limit=1`
      )
      if (!response.ok) return false
      const data = await response.json()
      return data.workgroups?.some(
        (w: { name: string }) => w.name.toLowerCase() === name.toLowerCase()
      ) ?? false
    } catch {
      return false
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && form.formState.isDirty) {
      setShowDiscardDialog(true)
    } else {
      onOpenChange(newOpen)
    }
  }

  function handleDiscardConfirm() {
    setShowDiscardDialog(false)
    form.reset()
    onOpenChange(false)
  }

  function handleMemberToggle(profileId: string, checked: boolean) {
    // Prevent removing the creator (current user) when creating new
    if (!isEditing && profileId === currentUserId && !checked) {
      return
    }

    setSelectedMembers((prev) =>
      checked ? [...prev, profileId] : prev.filter((id) => id !== profileId)
    )
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || !onCreateCategory) return

    setIsCreatingCategory(true)
    try {
      const newCategory = await onCreateCategory(newCategoryName.trim())
      if (newCategory) {
        form.setValue("category_id", newCategory.id)
        setNewCategoryName("")
        setShowNewCategoryInput(false)
      }
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Filter members by search
  const filteredMembers = allMembers.filter((m) => {
    if (!memberSearch) return true
    const searchLower = memberSearch.toLowerCase()
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    return fullName.includes(searchLower)
  })

  // Get selected member details for display
  const selectedMemberDetails = allMembers.filter((m) =>
    selectedMembers.includes(m.id)
  )

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Workgroup bearbeiten" : "Neue Workgroup erstellen"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Bearbeiten Sie die Workgroup-Informationen."
                : "Erstellen Sie eine neue Workgroup für Vereinsprojekte."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Wagenbau 2026"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Field */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    {!showNewCategoryInput ? (
                      <>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Keine Kategorie
                            </SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {onCreateCategory && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-auto p-0 text-primary"
                            onClick={() => setShowNewCategoryInput(true)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Neue Kategorie erstellen
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Kategoriename"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          disabled={isCreatingCategory}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim() || isCreatingCategory}
                        >
                          {isCreatingCategory ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Erstellen"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowNewCategoryInput(false)
                            setNewCategoryName("")
                          }}
                          disabled={isCreatingCategory}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optionale Beschreibung der Workgroup..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximal 500 Zeichen
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Members Section */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Mitglieder zuweisen *
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wählen Sie mindestens ein Mitglied für diese Workgroup.
                  </p>
                </div>

                {/* Selected Members Preview */}
                {selectedMemberDetails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMemberDetails.map((member) => {
                      const isCurrentUser = member.id === currentUserId
                      return (
                        <Badge
                          key={member.id}
                          variant="secondary"
                          className="flex items-center gap-1.5 py-1"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {member.first_name} {member.last_name}
                            {isCurrentUser && !isEditing && " (Du)"}
                          </span>
                          {(!isCurrentUser || isEditing) && (
                            <button
                              type="button"
                              onClick={() => handleMemberToggle(member.id, false)}
                              className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Member Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Mitglied suchen..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Member List */}
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {filteredMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        {memberSearch
                          ? "Keine Mitglieder gefunden."
                          : "Keine Mitglieder verfügbar."}
                      </p>
                    ) : (
                      filteredMembers.map((member) => {
                        const isSelected = selectedMembers.includes(member.id)
                        const isCurrentUser = member.id === currentUserId
                        return (
                          <div
                            key={member.id}
                            className="flex items-center space-x-3 rounded-md p-2 hover:bg-accent"
                          >
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleMemberToggle(member.id, !!checked)
                              }
                              disabled={!isEditing && isCurrentUser && isSelected}
                            />
                            <label
                              htmlFor={`member-${member.id}`}
                              className="flex-1 cursor-pointer flex items-center gap-2"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {getInitials(member.first_name, member.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {member.first_name} {member.last_name}
                                {isCurrentUser && !isEditing && (
                                  <span className="text-muted-foreground ml-1">(Du)</span>
                                )}
                              </span>
                            </label>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>

                <p className="text-sm text-muted-foreground">
                  {selectedMembers.length} Mitglied{selectedMembers.length !== 1 && "er"} ausgewählt
                </p>
                {form.formState.errors.member_ids && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.member_ids.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Speichern" : "Workgroup erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben ungespeicherte Änderungen. Möchten Sie diese wirklich
              verwerfen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zurück zum Formular</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              Änderungen verwerfen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Name Warning Dialog */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Doppelter Name</AlertDialogTitle>
            <AlertDialogDescription>
              Eine Workgroup mit diesem Namen existiert bereits. Möchten Sie
              trotzdem fortfahren?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmitData(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSubmitData) {
                  submitForm(pendingSubmitData)
                }
                setShowDuplicateWarning(false)
                setPendingSubmitData(null)
              }}
            >
              Trotzdem erstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
