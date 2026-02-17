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
import { folderCreateSchema, FolderCreateData } from "@/lib/validations/folders"
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
    },
  })

  // Reset form when folder or parentFolder changes
  React.useEffect(() => {
    if (open) {
      if (folder) {
        form.reset({
          name: folder.name,
          description: folder.description || "",
          parent_id: folder.parent_id,
        })
      } else {
        form.reset({
          name: "",
          description: "",
          parent_id: parentFolder?.id || null,
        })
      }
    }
  }, [open, folder, parentFolder, form])

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

              {/* Inherited Permissions Display */}
              {(inheritedPermissions.length > 0 || selectedParent) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Vererbte Berechtigungen
                      {selectedParent && ` von "${selectedParent.name}"`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inheritedPermissions.length > 0 ? (
                      inheritedPermissions.map((perm) => (
                        <Badge
                          key={perm.id}
                          variant="secondary"
                          className="text-muted-foreground flex items-center gap-1"
                        >
                          {/* BUG-4 FIX: Show chain icon for inherited permissions */}
                          {perm.is_inherited && (
                            <Link2 className="h-3 w-3" aria-label="Vererbt" />
                          )}
                          {formatPermission(perm)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" aria-label="Standard" />
                        Vorstand (Standard)
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Diese Berechtigungen werden automatisch vom übergeordneten
                    Ordner geerbt und können erweitert, aber nicht eingeschränkt
                    werden.
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
