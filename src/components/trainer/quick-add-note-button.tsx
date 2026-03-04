"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NoteEditorDialog } from "./note-editor-dialog"
import {
  getTrainingSessionsForGroup,
  type TrainingSessionOption,
} from "@/lib/actions"

interface QuickAddNoteButtonProps {
  groupId: string
  sessionId: string
  sessionDate: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function QuickAddNoteButton({
  groupId,
  sessionId,
  variant = "outline",
  size = "sm",
  className,
}: QuickAddNoteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sessions, setSessions] = useState<TrainingSessionOption[]>([])
  const [sessionsLoaded, setSessionsLoaded] = useState(false)

  // Load sessions when dialog opens
  useEffect(() => {
    if (dialogOpen && !sessionsLoaded) {
      getTrainingSessionsForGroup(groupId).then((data) => {
        setSessions(data)
        setSessionsLoaded(true)
      })
    }
  }, [dialogOpen, groupId, sessionsLoaded])

  const handleSuccess = () => {
    // Just close the dialog - no need to refresh the schedule page
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <FileText className="h-3.5 w-3.5 mr-1" />
        Notiz
      </Button>

      <NoteEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={groupId}
        trainingSessions={sessions}
        preselectedSessionId={sessionId}
        onSuccess={handleSuccess}
      />
    </>
  )
}
