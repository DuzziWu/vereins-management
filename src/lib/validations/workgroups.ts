import { z } from "zod"

// =============================================
// PROJ-25: Workgroup Validation Schemas
// =============================================

// Workgroup Category Schemas
export const workgroupCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(50, "Maximal 50 Zeichen"),
  sort_order: z.number().int().optional(),
})

export const workgroupCategoryPatchSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(50, "Maximal 50 Zeichen")
    .optional(),
  sort_order: z.number().int().optional(),
}).strict()

export type WorkgroupCategoryFormData = z.infer<typeof workgroupCategorySchema>
export type WorkgroupCategoryPatchData = z.infer<typeof workgroupCategoryPatchSchema>

// Workgroup Schemas
export const workgroupSchema = z.object({
  name: z
    .string()
    .min(3, "Mindestens 3 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  category_id: z.string().uuid("Ungültige Kategorie-ID").nullable().optional(),
  member_ids: z
    .array(z.string().uuid("Ungültige Mitglieder-ID"))
    .min(1, "Mindestens ein Mitglied erforderlich"),
})

export const workgroupPatchSchema = z.object({
  name: z
    .string()
    .min(3, "Mindestens 3 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .optional(),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .nullable()
    .optional(),
  category_id: z.string().uuid("Ungültige Kategorie-ID").nullable().optional(),
  status: z.enum(["active", "archived"]).optional(),
}).strict()

export type WorkgroupFormData = z.infer<typeof workgroupSchema>
export type WorkgroupPatchData = z.infer<typeof workgroupPatchSchema>

// Workgroup Members Schema
export const workgroupMembersSchema = z.object({
  profile_ids: z
    .array(z.string().uuid("Ungültige Mitglieder-ID"))
    .min(1, "Mindestens ein Mitglied erforderlich"),
})

export type WorkgroupMembersFormData = z.infer<typeof workgroupMembersSchema>
