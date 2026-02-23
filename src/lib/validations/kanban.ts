import { z } from "zod"

// =============================================
// PROJ-29: Kanban Board Validation Schemas
// =============================================

// Priority enum
export const kanbanPrioritySchema = z.enum(["low", "normal", "high", "urgent"])
export type KanbanPriority = z.infer<typeof kanbanPrioritySchema>

// Column color options (8 colors)
export const columnColors = [
  "#6B7280", // Gray (default)
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
] as const

// =============================================
// Kanban Column Schemas
// =============================================

export const kanbanColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(100, "Maximal 100 Zeichen"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Farbformat")
    .nullable()
    .optional(),
  sort_order: z.number().int().optional(),
})

export const kanbanColumnPatchSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(100, "Maximal 100 Zeichen")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Farbformat")
    .nullable()
    .optional(),
  sort_order: z.number().int().optional(),
}).strict()

export const kanbanColumnReorderSchema = z.object({
  column_ids: z.array(z.string().uuid("Ungültige Column-ID")),
})

export type KanbanColumnFormData = z.infer<typeof kanbanColumnSchema>
export type KanbanColumnPatchData = z.infer<typeof kanbanColumnPatchSchema>
export type KanbanColumnReorderData = z.infer<typeof kanbanColumnReorderSchema>

// =============================================
// Kanban Task Schemas
// =============================================

export const kanbanTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Maximal 200 Zeichen"),
  description: z
    .string()
    .max(2000, "Maximal 2000 Zeichen")
    .nullable()
    .optional(),
  priority: kanbanPrioritySchema.default("normal"),
  deadline: z.string().datetime().nullable().optional(),
  column_id: z.string().uuid("Ungültige Column-ID"),
  sort_order: z.number().int().optional(),
  // Optional: Assignees and Labels for task creation
  assignee_ids: z.array(z.string().uuid("Ungültige Profil-ID")).optional(),
  label_ids: z.array(z.string().uuid("Ungültige Label-ID")).optional(),
})

export const kanbanTaskPatchSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Maximal 200 Zeichen")
    .optional(),
  description: z
    .string()
    .max(2000, "Maximal 2000 Zeichen")
    .nullable()
    .optional(),
  priority: kanbanPrioritySchema.optional(),
  deadline: z.string().datetime().nullable().optional(),
  column_id: z.string().uuid("Ungültige Column-ID").optional(),
  sort_order: z.number().int().optional(),
}).strict()

export const kanbanTaskMoveSchema = z.object({
  column_id: z.string().uuid("Ungültige Column-ID"),
  sort_order: z.number().int(),
})

export const kanbanTaskReorderSchema = z.object({
  task_ids: z.array(z.string().uuid("Ungültige Task-ID")),
})

export type KanbanTaskFormData = z.infer<typeof kanbanTaskSchema>
export type KanbanTaskPatchData = z.infer<typeof kanbanTaskPatchSchema>
export type KanbanTaskMoveData = z.infer<typeof kanbanTaskMoveSchema>
export type KanbanTaskReorderData = z.infer<typeof kanbanTaskReorderSchema>

// =============================================
// Task Assignee Schemas
// =============================================

export const kanbanTaskAssigneesSchema = z.object({
  profile_ids: z.array(z.string().uuid("Ungültige Profil-ID")),
})

export type KanbanTaskAssigneesData = z.infer<typeof kanbanTaskAssigneesSchema>

// =============================================
// Kanban Label Schemas
// =============================================

export const kanbanLabelSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Maximal 50 Zeichen"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Farbformat"),
})

export const kanbanLabelPatchSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Maximal 50 Zeichen")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Farbformat")
    .optional(),
}).strict()

export const kanbanTaskLabelsSchema = z.object({
  label_ids: z.array(z.string().uuid("Ungültige Label-ID")),
})

export type KanbanLabelFormData = z.infer<typeof kanbanLabelSchema>
export type KanbanLabelPatchData = z.infer<typeof kanbanLabelPatchSchema>
export type KanbanTaskLabelsData = z.infer<typeof kanbanTaskLabelsSchema>

// =============================================
// Checklist Item Schemas
// =============================================

export const kanbanChecklistItemSchema = z.object({
  text: z
    .string()
    .min(1, "Text ist erforderlich")
    .max(500, "Maximal 500 Zeichen"),
  sort_order: z.number().int().optional(),
})

export const kanbanChecklistItemPatchSchema = z.object({
  text: z
    .string()
    .min(1, "Text ist erforderlich")
    .max(500, "Maximal 500 Zeichen")
    .optional(),
  is_completed: z.boolean().optional(),
  sort_order: z.number().int().optional(),
}).strict()

export const kanbanChecklistReorderSchema = z.object({
  item_ids: z.array(z.string().uuid("Ungültige Item-ID")),
})

export type KanbanChecklistItemFormData = z.infer<typeof kanbanChecklistItemSchema>
export type KanbanChecklistItemPatchData = z.infer<typeof kanbanChecklistItemPatchSchema>
export type KanbanChecklistReorderData = z.infer<typeof kanbanChecklistReorderSchema>

// =============================================
// Attachment Schema (for validation, upload handled separately)
// =============================================

export const kanbanAttachmentValidation = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxFilesPerTask: 5,
  allowedMimeTypes: [
    // PDF
    "application/pdf",
    // Office
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Archive
    "application/zip",
    "application/x-zip-compressed",
  ],
}

// =============================================
// Filter Schema (for URL query params)
// =============================================

export const kanbanFilterSchema = z.object({
  search: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  label_id: z.string().uuid().optional(),
  priority: kanbanPrioritySchema.optional(),
  only_mine: z.boolean().optional(),
  overdue: z.boolean().optional(),
})

export type KanbanFilterData = z.infer<typeof kanbanFilterSchema>

// =============================================
// TypeScript Types for API Responses
// =============================================

export interface KanbanColumn {
  id: string
  workgroup_id: string
  name: string
  color: string | null
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface KanbanTaskAssignee {
  profile_id: string
  first_name: string
  last_name: string
  assigned_at: string | null
}

export interface KanbanLabel {
  id: string
  workgroup_id: string
  name: string
  color: string
  created_at: string | null
}

// Simplified label for task display (without workgroup_id and created_at)
export interface KanbanTaskLabel {
  id: string
  name: string
  color: string
}

export interface KanbanChecklistItem {
  id: string
  task_id: string
  text: string
  is_completed: boolean
  sort_order: number
  completed_by: string | null
  completed_at: string | null
  created_at: string
}

export interface KanbanTaskAttachment {
  id: string
  task_id: string
  filename: string
  storage_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploader_name?: string
  created_at: string
}

export interface KanbanTask {
  id: string
  column_id: string
  title: string
  description: string | null
  priority: string
  deadline: string | null
  sort_order: number
  created_by: string
  creator_name?: string
  created_at: string | null
  updated_at: string | null
  // Relationships
  assignees?: KanbanTaskAssignee[]
  labels?: KanbanTaskLabel[]
  checklist_items?: KanbanChecklistItem[]
  attachments?: KanbanTaskAttachment[]
  // Computed
  checklist_total?: number
  checklist_completed?: number
  attachment_count?: number
}

export interface KanbanColumnWithTasks extends KanbanColumn {
  tasks: KanbanTask[]
}

export interface KanbanBoardData {
  workgroup_id: string
  workgroup_name: string
  columns: KanbanColumnWithTasks[]
  labels: KanbanLabel[]
  members: {
    profile_id: string
    first_name: string
    last_name: string
  }[]
}

// Helper for priority display
export const priorityConfig: Record<KanbanPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Niedrig", color: "text-gray-600", bgColor: "bg-gray-200" },
  normal: { label: "Normal", color: "text-blue-600", bgColor: "bg-blue-200" },
  high: { label: "Hoch", color: "text-orange-600", bgColor: "bg-orange-200" },
  urgent: { label: "Dringend", color: "text-red-600", bgColor: "bg-red-200" },
}
