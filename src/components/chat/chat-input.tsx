"use client"

import { useState, useRef, useCallback, type KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================
// PROJ-14: Chat Input
// - Textarea (multiline, max 1000 chars)
// - Enter = send, Shift+Enter = newline
// - Character counter (visible from 800 chars)
// - Send button (disabled when empty/whitespace)
// - Respects mobile keyboard (safe-area-inset-bottom)
// ============================================================

const MAX_CHARS = 1000
const SHOW_COUNTER_AT = 800

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedValue = value.trim()
  const canSend = trimmedValue.length > 0 && trimmedValue.length <= MAX_CHARS && !disabled && !isSending
  const charCount = value.length
  const showCounter = charCount >= SHOW_COUNTER_AT
  const isOverLimit = charCount > MAX_CHARS

  const handleSend = useCallback(async () => {
    if (!canSend) return

    setIsSending(true)
    try {
      await onSend(trimmedValue)
      setValue("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch {
      // Send failed — keep the message in the textarea so the user can retry
    } finally {
      setIsSending(false)
      // Re-focus the textarea after sending
      textareaRef.current?.focus()
    }
  }, [canSend, trimmedValue, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      // Auto-resize textarea
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    },
    []
  )

  return (
    <div
      className={cn(
        "border-t bg-background px-3 py-2 sm:px-4 sm:py-3",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            disabled={disabled || isSending}
            maxLength={MAX_CHARS + 50} // Allow slight overflow for UX, validated before send
            rows={1}
            className={cn(
              "flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "resize-none min-h-[40px] max-h-[120px]",
              isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
            aria-label="Nachricht eingeben"
          />
          {/* Character counter */}
          {showCounter && (
            <span
              className={cn(
                "absolute bottom-1 right-2 text-[10px]",
                isOverLimit
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
            >
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className="shrink-0 rounded-full h-10 w-10"
          disabled={!canSend}
          onClick={handleSend}
          aria-label="Nachricht senden"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
