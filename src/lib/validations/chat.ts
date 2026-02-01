import { z } from "zod"

// ============================================================
// PROJ-14: Chat Message Validation Schemas
// ============================================================

/**
 * Schema for sending a new chat message.
 * - content: 1-1000 characters, trimmed, HTML tags stripped
 */
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Nachricht darf nicht leer sein")
    .max(1000, "Maximal 1000 Zeichen")
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, {
      message: "Nachricht darf nicht leer sein",
    }),
})

export type SendMessageData = z.infer<typeof sendMessageSchema>

/**
 * Schema for marking messages as read (UPSERT last_read_at).
 */
export const markReadSchema = z.object({
  last_read_at: z
    .string()
    .datetime({ message: "Ungültiges Datumsformat" })
    .optional(),
})

export type MarkReadData = z.infer<typeof markReadSchema>
