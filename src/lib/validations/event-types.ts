import { z } from "zod"

// === Event-Typen Validierung (PROJ-23) ===

// Vordefinierte Farbpalette (12 Farben)
export const EVENT_TYPE_COLOR_PALETTE = [
  { value: "#EF4444", label: "Rot" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Gelb" },
  { value: "#22C55E", label: "Grün" },
  { value: "#14B8A6", label: "Türkis" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#3B82F6", label: "Blau" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Lila" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#6B7280", label: "Grau" },
] as const

// Hex-Farben-Regex
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

// Event-Typ Schema für API-Response
export interface EventType {
  id: string
  name: string
  color: string
  icon: string | null
  is_system_default: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
  // Zusätzliche Felder für UI
  event_count?: number
}

// Schema für Event-Typ erstellen
export const createEventTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(50, "Maximal 50 Zeichen")
    .trim(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Ungültiges Farbformat (z.B. #8B5CF6)"),
  icon: z.string().max(10, "Maximal 10 Zeichen").nullable(),
})

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>

// Schema für Event-Typ bearbeiten
export const updateEventTypeSchema = createEventTypeSchema.partial()

export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>

// Helper: Prüft ob Farbe gültig ist
export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color)
}

// Helper: Konvertiert Tailwind-Klasse zu Hex (für Migration)
export const TAILWIND_TO_HEX: Record<string, string> = {
  "bg-purple-500": "#8B5CF6",
  "bg-blue-500": "#3B82F6",
  "bg-green-500": "#22C55E",
  "bg-orange-500": "#F97316",
}

// Helper: Generiert Tailwind-ähnliche Klasse aus Hex-Farbe
export function hexToTailwindBg(hex: string): string {
  // Für dynamische Farben nutzen wir inline-style statt Tailwind-Klassen
  return `bg-[${hex}]`
}
