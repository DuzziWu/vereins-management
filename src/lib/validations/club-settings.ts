import { z } from "zod"

const PHONE_REGEX = /^[\d\s+\-()]+$/
const ZIP_REGEX = /^\d{5}$/
const URL_REGEX = /^https?:\/\/.+/

export const clubSettingsSchema = z.object({
  club_name: z
    .string()
    .min(2, "Vereinsname muss mindestens 2 Zeichen lang sein")
    .max(200, "Vereinsname darf maximal 200 Zeichen lang sein"),
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || PHONE_REGEX.test(val),
      "Nur Zahlen, Leerzeichen, +, -, () erlaubt"
    ),
  address_street: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
  address_zip: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || ZIP_REGEX.test(val),
      "PLZ muss 5 Ziffern haben"
    ),
  address_city: z
    .string()
    .max(100, "Maximal 100 Zeichen")
    .optional()
    .or(z.literal("")),
  website_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || URL_REGEX.test(val),
      "URL muss mit http:// oder https:// beginnen"
    ),
})

export type ClubSettingsFormData = z.infer<typeof clubSettingsSchema>

export const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png"]
export const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
export const MAX_LOGO_DIMENSION = 400 // 400x400px
