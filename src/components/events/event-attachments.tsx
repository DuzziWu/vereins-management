"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Loader2,
  X,
  ZoomIn,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  type EventAttachment,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_EVENT,
  FILE_TYPE_LABELS,
} from "@/lib/validations/events"

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper: Get file icon
function FileIcon({ fileType, className }: { fileType: string; className?: string }) {
  if (fileType.startsWith("image/")) {
    return <ImageIcon className={className} />
  }
  return <FileText className={className} />
}

// === Attachment List Component ===
interface EventAttachmentListProps {
  attachments: EventAttachment[]
  canDelete?: boolean
  currentUserId?: string
  onDelete?: (id: string) => void
  className?: string
}

export function EventAttachmentList({
  attachments,
  canDelete = false,
  currentUserId,
  onDelete,
  className,
}: EventAttachmentListProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!attachments || attachments.length === 0) {
    return null
  }

  const handleDownload = async (attachment: EventAttachment) => {
    try {
      // Hole signierte Download-URL von der API
      const response = await fetch(
        `/api/events/${attachment.event_id}/attachments/${attachment.id}`
      )
      if (!response.ok) {
        throw new Error("Download fehlgeschlagen")
      }

      const data = await response.json()

      // Lade Datei von der signierten URL
      const fileResponse = await fetch(data.url)
      if (!fileResponse.ok) {
        throw new Error("Download fehlgeschlagen")
      }

      const blob = await fileResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Download fehlgeschlagen")
    }
  }

  const handlePreview = async (attachment: EventAttachment) => {
    // Für PDFs: Öffne in neuem Tab (Browser-PDF-Viewer)
    if (attachment.file_type === "application/pdf") {
      try {
        const response = await fetch(
          `/api/events/${attachment.event_id}/attachments/${attachment.id}`
        )
        if (!response.ok) {
          throw new Error("Vorschau fehlgeschlagen")
        }
        const data = await response.json()
        window.open(data.url, "_blank", "noopener,noreferrer")
      } catch {
        toast.error("Vorschau fehlgeschlagen")
      }
      return
    }

    // Für Bilder: Lightbox
    if (attachment.file_type.startsWith("image/")) {
      try {
        const response = await fetch(
          `/api/events/${attachment.event_id}/attachments/${attachment.id}`
        )
        if (!response.ok) {
          throw new Error("Vorschau fehlgeschlagen")
        }
        const data = await response.json()
        setPreviewImage(data.url)
      } catch {
        toast.error("Vorschau fehlgeschlagen")
      }
      return
    }

    // Für andere Dateien: Download
    handleDownload(attachment)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const attachment = attachments.find((a) => a.id === deleteId)
    if (!attachment) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/events/${attachment.event_id}/attachments/${attachment.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Löschen fehlgeschlagen")
      }

      toast.success("Datei gelöscht")
      onDelete?.(deleteId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Löschen fehlgeschlagen")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {attachments.map((attachment) => {
          const isImage = attachment.file_type.startsWith("image/")
          const isPdf = attachment.file_type === "application/pdf"
          const hasPreview = isImage || isPdf
          const canDeleteThis =
            canDelete ||
            (currentUserId && attachment.uploaded_by === currentUserId)

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <FileIcon
                fileType={attachment.file_type}
                className="h-5 w-5 text-muted-foreground flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {FILE_TYPE_LABELS[attachment.file_type] || "Datei"} -{" "}
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {hasPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(attachment)}
                    title={isPdf ? "PDF öffnen" : "Vorschau"}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(attachment)}
                  title="Herunterladen"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canDeleteThis && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(attachment.id)}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bildvorschau</DialogTitle>
          </DialogHeader>
          {previewImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImage}
              alt="Vorschau"
              className="max-h-[70vh] w-auto mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diese Datei wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// === File Upload Component ===
interface EventAttachmentUploadProps {
  eventId: string
  currentCount: number
  onUploadComplete?: () => void
  className?: string
}

export function EventAttachmentUpload({
  eventId,
  currentCount,
  onUploadComplete,
  className,
}: EventAttachmentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [failedFile, setFailedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const remainingSlots = MAX_FILES_PER_EVENT - currentCount

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      return `Dateityp nicht erlaubt. Erlaubt: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei zu groß. Maximum: ${formatFileSize(MAX_FILE_SIZE)}`
    }
    return null
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        toast.error(validationError)
        return
      }

      if (remainingSlots <= 0) {
        toast.error(`Maximal ${MAX_FILES_PER_EVENT} Dateien pro Event erlaubt`)
        return
      }

      // Clear previous error state
      setFailedFile(null)
      setUploadError(null)
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate progress for UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const response = await fetch(`/api/events/${eventId}/attachments`, {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Upload fehlgeschlagen")
        }

        toast.success("Datei hochgeladen")
        onUploadComplete?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload fehlgeschlagen"
        toast.error(errorMessage)
        // Store the failed file for retry
        setFailedFile(file)
        setUploadError(errorMessage)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
        if (inputRef.current) {
          inputRef.current.value = ""
        }
      }
    },
    [eventId, onUploadComplete, remainingSlots]
  )

  const handleRetry = useCallback(() => {
    if (failedFile) {
      uploadFile(failedFile)
    }
  }, [failedFile, uploadFile])

  const handleDismissError = useCallback(() => {
    setFailedFile(null)
    setUploadError(null)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0])
      }
    },
    [uploadFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        uploadFile(e.target.files[0])
      }
    },
    [uploadFile]
  )

  if (remainingSlots <= 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 border border-dashed rounded-md bg-muted/50 text-muted-foreground",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Maximum von {MAX_FILES_PER_EVENT} Dateien erreicht</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error state with Retry button */}
      {failedFile && uploadError && (
        <div className="flex items-center gap-3 p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Upload fehlgeschlagen</p>
            <p className="text-xs text-muted-foreground truncate">
              {failedFile.name} - {uploadError}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isUploading}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Erneut versuchen
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismissError}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-md transition-colors cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_FILE_EXTENSIONS.join(",")}
          onChange={handleChange}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2 p-6">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
              <Progress value={uploadProgress} className="w-48 h-1" />
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Datei hierher ziehen oder klicken
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ALLOWED_FILE_EXTENSIONS.join(", ").toUpperCase()} bis{" "}
                  {formatFileSize(MAX_FILE_SIZE)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Noch {remainingSlots} von {MAX_FILES_PER_EVENT} Dateien möglich
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
