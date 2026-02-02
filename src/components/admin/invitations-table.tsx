"use client"

import * as React from "react"
import { MoreHorizontal, Mail, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { revokeInvitation, resendInvitation } from "@/lib/actions"
import { useRouter } from "next/navigation"

export interface Invitation {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "vorstand" | "trainer" | "mitglied"
  status: "pending" | "accepted" | "expired" | "revoked"
  createdAt: string
  expiresAt: string
}

interface InvitationsTableProps {
  invitations: Invitation[]
}

const roleLabels: Record<string, string> = {
  vorstand: "Vorstand",
  trainer: "Trainer",
  mitglied: "Mitglied",
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Ausstehend", variant: "secondary", icon: Clock },
  accepted: { label: "Angenommen", variant: "default", icon: CheckCircle },
  expired: { label: "Abgelaufen", variant: "outline", icon: XCircle },
  revoked: { label: "Widerrufen", variant: "destructive", icon: XCircle },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const router = useRouter()
  const [revokeId, setRevokeId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState<string | null>(null)

  async function handleResend(id: string) {
    setIsLoading(id)
    try {
      await resendInvitation(id)
      router.refresh()
    } finally {
      setIsLoading(null)
    }
  }

  async function handleRevoke() {
    if (!revokeId) return
    setIsLoading(revokeId)
    try {
      await revokeInvitation(revokeId)
      router.refresh()
    } finally {
      setIsLoading(null)
      setRevokeId(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Einladungen</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Es wurden noch keine Einladungen versendet.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Erstellt</TableHead>
              <TableHead className="hidden lg:table-cell">Gültig bis</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const status = statusConfig[invitation.status]
              const StatusIcon = status.icon
              const isPending = invitation.status === "pending"

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.firstName} {invitation.lastName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(invitation.createdAt)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(invitation.expiresAt)}</TableCell>
                  <TableCell>
                    {isPending && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLoading === invitation.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Aktionen</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResend(invitation.id)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Erneut senden
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRevokeId(invitation.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Widerrufen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einladung widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Einladungslink
              wird ungültig und der User kann sich nicht mehr registrieren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
