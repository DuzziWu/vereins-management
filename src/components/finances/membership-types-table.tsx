"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Trash2, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { formatCurrency } from "@/lib/validations/membership-type"

export interface MembershipTypeWithCount {
  id: string
  name: string
  annual_fee: number
  description: string | null
  member_count: number
  created_at: string | null
  updated_at: string | null
}

interface MembershipTypesTableProps {
  membershipTypes: MembershipTypeWithCount[]
  onEdit: (membershipType: MembershipTypeWithCount) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function MembershipTypesTable({
  membershipTypes,
  onEdit,
  onDelete,
  isLoading,
}: MembershipTypesTableProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<MembershipTypeWithCount | null>(null)

  function handleDeleteConfirm() {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (membershipTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Noch keine Beitragsarten definiert</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Erstellen Sie Ihre erste Beitragsart, um Mitgliedern Jahresbeiträge zuzuweisen.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Jahresbetrag</TableHead>
              <TableHead className="hidden md:table-cell">Beschreibung</TableHead>
              <TableHead className="text-right">Mitglieder</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membershipTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(type.annual_fee)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {type.description || "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {type.member_count}
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
                      <DropdownMenuItem onClick={() => onEdit(type)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(type)}
                        className="text-destructive focus:text-destructive"
                        disabled={type.member_count > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Beitragsart &quot;{deleteTarget?.name}&quot; wirklich löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.member_count > 0 ? (
                <span className="text-destructive">
                  Beitragsart kann nicht gelöscht werden. {deleteTarget.member_count} Mitglied
                  {deleteTarget.member_count > 1 ? "er haben" : " hat"} diese Beitragsart zugewiesen.
                </span>
              ) : (
                "Diese Aktion kann nicht rückgängig gemacht werden. Die Beitragsart wird dauerhaft gelöscht."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            {deleteTarget && deleteTarget.member_count === 0 && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
