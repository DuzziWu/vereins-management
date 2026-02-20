// =============================================
// PROJ-26: Document Folder System Types
// =============================================

export interface Folder {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  path: string
  depth: number
  is_system_default: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[]
  document_count?: number
  has_children?: boolean
}

export interface FolderPermission {
  id: string
  folder_id: string
  role: "vorstand" | "trainer" | "mitglied" | null
  group_id: string | null
  profile_id: string | null
  is_inherited: boolean
  created_at: string
  // Joined data
  group?: {
    id: string
    name: string
  } | null
  profile?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export interface FolderWithPermissions extends Folder {
  permissions: FolderPermission[]
}

export interface FolderTreeNode {
  folder: Folder
  children: FolderTreeNode[]
  isExpanded: boolean
  isSelected: boolean
  isLoading: boolean
}

export interface BreadcrumbItem {
  id: string | null
  name: string
  path: string
}

// API Response types
export interface FoldersResponse {
  folders: Folder[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FolderResponse {
  folder: FolderWithPermissions
  children: Folder[]
  breadcrumb: BreadcrumbItem[]
}

// =============================================
// PROJ-28: Document Upload & Versioning Types
// =============================================

// Supported file types
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
] as const

export type AllowedDocumentType = typeof ALLOWED_DOCUMENT_TYPES[number]

// File type categories for UI display
export type DocumentCategory = "pdf" | "word" | "excel" | "powerpoint" | "image" | "archive" | "other"

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024 // 25 MB

// Document entity
export interface Document {
  id: string
  folder_id: string
  name: string
  description: string | null
  current_version_id: string | null
  requires_confirmation: boolean
  original_filename: string
  mime_type: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined data
  creator?: {
    id: string
    first_name: string
    last_name: string
  } | null
  current_version?: DocumentVersion | null
}

// Document with version and confirmation info
export interface DocumentWithDetails extends Document {
  current_version: DocumentVersion | null
  versions?: DocumentVersion[]
  confirmation_count?: number
  total_confirmations_needed?: number
  user_has_confirmed?: boolean
}

// Document version entity
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  storage_path: string
  file_size: number
  change_note: string | null
  uploaded_by: string
  created_at: string
  // Joined data
  uploader?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

// Document confirmation entity
export interface DocumentConfirmation {
  id: string
  document_id: string
  profile_id: string
  version_id: string
  confirmed_at: string
  // Joined data
  profile?: {
    id: string
    first_name: string
    last_name: string
    user_id: string
  } | null
}

// Confirmation status for Vorstand view
export interface ConfirmationStatus {
  confirmed: Array<{
    profile_id: string
    first_name: string
    last_name: string
    confirmed_at: string
  }>
  pending: Array<{
    profile_id: string
    first_name: string
    last_name: string
  }>
  total: number
  confirmed_count: number
}

// API Response types for documents
export interface DocumentsResponse {
  documents: DocumentWithDetails[]
}

export interface DocumentResponse {
  document: DocumentWithDetails
  versions: DocumentVersion[]
  confirmations?: ConfirmationStatus
}

export interface DocumentUploadResponse {
  document: Document
  version: DocumentVersion
}

// Helper function to get document category from MIME type
export function getDocumentCategory(mimeType: string): DocumentCategory {
  if (mimeType === "application/pdf") return "pdf"
  if (mimeType.includes("word") || mimeType.includes("opendocument.text")) return "word"
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "excel"
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "powerpoint"
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "application/zip") return "archive"
  return "other"
}

// Helper function to get file extension from MIME type
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.oasis.opendocument.text": "odt",
    "application/vnd.oasis.opendocument.spreadsheet": "ods",
    "application/vnd.oasis.opendocument.presentation": "odp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/zip": "zip",
  }
  return mimeToExt[mimeType] || "file"
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
