import { z } from "zod"

// Item Status
export const ITEM_STATUS = ["available", "loaned", "defective", "in_cleaning", "reserved"] as const
export type ItemStatus = typeof ITEM_STATUS[number]

// Item Condition
export const ITEM_CONDITION = ["new", "good", "used", "needs_repair"] as const
export type ItemCondition = typeof ITEM_CONDITION[number]

// Status configuration for UI
export const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Verfügbar", color: "bg-green-500", variant: "default" },
  loaned: { label: "Verliehen", color: "bg-orange-500", variant: "secondary" },
  defective: { label: "Defekt", color: "bg-red-500", variant: "destructive" },
  in_cleaning: { label: "In Reinigung", color: "bg-blue-500", variant: "outline" },
  reserved: { label: "Reserviert", color: "bg-yellow-500", variant: "outline" },
}

// Condition configuration for UI
export const CONDITION_CONFIG: Record<ItemCondition, { label: string }> = {
  new: { label: "Neu" },
  good: { label: "Gut" },
  used: { label: "Gebraucht" },
  needs_repair: { label: "Reparaturbedürftig" },
}

// Category Schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(50, "Maximal 50 Zeichen"),
  description: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
  icon: z
    .string()
    .max(10, "Maximal 10 Zeichen (Emoji)")
    .optional()
    .or(z.literal("")),
  sort_order: z.number().int().optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// Category Patch Schema (for API updates)
export const categoryPatchSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(50, "Maximal 50 Zeichen")
    .optional(),
  description: z
    .string()
    .max(200, "Maximal 200 Zeichen")
    .nullable()
    .optional(),
  icon: z
    .string()
    .max(10, "Maximal 10 Zeichen (Emoji)")
    .nullable()
    .optional(),
  sort_order: z.number().int().optional(),
}).strict()

export type CategoryPatchData = z.infer<typeof categoryPatchSchema>

// Category Sort Order Schema
export const categorySortSchema = z.object({
  category_ids: z
    .array(z.string().uuid("Ungültige Kategorie-ID"))
    .min(1, "Mindestens eine Kategorie erforderlich"),
})

export type CategorySortData = z.infer<typeof categorySortSchema>

// Item Schema
export const itemSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(1000, "Maximal 1000 Zeichen")
    .optional()
    .or(z.literal("")),
  category_id: z
    .string()
    .uuid("Kategorie auswählen"),
  inventory_number: z
    .string()
    .max(50, "Maximal 50 Zeichen")
    .optional()
    .or(z.literal("")),
  status: z.enum(ITEM_STATUS).optional(),
  condition: z.enum(ITEM_CONDITION).optional(),
  size_info: z
    .string()
    .max(100, "Maximal 100 Zeichen")
    .optional()
    .or(z.literal("")),
  purchase_date: z
    .string()
    .optional()
    .or(z.literal("")),
  purchase_price: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Preis muss positiv sein"),
  notes: z
    .string()
    .optional()
    .or(z.literal("")),
  location_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional(),
})

export type ItemFormData = z.infer<typeof itemSchema>

// Item Patch Schema (for API updates)
export const itemPatchSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen")
    .optional(),
  description: z
    .string()
    .max(1000, "Maximal 1000 Zeichen")
    .nullable()
    .optional(),
  category_id: z.string().uuid("Ungültige Kategorie-ID").optional(),
  inventory_number: z
    .string()
    .max(50, "Maximal 50 Zeichen")
    .nullable()
    .optional(),
  status: z.enum(ITEM_STATUS).optional(),
  condition: z.enum(ITEM_CONDITION).optional(),
  size_info: z
    .string()
    .max(100, "Maximal 100 Zeichen")
    .nullable()
    .optional(),
  purchase_date: z.string().nullable().optional(),
  purchase_price: z.number().min(0, "Preis muss positiv sein").nullable().optional(),
  notes: z.string().nullable().optional(),
  is_archived: z.boolean().optional(),
  location_id: z.string().uuid().nullable().optional(),
}).strict()

export type ItemPatchData = z.infer<typeof itemPatchSchema>

// Set Schema
export const setSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  item_ids: z
    .array(z.string().uuid())
    .min(1, "Mindestens 1 Item auswählen"),
})

export type SetFormData = z.infer<typeof setSchema>

// Set Patch Schema (for API updates)
export const setPatchSchema = z.object({
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
}).strict()

export type SetPatchData = z.infer<typeof setPatchSchema>

// Set Items Schema (for updating set items)
export const setItemsSchema = z.object({
  item_ids: z
    .array(z.string().uuid("Ungültige Item-ID"))
    .min(1, "Mindestens 1 Item erforderlich"),
})

export type SetItemsData = z.infer<typeof setItemsSchema>

// Status Change Schema
export const statusChangeSchema = z.object({
  status: z.enum(ITEM_STATUS),
  holder_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  note: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  // If status is "loaned", holder_id is required
  if (data.status === "loaned" && !data.holder_id) {
    return false
  }
  return true
}, {
  message: "Bitte wählen Sie ein Mitglied aus, an das verliehen wird",
  path: ["holder_id"],
})

export type StatusChangeFormData = z.infer<typeof statusChangeSchema>

// Types for API responses
export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
  item_count?: number
}

export interface InventoryItem {
  id: string
  name: string
  description: string | null
  category_id: string
  inventory_number: string | null
  status: ItemStatus
  condition: ItemCondition
  size_info: string | null
  purchase_date: string | null
  purchase_price: number | null
  notes: string | null
  current_holder_id: string | null
  loaned_at: string | null
  location_id: string | null
  is_archived: boolean
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  category?: Category
  current_holder?: {
    id: string
    first_name: string
    last_name: string
  }
  images?: ItemImage[]
  location?: {
    id: string
    name: string
    path: string
  }
}

export interface ItemImage {
  id: string
  item_id: string
  storage_path: string
  sort_order: number
  created_at: string
  public_url?: string
}

export interface InventorySet {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Computed fields
  items?: InventoryItem[]
  item_count?: number
  computed_status?: ItemStatus
}

export interface StatusLogEntry {
  id: string
  item_id: string
  old_status: ItemStatus | null
  new_status: ItemStatus
  changed_by: string
  holder_id: string | null
  note: string | null
  created_at: string
  // Relations
  changed_by_profile?: {
    first_name: string
    last_name: string
  }
  holder?: {
    first_name: string
    last_name: string
  }
}

// Filter types
export interface InventoryFilters {
  search: string
  category_id: string | null
  status: ItemStatus | null
  condition: ItemCondition | null
  location_id: string | null
}

export const defaultFilters: InventoryFilters = {
  search: "",
  category_id: null,
  status: null,
  condition: null,
  location_id: null,
}

// ===========================================
// PROJ-30: Location & Loan Schemas
// ===========================================

// Return Condition
export const RETURN_CONDITION = ["good", "damaged", "lost"] as const
export type ReturnCondition = typeof RETURN_CONDITION[number]

export const RETURN_CONDITION_CONFIG: Record<ReturnCondition, { label: string }> = {
  good: { label: "Gut" },
  damaged: { label: "Beschädigt" },
  lost: { label: "Verloren" },
}

// Location Schema
export const locationSchema = z.object({
  name: z
    .string()
    .min(2, "Mindestens 2 Zeichen")
    .max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .optional()
    .or(z.literal("")),
  parent_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
})

export type LocationFormData = z.infer<typeof locationSchema>

// Location Patch Schema
export const locationPatchSchema = z.object({
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
  notes: z
    .string()
    .nullable()
    .optional(),
  parent_id: z
    .string()
    .uuid()
    .nullable()
    .optional(),
}).strict()

export type LocationPatchData = z.infer<typeof locationPatchSchema>

// Loan Schema (creating a new loan)
export const loanSchema = z.object({
  item_id: z
    .string()
    .uuid("Ungültige Item-ID"),
  borrower_id: z
    .string()
    .uuid("Bitte ein Mitglied auswählen"),
  expected_return_date: z
    .string()
    .optional()
    .or(z.literal("")),
  loan_note: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
})

export type LoanFormData = z.infer<typeof loanSchema>

// Return Schema (recording a return)
export const returnSchema = z.object({
  return_location_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  return_note: z
    .string()
    .max(500, "Maximal 500 Zeichen")
    .optional()
    .or(z.literal("")),
  return_condition: z
    .enum(RETURN_CONDITION)
    .optional(),
})

export type ReturnFormData = z.infer<typeof returnSchema>

// Location Type
export interface InventoryLocation {
  id: string
  name: string
  description: string | null
  notes: string | null
  parent_id: string | null
  path: string
  depth: number
  qr_code_data: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Computed
  item_count?: number
  children?: InventoryLocation[]
  parent?: InventoryLocation
}

// Loan Type
export interface InventoryLoan {
  id: string
  item_id: string
  borrower_id: string
  loaned_by: string
  loaned_at: string
  expected_return_date: string | null
  returned_at: string | null
  returned_by: string | null
  return_location_id: string | null
  loan_note: string | null
  return_note: string | null
  return_condition: ReturnCondition | null
  created_at: string
  // Relations
  item?: InventoryItem
  borrower?: {
    id: string
    first_name: string
    last_name: string
  }
  loaned_by_profile?: {
    id: string
    first_name: string
    last_name: string
  }
  returned_by_profile?: {
    id: string
    first_name: string
    last_name: string
  }
  return_location?: InventoryLocation
}
