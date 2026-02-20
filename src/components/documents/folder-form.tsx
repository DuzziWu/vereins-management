"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Link2 } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { folderCreateSchema, FolderCreateData, FOLDER_ROLES, FOLDER_ROLE_LABELS, FolderRole } from "@/lib/validations/folders"
import type { Folder, FolderPermission } from "./types"

interface FolderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: Folder | null
  parentFolder?: Folder | null
  availableParents: Folder[]
  inheritedPermissions?: FolderPermission[]
  onSubmit: (data: FolderCreateData) => Promise<void>
}

export function FolderForm({
  open,
  onOpenChange,
  folder,
  parentFolder,
  availableParents,
  inheritedPermissions = [],
  onSubmit,
}: FolderFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
  const isEditing = !!folder

  const form = useForm<FolderCreateData>({
    resolver: zodResolver(folderCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      parent_id: null,
      roles: ["vorstand"],
    },
  })

  // Extract roles from inherited permissions for editing
  const getExistingRoles = React.useCallback((): FolderRole[] => {
    if (!inheritedPermissions || inheritedPermissions.length === 0) {
      return ["vorstand"]
    }
    const roles = inheritedPermissions
      .filter(p => p.role && !p.is_inherited)
      .map(p => p.role as FolderRole)
    return roles.length > 0 ? roles : ["vorstand"]
  }, [inheritedPermissions])

  // Reset form when folder or parentFolder changes
  React.useEffect(() => {
    if (open) {
      if (folder) {
        form.reset({
          name: folder.name,
          description: folder.description || "",
          parent_id: folder.parent_id,
          roles: getExistingRoles(),
        })
      } else {
        form.reset({
          name: "",
          description: "",
          parent_id: parentFolder?.id || null,
          roles: ["vorstand"],
        })
      }
    }
  }, [open, folder, parentFolder, form, getExistingRoles])

  async function handleSubmit(data: FolderCreateData) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
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

  // Get parent folder path for display
  const selectedParentId = form.watch("parent_id")
  const selectedParent = availableParents.find((f) => f.id === selectedParentId)

  // Format permission display
  function formatPermission(perm: FolderPermission): string {
    if (perm.role) {
      const roleNames: Record<string, string> = {
        vorstand: "Vorstand",
        trainer: "Trainer",
        mitglied: "Alle Mitglieder",
      }
      return roleNames[perm.role] || perm.role
    }
    if (perm.group) {
      return `Gruppe: ${perm.group.name}`
    }
    if (perm.profile) {
      return `${perm.profile.first_name} ${perm.profile.last_name}`
    }
    return "Unbekannt"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Ordner bearbeiten" : "Neuer Ordner"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Bearbeiten Sie die Ordner-Informationen."
                : "Erstellen Sie einen neuen Ordner für Ihre Dokumente."}
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
                        placeholder="z.B. Protokolle 2026"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      2-100 Zeichen
                    </FormDescription>
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
                        placeholder="Optionale Beschreibung des Ordners..."
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

              {/* Parent Folder Field */}
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Übergeordneter Ordner</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "root" ? null : value)
                        }
                        value={field.value || "root"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Root (oberste Ebene)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="root">
                            Root (oberste Ebene)
                          </SelectItem>
                          {availableParents
                            .filter((f) => f.depth < 5) // Max depth check
                            .map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                {"  ".repeat(parent.depth)}{parent.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Maximal 5 Ebenen Verschachtelung möglich.
                        {selectedParent && selectedParent.depth >= 4 && (
                          <span className="text-amber-600 block mt-1">
                            Dieser Ordner wird auf der maximalen Tiefe erstellt.
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Permissions Field */}
              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Berechtigungen *</FormLabel>
                      <FormDescription>
                        Wählen Sie, welche Benutzergruppen auf diesen Ordner zugreifen können.
                      </FormDescription>
                    </div>
                    <div className="space-y-3">
                      {FOLDER_ROLES.map((role) => (
                        <FormField
                          key={role}
                          control={form.control}
                          name="roles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || []
                                      if (checked) {
                                        field.onChange([...currentValue, role])
                                      } else {
                                        // Ensure at least one role remains
                                        const newValue = currentValue.filter((v) => v !== role)
                                        if (newValue.length > 0) {
                                          field.onChange(newValue)
                                        }
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {FOLDER_ROLE_LABELS[role]}
                                  {role === "mitglied" && (
                                    <span className="text-muted-foreground ml-1">(inkl. Trainer & Vorstand)</span>
                                  )}
                                  {role === "trainer" && (
                                    <span className="text-muted-foreground ml-1">(inkl. Vorstand)</span>
                                  )}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Inherited Permissions Info (when editing or with parent) */}
              {selectedParent && inheritedPermissions.length > 0 && (
                <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Vererbte Berechtigungen von &quot;{selectedParent.name}&quot;
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inheritedPermissions.filter(p => p.is_inherited).map((perm) => (
                      <Badge
                        key={perm.id}
                        variant="secondary"
                        className="text-muted-foreground"
                      >
                        {formatPermission(perm)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diese Berechtigungen werden automatisch vom übergeordneten Ordner übernommen.
                  </p>
                </div>
              )}

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
                  {isEditing ? "Speichern" : "Ordner erstellen"}
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
    </>
  )
}
