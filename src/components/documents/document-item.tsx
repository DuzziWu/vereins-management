"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Presentation,
  MoreHorizontal,
  Eye,
  Download,
  History,
  Upload,
  Trash2,
  Move,
  CheckCircle2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DocumentWithDetails, DocumentCategory } from "./types"
import { getDocumentCategory, formatFileSize } from "./types"

interface DocumentItemProps {
  document: DocumentWithDetails
  isVorstand: boolean
  onPreview: (documentId: string) => void
  onDownload: (documentId: string) => void
  onUploadVersion?: (documentId: string) => void
  onViewHistory?: (documentId: string) => void
  onViewConfirmations?: (documentId: string) => void
  onDelete?: (documentId: string) => void
  onMove?: (documentId: string) => void
}

// Icon mapping for document types
function getDocumentIcon(category: DocumentCategory) {
  switch (category) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />
    case "word":
      return <FileText className="h-5 w-5 text-blue-500" />
    case "excel":
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    case "powerpoint":
      return <Presentation className="h-5 w-5 text-orange-500" />
    case "image":
      return <FileImage className="h-5 w-5 text-purple-500" />
    case "archive":
      return <FileArchive className="h-5 w-5 text-yellow-600" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}

// Background color mapping for document types
function getDocumentBgColor(category: DocumentCategory): string {
  switch (category) {
    case "pdf":
      return "bg-red-100 dark:bg-red-900/30"
    case "word":
      return "bg-blue-100 dark:bg-blue-900/30"
    case "excel":
      return "bg-green-100 dark:bg-green-900/30"
    case "powerpoint":
      return "bg-orange-100 dark:bg-orange-900/30"
    case "image":
      return "bg-purple-100 dark:bg-purple-900/30"
    case "archive":
      return "bg-yellow-100 dark:bg-yellow-900/30"
    default:
      return "bg-gray-100 dark:bg-gray-900/30"
  }
}

export function DocumentItem({
  document,
  isVorstand,
  onPreview,
  onDownload,
  onUploadVersion,
  onViewHistory,
  onViewConfirmations,
  onDelete,
  onMove,
}: DocumentItemProps) {
  const category = getDocumentCategory(document.mime_type)
  const version = document.current_version

  const formattedDate = formatDistanceToNow(
    new Date(document.updated_at),
    { addSuffix: true, locale: de }
  )

  const fileSize = version ? formatFileSize(version.file_size) : "—"
  const versionNumber = version?.version_number || 1

  // Confirmation progress
  const confirmationProgress = document.requires_confirmation && document.total_confirmations_needed
    ? Math.round((document.confirmation_count || 0) / document.total_confirmations_needed * 100)
    : null

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-4 transition-colors",
        "hover:bg-accent cursor-pointer"
      )}
      onClick={() => onPreview(document.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onPreview(document.id)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Dokument ${document.name} öffnen`}
    >
      {/* Document Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          getDocumentBgColor(category)
        )}
      >
        {getDocumentIcon(category)}
      </div>

      {/* Document Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{document.name}</h3>
          {versionNumber > 1 && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              v{versionNumber}
            </Badge>
          )}
          {document.user_has_confirmed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sie haben dieses Dokument bestätigt</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {document.description && (
          <p className="truncate text-sm text-muted-foreground">
            {document.description}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{fileSize}</span>
          <span>·</span>
          <span>Aktualisiert {formattedDate}</span>
          {document.creator && (
            <>
              <span>·</span>
              <span>
                {document.creator.first_name} {document.creator.last_name}
              </span>
            </>
          )}
        </div>

        {/* Confirmation Progress (for documents requiring confirmation) */}
        {document.requires_confirmation && confirmationProgress !== null && (
          <div className="mt-2 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <Progress value={confirmationProgress} className="h-2 flex-1 max-w-32" />
            <span className="text-xs text-muted-foreground">
              {document.confirmation_count}/{document.total_confirmations_needed}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(document.id)
                }}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Vorschau</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vorschau</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload(document.id)
                }}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Herunterladen</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Herunterladen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Mehr Aktionen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onPreview(document.id)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Vorschau
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDownload(document.id)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Herunterladen
            </DropdownMenuItem>

            {onViewHistory && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onViewHistory(document.id)
                }}
              >
                <History className="mr-2 h-4 w-4" />
                Versionshistorie
              </DropdownMenuItem>
            )}

            {isVorstand && (
              <>
                <DropdownMenuSeparator />

                {onUploadVersion && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onUploadVersion(document.id)
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Neue Version hochladen
                  </DropdownMenuItem>
                )}

                {document.requires_confirmation && onViewConfirmations && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewConfirmations(document.id)
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Lesebestätigungen
                  </DropdownMenuItem>
                )}

                {onMove && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onMove(document.id)
                    }}
                  >
                    <Move className="mr-2 h-4 w-4" />
                    Verschieben
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(document.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
