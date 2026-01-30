"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Users, UserX, UserCheck, UsersRound } from "lucide-react"

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

export interface GroupListItem {
  id: string
  name: string
  description: string | null
  trainer_id: string | null
  trainer: { id: string; first_name: string; last_name: string } | null
  member_count: number
  max_members: number | null
  age_range: string
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
  training_location: string | null
  chat_enabled: boolean
  is_active: boolean | null
}

interface GroupsTableProps {
  groups: GroupListItem[]
  onEdit: (group: GroupListItem) => void
  onToggleStatus: (id: string, newStatus: boolean) => void
  onManageMembers: (group: GroupListItem) => void
}

function formatTrainingInfo(group: GroupListItem): string {
  if (!group.training_day) return "\u2013"
  let info = group.training_day
  if (group.training_start_time && group.training_end_time) {
    info += ` ${group.training_start_time}\u2013${group.training_end_time}`
  } else if (group.training_start_time) {
    info += ` ab ${group.training_start_time}`
  }
  return info
}

function formatMemberCount(group: GroupListItem): React.ReactNode {
  const count = group.member_count
  const max = group.max_members

  if (max) {
    const isOverLimit = count > max
    return (
      <span className={isOverLimit ? "text-destructive font-medium" : ""}>
        {count}/{max}
      </span>
    )
  }

  return <span>{count}</span>
}

export function GroupsTable({
  groups,
  onEdit,
  onToggleStatus,
  onManageMembers,
}: GroupsTableProps) {
  const [statusChangeTarget, setStatusChangeTarget] = React.useState<{
    id: string
    name: string
    newStatus: boolean
  } | null>(null)

  function handleStatusChangeConfirm() {
    if (statusChangeTarget) {
      onToggleStatus(statusChangeTarget.id, statusChangeTarget.newStatus)
      setStatusChangeTarget(null)
    }
  }

  const columns: ResponsiveTableColumn<GroupListItem>[] = [
    {
      header: "Name",
      accessorKey: "name",
      showOnMobile: true,
      cell: (group) => (
        <span className="font-medium">{group.name}</span>
      ),
    },
    {
      header: "Trainer",
      cell: (group) =>
        group.trainer
          ? `${group.trainer.first_name} ${group.trainer.last_name}`
          : "\u2013",
      className: "hidden md:table-cell",
    },
    {
      header: "Mitglieder",
      cell: (group) => formatMemberCount(group),
      className: "hidden lg:table-cell",
    },
    {
      header: "Altersbereich",
      accessorKey: "age_range",
      className: "hidden lg:table-cell",
    },
    {
      header: "Training",
      cell: (group) => formatTrainingInfo(group),
      className: "hidden xl:table-cell",
    },
    {
      header: "Status",
      showOnMobile: true,
      cell: (group) => {
        const isActive = group.is_active !== false
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktiv" : "Inaktiv"}
          </Badge>
        )
      },
    },
    {
      header: "",
      className: "w-[50px]",
      cell: (group) => {
        const isActive = group.is_active !== false
        return (
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
                  onEdit(group)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onManageMembers(group)
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Mitglieder verwalten
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatusChangeTarget({
                      id: group.id,
                      name: group.name,
                      newStatus: false,
                    })
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deaktivieren
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatusChangeTarget({
                      id: group.id,
                      name: group.name,
                      newStatus: true,
                    })
                  }}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Aktivieren
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UsersRound className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Gruppen vorhanden</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Erstellen Sie eine neue Gruppe, um zu beginnen.
        </p>
      </div>
    )
  }

  return (
    <>
      <ResponsiveTable<GroupListItem>
        data={groups}
        columns={columns}
        keyExtractor={(group) => group.id}
        onRowClick={onEdit}
        emptyMessage="Keine Gruppen vorhanden."
        renderCard={(group) => {
          const isActive = group.is_active !== false
          return (
            <Card
              className="cursor-pointer transition-colors active:bg-accent"
              onClick={() => onEdit(group)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    {group.trainer && (
                      <p className="text-sm text-muted-foreground">
                        Trainer: {group.trainer.first_name} {group.trainer.last_name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatMemberCount(group)} Mitglieder</span>
                      {group.age_range && group.age_range !== "Keine Mitglieder" && (
                        <span>{group.age_range}</span>
                      )}
                    </div>
                    {group.training_day && (
                      <p className="text-sm text-muted-foreground">
                        {formatTrainingInfo(group)}
                      </p>
                    )}
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
                          onEdit(group)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onManageMembers(group)
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Mitglieder verwalten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isActive ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setStatusChangeTarget({
                              id: group.id,
                              name: group.name,
                              newStatus: false,
                            })
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Deaktivieren
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setStatusChangeTarget({
                              id: group.id,
                              name: group.name,
                              newStatus: true,
                            })
                          }}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aktivieren
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          )
        }}
      />

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={!!statusChangeTarget}
        onOpenChange={() => setStatusChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Gruppe {statusChangeTarget?.newStatus ? "aktivieren" : "deaktivieren"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeTarget?.newStatus ? (
                <>
                  Die Gruppe <strong>{statusChangeTarget?.name}</strong> wird aktiviert
                  und ist wieder sichtbar.
                </>
              ) : (
                <>
                  Die Gruppe <strong>{statusChangeTarget?.name}</strong> wird deaktiviert.
                  Mitglieder und Trainer bleiben zugeordnet.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChangeConfirm}
              className={
                !statusChangeTarget?.newStatus
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {statusChangeTarget?.newStatus ? "Aktivieren" : "Deaktivieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
