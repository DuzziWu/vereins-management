import { z } from "zod"

// Regex patterns for validation
const NAME_REGEX = /^[a-zA-ZäöüÄÖÜßéèêëàáâãåæçíìîïñóòôõøúùûýÿ\s-]+$/
const PHONE_REGEX = /^[\d\s+\-()]+$/
const ZIP_REGEX = /^\d{5}$/

export const memberSchema = z.object({
  first_name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .regex(NAME_REGEX, "Nur Buchstaben und Bindestriche erlaubt"),
  last_name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .regex(NAME_REGEX, "Nur Buchstaben und Bindestriche erlaubt"),
  date_of_birth: z.string().refine((date) => {
    const parsed = new Date(date)
    const minDate = new Date('1900-01-01')
    const today = new Date()
    return parsed >= minDate && parsed <= today
  }, "Geburtsdatum muss zwischen 1900 und heute liegen"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || PHONE_REGEX.test(val),
      "Nur Zahlen, Leerzeichen, +, -, () erlaubt"
    ),
  role: z.enum(["vorstand", "trainer", "mitglied"]),
  address_street: z.string().optional().or(z.literal("")),
  address_zip: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || ZIP_REGEX.test(val),
      "PLZ muss 5 Ziffern haben"
    ),
  address_city: z.string().optional().or(z.literal("")),
  functional_tags: z.array(z.string()).optional(),
  family_id: z.string().uuid().optional().or(z.literal("")),
  membership_type_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export type MemberFormData = z.infer<typeof memberSchema>

export const familySchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen"),
  primary_member_id: z.string().uuid("Primärkontakt auswählen"),
  member_ids: z.array(z.string().uuid()).min(1, "Mindestens 1 Mitglied auswählen"),
})

export type FamilyFormData = z.infer<typeof familySchema>

// Functional tags options
export const FUNCTIONAL_TAGS = [
  { value: "dancer", label: "Tänzer/in" },
  { value: "trainer", label: "Trainer/in" },
  { value: "helper", label: "Helfer/in" },
  { value: "musician", label: "Musiker/in" },
  { value: "board_assistant", label: "Vorstandshelfer/in" },
] as const

// Status types
export type MemberStatus = "active" | "inactive" | "pending"

export const STATUS_CONFIG: Record<MemberStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Aktiv", variant: "default" },
  inactive: { label: "Inaktiv", variant: "secondary" },
  pending: { label: "Ausstehend", variant: "outline" },
}

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Mitglied",
}

export const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  vorstand: "default",
  trainer: "secondary",
  mitglied: "outline",
}
