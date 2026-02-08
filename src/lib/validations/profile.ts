import { z } from "zod"

// Regex patterns (reused from member.ts)
const NAME_REGEX = /^[a-zA-ZäöüÄÖÜßéèêëàáâãåæçíìîïñóòôõøúùûýÿ\s-]+$/
const PHONE_REGEX = /^[\d\s+\-()]+$/
const ZIP_REGEX = /^\d{5}$/

// Schema for personal data form
export const profileFormSchema = z.object({
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
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || PHONE_REGEX.test(val),
      "Nur Zahlen, Leerzeichen, +, -, () erlaubt"
    ),
  date_of_birth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((date) => {
      if (!date) return true
      const parsed = new Date(date)
      const minDate = new Date("1900-01-01")
      const today = new Date()
      return parsed >= minDate && parsed <= today
    }, "Geburtsdatum muss zwischen 1900 und heute liegen"),
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
})

export type ProfileFormData = z.infer<typeof profileFormSchema>

// Schema for password change form
export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
    new_password: z
      .string()
      .min(8, "Mindestens 8 Zeichen")
      .regex(/[a-zA-Z]/, "Muss mindestens einen Buchstaben enthalten")
      .regex(/[0-9]/, "Muss mindestens eine Ziffer enthalten"),
    confirm_password: z.string().min(1, "Passwort-Bestätigung ist erforderlich"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirm_password"],
  })

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>

// Notification categories
export const NOTIFICATION_CATEGORIES = [
  {
    id: "training_changes",
    label: "Trainings-Änderungen",
    description: "Absagen, Zeitänderungen",
  },
  {
    id: "group_messages",
    label: "Gruppen-Nachrichten",
    description: "Chat-Zusammenfassungen",
  },
  {
    id: "club_announcements",
    label: "Vereins-Mitteilungen",
    description: "System-Nachrichten vom Vorstand",
  },
  {
    id: "payment_reminders",
    label: "Beitrags-Erinnerungen",
    description: "Offene Zahlungen",
  },
] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["id"]

// Interface for notification preferences
export interface NotificationPreference {
  id: string
  profile_id: string
  category: NotificationCategory
  email_enabled: boolean
  push_enabled: boolean
}
