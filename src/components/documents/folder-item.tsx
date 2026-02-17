"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { Folder, Lock, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Folder as FolderType } from "./types"

interface FolderItemProps {
  folder: FolderType
  isVorstand: boolean
  onOpen: (folderId: string) => void
  onRename?: (folderId: string) => void
  onDelete?: (folderId: string) => void
  onMove?: (folderId: string) => void
  hasChildren?: boolean
  hasDocuments?: boolean
}

export function FolderItem({
  folder,
  isVorstand,
  onOpen,
  onRename,
  onDelete,
  onMove,
  hasChildren = false,
  hasDocuments = false,
}: FolderItemProps) {
  const canDelete = isVorstand && !folder.is_system_default && !hasChildren && !hasDocuments
  const canMove = isVorstand && !folder.is_system_default && folder.depth < 5

  const formattedDate = formatDistanceToNow(new Date(folder.updated_at), {
    addSuffix: true,
    locale: de,
  })

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-4 transition-colors",
        "hover:bg-accent cursor-pointer"
      )}
      onClick={() => onOpen(folder.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(folder.id)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ordner ${folder.name} öffnen`}
    >
      {/* Folder Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
        <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Folder Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{folder.name}</h3>
          {folder.is_system_default && (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        {folder.description && (
          <p className="truncate text-sm text-muted-foreground">
            {folder.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Aktualisiert {formattedDate}
        </p>
      </div>

      {/* Actions Menu (Vorstand only) */}
      {isVorstand && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ordner-Aktionen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRename && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRename(folder.id)
                }}
              >
                Umbenennen
              </DropdownMenuItem>
            )}
            {canMove && onMove && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onMove(folder.id)
                }}
              >
                Verschieben
              </DropdownMenuItem>
            )}
            {(onRename || canMove) && canDelete && <DropdownMenuSeparator />}
            {canDelete && onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(folder.id)
                }}
              >
                Löschen
              </DropdownMenuItem>
            )}
            {folder.is_system_default && (
              <DropdownMenuItem disabled>
                System-Ordner (nicht löschbar)
              </DropdownMenuItem>
            )}
            {!canDelete && !folder.is_system_default && (
              <DropdownMenuItem disabled>
                {hasChildren
                  ? "Enthält Unterordner"
                  : hasDocuments
                  ? "Enthält Dokumente"
                  : "Nicht löschbar"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Empty state component for folders
export function FolderEmptyState({
  isVorstand,
  onCreateFolder,
}: {
  isVorstand: boolean
  onCreateFolder?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Folder className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-medium">Dieser Ordner ist leer</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isVorstand
          ? "Erstellen Sie einen Unterordner oder laden Sie Dokumente hoch."
          : "Hier sind noch keine Dokumente vorhanden."}
      </p>
      {isVorstand && onCreateFolder && (
        <Button onClick={onCreateFolder} className="mt-4">
          Neuer Ordner
        </Button>
      )}
    </div>
  )
}
