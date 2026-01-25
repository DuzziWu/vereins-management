"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getMyGroups,
  getMyTrainerNotes,
  saveTrainerNote,
  type GroupWithTrainer,
  type TrainerNoteWithGroup,
} from "@/lib/actions"

// Debounce Hook für Autosave
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface NoteState {
  content: string
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

function GroupNoteCard({
  group,
  initialContent,
}: {
  group: GroupWithTrainer
  initialContent: string
}) {
  const [note, setNote] = useState<NoteState>({
    content: initialContent,
    isSaving: false,
    lastSaved: initialContent ? new Date() : null,
    error: null,
  })

  const debouncedContent = useDebounce(note.content, 500)

  // Autosave wenn sich der debounced Content ändert
  const saveNote = useCallback(async (content: string) => {
    if (content === initialContent) return // Nichts geändert

    setNote((prev) => ({ ...prev, isSaving: true, error: null }))

    const result = await saveTrainerNote(group.id, content)

    if (result.success) {
      setNote((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        error: null,
      }))
    } else {
      setNote((prev) => ({
        ...prev,
        isSaving: false,
        error: result.error || "Speichern fehlgeschlagen",
      }))
    }
  }, [group.id, initialContent])

  // Trigger save when debounced content changes
  useEffect(() => {
    if (debouncedContent !== initialContent) {
      saveNote(debouncedContent)
    }
  }, [debouncedContent, initialContent, saveNote])

  const formatLastSaved = (date: Date | null) => {
    if (!date) return null
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{group.name}</CardTitle>
            <CardDescription>
              {group.description || "Keine Beschreibung"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {note.isSaving && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Speichern...</span>
              </>
            )}
            {!note.isSaving && note.error && (
              <>
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Fehler</span>
              </>
            )}
            {!note.isSaving && !note.error && note.lastSaved && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Gespeichert um {formatLastSaved(note.lastSaved)}</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Notizen zu dieser Gruppe... (wird automatisch gespeichert)"
          className="min-h-[120px] resize-y"
          value={note.content}
          onChange={(e) =>
            setNote((prev) => ({ ...prev, content: e.target.value }))
          }
        />
      </CardContent>
    </Card>
  )
}

export function TrainerNotes() {
  const [groups, setGroups] = useState<GroupWithTrainer[]>([])
  const [notes, setNotes] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [groupsData, notesData] = await Promise.all([
        getMyGroups(),
        getMyTrainerNotes(),
      ])

      setGroups(groupsData)

      // Map von group_id zu content erstellen
      const notesMap = new Map<string, string>()
      notesData.forEach((note) => {
        notesMap.set(note.group_id, note.content)
      })
      setNotes(notesMap)

      setIsLoading(false)
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meine Notizen
        </h2>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meine Notizen
        </h2>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Du hast noch keine Gruppen zugeordnet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sobald du Gruppen hast, kannst du hier Notizen speichern
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Meine Notizen
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Private Notizen zu deinen Gruppen. Nur du kannst diese sehen.
      </p>
      <div className="space-y-4">
        {groups.map((group) => (
          <GroupNoteCard
            key={group.id}
            group={group}
            initialContent={notes.get(group.id) || ""}
          />
        ))}
      </div>
    </div>
  )
}
