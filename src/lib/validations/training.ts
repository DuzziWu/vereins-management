import { z } from "zod"

// === Types ===

export interface TrainingSession {
  id: string
  group_id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  description: string | null
  is_cancelled: boolean
  cancellation_reason: string | null
  series_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  group?: {
    id: string
    name: string
    training_location: string | null
  }
  rsvp_summary?: {
    confirmed: number
    declined: number
    pending: number
  }
  my_rsvp?: {
    rsvp_status: RsvpStatus
    rsvp_reason: string | null
  }
}

export interface TrainingSeries {
  id: string
  group_id: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

export type RsvpStatus = "confirmed" | "declined" | "pending"
export type ActualStatus = "present" | "absent" | "excused"

export interface AttendanceRecord {
  id: string
  training_session_id: string
  profile_id: string
  rsvp_status: RsvpStatus
  rsvp_reason: string | null
  rsvp_at: string | null
  actual_status: ActualStatus | null
  recorded_by: string | null
  recorded_at: string | null
  profile?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface AttendanceMatrixEntry {
  profile_id: string
  first_name: string
  last_name: string
  sessions: {
    session_id: string
    date: string
    actual_status: ActualStatus | null
    rsvp_reason: string | null
  }[]
  attendance_rate: number
}

// === German Weekday mapping ===

export const WEEKDAY_MAP: Record<string, number> = {
  Montag: 0,
  Dienstag: 1,
  Mittwoch: 2,
  Donnerstag: 3,
  Freitag: 4,
  Samstag: 5,
  Sonntag: 6,
}

export const WEEKDAY_NAMES = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
]

// === Validation Schemas ===

export const createSeriesSchema = z
  .object({
    group_id: z.string().uuid(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)").optional().or(z.literal("")),
    day_of_week: z.number().min(0).max(6),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültiges Zeitformat (HH:MM)"),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültiges Zeitformat (HH:MM)"),
    location: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "Endzeit muss nach der Startzeit liegen",
    path: ["end_time"],
  })

export type CreateSeriesFormData = z.infer<typeof createSeriesSchema>

export const deleteSeriesSchema = z.object({
  series_id: z.string().uuid("Ungültige Serien-ID"),
})

export type DeleteSeriesFormData = z.infer<typeof deleteSeriesSchema>

export const createSessionSchema = z
  .object({
    group_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)"),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültiges Zeitformat (HH:MM)"),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültiges Zeitformat (HH:MM)"),
    location: z.string().max(200).optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "Endzeit muss nach der Startzeit liegen",
    path: ["end_time"],
  })

export type CreateSessionFormData = z.infer<typeof createSessionSchema>

export const cancelSessionSchema = z.object({
  cancellation_reason: z
    .string()
    .min(3, "Bitte geben Sie einen Grund an (min. 3 Zeichen)")
    .max(500),
})

export type CancelSessionFormData = z.infer<typeof cancelSessionSchema>

export const rsvpSchema = z
  .object({
    rsvp_status: z.enum(["confirmed", "declined"]),
    rsvp_reason: z
      .string()
      .min(5, "Bitte geben Sie einen Grund an (min. 5 Zeichen)")
      .max(500)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.rsvp_status === "declined") {
        return data.rsvp_reason && data.rsvp_reason.length >= 5
      }
      return true
    },
    {
      message:
        "Bei Absage muss ein Grund angegeben werden (min. 5 Zeichen)",
      path: ["rsvp_reason"],
    }
  )

export type RsvpFormData = z.infer<typeof rsvpSchema>

export const recordAttendanceSchema = z.object({
  attendance: z.array(
    z.object({
      profile_id: z.string().uuid(),
      actual_status: z.enum(["present", "absent", "excused"]),
    })
  ),
})

export type RecordAttendanceFormData = z.infer<typeof recordAttendanceSchema>

export const correctAttendanceSchema = z.object({
  attendance: z.array(
    z.object({
      profile_id: z.string().uuid(),
      actual_status: z.enum(["present", "absent", "excused"]),
    })
  ),
})

export type CorrectAttendanceFormData = z.infer<typeof correctAttendanceSchema>
