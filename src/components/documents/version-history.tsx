"use client"

import * as React from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  History,
  Download,
  Eye,
  RotateCcw,
  FileText,
  Check,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DocumentVersion, DocumentWithDetails } from "./types"
import { formatFileSize } from "./types"

interface VersionHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentWithDetails | null
  isVorstand: boolean
  onPreviewVersion: (versionId: string) => void
  onDownloadVersion: (versionId: string) => void
  onRestoreVersion?: (versionId: string) => Promise<void>
  variant?: "dialog" | "sheet"
}

export function VersionHistory({
  open,
  onOpenChange,
  document,
  isVorstand,
  onPreviewVersion,
  onDownloadVersion,
  onRestoreVersion,
  variant = "sheet",
}: VersionHistoryProps) {
  const [restoringVersionId, setRestoringVersionId] = React.useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = React.useState<DocumentVersion | null>(null)
  const [isRestoring, setIsRestoring] = React.useState(false)

  const versions = document?.versions || []
  const currentVersionId = document?.current_version_id

  const handleRestore = async (version: DocumentVersion) => {
    if (!onRestoreVersion) return

    setIsRestoring(true)
    try {
      await onRestoreVersion(version.id)
      toast.success(`Version ${version.version_number} wurde wiederhergestellt`)
      setConfirmRestore(null)
    } catch (error) {
      console.error("Restore error:", error)
      toast.error("Fehler beim Wiederherstellen der Version")
    } finally {
      setIsRestoring(false)
    }
  }

  const content = (
    <>
      {versions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium">Keine Versionshistorie</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Dieses Dokument hat nur eine Version.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-4 pr-4">
            {versions.map((version, index) => {
              const isCurrent = version.id === currentVersionId
              const isLatest = index === 0
              const uploadDate = new Date(version.created_at)

              return (
                <div
                  key={version.id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isCurrent && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {isCurrent ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Version {version.version_number}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Aktuell
                            </Badge>
                          )}
                          {isLatest && !isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Neueste
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {format(uploadDate, "dd. MMMM yyyy, HH:mm", { locale: de })} Uhr
                        </p>

                        {version.uploader && (
                          <p className="text-sm text-muted-foreground">
                            von {version.uploader.first_name} {version.uploader.last_name}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(version.file_size)}
                        </p>

                        {version.change_note && (
                          <p className="mt-2 text-sm bg-muted/50 rounded p-2">
                            &quot;{version.change_note}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onPreviewVersion(version.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Vorschau</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDownloadVersion(version.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Herunterladen</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {isVorstand && !isCurrent && onRestoreVersion && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmRestore(version)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Wiederherstellen</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!confirmRestore}
        onOpenChange={(open) => !open && setConfirmRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Version wiederherstellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie Version {confirmRestore?.version_number} wiederherstellen?
              Dies erstellt eine neue Version mit dem Inhalt der ausgewählten Version.
              {document?.requires_confirmation && (
                <span className="block mt-2 font-medium text-destructive">
                  Hinweis: Da dieses Dokument Lesebestätigungen erfordert, werden
                  alle bestehenden Bestätigungen zurückgesetzt.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRestore && handleRestore(confirmRestore)}
              disabled={isRestoring}
            >
              {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wiederherstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Versionshistorie
            </DialogTitle>
            <DialogDescription>
              {document?.name} - {versions.length} Version(en)
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Versionshistorie
          </SheetTitle>
          <SheetDescription>
            {document?.name} - {versions.length} Version(en)
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 h-[calc(100vh-8rem)]">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}
