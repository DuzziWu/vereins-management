"use client"

import * as React from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Users,
  CheckCircle2,
  Clock,
  Bell,
  Loader2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ConfirmationStatus } from "./types"

interface ConfirmationStatusViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  status: ConfirmationStatus | null
  isLoading?: boolean
  onSendReminder?: (profileIds: string[]) => Promise<void>
  variant?: "dialog" | "sheet"
}

export function ConfirmationStatusView({
  open,
  onOpenChange,
  documentName,
  status,
  isLoading = false,
  onSendReminder,
  variant = "sheet",
}: ConfirmationStatusViewProps) {
  const [selectedForReminder, setSelectedForReminder] = React.useState<string[]>([])
  const [showReminderDialog, setShowReminderDialog] = React.useState(false)
  const [isSendingReminder, setIsSendingReminder] = React.useState(false)

  const progress = status
    ? Math.round((status.confirmed_count / status.total) * 100)
    : 0

  const handleSendReminder = async () => {
    if (!onSendReminder || selectedForReminder.length === 0) return

    setIsSendingReminder(true)
    try {
      await onSendReminder(selectedForReminder)
      toast.success(
        `Erinnerung an ${selectedForReminder.length} Mitglied(er) gesendet`
      )
      setSelectedForReminder([])
      setShowReminderDialog(false)
    } catch (error) {
      console.error("Reminder error:", error)
      toast.error("Fehler beim Senden der Erinnerung")
    } finally {
      setIsSendingReminder(false)
    }
  }

  const sendReminderToAll = () => {
    if (!status) return
    setSelectedForReminder(status.pending.map((p) => p.profile_id))
    setShowReminderDialog(true)
  }

  const content = isLoading ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ) : !status ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        Keine Bestätigungsdaten verfügbar
      </p>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Fortschritt</span>
          <span className="text-sm text-muted-foreground">
            {status.confirmed_count} von {status.total} ({progress}%)
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Tabs for Confirmed/Pending */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Ausstehend ({status.pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Bestätigt ({status.confirmed.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          {status.pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium">Alle haben bestätigt!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Alle berechtigten Mitglieder haben das Dokument gelesen.
              </p>
            </div>
          ) : (
            <>
              {onSendReminder && (
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendReminderToAll}
                    className="gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    Alle erinnern
                  </Button>
                </div>
              )}

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {status.pending.map((member) => (
                    <div
                      key={member.profile_id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.first_name[0]}
                            {member.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {member.first_name} {member.last_name}
                        </span>
                      </div>

                      {onSendReminder && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedForReminder([member.profile_id])
                            setShowReminderDialog(true)
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="sr-only">Erinnerung senden</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>

        {/* Confirmed Tab */}
        <TabsContent value="confirmed" className="mt-4">
          {status.confirmed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Noch keine Bestätigungen</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bisher hat noch niemand das Dokument bestätigt.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {status.confirmed.map((member) => (
                  <div
                    key={member.profile_id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900">
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {format(new Date(member.confirmed_at), "dd.MM.yyyy", {
                          locale: de,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Reminder Confirmation Dialog */}
      <AlertDialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erinnerung senden?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedForReminder.length === 1
                ? "Möchten Sie diesem Mitglied eine Erinnerung senden, das Dokument zu lesen?"
                : `Möchten Sie ${selectedForReminder.length} Mitgliedern eine Erinnerung senden, das Dokument zu lesen?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingReminder}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReminder}
              disabled={isSendingReminder}
            >
              {isSendingReminder && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Erinnerung senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lesebestätigungen
            </DialogTitle>
            <DialogDescription>{documentName}</DialogDescription>
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
            <Users className="h-5 w-5" />
            Lesebestätigungen
          </SheetTitle>
          <SheetDescription>{documentName}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
      </SheetContent>
    </Sheet>
  )
}

// Compact inline status for document list
export function ConfirmationStatusBadge({
  confirmedCount,
  totalCount,
}: {
  confirmedCount: number
  totalCount: number
}) {
  const progress = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0
  const isComplete = confirmedCount === totalCount

  return (
    <Badge
      variant={isComplete ? "default" : "secondary"}
      className={cn(
        "gap-1",
        isComplete && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      )}
    >
      <Users className="h-3 w-3" />
      {confirmedCount}/{totalCount}
    </Badge>
  )
}
