"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen, Lock, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type { FolderWithChildren } from "./types"

interface FolderTreeProps {
  folders: FolderWithChildren[]
  selectedFolderId: string | null
  expandedFolderIds: Set<string>
  isVorstand: boolean
  isLoading?: boolean
  onFolderSelect: (folderId: string | null) => void
  onFolderExpand: (folderId: string) => void
  onFolderCollapse: (folderId: string) => void
  onFolderRename?: (folderId: string) => void
  onFolderDelete?: (folderId: string) => void
  onFolderMove?: (folderId: string) => void
  onNewSubfolder?: (parentId: string) => void
}

export function FolderTree({
  folders,
  selectedFolderId,
  expandedFolderIds,
  isVorstand,
  isLoading,
  onFolderSelect,
  onFolderExpand,
  onFolderCollapse,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  onNewSubfolder,
}: FolderTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (folders.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Keine Ordner vorhanden
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* Root level click area */}
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
          selectedFolderId === null && "bg-accent font-medium"
        )}
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span>Alle Dokumente</span>
      </button>

      {folders.map((folder) => (
        <FolderTreeNode
          key={folder.id}
          folder={folder}
          depth={0}
          selectedFolderId={selectedFolderId}
          expandedFolderIds={expandedFolderIds}
          isVorstand={isVorstand}
          onFolderSelect={onFolderSelect}
          onFolderExpand={onFolderExpand}
          onFolderCollapse={onFolderCollapse}
          onFolderRename={onFolderRename}
          onFolderDelete={onFolderDelete}
          onFolderMove={onFolderMove}
          onNewSubfolder={onNewSubfolder}
        />
      ))}
    </div>
  )
}

interface FolderTreeNodeProps {
  folder: FolderWithChildren
  depth: number
  selectedFolderId: string | null
  expandedFolderIds: Set<string>
  isVorstand: boolean
  onFolderSelect: (folderId: string | null) => void
  onFolderExpand: (folderId: string) => void
  onFolderCollapse: (folderId: string) => void
  onFolderRename?: (folderId: string) => void
  onFolderDelete?: (folderId: string) => void
  onFolderMove?: (folderId: string) => void
  onNewSubfolder?: (parentId: string) => void
}

function FolderTreeNode({
  folder,
  depth,
  selectedFolderId,
  expandedFolderIds,
  isVorstand,
  onFolderSelect,
  onFolderExpand,
  onFolderCollapse,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  onNewSubfolder,
}: FolderTreeNodeProps) {
  const isExpanded = expandedFolderIds.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children && folder.children.length > 0
  const canDelete = isVorstand && !folder.is_system_default && !hasChildren
  const canMove = isVorstand && !folder.is_system_default && folder.depth < 5

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpanded) {
      onFolderCollapse(folder.id)
    } else {
      onFolderExpand(folder.id)
    }
  }

  return (
    <Collapsible open={isExpanded}>
      <div
        className={cn(
          "group flex items-center rounded-md hover:bg-accent",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/Collapse Button */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 shrink-0",
              !hasChildren && "invisible"
            )}
            onClick={handleToggle}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </Button>
        </CollapsibleTrigger>

        {/* Folder Icon & Name */}
        <button
          className="flex flex-1 items-center gap-2 overflow-hidden py-1.5 pr-2"
          onClick={() => onFolderSelect(folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}
          <span className="truncate text-sm">{folder.name}</span>
          {folder.is_system_default && (
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </button>

        {/* Actions Menu (Vorstand only) */}
        {isVorstand && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ordner-Aktionen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {folder.depth < 5 && onNewSubfolder && (
                <DropdownMenuItem onClick={() => onNewSubfolder(folder.id)}>
                  Neuer Unterordner
                </DropdownMenuItem>
              )}
              {onFolderRename && (
                <DropdownMenuItem onClick={() => onFolderRename(folder.id)}>
                  Umbenennen
                </DropdownMenuItem>
              )}
              {canMove && onFolderMove && (
                <DropdownMenuItem onClick={() => onFolderMove(folder.id)}>
                  Verschieben
                </DropdownMenuItem>
              )}
              {(onFolderRename || canMove) && canDelete && (
                <DropdownMenuSeparator />
              )}
              {canDelete && onFolderDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onFolderDelete(folder.id)}
                >
                  Löschen
                </DropdownMenuItem>
              )}
              {folder.is_system_default && (
                <DropdownMenuItem disabled>
                  System-Ordner (nicht löschbar)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <CollapsibleContent>
          {folder.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              expandedFolderIds={expandedFolderIds}
              isVorstand={isVorstand}
              onFolderSelect={onFolderSelect}
              onFolderExpand={onFolderExpand}
              onFolderCollapse={onFolderCollapse}
              onFolderRename={onFolderRename}
              onFolderDelete={onFolderDelete}
              onFolderMove={onFolderMove}
              onNewSubfolder={onNewSubfolder}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
