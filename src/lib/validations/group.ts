import { z } from "zod"

// Training days (German weekdays)
export const TRAINING_DAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const

// Base object schema (used for form type and zodResolver in react-hook-form)
export const groupBaseSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z.string().optional().or(z.literal("")),
  training_day: z.string().optional().or(z.literal("")),
  training_start_time: z.string().optional().or(z.literal("")),
  training_end_time: z.string().optional().or(z.literal("")),
  training_location: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
  max_members: z
    .number()
    .int("Muss eine ganze Zahl sein")
    .positive("Muss eine positive Zahl sein")
    .nullable()
    .optional(),
  chat_enabled: z.boolean(),
  trainer_id: z.string().min(1, "Bitte einen Trainer auswählen"),
  co_trainer_ids: z.array(z.string()).optional(),
  member_ids: z.array(z.string()).optional(),
})

// Full schema with refinement for time validation
export const groupSchema = groupBaseSchema.refine(
  (data) => {
    if (data.training_start_time && data.training_end_time) {
      return data.training_end_time > data.training_start_time
    }
    return true
  },
  {
    message: "Endzeit muss nach der Startzeit liegen",
    path: ["training_end_time"],
  }
)

// Type derived from the base object (not the refined version) to avoid issues with react-hook-form
export type GroupFormData = z.infer<typeof groupBaseSchema>

// SEC-5: PATCH validation schema - all fields optional for partial updates
export const groupPatchSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .optional(),
  description: z.string().max(2000, "Maximal 2000 Zeichen").nullable().optional(),
  training_day: z.enum(["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag", ""])
    .nullable()
    .optional(),
  training_start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Ungültiges Zeitformat (HH:MM)")
    .nullable()
    .optional(),
  training_end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Ungültiges Zeitformat (HH:MM)")
    .nullable()
    .optional(),
  training_location: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .nullable()
    .optional(),
  max_members: z
    .number()
    .int("Muss eine ganze Zahl sein")
    .positive("Muss eine positive Zahl sein")
    .nullable()
    .optional(),
  trainer_id: z.string().uuid("Ungültige Trainer-ID").nullable().optional(),
  is_active: z.boolean().optional(),
  co_trainer_ids: z.array(z.string().uuid("Ungültige Co-Trainer-ID")).optional(),
  member_ids: z.array(z.string().uuid("Ungültige Mitglieder-ID")).optional(),
}).strict()

export type GroupPatchData = z.infer<typeof groupPatchSchema>
