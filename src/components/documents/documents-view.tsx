"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, SortAsc, Loader2, Upload, FolderIcon, ChevronRight } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { FolderTree } from "./folder-tree"
import { FolderBreadcrumb } from "./folder-breadcrumb"
import { FolderForm } from "./folder-form"
import { FolderItem, FolderEmptyState } from "./folder-item"
import { DocumentList } from "./document-list"
import { DocumentUpload, NewVersionUpload } from "./document-upload"
import { DocumentPreview } from "./document-preview"
import { VersionHistory } from "./version-history"
import { ConfirmationStatusView } from "./confirmation-status"
import {
  useFolderNavigation,
  buildFolderTree,
} from "@/hooks/use-folder-navigation"
import type {
  Folder,
  FolderWithChildren,
  DocumentWithDetails,
  ConfirmationStatus,
} from "./types"
import type { FolderCreateData } from "@/lib/validations/folders"
import type { DocumentUploadData } from "@/lib/validations/documents"

interface DocumentsViewProps {
  isVorstand: boolean
  basePath: string
}

export function DocumentsView({ isVorstand, basePath }: DocumentsViewProps) {
  // Folder State
  const [folders, setFolders] = React.useState<Folder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"name" | "updated_at">("name")

  // Document State
  const [documents, setDocuments] = React.useState<DocumentWithDetails[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false)
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentWithDetails | null>(null)
  const [documentFileUrl, setDocumentFileUrl] = React.useState<string | null>(null)

  // Dialog states
  const [showFolderForm, setShowFolderForm] = React.useState(false)
  const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null)
  const [parentFolderForNew, setParentFolderForNew] = React.useState<Folder | null>(null)
  const [deletingFolderId, setDeletingFolderId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Document Dialog states
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [showNewVersionDialog, setShowNewVersionDialog] = React.useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = React.useState(false)
  const [showHistorySheet, setShowHistorySheet] = React.useState(false)
  const [showConfirmationsSheet, setShowConfirmationsSheet] = React.useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null)
  const [isDeletingDocument, setIsDeletingDocument] = React.useState(false)
  const [confirmationStatus, setConfirmationStatus] = React.useState<ConfirmationStatus | null>(null)
  const [isLoadingConfirmations, setIsLoadingConfirmations] = React.useState(false)
  const [versionsWithUrls, setVersionsWithUrls] = React.useState<Array<{ id: string; download_url: string | null }>>([])
  const [isLoadingVersions, setIsLoadingVersions] = React.useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const [movingDocumentId, setMovingDocumentId] = React.useState<string | null>(null)
  const [isMovingDocument, setIsMovingDocument] = React.useState(false)
  const [duplicateInfo, setDuplicateInfo] = React.useState<{
    existingDocumentId: string
    existingDocumentName: string
    file: File
    data: DocumentUploadData
  } | null>(null)

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
      return folderTree
    }
    return currentFolder?.children || []
  }, [currentFolderId, currentFolder, folderTree])

  // Filtered and sorted children
  const displayFolders = React.useMemo(() => {
    let result = [...childFolders]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query)
      )
    }

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

  // Fetch documents for current folder
  const fetchDocuments = React.useCallback(async (folderId: string | null) => {
    if (!folderId) {
      setDocuments([])
      return
    }

    try {
      setIsLoadingDocuments(true)
      const response = await fetch(`/api/documents?folder_id=${folderId}`)
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Dokumente")
      }
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast.error("Fehler beim Laden der Dokumente")
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // Fetch documents when folder changes
  React.useEffect(() => {
    fetchDocuments(currentFolderId)
  }, [currentFolderId, fetchDocuments])

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

  // ===== Document Handlers =====

  // Upload document
  const handleUploadDocument = async (data: DocumentUploadData, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("name", data.name)
    formData.append("description", data.description || "")
    formData.append("folder_id", data.folder_id)
    formData.append("requires_confirmation", String(data.requires_confirmation))
    formData.append("access_all_groups", String(data.access_all_groups || false))

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Handle duplicate name (409 Conflict)
      if (response.status === 409 && errorData.existing_document_id) {
        setShowUploadDialog(false)
        setDuplicateInfo({
          existingDocumentId: errorData.existing_document_id,
          existingDocumentName: errorData.existing_document_name,
          file,
          data,
        })
        return
      }

      throw new Error(errorData.error || "Fehler beim Hochladen")
    }

    await fetchDocuments(currentFolderId)
    setShowUploadDialog(false)
  }

  // Handle duplicate: upload as new version
  const handleDuplicateAsNewVersion = async () => {
    if (!duplicateInfo) return

    const formData = new FormData()
    formData.append("file", duplicateInfo.file)

    const response = await fetch(`/api/documents/${duplicateInfo.existingDocumentId}/versions`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Fehler beim Hochladen der Version")
    }

    toast.success("Datei als neue Version hochgeladen")
    await fetchDocuments(currentFolderId)
    setDuplicateInfo(null)
  }

  // Handle duplicate: rename and retry
  const handleDuplicateRename = () => {
    setDuplicateInfo(null)
    setShowUploadDialog(true)
    // The user will manually change the name in the upload dialog
  }

  // Upload new version
  const handleUploadNewVersion = async (file: File, changeNote?: string) => {
    if (!selectedDocument) return

    const formData = new FormData()
    formData.append("file", file)
    if (changeNote) {
      formData.append("change_note", changeNote)
    }

    const response = await fetch(`/api/documents/${selectedDocument.id}/versions`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Fehler beim Hochladen der Version")
    }

    await fetchDocuments(currentFolderId)
    setShowNewVersionDialog(false)
  }

  // Preview document
  const handlePreviewDocument = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    setSelectedDocument(doc)
    setShowPreviewDialog(true)
    setDocumentFileUrl(null)
    setIsLoadingPreview(true)

    // Fetch document details with download URL
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (response.ok) {
        const data = await response.json()
        setDocumentFileUrl(data.document.download_url)
        // Update selected document with full details
        setSelectedDocument(data.document)
      } else {
        const errorData = await response.json()
        console.error("Error fetching document:", errorData.error)
        toast.error("Fehler beim Laden des Dokuments")
      }
    } catch (error) {
      console.error("Error fetching document:", error)
      toast.error("Fehler beim Laden des Dokuments")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Download document
  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) throw new Error("Download fehlgeschlagen")

      const blob = await response.blob()
      const doc = documents.find((d) => d.id === documentId)
      const filename = doc?.original_filename || "document"

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Fehler beim Herunterladen")
    }
  }

  // View version history
  const handleViewHistory = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    setSelectedDocument(doc)
    setShowHistorySheet(true)
    setIsLoadingVersions(true)
    setVersionsWithUrls([])

    // Fetch versions with download URLs
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersionsWithUrls(data.versions || [])
        // Update selected document with versions that have URLs
        setSelectedDocument({
          ...doc,
          versions: data.versions || [],
        })
      }
    } catch (error) {
      console.error("Error fetching versions:", error)
      toast.error("Fehler beim Laden der Versionen")
    } finally {
      setIsLoadingVersions(false)
    }
  }

  // View confirmations (Vorstand only)
  const handleViewConfirmations = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    setSelectedDocument(doc)
    setShowConfirmationsSheet(true)
    setIsLoadingConfirmations(true)

    try {
      const response = await fetch(`/api/documents/${documentId}/confirmations`)
      if (response.ok) {
        const data = await response.json()
        setConfirmationStatus(data.status)
      }
    } catch (error) {
      console.error("Error fetching confirmations:", error)
      toast.error("Fehler beim Laden der Bestätigungen")
    } finally {
      setIsLoadingConfirmations(false)
    }
  }

  // Confirm document read
  const handleConfirmRead = async () => {
    if (!selectedDocument) return

    const response = await fetch(`/api/documents/${selectedDocument.id}/confirm`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error("Fehler beim Bestätigen")
    }

    toast.success("Lesebestätigung gespeichert")
    await fetchDocuments(currentFolderId)
    setShowPreviewDialog(false)
  }

  // Delete document
  const handleDeleteDocument = async () => {
    if (!deletingDocumentId) return

    setIsDeletingDocument(true)
    try {
      const response = await fetch(`/api/documents/${deletingDocumentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Löschen")
      }

      toast.success("Dokument gelöscht")
      setDeletingDocumentId(null)
      await fetchDocuments(currentFolderId)
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Löschen"
      )
    } finally {
      setIsDeletingDocument(false)
    }
  }

  // Restore version
  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedDocument) return

    const response = await fetch(
      `/api/documents/${selectedDocument.id}/versions/${versionId}/restore`,
      { method: "POST" }
    )

    if (!response.ok) {
      throw new Error("Fehler beim Wiederherstellen")
    }

    await fetchDocuments(currentFolderId)
  }

  // Send reminder
  const handleSendReminder = async (profileIds: string[]) => {
    if (!selectedDocument) return

    const response = await fetch(`/api/documents/${selectedDocument.id}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_ids: profileIds }),
    })

    if (!response.ok) {
      throw new Error("Fehler beim Senden der Erinnerung")
    }
  }

  // Move document to different folder
  const handleMoveDocument = async (targetFolderId: string) => {
    if (!movingDocumentId) return

    setIsMovingDocument(true)
    try {
      const response = await fetch(`/api/documents/${movingDocumentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: targetFolderId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fehler beim Verschieben")
      }

      toast.success("Dokument verschoben")
      setMovingDocumentId(null)
      await fetchDocuments(currentFolderId)
    } catch (error) {
      console.error("Move error:", error)
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Verschieben"
      )
    } finally {
      setIsMovingDocument(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dokumente</h1>
        {isVorstand && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openNewFolderDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Ordner
              </DropdownMenuItem>
              {currentFolderId && (
                <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Dokument hochladen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                placeholder="Suchen..."
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
              ) : displayFolders.length === 0 && documents.length === 0 ? (
                <FolderEmptyState
                  isVorstand={isVorstand}
                  onCreateFolder={() => openNewFolderDialog()}
                />
              ) : (
                <>
                  {/* Folders Section */}
                  {displayFolders.length > 0 && (
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

                  {/* Documents Section */}
                  {currentFolderId && (
                    <div className={displayFolders.length > 0 ? "mt-6 pt-6 border-t" : ""}>
                      {displayFolders.length > 0 && (
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">
                          Dokumente
                        </h3>
                      )}
                      <DocumentList
                        documents={documents}
                        isVorstand={isVorstand}
                        isLoading={isLoadingDocuments}
                        folderId={currentFolderId}
                        onPreviewDocument={handlePreviewDocument}
                        onDownloadDocument={handleDownloadDocument}
                        onUploadVersion={(id) => {
                          const doc = documents.find((d) => d.id === id)
                          if (doc) {
                            setSelectedDocument(doc)
                            setShowNewVersionDialog(true)
                          }
                        }}
                        onViewHistory={handleViewHistory}
                        onViewConfirmations={isVorstand ? handleViewConfirmations : undefined}
                        onDeleteDocument={isVorstand ? setDeletingDocumentId : undefined}
                        onMoveDocument={isVorstand ? setMovingDocumentId : undefined}
                        onUploadNew={isVorstand ? () => setShowUploadDialog(true) : undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ===== Dialogs ===== */}

      {/* Folder Form Dialog */}
      <FolderForm
        open={showFolderForm}
        onOpenChange={setShowFolderForm}
        folder={editingFolder}
        parentFolder={parentFolderForNew}
        availableParents={availableParents}
        onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
      />

      {/* Delete Folder Dialog */}
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

      {/* Document Upload Dialog */}
      {currentFolderId && (
        <DocumentUpload
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          folderId={currentFolderId}
          onSubmit={handleUploadDocument}
        />
      )}

      {/* New Version Upload Dialog */}
      {selectedDocument && (
        <NewVersionUpload
          open={showNewVersionDialog}
          onOpenChange={setShowNewVersionDialog}
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          onSubmit={handleUploadNewVersion}
        />
      )}

      {/* Document Preview Dialog */}
      <DocumentPreview
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        document={selectedDocument}
        fileUrl={documentFileUrl}
        isLoading={isLoadingPreview}
        isVorstand={isVorstand}
        onDownload={() => selectedDocument && handleDownloadDocument(selectedDocument.id)}
        onViewHistory={() => {
          setShowPreviewDialog(false)
          setShowHistorySheet(true)
        }}
        onConfirm={
          selectedDocument?.requires_confirmation && !selectedDocument?.user_has_confirmed
            ? handleConfirmRead
            : undefined
        }
      />

      {/* Version History Sheet */}
      <VersionHistory
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        document={selectedDocument}
        isVorstand={isVorstand}
        onPreviewVersion={(versionId) => {
          // Find version with URL
          const version = versionsWithUrls.find((v) => v.id === versionId)
          if (version?.download_url) {
            // Open preview with version URL
            setDocumentFileUrl(version.download_url)
            setShowHistorySheet(false)
            setShowPreviewDialog(true)
          } else {
            toast.error("Vorschau nicht verfügbar")
          }
        }}
        onDownloadVersion={(versionId) => {
          // Find version with URL
          const version = versionsWithUrls.find((v) => v.id === versionId)
          if (version?.download_url) {
            // Trigger download
            const a = document.createElement("a")
            a.href = version.download_url
            a.download = selectedDocument?.original_filename || "document"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          } else {
            toast.error("Download nicht verfügbar")
          }
        }}
        onRestoreVersion={isVorstand ? handleRestoreVersion : undefined}
      />

      {/* Confirmation Status Sheet */}
      <ConfirmationStatusView
        open={showConfirmationsSheet}
        onOpenChange={setShowConfirmationsSheet}
        documentName={selectedDocument?.name || ""}
        status={confirmationStatus}
        isLoading={isLoadingConfirmations}
        onSendReminder={handleSendReminder}
      />

      {/* Delete Document Dialog */}
      <AlertDialog
        open={!!deletingDocumentId}
        onOpenChange={(open) => !open && setDeletingDocumentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Dokument löschen möchten? Alle
              Versionen werden ebenfalls gelöscht. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDocument}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isDeletingDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDocument && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Document Dialog */}
      <Dialog
        open={!!movingDocumentId}
        onOpenChange={(open) => !open && setMovingDocumentId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dokument verschieben</DialogTitle>
            <DialogDescription>
              Wählen Sie den Zielordner für das Dokument.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-1 pr-4">
              {flattenFolders(folderTree)
                .filter((f) => f.id !== currentFolderId)
                .map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    style={{ paddingLeft: `${(folder.depth || 0) * 16 + 8}px` }}
                    disabled={isMovingDocument}
                    onClick={() => handleMoveDocument(folder.id)}
                  >
                    {folder.depth > 0 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{folder.name}</span>
                    {isMovingDocument && (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                    )}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Duplicate Document Dialog */}
      <AlertDialog
        open={!!duplicateInfo}
        onOpenChange={(open) => !open && setDuplicateInfo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument existiert bereits</AlertDialogTitle>
            <AlertDialogDescription>
              Ein Dokument mit dem Namen &quot;{duplicateInfo?.existingDocumentName}&quot;
              existiert bereits in diesem Ordner. Was möchten Sie tun?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setDuplicateInfo(null)}>
              Abbrechen
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDuplicateRename}
            >
              Umbenennen
            </Button>
            <AlertDialogAction onClick={handleDuplicateAsNewVersion}>
              Als neue Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
