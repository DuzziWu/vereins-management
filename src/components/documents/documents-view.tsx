"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, SortAsc, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { FolderTree } from "./folder-tree"
import { FolderBreadcrumb } from "./folder-breadcrumb"
import { FolderForm } from "./folder-form"
import { FolderItem, FolderEmptyState } from "./folder-item"
import {
  useFolderNavigation,
  buildFolderTree,
} from "@/hooks/use-folder-navigation"
import type {
  Folder,
  FolderWithChildren,
  FolderPermission,
  BreadcrumbItem,
} from "./types"
import type { FolderCreateData } from "@/lib/validations/folders"

interface DocumentsViewProps {
  isVorstand: boolean
  basePath: string
}

export function DocumentsView({ isVorstand, basePath }: DocumentsViewProps) {
  // State
  const [folders, setFolders] = React.useState<Folder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"name" | "updated_at">("name")

  // Dialog states
  const [showFolderForm, setShowFolderForm] = React.useState(false)
  const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null)
  const [parentFolderForNew, setParentFolderForNew] = React.useState<Folder | null>(null)
  const [deletingFolderId, setDeletingFolderId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Navigation hook
  const {
    currentFolderId,
    expandedFolderIds,
    navigateToFolder,
    expandFolder,
    collapseFolder,
    expandToFolder,
    buildBreadcrumb,
    findFolderById,
    flattenFolders,
  } = useFolderNavigation({ basePath })

  // Build folder tree
  const folderTree = React.useMemo(() => buildFolderTree(folders), [folders])

  // Current folder data
  const currentFolder = React.useMemo(() => {
    if (!currentFolderId) return null
    return findFolderById(currentFolderId, folderTree)
  }, [currentFolderId, folderTree, findFolderById])

  // Breadcrumb items
  const breadcrumbItems = React.useMemo(() => {
    return buildBreadcrumb(currentFolderId, folderTree)
  }, [currentFolderId, folderTree, buildBreadcrumb])

  // Children of current folder
  const childFolders = React.useMemo(() => {
    if (!currentFolderId) {
      // Root level - show top-level folders
      return folderTree
    }
    return currentFolder?.children || []
  }, [currentFolderId, currentFolder, folderTree])

  // Filtered and sorted children
  const displayFolders = React.useMemo(() => {
    let result = [...childFolders]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "de")
      }
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    })

    return result
  }, [childFolders, searchQuery, sortBy])

  // Available parent folders for new folder form
  const availableParents = React.useMemo(() => {
    return flattenFolders(folderTree).filter((f) => f.depth < 5)
  }, [folderTree, flattenFolders])

  // Fetch folders
  const fetchFolders = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/folders")
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Ordner")
      }
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
      toast.error("Fehler beim Laden der Ordner")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // Expand path to current folder when it changes
  React.useEffect(() => {
    if (currentFolderId && folderTree.length > 0) {
      expandToFolder(currentFolderId, folderTree)
    }
  }, [currentFolderId, folderTree, expandToFolder])

  // Create folder
  const handleCreateFolder = async (data: FolderCreateData) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Erstellen des Ordners")
      }

      toast.success("Ordner erstellt")
      await fetchFolders()
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Erstellen"
      )
      throw error
    }
  }

  // Update folder
  const handleUpdateFolder = async (data: FolderCreateData) => {
    if (!editingFolder) return

    try {
      const response = await fetch(`/api/folders/${editingFolder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Aktualisieren")
      }

      toast.success("Ordner aktualisiert")
      await fetchFolders()
    } catch (error) {
      console.error("Error updating folder:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Aktualisieren"
      )
      throw error
    }
  }

  // Delete folder
  const handleDeleteFolder = async () => {
    if (!deletingFolderId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/folders/${deletingFolderId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Ordner gelöscht")
      setDeletingFolderId(null)

      // Navigate to parent if we deleted the current folder
      if (deletingFolderId === currentFolderId) {
        const folder = findFolderById(deletingFolderId, folderTree)
        navigateToFolder(folder?.parent_id || null)
      }

      await fetchFolders()
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Löschen"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Open new folder dialog
  const openNewFolderDialog = (parentId?: string) => {
    const parent = parentId ? findFolderById(parentId, folderTree) : currentFolder
    setParentFolderForNew(parent || null)
    setEditingFolder(null)
    setShowFolderForm(true)
  }

  // Open edit folder dialog
  const openEditFolderDialog = (folderId: string) => {
    const folder = findFolderById(folderId, folderTree)
    if (folder) {
      setEditingFolder(folder)
      setParentFolderForNew(null)
      setShowFolderForm(true)
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dokumente</h1>
        {isVorstand && (
          <Button onClick={() => openNewFolderDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Ordner
          </Button>
        )}
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-lg border">
        {/* Left Sidebar - Folder Tree */}
        <div className="hidden w-64 shrink-0 border-r md:block">
          <div className="p-3 border-b">
            <h2 className="font-semibold text-sm">Ordner</h2>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)]">
            <div className="p-2">
              <FolderTree
                folders={folderTree}
                selectedFolderId={currentFolderId}
                expandedFolderIds={expandedFolderIds}
                isVorstand={isVorstand}
                isLoading={isLoading}
                onFolderSelect={navigateToFolder}
                onFolderExpand={expandFolder}
                onFolderCollapse={collapseFolder}
                onFolderRename={openEditFolderDialog}
                onFolderDelete={setDeletingFolderId}
                onNewSubfolder={(parentId) => openNewFolderDialog(parentId)}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Right Content - Folder Contents */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between border-b p-3">
            <FolderBreadcrumb
              items={breadcrumbItems}
              onNavigate={navigateToFolder}
            />
          </div>

          {/* Folder Header */}
          {currentFolder && (
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">{currentFolder.name}</h2>
              {currentFolder.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentFolder.description}
                </p>
              )}
            </div>
          )}

          {/* Search and Sort */}
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ordner suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "name" | "updated_at")
              }
            >
              <SelectTrigger className="w-40">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="updated_at">Zuletzt geändert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Folder Contents */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : displayFolders.length === 0 ? (
                <FolderEmptyState
                  isVorstand={isVorstand}
                  onCreateFolder={() => openNewFolderDialog()}
                />
              ) : (
                <div className="space-y-2">
                  {displayFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      isVorstand={isVorstand}
                      onOpen={navigateToFolder}
                      onRename={openEditFolderDialog}
                      onDelete={setDeletingFolderId}
                      hasChildren={folder.children && folder.children.length > 0}
                    />
                  ))}
                </div>
              )}

              {/* Document list placeholder - PROJ-27 */}
              {!isLoading && currentFolderId && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Dokumente
                  </h3>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Dokument-Upload wird in einem zukünftigen Update verfügbar
                    sein.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Folder Form Dialog */}
      <FolderForm
        open={showFolderForm}
        onOpenChange={setShowFolderForm}
        folder={editingFolder}
        parentFolder={parentFolderForNew}
        availableParents={availableParents}
        onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingFolderId}
        onOpenChange={(open) => !open && setDeletingFolderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ordner löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Ordner löschen möchten? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
