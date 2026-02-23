"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Upload,
  File,
  FileText,
  Image,
  FileArchive,
  Trash2,
  Download,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  KanbanTaskAttachment,
  kanbanAttachmentValidation,
} from "@/lib/validations/kanban"

interface KanbanAttachmentProps {
  taskId: string
  workgroupId: string
  attachments: KanbanTaskAttachment[]
  onAttachmentsChange: () => void
  isVorstand: boolean
  currentUserId: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className="h-4 w-4 text-blue-500" />
  }
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return <FileText className="h-4 w-4 text-green-500" />
  }
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) {
    return <FileText className="h-4 w-4 text-orange-500" />
  }
  if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return <FileArchive className="h-4 w-4 text-yellow-600" />
  }
  return <File className="h-4 w-4" />
}

export function KanbanAttachment({
  taskId,
  workgroupId,
  attachments,
  onAttachmentsChange,
  isVorstand,
  currentUserId,
}: KanbanAttachmentProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [deletingAttachment, setDeletingAttachment] = React.useState<KanbanTaskAttachment | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const canUpload = attachments.length < kanbanAttachmentValidation.maxFilesPerTask

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > kanbanAttachmentValidation.maxFileSize) {
      return `Datei zu groß. Maximal ${formatFileSize(kanbanAttachmentValidation.maxFileSize)}`
    }
    if (!kanbanAttachmentValidation.allowedMimeTypes.includes(file.type)) {
      return "Dateityp nicht erlaubt. Erlaubt: PDF, Office-Dokumente, Bilder, ZIP"
    }
    return null
  }

  // Upload file
  const uploadFile = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    if (!canUpload) {
      toast.error(`Maximal ${kanbanAttachmentValidation.maxFilesPerTask} Dateien pro Task`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Hochladen")
      }

      toast.success("Datei hochgeladen")
      onAttachmentsChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Datei konnte nicht hochgeladen werden")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  // Download file
  const handleDownload = async (attachment: KanbanTaskAttachment) => {
    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/attachments/${attachment.id}`
      )

      if (!response.ok) {
        throw new Error("Fehler beim Herunterladen")
      }

      const data = await response.json()

      // Open signed URL in new tab
      window.open(data.url, "_blank")
    } catch (err) {
      toast.error("Datei konnte nicht heruntergeladen werden")
    }
  }

  // Delete file
  const handleDelete = async () => {
    if (!deletingAttachment) return

    try {
      const response = await fetch(
        `/api/workgroups/${workgroupId}/kanban/tasks/${taskId}/attachments/${deletingAttachment.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Fehler beim Löschen")
      }

      toast.success("Datei gelöscht")
      setDeletingAttachment(null)
      onAttachmentsChange()
    } catch (err) {
      toast.error("Datei konnte nicht gelöscht werden")
    }
  }

  const canDelete = (attachment: KanbanTaskAttachment) => {
    return attachment.uploaded_by === currentUserId || isVorstand
  }

  return (
    <>
      <div className="space-y-3">
        {/* File List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0">{getFileIcon(attachment.mime_type)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                    {attachment.uploader_name && ` • ${attachment.uploader_name}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Herunterladen</span>
                  </Button>
                  {canDelete(attachment) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingAttachment(attachment)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Löschen</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {canUpload && (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept={kanbanAttachmentValidation.allowedMimeTypes.join(",")}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Wird hochgeladen...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Datei hierher ziehen oder{" "}
                  <span className="text-primary underline">auswählen</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Max. {formatFileSize(kanbanAttachmentValidation.maxFileSize)} • PDF, Office, Bilder, ZIP
                </p>
              </div>
            )}
          </div>
        )}

        {!canUpload && (
          <p className="text-xs text-muted-foreground text-center">
            Maximale Anzahl an Dateien erreicht (
            {kanbanAttachmentValidation.maxFilesPerTask})
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAttachment}
        onOpenChange={() => setDeletingAttachment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Datei &quot;{deletingAttachment?.filename}&quot; wird dauerhaft
              gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
