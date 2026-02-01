// ============================================================
// PROJ-14: Chat Utility Functions
// ============================================================

/**
 * Format a message timestamp for display.
 * - Today: "HH:MM"
 * - Older: "DD.MM. HH:MM"
 */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const time = `${hours}:${minutes}`

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return time
  }

  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${day}.${month}. ${time}`
}

/**
 * Check if two messages are from the same sender and close in time (< 2 min).
 * Used for grouping consecutive messages visually.
 */
export function isSameMessageGroup(
  prevCreatedAt: string,
  prevSenderId: string,
  currCreatedAt: string,
  currSenderId: string
): boolean {
  if (prevSenderId !== currSenderId) return false

  const prevTime = new Date(prevCreatedAt).getTime()
  const currTime = new Date(currCreatedAt).getTime()
  return currTime - prevTime < 2 * 60 * 1000 // 2 minutes
}
