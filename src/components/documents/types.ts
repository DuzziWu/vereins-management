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
