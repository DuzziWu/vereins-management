"use client"

import * as React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ConfirmationButtonProps {
  onConfirm: () => Promise<void>
  variant?: "default" | "inline"
  disabled?: boolean
}

export function ConfirmationButton({
  onConfirm,
  variant = "default",
  disabled = false,
}: ConfirmationButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [showDialog, setShowDialog] = React.useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      setShowDialog(false)
    } catch (error) {
      console.error("Confirmation error:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  if (variant === "inline") {
    return (
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isConfirming}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Gelesen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lesebestätigung</AlertDialogTitle>
            <AlertDialogDescription>
              Mit dem Klick auf &quot;Bestätigen&quot; erklären Sie, dass Sie
              dieses Dokument gelesen und zur Kenntnis genommen haben.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button
          className="w-full gap-2"
          disabled={disabled || isConfirming}
        >
          <CheckCircle2 className="h-5 w-5" />
          Ich habe dieses Dokument gelesen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lesebestätigung abgeben</AlertDialogTitle>
          <AlertDialogDescription>
            Mit dem Klick auf &quot;Bestätigen&quot; erklären Sie, dass Sie
            dieses Dokument vollständig gelesen und zur Kenntnis genommen haben.
            Diese Bestätigung wird mit Ihrem Namen und einem Zeitstempel
            gespeichert.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bestätigen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Badge shown when user has confirmed
export function ConfirmedBadge({ confirmedAt }: { confirmedAt?: string }) {
  const formattedDate = confirmedAt
    ? new Date(confirmedAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-4 w-4" />
      <span>
        Bestätigt{formattedDate && ` am ${formattedDate}`}
      </span>
    </div>
  )
}
