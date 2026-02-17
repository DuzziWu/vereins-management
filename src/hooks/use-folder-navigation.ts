"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type {
  Folder,
  FolderWithChildren,
  BreadcrumbItem,
} from "@/components/documents/types"

interface UseFolderNavigationOptions {
  basePath: string
  initialFolderId?: string | null
}

interface UseFolderNavigationReturn {
  // Current state
  currentFolderId: string | null
  expandedFolderIds: Set<string>
  breadcrumb: BreadcrumbItem[]

  // Navigation actions
  navigateToFolder: (folderId: string | null) => void
  expandFolder: (folderId: string) => void
  collapseFolder: (folderId: string) => void
  toggleFolder: (folderId: string) => void
  expandToFolder: (folderId: string, folders: FolderWithChildren[]) => void

  // Helpers
  buildBreadcrumb: (
    folderId: string | null,
    folders: FolderWithChildren[]
  ) => BreadcrumbItem[]
  findFolderById: (
    folderId: string,
    folders: FolderWithChildren[]
  ) => FolderWithChildren | null
  flattenFolders: (folders: FolderWithChildren[]) => Folder[]
}

export function useFolderNavigation({
  basePath,
  initialFolderId = null,
}: UseFolderNavigationOptions): UseFolderNavigationReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get folder ID from URL or use initial
  const currentFolderId = searchParams.get("folder") || initialFolderId

  // Track expanded folders
  const [expandedFolderIds, setExpandedFolderIds] = React.useState<Set<string>>(
    new Set()
  )

  // Track breadcrumb
  const [breadcrumb, setBreadcrumb] = React.useState<BreadcrumbItem[]>([])

  // Navigate to a folder
  const navigateToFolder = React.useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (folderId) {
        params.set("folder", folderId)
      } else {
        params.delete("folder")
      }
      router.push(`${basePath}?${params.toString()}`)
    },
    [router, basePath, searchParams]
  )

  // Expand a folder
  const expandFolder = React.useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => new Set([...prev, folderId]))
  }, [])

  // Collapse a folder
  const collapseFolder = React.useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      next.delete(folderId)
      return next
    })
  }, [])

  // Toggle folder expansion
  const toggleFolder = React.useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Find folder by ID in nested structure
  const findFolderById = React.useCallback(
    (
      folderId: string,
      folders: FolderWithChildren[]
    ): FolderWithChildren | null => {
      for (const folder of folders) {
        if (folder.id === folderId) {
          return folder
        }
        if (folder.children && folder.children.length > 0) {
          const found = findFolderById(folderId, folder.children)
          if (found) return found
        }
      }
      return null
    },
    []
  )

  // Build breadcrumb path from folder ID
  const buildBreadcrumb = React.useCallback(
    (
      folderId: string | null,
      folders: FolderWithChildren[]
    ): BreadcrumbItem[] => {
      if (!folderId) return []

      const items: BreadcrumbItem[] = []
      let current = findFolderById(folderId, folders)

      while (current) {
        items.unshift({
          id: current.id,
          name: current.name,
          path: current.path,
        })

        if (current.parent_id) {
          current = findFolderById(current.parent_id, folders)
        } else {
          current = null
        }
      }

      return items
    },
    [findFolderById]
  )

  // Expand all folders in the path to a specific folder
  const expandToFolder = React.useCallback(
    (folderId: string, folders: FolderWithChildren[]) => {
      const pathIds: string[] = []
      let current = findFolderById(folderId, folders)

      while (current && current.parent_id) {
        pathIds.push(current.parent_id)
        current = findFolderById(current.parent_id, folders)
      }

      if (pathIds.length > 0) {
        setExpandedFolderIds((prev) => new Set([...prev, ...pathIds]))
      }
    },
    [findFolderById]
  )

  // Flatten nested folder structure
  const flattenFolders = React.useCallback(
    (folders: FolderWithChildren[]): Folder[] => {
      const result: Folder[] = []

      function traverse(items: FolderWithChildren[]) {
        for (const folder of items) {
          const { children, ...folderData } = folder
          result.push(folderData)
          if (children && children.length > 0) {
            traverse(children)
          }
        }
      }

      traverse(folders)
      return result
    },
    []
  )

  return {
    currentFolderId,
    expandedFolderIds,
    breadcrumb,
    navigateToFolder,
    expandFolder,
    collapseFolder,
    toggleFolder,
    expandToFolder,
    buildBreadcrumb,
    findFolderById,
    flattenFolders,
  }
}

// Helper function to build folder tree from flat list
export function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>()
  const roots: FolderWithChildren[] = []

  // First pass: create all nodes
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] })
  }

  // Second pass: build tree structure
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children alphabetically
  function sortChildren(nodes: FolderWithChildren[]) {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "de"))
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children)
      }
    }
  }

  sortChildren(roots)
  return roots
}
