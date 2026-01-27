import { z } from "zod"

// Zahlungsart Optionen
export const PAYMENT_METHODS = [
  { value: "cash", label: "Bar" },
  { value: "transfer", label: "Überweisung" },
  { value: "other", label: "Sonstiges" },
] as const

export type PaymentMethod = "cash" | "transfer" | "other"

// Schema für neue Zahlung
export const createPaymentSchema = z.object({
  fee_id: z.string().uuid("Ungültige Beitrags-ID"),
  amount: z
    .number({ error: "Betrag erforderlich" })
    .positive("Betrag muss positiv sein")
    .max(100000, "Betrag zu hoch (max. 100.000 €)"),
  payment_date: z.string().refine((date) => {
    const parsed = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return parsed <= today
  }, "Datum kann nicht in der Zukunft liegen"),
  payment_method: z.enum(["cash", "transfer", "other"], {
    error: "Ungültige Zahlungsart",
  }),
  note: z
    .string()
    .max(500, "Notiz zu lang (max. 500 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type CreatePaymentData = z.infer<typeof createPaymentSchema>

// Schema für Zahlung bearbeiten (nur Notiz und Zahlungsart änderbar)
export const updatePaymentSchema = z.object({
  payment_method: z.enum(["cash", "transfer", "other"]).optional(),
  note: z
    .string()
    .max(500, "Notiz zu lang (max. 500 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type UpdatePaymentData = z.infer<typeof updatePaymentSchema>

// Schema für Stornierung
export const cancelPaymentSchema = z.object({
  cancellation_reason: z
    .string({ error: "Storno-Grund erforderlich" })
    .min(3, "Storno-Grund zu kurz (min. 3 Zeichen)")
    .max(500, "Storno-Grund zu lang (max. 500 Zeichen)"),
})

export type CancelPaymentData = z.infer<typeof cancelPaymentSchema>

// Zahlungsstatus basierend auf amount_paid vs amount_due
export type PaymentStatus = "open" | "partial" | "paid" | "overpaid"

export function getPaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= 0) return "open"
  if (amountPaid < amountDue) return "partial"
  if (amountPaid === amountDue) return "paid"
  return "overpaid"
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Offen", variant: "destructive" },
  partial: { label: "Teilweise", variant: "secondary" },
  paid: { label: "Bezahlt", variant: "default" },
  overpaid: { label: "Überzahlt", variant: "outline" },
}

// Labels für Zahlungsarten
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Bar",
  transfer: "Überweisung",
  other: "Sonstiges",
}
