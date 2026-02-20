import { z } from "zod"
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from "@/components/documents/types"

// =============================================
// PROJ-28: Document Upload & Versioning Validation Schemas
// =============================================

// Document Upload Schema (for frontend forms)
export const documentUploadSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(255, "Maximal 255 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional(),
  folder_id: z.string().uuid("Ungültige Ordner-ID"),
  requires_confirmation: z.boolean(),
  access_all_groups: z.boolean().optional(),
})

export type DocumentUploadData = z.infer<typeof documentUploadSchema>

// Document Update Schema
export const documentUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(255, "Maximal 255 Zeichen")
    .optional(),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .nullable()
    .optional(),
  requires_confirmation: z.boolean().optional(),
})

export type DocumentUpdateData = z.infer<typeof documentUpdateSchema>

// New Version Upload Schema
export const newVersionSchema = z.object({
  change_note: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
})

export type NewVersionData = z.infer<typeof newVersionSchema>

// Document Move Schema
export const documentMoveSchema = z.object({
  folder_id: z.string().uuid("Ungültige Ordner-ID"),
})

export type DocumentMoveData = z.infer<typeof documentMoveSchema>

// File validation helper
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    return {
      valid: false,
      error: "Dieser Dateityp wird nicht unterstützt. Erlaubte Formate: PDF, Word, Excel, PowerPoint, Bilder, ZIP.",
    }
  }

  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    const maxSizeMB = MAX_DOCUMENT_SIZE / 1024 / 1024
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `Diese Datei ist zu groß (${fileSizeMB} MB). Maximale Größe: ${maxSizeMB} MB.`,
    }
  }

  return { valid: true }
}

// UUID validation helper
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

// File type human-readable names
export const FILE_TYPE_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
  "application/vnd.oasis.opendocument.text": "OpenDocument Text",
  "application/vnd.oasis.opendocument.spreadsheet": "OpenDocument Tabelle",
  "application/vnd.oasis.opendocument.presentation": "OpenDocument Präsentation",
  "image/jpeg": "Bild (JPG)",
  "image/png": "Bild (PNG)",
  "image/webp": "Bild (WebP)",
  "application/zip": "ZIP-Archiv",
}

export function getFileTypeName(mimeType: string): string {
  return FILE_TYPE_NAMES[mimeType] || "Datei"
}

// =============================================
// Server-Side Schemas for API Routes
// =============================================

// Document Create Schema (for API)
export const documentCreateSchema = z.object({
  folder_id: z.string().uuid("Ungültige Ordner-ID"),
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(255, "Maximal 255 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  requires_confirmation: z.boolean().default(false),
  access_all_groups: z.boolean().default(false),
  original_filename: z
    .string()
    .min(1, "Dateiname ist erforderlich")
    .max(255, "Maximal 255 Zeichen"),
  mime_type: z.string().min(1, "MIME-Typ ist erforderlich"),
  file_size: z
    .number()
    .positive("Dateigröße muss positiv sein")
    .max(MAX_DOCUMENT_SIZE, `Maximale Dateigröße: ${MAX_DOCUMENT_SIZE / 1024 / 1024} MB`),
})

export type DocumentCreateData = z.infer<typeof documentCreateSchema>

// Document Version Create Schema (for uploading new version via API)
export const documentVersionCreateSchema = z.object({
  change_note: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
  original_filename: z
    .string()
    .min(1, "Dateiname ist erforderlich")
    .max(255, "Maximal 255 Zeichen"),
  mime_type: z.string().min(1, "MIME-Typ ist erforderlich"),
  file_size: z
    .number()
    .positive("Dateigröße muss positiv sein")
    .max(MAX_DOCUMENT_SIZE, `Maximale Dateigröße: ${MAX_DOCUMENT_SIZE / 1024 / 1024} MB`),
})

export type DocumentVersionCreateData = z.infer<typeof documentVersionCreateSchema>

// Query Parameters Schema
export const documentsQuerySchema = z.object({
  folder_id: z.string().uuid("Ungültige Ordner-ID").optional(),
  search: z.string().max(100).optional(),
  mime_type: z.string().optional(),
  requires_confirmation: z.enum(["true", "false"]).optional(),
  pending_confirmation: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export type DocumentsQueryData = z.infer<typeof documentsQuerySchema>
