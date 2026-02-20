"use client"

import * as React from "react"
import { FileText, Filter, SortAsc, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentItem } from "./document-item"
import type { DocumentWithDetails, DocumentCategory } from "./types"
import { getDocumentCategory } from "./types"

interface DocumentListProps {
  documents: DocumentWithDetails[]
  isVorstand: boolean
  isLoading?: boolean
  folderId: string | null
  onPreviewDocument: (documentId: string) => void
  onDownloadDocument: (documentId: string) => void
  onUploadVersion?: (documentId: string) => void
  onViewHistory?: (documentId: string) => void
  onViewConfirmations?: (documentId: string) => void
  onDeleteDocument?: (documentId: string) => void
  onMoveDocument?: (documentId: string) => void
  onUploadNew?: () => void
}

type SortOption = "name" | "updated_at" | "size"
type FilterOption = "all" | "pdf" | "word" | "excel" | "powerpoint" | "image" | "archive" | "pending_confirmation"

export function DocumentList({
  documents,
  isVorstand,
  isLoading = false,
  folderId,
  onPreviewDocument,
  onDownloadDocument,
  onUploadVersion,
  onViewHistory,
  onViewConfirmations,
  onDeleteDocument,
  onMoveDocument,
  onUploadNew,
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<SortOption>("name")
  const [filterBy, setFilterBy] = React.useState<FilterOption>("all")

  // Filter and sort documents
  const displayDocuments = React.useMemo(() => {
    let result = [...documents]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query)
      )
    }

    // Filter by type
    if (filterBy !== "all") {
      if (filterBy === "pending_confirmation") {
        result = result.filter(
          (doc) => doc.requires_confirmation && !doc.user_has_confirmed
        )
      } else {
        result = result.filter(
          (doc) => getDocumentCategory(doc.mime_type) === filterBy
        )
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "de")
        case "updated_at":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        case "size":
          const sizeA = a.current_version?.file_size || 0
          const sizeB = b.current_version?.file_size || 0
          return sizeB - sizeA
        default:
          return 0
      }
    })

    return result
  }, [documents, searchQuery, sortBy, filterBy])

  // Count documents with pending confirmations
  const pendingConfirmationsCount = React.useMemo(() => {
    return documents.filter(
      (doc) => doc.requires_confirmation && !doc.user_has_confirmed
    ).length
  }, [documents])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // No folder selected
  if (!folderId) {
    return (
      <DocumentEmptyState
        message="Wählen Sie einen Ordner aus, um Dokumente anzuzeigen."
        showUploadButton={false}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      {documents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Dokumente suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterBy}
            onValueChange={(value) => setFilterBy(value as FilterOption)}
          >
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Dateien</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="powerpoint">PowerPoint</SelectItem>
              <SelectItem value="image">Bilder</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
              {pendingConfirmationsCount > 0 && (
                <SelectItem value="pending_confirmation">
                  <span className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5" />
                    Bestätigung ausstehend ({pendingConfirmationsCount})
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-40">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="updated_at">Zuletzt geändert</SelectItem>
              <SelectItem value="size">Größe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Document List */}
      {displayDocuments.length === 0 ? (
        documents.length > 0 ? (
          // Search/filter returned no results
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium">Keine Ergebnisse</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Es wurden keine Dokumente gefunden, die Ihren Suchkriterien
              entsprechen.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("")
                setFilterBy("all")
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
        ) : (
          // No documents in folder
          <DocumentEmptyState
            isVorstand={isVorstand}
            onUpload={onUploadNew}
          />
        )
      ) : (
        <div className="space-y-2">
          {displayDocuments.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              isVorstand={isVorstand}
              onPreview={onPreviewDocument}
              onDownload={onDownloadDocument}
              onUploadVersion={onUploadVersion}
              onViewHistory={onViewHistory}
              onViewConfirmations={onViewConfirmations}
              onDelete={onDeleteDocument}
              onMove={onMoveDocument}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Empty state component
function DocumentEmptyState({
  message,
  isVorstand = false,
  showUploadButton = true,
  onUpload,
}: {
  message?: string
  isVorstand?: boolean
  showUploadButton?: boolean
  onUpload?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-medium">
        {message || "Keine Dokumente vorhanden"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isVorstand
          ? "Laden Sie das erste Dokument in diesen Ordner hoch."
          : "In diesem Ordner sind noch keine Dokumente vorhanden."}
      </p>
      {isVorstand && showUploadButton && onUpload && (
        <Button onClick={onUpload} className="mt-4">
          Dokument hochladen
        </Button>
      )}
    </div>
  )
}
