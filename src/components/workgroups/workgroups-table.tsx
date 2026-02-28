"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Users, Archive, ArchiveRestore, FolderKanban } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ResponsiveTable, ResponsiveTableColumn } from "@/components/ui/responsive-table"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WorkgroupListItem, WorkgroupCategory } from "./workgroup-form"

interface WorkgroupsTableProps {
  workgroups: WorkgroupListItem[]
  onEdit: (workgroup: WorkgroupListItem) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onManageMembers: (workgroup: WorkgroupListItem) => void
  showArchived?: boolean
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), "dd.MM.yyyy", { locale: de })
}

function getCategoryBadgeColor(category: WorkgroupCategory | null): string {
  if (!category) return "secondary"

  // Color mapping based on category name
  const colorMap: Record<string, string> = {
    "Wagenbau": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Event-Planung": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Kostüme": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "Organisation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Sonstiges": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  return colorMap[category.name] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

export function WorkgroupsTable({
  workgroups,
  onEdit,
  onArchive,
  onRestore,
  onManageMembers,
  showArchived = false,
}: WorkgroupsTableProps) {
  const [archiveTarget, setArchiveTarget] = React.useState<{
    id: string
    name: string
    action: "archive" | "restore"
  } | null>(null)

  function handleArchiveConfirm() {
    if (archiveTarget) {
      if (archiveTarget.action === "archive") {
        onArchive(archiveTarget.id)
      } else {
        onRestore(archiveTarget.id)
      }
      setArchiveTarget(null)
    }
  }

  const columns: ResponsiveTableColumn<WorkgroupListItem>[] = [
    {
      header: "Name",
      accessorKey: "name",
      showOnMobile: true,
      cell: (workgroup) => (
        <span className="font-medium">{workgroup.name}</span>
      ),
    },
    {
      header: "Kategorie",
      cell: (workgroup) =>
        workgroup.category ? (
          <Badge className={getCategoryBadgeColor(workgroup.category)} variant="outline">
            {workgroup.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">–</span>
        ),
      className: "hidden md:table-cell",
    },
    {
      header: "Mitglieder",
      cell: (workgroup) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{workgroup.member_count}</span>
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      header: "Erstellt",
      cell: (workgroup) => formatDate(workgroup.created_at),
      className: "hidden xl:table-cell",
    },
    {
      header: "Status",
      showOnMobile: true,
      cell: (workgroup) => (
        <Badge variant={workgroup.status === "active" ? "default" : "secondary"}>
          {workgroup.status === "active" ? "Aktiv" : "Archiviert"}
        </Badge>
      ),
    },
    {
      header: "",
      className: "w-[50px]",
      cell: (workgroup) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aktionen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit(workgroup)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onManageMembers(workgroup)
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Mitglieder verwalten
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {workgroup.status === "active" ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setArchiveTarget({
                    id: workgroup.id,
                    name: workgroup.name,
                    action: "archive",
                  })
                }}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setArchiveTarget({
                    id: workgroup.id,
                    name: workgroup.name,
                    action: "restore",
                  })
                }}
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Wiederherstellen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (workgroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">
          {showArchived ? "Keine archivierten Workgroups" : "Keine Workgroups vorhanden"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {showArchived
            ? "Archivierte Workgroups werden hier angezeigt."
            : "Erstellen Sie eine neue Workgroup, um zu beginnen."}
        </p>
      </div>
    )
  }

  return (
    <>
      <ResponsiveTable<WorkgroupListItem>
        data={workgroups}
        columns={columns}
        keyExtractor={(workgroup) => workgroup.id}
        onRowClick={onEdit}
        emptyMessage="Keine Workgroups vorhanden."
        renderCard={(workgroup) => (
          <Card
            className="cursor-pointer transition-colors active:bg-accent"
            onClick={() => onEdit(workgroup)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{workgroup.name}</span>
                    {workgroup.category && (
                      <Badge
                        className={getCategoryBadgeColor(workgroup.category)}
                        variant="outline"
                      >
                        {workgroup.category.name}
                      </Badge>
                    )}
                    <Badge variant={workgroup.status === "active" ? "default" : "secondary"}>
                      {workgroup.status === "active" ? "Aktiv" : "Archiviert"}
                    </Badge>
                  </div>
                  {workgroup.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workgroup.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {workgroup.member_count} Mitglieder
                    </span>
                    <span>{formatDate(workgroup.created_at)}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Aktionen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(workgroup)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onManageMembers(workgroup)
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Mitglieder verwalten
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {workgroup.status === "active" ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setArchiveTarget({
                            id: workgroup.id,
                            name: workgroup.name,
                            action: "archive",
                          })
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archivieren
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setArchiveTarget({
                            id: workgroup.id,
                            name: workgroup.name,
                            action: "restore",
                          })
                        }}
                      >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Wiederherstellen
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        )}
      />

      {/* Archive/Restore Confirmation Dialog */}
      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={() => setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Workgroup {archiveTarget?.action === "archive" ? "archivieren" : "wiederherstellen"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.action === "archive" ? (
                <>
                  Die Workgroup <strong>{archiveTarget?.name}</strong> wird archiviert.
                  Mitglieder können nicht mehr darauf zugreifen.{" "}
                  <strong>Der Chat-Verlauf wird permanent gelöscht und kann nicht wiederhergestellt werden.</strong>
                </>
              ) : (
                <>
                  Die Workgroup <strong>{archiveTarget?.name}</strong> wird wiederhergestellt
                  und ist wieder für Mitglieder sichtbar.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className={
                archiveTarget?.action === "archive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {archiveTarget?.action === "archive" ? "Archivieren" : "Wiederherstellen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
