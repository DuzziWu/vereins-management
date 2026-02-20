"use client"

import * as React from "react"
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  History,
  Loader2,
  FileText,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmationButton } from "./confirmation-button"
import type { DocumentWithDetails, DocumentVersion } from "./types"
import { getDocumentCategory, formatFileSize } from "./types"
import { getFileTypeName } from "@/lib/validations/documents"

interface DocumentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentWithDetails | null
  fileUrl: string | null
  isLoading?: boolean
  isVorstand: boolean
  onDownload: () => void
  onViewHistory?: () => void
  onVersionChange?: (versionId: string) => void
  onConfirm?: () => Promise<void>
}

export function DocumentPreview({
  open,
  onOpenChange,
  document,
  fileUrl,
  isLoading = false,
  isVorstand,
  onDownload,
  onViewHistory,
  onVersionChange,
  onConfirm,
}: DocumentPreviewProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [imageZoom, setImageZoom] = React.useState(1)
  const [imageRotation, setImageRotation] = React.useState(0)
  const [pdfPage, setPdfPage] = React.useState(1)
  const [pdfError, setPdfError] = React.useState(false)

  const category = document ? getDocumentCategory(document.mime_type) : "other"
  const currentVersion = document?.current_version
  const versions = document?.versions || []

  // Reset state when document changes
  React.useEffect(() => {
    setImageZoom(1)
    setImageRotation(0)
    setPdfPage(1)
    setPdfError(false)
  }, [document?.id])

  // Image controls
  const zoomIn = () => setImageZoom((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setImageZoom((prev) => Math.max(prev - 0.25, 0.5))
  const rotate = () => setImageRotation((prev) => (prev + 90) % 360)
  const resetImage = () => {
    setImageZoom(1)
    setImageRotation(0)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-0",
          isFullscreen
            ? "max-w-full h-full max-h-full rounded-none"
            : "max-w-4xl h-[90vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b p-4">
          <DialogDescription className="sr-only">
            Dokumentvorschau für {document.name}
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <DialogTitle className="truncate">
                {document.name}
              </DialogTitle>
              {currentVersion && currentVersion.version_number > 1 && (
                <Badge variant="secondary">v{currentVersion.version_number}</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Version Selector (if multiple versions) */}
              {versions.length > 1 && onVersionChange && (
                <Select
                  value={currentVersion?.id}
                  onValueChange={onVersionChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version_number}
                        {v.id === document.current_version_id && " (aktuell)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* View History */}
              {onViewHistory && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={onViewHistory}>
                        <History className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Versionshistorie</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Download */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Herunterladen</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Fullscreen Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullscreen ? "Vollbild beenden" : "Vollbild"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>{getFileTypeName(document.mime_type)}</span>
            {currentVersion && (
              <>
                <span>·</span>
                <span>{formatFileSize(currentVersion.file_size)}</span>
              </>
            )}
            {currentVersion?.change_note && (
              <>
                <span>·</span>
                <span className="truncate">{currentVersion.change_note}</span>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : category === "pdf" ? (
            // PDF Preview with lazy loading for large files
            <PdfPreview
              url={fileUrl}
              onError={() => setPdfError(true)}
              hasError={pdfError}
              onDownload={onDownload}
              fileSize={currentVersion?.file_size}
            />
          ) : category === "image" ? (
            // Image Preview
            <ImagePreview
              url={fileUrl}
              alt={document.name}
              zoom={imageZoom}
              rotation={imageRotation}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onRotate={rotate}
              onReset={resetImage}
            />
          ) : (
            // Unsupported format
            <UnsupportedPreview
              fileType={getFileTypeName(document.mime_type)}
              onDownload={onDownload}
            />
          )}
        </div>

        {/* Footer with Confirmation Button */}
        {document.requires_confirmation && !document.user_has_confirmed && onConfirm && (
          <div className="flex-shrink-0 border-t p-4 bg-muted/50">
            <ConfirmationButton onConfirm={onConfirm} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// PDF Preview Component with lazy loading
function PdfPreview({
  url,
  onError,
  hasError,
  onDownload,
  fileSize,
}: {
  url: string | null
  onError: () => void
  hasError: boolean
  onDownload: () => void
  fileSize?: number
}) {
  // Lazy load threshold: 5 MB
  const LAZY_LOAD_THRESHOLD = 5 * 1024 * 1024
  const isLargeFile = fileSize && fileSize > LAZY_LOAD_THRESHOLD
  const [shouldLoad, setShouldLoad] = React.useState(!isLargeFile)
  const [isLoading, setIsLoading] = React.useState(false)

  // Reset loading state when URL changes
  React.useEffect(() => {
    setShouldLoad(!isLargeFile)
    setIsLoading(false)
  }, [url, isLargeFile])

  if (hasError || !url) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">Vorschau nicht verfügbar</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Die PDF-Vorschau konnte nicht geladen werden.
        </p>
        <Button onClick={onDownload} className="mt-4">
          <Download className="mr-2 h-4 w-4" />
          Herunterladen
        </Button>
      </div>
    )
  }

  // Show lazy load prompt for large files
  if (!shouldLoad) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium">Große PDF-Datei</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Diese PDF ist größer als 5 MB ({fileSize ? (fileSize / 1024 / 1024).toFixed(1) : '?'} MB).
          <br />
          Möchten Sie die Vorschau laden?
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Herunterladen
          </Button>
          <Button
            onClick={() => {
              setIsLoading(true)
              setShouldLoad(true)
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vorschau laden
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
        className="w-full h-full border-0"
        title="PDF-Vorschau"
        onError={onError}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}

// Image Preview Component
function ImagePreview({
  url,
  alt,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}: {
  url: string | null
  alt: string
  zoom: number
  rotation: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRotate: () => void
  onReset: () => void
}) {
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Bild konnte nicht geladen werden</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Image Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-background/80 backdrop-blur rounded-lg p-1 border">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Verkleinern</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-sm px-2 min-w-[4rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vergrößern</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-6 bg-border mx-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Drehen</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={zoom === 1 && rotation === 0}
              >
                Zurücksetzen
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ansicht zurücksetzen</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Image Display */}
      <div className="h-full overflow-auto flex items-center justify-center p-4 bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  )
}

// Unsupported Format Preview
function UnsupportedPreview({
  fileType,
  onDownload,
}: {
  fileType: string
  onDownload: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium">Vorschau nicht verfügbar</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {fileType}-Dateien können nicht im Browser angezeigt werden.
        Laden Sie die Datei herunter, um sie zu öffnen.
      </p>
      <Button onClick={onDownload} className="mt-4">
        <Download className="mr-2 h-4 w-4" />
        Herunterladen
      </Button>
    </div>
  )
}
