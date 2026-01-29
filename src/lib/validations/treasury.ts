import { z } from "zod"

// Transaction type
export type TransactionType = "income" | "expense"

// Schema für neue Buchung
export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    error: "Typ muss 'income' oder 'expense' sein",
  }),
  amount: z
    .number({ error: "Betrag erforderlich" })
    .positive("Betrag muss positiv sein")
    .max(999999.99, "Betrag zu hoch (max. 999.999,99 \u20AC)"),
  transaction_date: z.string().refine((date) => {
    const parsed = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return parsed <= today
  }, "Datum kann nicht in der Zukunft liegen"),
  description: z
    .string({ error: "Beschreibung erforderlich" })
    .min(3, "Beschreibung zu kurz (min. 3 Zeichen)")
    .max(500, "Beschreibung zu lang (max. 500 Zeichen)"),
  category_id: z.string().uuid("Ung\u00FCltige Kategorie-ID"),
  receipt_reference: z
    .string()
    .max(200, "Beleg-Referenz zu lang (max. 200 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  note: z
    .string()
    .max(1000, "Notiz zu lang (max. 1000 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type CreateTransactionData = z.infer<typeof createTransactionSchema>

// Schema f\u00FCr Buchung bearbeiten
export const updateTransactionSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  amount: z
    .number()
    .positive("Betrag muss positiv sein")
    .max(999999.99, "Betrag zu hoch (max. 999.999,99 \u20AC)")
    .optional(),
  transaction_date: z
    .string()
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return parsed <= today
    }, "Datum kann nicht in der Zukunft liegen")
    .optional(),
  description: z
    .string()
    .min(3, "Beschreibung zu kurz (min. 3 Zeichen)")
    .max(500, "Beschreibung zu lang (max. 500 Zeichen)")
    .optional(),
  category_id: z.string().uuid("Ung\u00FCltige Kategorie-ID").optional(),
  receipt_reference: z
    .string()
    .max(200, "Beleg-Referenz zu lang (max. 200 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  note: z
    .string()
    .max(1000, "Notiz zu lang (max. 1000 Zeichen)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>

// Schema f\u00FCr Soft-Delete
export const deleteTransactionSchema = z.object({
  deletion_reason: z
    .string({ error: "L\u00F6schgrund erforderlich" })
    .min(3, "L\u00F6schgrund zu kurz (min. 3 Zeichen)")
    .max(500, "L\u00F6schgrund zu lang (max. 500 Zeichen)"),
})

export type DeleteTransactionData = z.infer<typeof deleteTransactionSchema>

// Schema f\u00FCr Kategorie erstellen
export const createCategorySchema = z.object({
  name: z
    .string({ error: "Name erforderlich" })
    .min(2, "Name zu kurz (min. 2 Zeichen)")
    .max(50, "Name zu lang (max. 50 Zeichen)"),
  type: z.enum(["income", "expense"], {
    error: "Typ muss 'income' oder 'expense' sein",
  }),
  icon: z
    .string()
    .max(50, "Icon-Name zu lang")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ung\u00FCltiges Farbformat (z.B. #10B981)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type CreateCategoryData = z.infer<typeof createCategorySchema>

// Schema f\u00FCr Kategorie bearbeiten
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name zu kurz (min. 2 Zeichen)")
    .max(50, "Name zu lang (max. 50 Zeichen)")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon-Name zu lang")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ung\u00FCltiges Farbformat (z.B. #10B981)")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
})

export type UpdateCategoryData = z.infer<typeof updateCategorySchema>
