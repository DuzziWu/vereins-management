"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Pencil,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { NoteEditorDialog } from "./note-editor-dialog"
import {
  deleteTrainerNote,
  type TrainerNoteWithSession,
  type TrainingSessionOption,
} from "@/lib/actions"

interface GroupNotesListProps {
  groupId: string
  initialNotes: TrainerNoteWithSession[]
  trainingSessions: TrainingSessionOption[]
  onRefresh: () => Promise<void>
}

export function GroupNotesList({
  groupId,
  initialNotes,
  trainingSessions,
  onRefresh,
}: GroupNotesListProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<TrainerNoteWithSession | null>(
    null
  )
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Client-side filtering
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes

    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    )
  }, [notes, searchQuery])

  const handleCreateNew = useCallback(() => {
    setEditingNote(null)
    setEditorOpen(true)
  }, [])

  const handleEdit = useCallback((note: TrainerNoteWithSession) => {
    setEditingNote(note)
    setEditorOpen(true)
  }, [])

  const handleDeleteClick = useCallback((noteId: string) => {
    setDeletingNoteId(noteId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deletingNoteId) return

    setIsDeleting(true)
    try {
      const result = await deleteTrainerNote(deletingNoteId)
      if (result.success) {
        toast.success("Notiz gelöscht")
        setNotes((prev) => prev.filter((n) => n.id !== deletingNoteId))
      } else {
        toast.error(result.error || "Fehler beim Löschen")
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setDeletingNoteId(null)
    }
  }

  const handleEditorSuccess = async () => {
    await onRefresh()
    // Re-fetch will update the notes via parent
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatSessionInfo = (session: TrainerNoteWithSession["training_session"]) => {
    if (!session) return null
    const date = new Date(session.date)
    return `Training vom ${date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    })}`
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).trim() + "..."
  }

  return (
    <div className="space-y-4">
      {/* Privacy notice (shown once) */}
      {notes.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Deine Notizen sind privat. Nur du kannst sie sehen - weder der
            Vorstand noch andere Trainer haben Zugriff.
          </span>
        </div>
      )}

      {/* Header with search and add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Notizen durchsuchen..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Notiz
        </Button>
      </div>

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              {searchQuery ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Keine Notizen gefunden für &quot;{searchQuery}&quot;
                  </p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setSearchQuery("")}
                  >
                    Suche zurücksetzen
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Noch keine Notizen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Halte deine Trainings-Beobachtungen fest!
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Notiz erstellen
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:bg-muted/30 transition-colors group"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      {note.title || "(Ohne Titel)"}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.created_at)}
                      </span>
                      {note.training_session && (
                        <Badge variant="secondary" className="text-xs">
                          {formatSessionInfo(note.training_session)}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(note)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Bearbeiten</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Löschen</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {truncateContent(note.content)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        groupId={groupId}
        trainingSessions={trainingSessions}
        editingNote={editingNote}
        onSuccess={handleEditorSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher? Diese Notiz wird permanent gelöscht und kann nicht
              wiederhergestellt werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
