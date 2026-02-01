"use client"

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type UIEvent,
} from "react"
import { ChevronDown, MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatMessageBubble } from "./chat-message-bubble"
import { isSameMessageGroup } from "@/lib/chat-utils"
import type { ChatMessage } from "@/lib/chat-types"
import { cn } from "@/lib/utils"

// ============================================================
// PROJ-14: Chat Messages Area
// - ScrollArea with messages
// - Auto-scroll to newest messages
// - "Neue Nachrichten" button when scrolled up + new messages
// - Infinite scroll up for older messages
// - Loading skeleton
// - Empty state
// ============================================================

interface ChatMessagesProps {
  messages: ChatMessage[]
  currentUserId: string
  trainerIds: string[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}

/** Threshold in px from bottom to consider "scrolled to bottom" */
const SCROLL_BOTTOM_THRESHOLD = 100
/** Threshold in px from top to trigger loading more */
const SCROLL_TOP_THRESHOLD = 50

export function ChatMessages({
  messages,
  currentUserId,
  trainerIds,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ChatMessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const prevMessageCountRef = useRef(messages.length)
  const isInitialLoadRef = useRef(true)
  const prevScrollHeightRef = useRef<number>(0)

  /**
   * Check if the user is scrolled near the bottom.
   */
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < SCROLL_BOTTOM_THRESHOLD
  }, [])

  /**
   * Scroll to the bottom of the messages.
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
    setHasNewMessages(false)
    setIsAtBottom(true)
  }, [])

  /**
   * Handle new messages arriving.
   */
  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMessageCountRef.current

    if (newCount > prevCount) {
      const addedAtBottom = newCount > prevCount

      if (isInitialLoadRef.current) {
        // Initial load: scroll to bottom instantly
        isInitialLoadRef.current = false
        // Use setTimeout to ensure DOM has rendered
        setTimeout(() => scrollToBottom("instant"), 0)
      } else if (addedAtBottom && isAtBottom) {
        // New messages at bottom and user is at bottom: auto-scroll
        setTimeout(() => scrollToBottom("smooth"), 0)
      } else if (addedAtBottom && !isAtBottom) {
        // New messages but user is scrolled up: show indicator
        setHasNewMessages(true)
      }
    }

    prevMessageCountRef.current = newCount
  }, [messages.length, isAtBottom, scrollToBottom])

  /**
   * After loading more (older) messages, maintain scroll position.
   */
  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current > 0) {
      const container = scrollContainerRef.current
      if (container) {
        const newScrollHeight = container.scrollHeight
        const diff = newScrollHeight - prevScrollHeightRef.current
        container.scrollTop += diff
        prevScrollHeightRef.current = 0
      }
    }
  }, [isLoadingMore, messages])

  /**
   * Handle scroll events: check position and trigger loading more.
   */
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget
      const atBottom = checkIfAtBottom()
      setIsAtBottom(atBottom)

      if (atBottom) {
        setHasNewMessages(false)
      }

      // Load more when scrolled near top
      if (
        container.scrollTop < SCROLL_TOP_THRESHOLD &&
        hasMore &&
        !isLoadingMore
      ) {
        prevScrollHeightRef.current = container.scrollHeight
        onLoadMore()
      }
    },
    [checkIfAtBottom, hasMore, isLoadingMore, onLoadMore]
  )

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              i % 3 === 0 ? "justify-end" : "justify-start"
            )}
          >
            <div className="space-y-1.5 max-w-[70%]">
              {i % 3 !== 0 && <Skeleton className="h-3 w-16" />}
              <Skeleton
                className={cn(
                  "rounded-2xl",
                  i % 2 === 0 ? "h-10 w-48" : "h-16 w-56"
                )}
              />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-sm font-medium text-muted-foreground">
          Noch keine Nachrichten in dieser Gruppe.
        </h3>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Starte die Konversation!
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Scrollable messages area */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto p-3 sm:p-4 space-y-1"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMore && messages.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-2">
            Keine aelteren Nachrichten
          </p>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId
          const isTrainer = trainerIds.includes(message.sender_id)

          // Determine if we should show the sender name
          // Hide if same sender and within 2 minutes of previous message
          const prevMessage = index > 0 ? messages[index - 1] : null
          const showSender =
            !prevMessage ||
            !isSameMessageGroup(
              prevMessage.created_at,
              prevMessage.sender_id,
              message.created_at,
              message.sender_id
            )

          return (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              isTrainer={isTrainer}
              showSender={showSender}
            />
          )
        })}

        {/* Bottom anchor for scrolling */}
        <div ref={bottomRef} />
      </div>

      {/* "Neue Nachrichten" button */}
      {hasNewMessages && !isAtBottom && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-lg rounded-full gap-1 text-xs"
            onClick={() => scrollToBottom("smooth")}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Neue Nachrichten
          </Button>
        </div>
      )}
    </div>
  )
}
