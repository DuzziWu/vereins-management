import { z } from "zod"

// UUID-Validierung
export const uuidSchema = z.string().uuid("Ungültige ID")

export function isValidUUID(id: string): boolean {
  return uuidSchema.safeParse(id).success
}

// Event-Typen
export const EVENT_TYPES = ["performance", "match", "club_event", "training_event"] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  performance: "Auftritt",
  match: "Wettkampf",
  club_event: "Vereins-Event",
  training_event: "Training-Event",
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  performance: "bg-purple-500",
  match: "bg-blue-500",
  club_event: "bg-green-500",
  training_event: "bg-orange-500",
}

// Event-Status
export const EVENT_STATUSES = ["anfrage", "bestaetigt", "abgeschlossen", "abgesagt"] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  anfrage: "Anfrage",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  abgesagt: "Abgesagt",
}

export const EVENT_STATUS_VARIANTS: Record<EventStatus, "default" | "secondary" | "outline" | "destructive"> = {
  anfrage: "secondary",
  bestaetigt: "default",
  abgeschlossen: "outline",
  abgesagt: "destructive",
}

// Schema für Event erstellen
export const createEventSchema = z.object({
  title: z.string().min(3, "Mindestens 3 Zeichen").max(200, "Maximal 200 Zeichen"),
  description: z.string().max(2000, "Maximal 2000 Zeichen").optional().nullable(),
  event_type: z.enum(EVENT_TYPES),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Ungültiges Zeitformat (HH:MM)"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Ungültiges Zeitformat (HH:MM)").optional().nullable(),
  location_name: z.string().max(200, "Maximal 200 Zeichen").optional().nullable(),
  address: z.string().max(500, "Maximal 500 Zeichen").optional().nullable(),
  meeting_point: z.string().max(200, "Maximal 200 Zeichen").optional().nullable(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>

// Schema für Event aktualisieren
export const updateEventSchema = createEventSchema.partial()

export type UpdateEventInput = z.infer<typeof updateEventSchema>

// Schema für Status-Änderung
export const updateStatusSchema = z.object({
  status: z.enum(EVENT_STATUSES),
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

// Event-Typ für API-Response
export interface Event {
  id: string
  title: string
  description: string | null
  event_type: EventType
  status: EventStatus
  event_date: string
  start_time: string
  end_time: string | null
  location_name: string | null
  address: string | null
  meeting_point: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: {
    first_name: string
    last_name: string
  }
}
