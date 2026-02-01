// ============================================================
// PROJ-14: Chat Type Definitions
// ============================================================

/**
 * A single chat message as returned by the API.
 */
export interface ChatMessage {
  id: string
  group_id: string
  sender_id: string
  sender_display_name: string
  content: string
  created_at: string
}

/**
 * API response for loading messages.
 */
export interface MessagesResponse {
  messages: ChatMessage[]
  has_more: boolean
}

/**
 * API response for sending a message.
 */
export interface SendMessageResponse {
  message: ChatMessage
}

/**
 * A single unread count entry per group.
 */
export interface UnreadEntry {
  group_id: string
  group_name: string
  unread_count: number
}

/**
 * API response for unread message counts.
 */
export interface UnreadResponse {
  unread: UnreadEntry[]
  total_unread: number
}

/**
 * Group member info for the members sheet.
 */
export interface ChatMember {
  id: string
  display_name: string
  role: "trainer" | "co-trainer" | "mitglied"
}

/**
 * Realtime connection status.
 */
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected"
