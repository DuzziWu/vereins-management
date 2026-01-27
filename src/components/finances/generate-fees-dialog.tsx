"use client"

import * as React from "react"
import { AlertTriangle, Users, Home, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/validations/membership-type"

export interface GenerateFeesPreview {
  year: number
  individualCount: number
  familyCount: number
  totalAmount: number
  membersWithoutType: number
  membersWithoutTypeNames: string[]
}

interface GenerateFeesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: GenerateFeesPreview | null
  isLoading?: boolean
  isGenerating?: boolean
  onGenerate: () => void
  year?: number
}

export function GenerateFeesDialog({
  open,
  onOpenChange,
  preview,
  isLoading,
  isGenerating,
  onGenerate,
  year,
}: GenerateFeesDialogProps) {
  const displayYear = preview?.year ?? year ?? new Date().getFullYear()
  const hasWarning = preview ? preview.membersWithoutType > 0 : false
  const isPreviewLoading = !preview && open

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beiträge für {displayYear} generieren</DialogTitle>
          <DialogDescription>
            Es werden Jahresbeiträge für alle Mitglieder und Familien mit zugewiesener Beitragsart erstellt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPreviewLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Lade Vorschau...</p>
            </div>
          ) : preview ? (
            <>
              {/* Preview Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{preview.individualCount}</div>
                    <div className="text-xs text-muted-foreground">Einzelpersonen</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{preview.familyCount}</div>
                    <div className="text-xs text-muted-foreground">Familien</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gesamt-Soll:</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatCurrency(preview.totalAmount)}
                </span>
              </div>

              {/* Warning for members without type */}
              {hasWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{preview.membersWithoutType} Mitglied{preview.membersWithoutType > 1 ? "er" : ""}</strong> ohne Beitragsart werden übersprungen:
                    <ul className="mt-2 text-sm list-disc pl-4">
                      {preview.membersWithoutTypeNames.slice(0, 5).map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                      {preview.membersWithoutTypeNames.length > 5 && (
                        <li>... und {preview.membersWithoutTypeNames.length - 5} weitere</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isLoading || isGenerating || isPreviewLoading || !preview || (preview.individualCount === 0 && preview.familyCount === 0)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird generiert...
              </>
            ) : (
              "Beiträge generieren"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
