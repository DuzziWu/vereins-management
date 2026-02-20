"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, FileText, X, Loader2, AlertCircle, WifiOff, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  documentUploadSchema,
  validateFile,
  type DocumentUploadData,
} from "@/lib/validations/documents"
import {
  ALLOWED_DOCUMENT_TYPES,
  formatFileSize,
  getDocumentCategory,
} from "./types"

interface DocumentUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
  existingDocumentName?: string // For duplicate detection
  onSubmit: (data: DocumentUploadData, file: File) => Promise<void>
  mode?: "upload" | "new_version"
  documentId?: string
}

export function DocumentUpload({
  open,
  onOpenChange,
  folderId,
  existingDocumentName,
  onSubmit,
  mode = "upload",
  documentId,
}: DocumentUploadProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [networkError, setNetworkError] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<DocumentUploadData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      name: "",
      description: "",
      folder_id: folderId,
      requires_confirmation: false,
      access_all_groups: false,
    },
  })

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        description: "",
        folder_id: folderId,
        requires_confirmation: false,
        access_all_groups: false,
      })
      setFile(null)
      setFileError(null)
      setUploadProgress(0)
      setNetworkError(false)
    }
  }, [open, folderId, form])

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setFileError(validation.error || "Ungültige Datei")
      setFile(null)
      return
    }

    setFileError(null)
    setFile(selectedFile)

    // Auto-fill name from filename if empty
    if (!form.getValues("name")) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
      form.setValue("name", nameWithoutExt)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  // Remove selected file
  const removeFile = () => {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Submit handler
  const handleSubmit = async (data: DocumentUploadData) => {
    if (!file) {
      setFileError("Bitte wählen Sie eine Datei aus")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setNetworkError(false)

    try {
      // Simulate upload progress (actual progress would come from XHR/fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      await onSubmit(data, file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success(
        mode === "new_version"
          ? "Neue Version erfolgreich hochgeladen"
          : "Dokument erfolgreich hochgeladen"
      )
      onOpenChange(false)
    } catch (error) {
      console.error("Upload error:", error)

      // Check for network/offline errors
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("Network") ||
            error.message.includes("Failed to fetch")))

      if (isNetworkError || !navigator.onLine) {
        setNetworkError(true)
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Fehler beim Hochladen"
        )
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Retry handler for network errors
  const handleRetry = () => {
    setNetworkError(false)
    form.handleSubmit(handleSubmit)()
  }

  const acceptedTypes = ALLOWED_DOCUMENT_TYPES.join(",")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "new_version"
              ? "Neue Version hochladen"
              : "Dokument hochladen"}
          </DialogTitle>
          <DialogDescription>
            {mode === "new_version"
              ? "Laden Sie eine neue Version dieses Dokuments hoch."
              : "Wählen Sie eine Datei aus oder ziehen Sie sie in den Upload-Bereich."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Drop Zone */}
            <div
              className={cn(
                "relative rounded-lg border-2 border-dashed p-6 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                file && "border-green-500 bg-green-50 dark:bg-green-950/20"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleInputChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isUploading}
              />

              {file ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Datei entfernen</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="font-medium">
                    Datei hier ablegen oder klicken zum Auswählen
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, Word, Excel, PowerPoint, Bilder, ZIP
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max. 25 MB
                  </p>
                </div>
              )}
            </div>

            {/* File Error */}
            {fileError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {/* Network Error */}
            {networkError && (
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Netzwerkfehler: Überprüfen Sie Ihre Internetverbindung.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2 shrink-0"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Erneut versuchen
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Wird hochgeladen...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Document Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dokumentname *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Jahresbericht 2026"
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Beschreibung des Dokuments..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximal 500 Zeichen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requires Confirmation (only for new uploads) */}
            {mode === "upload" && (
              <>
                <FormField
                  control={form.control}
                  name="requires_confirmation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Lesebestätigung erforderlich
                        </FormLabel>
                        <FormDescription>
                          Mitglieder müssen bestätigen, dass sie das Dokument
                          gelesen haben.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUploading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="access_all_groups"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Zugriff für alle Gruppen
                        </FormLabel>
                        <FormDescription>
                          Das Dokument ist für alle Mitglieder sichtbar,
                          unabhängig von der Ordner-Berechtigung.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUploading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Change Note (only for new versions) */}
            {mode === "new_version" && (
              <FormItem>
                <FormLabel>Änderungsnotiz</FormLabel>
                <Textarea
                  placeholder="Was hat sich geändert? (optional)"
                  className="resize-none"
                  rows={2}
                  disabled={isUploading}
                />
                <FormDescription>
                  Maximal 200 Zeichen
                </FormDescription>
              </FormItem>
            )}

            <DialogFooter className="flex-shrink-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isUploading || !file}>
                {isUploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "new_version" ? "Version hochladen" : "Hochladen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// New Version Upload Dialog (simplified)
interface NewVersionUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
  onSubmit: (file: File, changeNote?: string) => Promise<void>
}

export function NewVersionUpload({
  open,
  onOpenChange,
  documentId,
  documentName,
  onSubmit,
}: NewVersionUploadProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [changeNote, setChangeNote] = React.useState("")
  const [networkError, setNetworkError] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setFile(null)
      setFileError(null)
      setUploadProgress(0)
      setChangeNote("")
      setNetworkError(false)
    }
  }, [open])

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setFileError(validation.error || "Ungültige Datei")
      setFile(null)
      return
    }
    setFileError(null)
    setFile(selectedFile)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setFileError("Bitte wählen Sie eine Datei aus")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setNetworkError(false)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      await onSubmit(file, changeNote || undefined)

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success("Neue Version erfolgreich hochgeladen")
      onOpenChange(false)
    } catch (error) {
      console.error("Upload error:", error)

      // Check for network/offline errors
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("Network") ||
            error.message.includes("Failed to fetch")))

      if (isNetworkError || !navigator.onLine) {
        setNetworkError(true)
      } else {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Hochladen"
        )
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetry = () => {
    setNetworkError(false)
    handleSubmit()
  }

  const acceptedTypes = ALLOWED_DOCUMENT_TYPES.join(",")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Neue Version hochladen</DialogTitle>
          <DialogDescription>
            Neue Version für &quot;{documentName}&quot; hochladen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Drop Zone */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed p-6 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              file && "border-green-500 bg-green-50 dark:bg-green-950/20"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isUploading}
            />

            {file ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setFileError(null)
                  }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium">Neue Version hier ablegen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  oder klicken zum Auswählen
                </p>
              </div>
            )}
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {networkError && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Netzwerkfehler: Überprüfen Sie Ihre Internetverbindung.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2 shrink-0"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Erneut versuchen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Wird hochgeladen...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Change Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Änderungsnotiz (optional)
            </label>
            <Textarea
              placeholder="Was hat sich geändert?"
              className="resize-none"
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              maxLength={200}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              {changeNote.length}/200 Zeichen
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bei Dokumenten mit Lesebestätigung werden alle bestehenden
              Bestätigungen zurückgesetzt.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !file}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Version hochladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
