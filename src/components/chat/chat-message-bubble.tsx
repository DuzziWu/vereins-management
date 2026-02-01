"use client"

import { GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatMessageTime } from "@/lib/chat-utils"
import { linkifyText } from "@/lib/linkify"
import type { ChatMessage } from "@/lib/chat-types"

// ============================================================
// PROJ-14: Single Message Bubble
// - Own messages: right-aligned, primary background
// - Other messages: left-aligned, muted background
// - Trainer messages: badge with icon
// ============================================================

interface ChatMessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  isTrainer: boolean
  /** Whether to show the sender name (hidden when grouping consecutive messages) */
  showSender?: boolean
}

export function ChatMessageBubble({
  message,
  isOwn,
  isTrainer,
  showSender = true,
}: ChatMessageBubbleProps) {
  const formattedTime = formatMessageTime(message.created_at)

  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[70%] space-y-0.5",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (only for other peoples messages and when showSender) */}
        {!isOwn && showSender && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {message.sender_display_name}
            </span>
            {isTrainer && (
              <Badge
                variant="secondary"
                className="h-4 px-1 text-[10px] leading-none gap-0.5"
              >
                <GraduationCap className="h-2.5 w-2.5" />
                Trainer
              </Badge>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          <p className="leading-relaxed">{linkifyText(message.content)}</p>
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            "text-[10px] text-muted-foreground px-1",
            isOwn ? "text-right block" : "text-left block"
          )}
        >
          {isOwn ? `Du \u00B7 ${formattedTime}` : formattedTime}
        </span>
      </div>
    </div>
  )
}
