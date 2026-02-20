import { z } from "zod"

// =============================================
// PROJ-26: Document Folder System Validation Schemas
// =============================================

// Role types for folder permissions
export const FOLDER_ROLES = ["vorstand", "trainer", "mitglied"] as const
export type FolderRole = typeof FOLDER_ROLES[number]

export const FOLDER_ROLE_LABELS: Record<FolderRole, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Alle Mitglieder",
}

// Folder Create Schema
export const folderCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  parent_id: z.string().uuid("Ungültige Ordner-ID").nullable().optional(),
  // Permissions - which roles can access this folder
  roles: z.array(z.enum(FOLDER_ROLES)).min(1, "Mindestens eine Berechtigung erforderlich"),
})

export type FolderCreateData = z.infer<typeof folderCreateSchema>

// Folder Update Schema
export const folderUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .optional(),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .nullable()
    .optional(),
  parent_id: z.string().uuid("Ungültige Ordner-ID").nullable().optional(),
  // Permissions - which roles can access this folder
  roles: z.array(z.enum(FOLDER_ROLES)).min(1, "Mindestens eine Berechtigung erforderlich").optional(),
})

export type FolderUpdateData = z.infer<typeof folderUpdateSchema>

// Folder Permission Schema
export const folderPermissionSchema = z.object({
  folder_id: z.string().uuid("Ungültige Ordner-ID"),
  // Exactly one of these must be provided
  role: z.enum(["vorstand", "trainer", "mitglied"]).optional(),
  group_id: z.string().uuid("Ungültige Gruppen-ID").optional(),
  profile_id: z.string().uuid("Ungültige Profil-ID").optional(),
}).refine(
  (data) => {
    const count = [data.role, data.group_id, data.profile_id].filter(Boolean).length
    return count === 1
  },
  {
    message: "Genau eine Berechtigung (Rolle, Gruppe oder Profil) muss angegeben werden",
  }
)

export type FolderPermissionData = z.infer<typeof folderPermissionSchema>

// Bulk Permission Update Schema (for adding multiple permissions at once)
export const folderPermissionsUpdateSchema = z.object({
  folder_id: z.string().uuid("Ungültige Ordner-ID"),
  permissions: z.array(z.object({
    role: z.enum(["vorstand", "trainer", "mitglied"]).optional(),
    group_id: z.string().uuid("Ungültige Gruppen-ID").optional(),
    profile_id: z.string().uuid("Ungültige Profil-ID").optional(),
  }).refine(
    (data) => {
      const count = [data.role, data.group_id, data.profile_id].filter(Boolean).length
      return count === 1
    },
    {
      message: "Genau eine Berechtigung (Rolle, Gruppe oder Profil) muss angegeben werden",
    }
  )),
})

export type FolderPermissionsUpdateData = z.infer<typeof folderPermissionsUpdateSchema>

// Move Folder Schema
export const folderMoveSchema = z.object({
  new_parent_id: z.string().uuid("Ungültige Ordner-ID").nullable(),
})

export type FolderMoveData = z.infer<typeof folderMoveSchema>
