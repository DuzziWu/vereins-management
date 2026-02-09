"use client"

import * as React from "react"
import { useState } from "react"
import { Bold, List, Link2, Loader2, Save, X, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { cn } from "@/lib/utils"

interface EventLogisticsEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
  initialLogistics: string | null
  onSuccess?: () => void
}

const MAX_CHARS = 2000

export function EventLogisticsEditor({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  initialLogistics,
  onSuccess,
}: EventLogisticsEditorProps) {
  const [content, setContent] = useState(initialLogistics || "")
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Reset content when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setContent(initialLogistics || "")
      setShowPreview(false)
    }
  }, [open, initialLogistics])

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    if (newText.length <= MAX_CHARS) {
      setContent(newText)
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + before.length + selectedText.length + after.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  const handleBold = () => {
    insertText("**", "**")
  }

  const handleList = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = content.lastIndexOf("\n", start - 1) + 1
    const newText =
      content.substring(0, lineStart) + "- " + content.substring(lineStart)

    if (newText.length <= MAX_CHARS) {
      setContent(newText)
    }
  }

  const handleLink = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (selectedText) {
      insertText("[", "](https://)")
    } else {
      insertText("[Link-Text](https://beispiel.de)")
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/logistics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logistics_info: content.trim() || null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      toast.success("Logistik-Informationen gespeichert")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = MAX_CHARS - content.length

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Logistik & Anfahrt</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {eventTitle}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-4 space-y-4">
          {/* Formatting Buttons */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBold}
              disabled={isSubmitting}
              title="Fett"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleList}
              disabled={isSubmitting}
              title="Liste"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLink}
              disabled={isSubmitting}
              title="Link"
            >
              <Link2 className="h-4 w-4" />
            </Button>

            <div className="flex-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={isSubmitting}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1.5" />
                  Bearbeiten
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1.5" />
                  Vorschau
                </>
              )}
            </Button>
          </div>

          {/* Editor / Preview */}
          {showPreview ? (
            <div className="min-h-[200px] p-3 border rounded-md prose prose-sm dark:prose-invert max-w-none">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">
                  Keine Logistik-Informationen vorhanden.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setContent(e.target.value)
                  }
                }}
                placeholder="Beispiel:
- Busabfahrt um 17:30 am Vereinsheim
- Parkplätze: P2 ist kostenlos
- Einlass nur mit Künstlerausweis

**Wichtig:** Getränke selbst mitbringen!"
                className="min-h-[200px] font-mono text-sm"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Unterstützt: **fett**, - Listen, [Links](url)
                </span>
                <span
                  className={cn(
                    remainingChars < 100 && "text-orange-500",
                    remainingChars < 50 && "text-destructive"
                  )}
                >
                  {remainingChars} Zeichen übrig
                </span>
              </div>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-1.5" />
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Speichern
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

// Standalone Markdown Display Component
interface EventLogisticsDisplayProps {
  logistics: string | null
  className?: string
}

export function EventLogisticsDisplay({
  logistics,
  className,
}: EventLogisticsDisplayProps) {
  if (!logistics) return null

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{logistics}</ReactMarkdown>
    </div>
  )
}
