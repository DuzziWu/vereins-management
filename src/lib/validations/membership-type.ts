import { z } from "zod"

export const membershipTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(50, "Name darf maximal 50 Zeichen lang sein"),
  annual_fee: z
    .number()
    .min(0, "Betrag darf nicht negativ sein")
    .multipleOf(0.01, "Betrag muss auf 2 Dezimalstellen gerundet sein"),
  description: z.string().optional(),
})

export type MembershipTypeFormData = z.infer<typeof membershipTypeSchema>

// Helper für Währungsformatierung (deutsche Locale)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

// Helper für Input-Parsing (Komma zu Punkt konvertieren)
export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(",", ".")
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
}
