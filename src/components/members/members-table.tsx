"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, UserX, UserCheck, Users, UsersRound, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { MemberStatusBadge } from "./member-status-badge"
import { ROLE_LABELS, ROLE_VARIANTS, MemberStatus } from "@/lib/validations/member"

export type SortColumn = "last_name" | "first_name" | "role" | "status" | "created_at"
export type SortOrder = "asc" | "desc"

export interface SortConfig {
  column: SortColumn
  order: SortOrder
}

export interface Member {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  role: string
  status: MemberStatus
  family_id?: string | null
  family_name?: string | null
  date_of_birth?: string | null
  phone?: string | null
  address_street?: string | null
  address_zip?: string | null
  address_city?: string | null
  functional_tags?: string[] | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
  families?: {
    id: string
    name: string
    primary_member_id: string | null
  } | null
}

interface Family {
  id: string
  name: string
}

interface MembersTableProps {
  members: Member[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEdit: (member: Member) => void
  onStatusChange: (id: string, newStatus: MemberStatus) => void
  onBulkStatusChange?: (ids: string[], newStatus: MemberStatus) => void
  onAssignToFamily?: (memberId: string, familyId: string) => void
  families?: Family[]
  sortConfig?: SortConfig
  onSortChange?: (config: SortConfig) => void
  isLoading?: boolean
}

export function MembersTable({
  members,
  selectedIds,
  onSelectionChange,
  onEdit,
  onStatusChange,
  onBulkStatusChange,
  onAssignToFamily,
  families = [],
  sortConfig,
  onSortChange,
  isLoading,
}: MembersTableProps) {
  const [statusChangeTarget, setStatusChangeTarget] = React.useState<{
    id: string
    name: string
    newStatus: MemberStatus
  } | null>(null)

  const [bulkStatusChangeTarget, setBulkStatusChangeTarget] = React.useState<{
    ids: string[]
    newStatus: MemberStatus
  } | null>(null)

  const [familyAssignTarget, setFamilyAssignTarget] = React.useState<{
    memberId: string
    memberName: string
  } | null>(null)

  function handleSort(column: SortColumn) {
    if (!onSortChange) return

    const newOrder: SortOrder =
      sortConfig?.column === column && sortConfig.order === "asc"
        ? "desc"
        : "asc"

    onSortChange({ column, order: newOrder })
  }

  function getSortIcon(column: SortColumn) {
    if (sortConfig?.column !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
    }
    return sortConfig.order === "asc"
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  function handleBulkStatusConfirm() {
    if (bulkStatusChangeTarget && onBulkStatusChange) {
      onBulkStatusChange(bulkStatusChangeTarget.ids, bulkStatusChangeTarget.newStatus)
      setBulkStatusChangeTarget(null)
      onSelectionChange([])
    }
  }

  function handleFamilyAssign(familyId: string) {
    if (familyAssignTarget && onAssignToFamily) {
      onAssignToFamily(familyAssignTarget.memberId, familyId)
      setFamilyAssignTarget(null)
    }
  }

  const allSelected = members.length > 0 && selectedIds.length === members.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < members.length

  function handleSelectAll(checked: boolean) {
    onSelectionChange(checked ? members.map((m) => m.id) : [])
  }

  function handleSelectOne(id: string, checked: boolean) {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  function handleStatusChangeConfirm() {
    if (statusChangeTarget) {
      onStatusChange(statusChangeTarget.id, statusChangeTarget.newStatus)
      setStatusChangeTarget(null)
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Mitglieder gefunden</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Passen Sie Ihre Suchkriterien an oder legen Sie ein neues Mitglied an.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && onBulkStatusChange && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} Mitglied{selectedIds.length > 1 ? "er" : ""} ausgewählt
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setBulkStatusChangeTarget({
                ids: selectedIds,
                newStatus: "inactive",
              })
            }
          >
            <UserX className="mr-2 h-4 w-4" />
            Ausgewählte deaktivieren
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Auswahl aufheben
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement).dataset.state = someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Alle auswählen"
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("last_name")}
                >
                  Name
                  {getSortIcon("last_name")}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">E-Mail</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("role")}
                >
                  Rolle
                  {getSortIcon("role")}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Familie</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {getSortIcon("status")}
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isActive = member.status === "active"
              const isSelected = selectedIds.includes(member.id)

              return (
                <TableRow
                  key={member.id}
                  className={member.status === "inactive" ? "opacity-60" : ""}
                  data-state={isSelected ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(member.id, !!checked)}
                      aria-label={`${member.first_name} ${member.last_name} auswählen`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {member.first_name} {member.last_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {member.email || "–"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[member.role] || "outline"}>
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {member.family_name || "–"}
                  </TableCell>
                  <TableCell>
                    <MemberStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aktionen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(member)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        {families.length > 0 && onAssignToFamily && (
                          <DropdownMenuItem
                            onClick={() =>
                              setFamilyAssignTarget({
                                memberId: member.id,
                                memberName: `${member.first_name} ${member.last_name}`,
                              })
                            }
                          >
                            <UsersRound className="mr-2 h-4 w-4" />
                            Zur Familie hinzufügen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {isActive ? (
                          <DropdownMenuItem
                            onClick={() =>
                              setStatusChangeTarget({
                                id: member.id,
                                name: `${member.first_name} ${member.last_name}`,
                                newStatus: "inactive",
                              })
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deaktivieren
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              setStatusChangeTarget({
                                id: member.id,
                                name: `${member.first_name} ${member.last_name}`,
                                newStatus: "active",
                              })
                            }
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Aktivieren
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Single Member Status Change Dialog */}
      <AlertDialog
        open={!!statusChangeTarget}
        onOpenChange={() => setStatusChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mitglied {statusChangeTarget?.newStatus === "inactive" ? "deaktivieren" : "aktivieren"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeTarget?.newStatus === "inactive" ? (
                <>
                  <strong>{statusChangeTarget?.name}</strong> wird deaktiviert und kann sich nicht mehr einloggen.
                  Die Daten bleiben für Buchhaltung und Historie erhalten.
                </>
              ) : (
                <>
                  <strong>{statusChangeTarget?.name}</strong> wird aktiviert und erhält wieder Zugang zum System.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChangeConfirm}
              className={
                statusChangeTarget?.newStatus === "inactive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {statusChangeTarget?.newStatus === "inactive" ? "Deaktivieren" : "Aktivieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change Dialog */}
      <AlertDialog
        open={!!bulkStatusChangeTarget}
        onOpenChange={() => setBulkStatusChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkStatusChangeTarget?.ids.length} Mitglieder deaktivieren?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Die ausgewählten Mitglieder werden deaktiviert und können sich nicht mehr einloggen.
              Die Daten bleiben für Buchhaltung und Historie erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkStatusChangeTarget?.ids.length} Mitglieder deaktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Family Assignment Dialog */}
      <AlertDialog
        open={!!familyAssignTarget}
        onOpenChange={() => setFamilyAssignTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Familie auswählen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Wählen Sie eine Familie für <strong>{familyAssignTarget?.memberName}</strong>:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            {families.map((family) => (
              <Button
                key={family.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleFamilyAssign(family.id)}
              >
                <UsersRound className="mr-2 h-4 w-4" />
                {family.name}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
