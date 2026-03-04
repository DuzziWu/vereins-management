"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  createTrainerNote,
  updateTrainerNote,
  type TrainerNoteWithSession,
  type TrainingSessionOption,
} from "@/lib/actions"

interface NoteEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  trainingSessions: TrainingSessionOption[]
  editingNote?: TrainerNoteWithSession | null
  preselectedSessionId?: string | null
  onSuccess: () => void
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  groupId,
  trainingSessions,
  editingNote,
  preselectedSessionId,
  onSuccess,
}: NoteEditorDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingNote
  const contentLength = content.length
  const showCharCount = contentLength >= 4000

  // Reset form when dialog opens/closes or editing note changes
  useEffect(() => {
    if (open) {
      if (editingNote) {
        setTitle(editingNote.title || "")
        setContent(editingNote.content)
        setSessionId(editingNote.training_session_id)
      } else {
        setTitle("")
        setContent("")
        setSessionId(preselectedSessionId || null)
      }
    }
  }, [open, editingNote, preselectedSessionId])

  const formatSessionDate = (session: TrainingSessionOption) => {
    const date = new Date(session.date)
    const formattedDate = date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const time = session.start_time.slice(0, 5)
    return `${formattedDate}, ${time} Uhr`
  }

  const handleSubmit = async () => {
    if (contentLength < 10) {
      toast.error("Die Notiz muss mindestens 10 Zeichen haben")
      return
    }
    if (contentLength > 5000) {
      toast.error("Die Notiz darf maximal 5000 Zeichen haben")
      return
    }
    if (title.length > 100) {
      toast.error("Der Titel darf maximal 100 Zeichen haben")
      return
    }

    setIsSubmitting(true)

    try {
      const input = {
        title: title.trim() || null,
        content: content.trim(),
        training_session_id: sessionId,
      }

      const result = isEditing
        ? await updateTrainerNote(editingNote.id, input)
        : await createTrainerNote({ ...input, group_id: groupId })

      if (result.success) {
        toast.success(isEditing ? "Notiz aktualisiert" : "Notiz erstellt")
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.error || "Fehler beim Speichern")
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Notiz bearbeiten" : "Neue Notiz"}
          </DialogTitle>
          <DialogDescription>
            Deine Notizen sind privat. Nur du kannst sie sehen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="note-title">Titel (optional)</Label>
            <Input
              id="note-title"
              placeholder="z.B. Choreografie Teil 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Training Session */}
          <div className="space-y-2">
            <Label htmlFor="note-session">Verknüpftes Training (optional)</Label>
            <Select
              value={sessionId || "none"}
              onValueChange={(value) =>
                setSessionId(value === "none" ? null : value)
              }
            >
              <SelectTrigger id="note-session">
                <SelectValue placeholder="Kein Training verknüpft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Training verknüpft</SelectItem>
                {trainingSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {formatSessionDate(session)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="note-content">
              Notiz <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note-content"
              placeholder="Deine Beobachtungen, Trainingsfortschritte, Notizen..."
              className="min-h-[200px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min. 10 Zeichen</span>
              {showCharCount && (
                <span
                  className={contentLength > 4800 ? "text-destructive" : ""}
                >
                  {contentLength}/5000
                </span>
              )}
            </div>
          </div>

          {/* Last edited info */}
          {isEditing && editingNote.updated_at && (
            <p className="text-xs text-muted-foreground">
              Zuletzt bearbeitet:{" "}
              {new Date(editingNote.updated_at).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || contentLength < 10}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
