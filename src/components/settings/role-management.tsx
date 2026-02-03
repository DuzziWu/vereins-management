"use client"

import * as React from "react"
import { toast } from "sonner"
import { Search, Shield, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Skeleton } from "@/components/ui/skeleton"

import {
  type MemberWithRole,
  getAllMembersWithRoles,
  updateMemberRole,
} from "@/lib/actions/role-management"
import { ROLE_LABELS, ROLE_VARIANTS } from "@/lib/validations/member"

interface PendingChange {
  member: MemberWithRole
  newRole: string
}

export function RoleManagement() {
  const [members, setMembers] = React.useState<MemberWithRole[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [pendingChange, setPendingChange] = React.useState<PendingChange | null>(null)
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  // Load members
  const fetchMembers = React.useCallback(async () => {
    try {
      const result = await getAllMembersWithRoles()
      if (!result.success || result.error) {
        toast.error(result.error || "Fehler beim Laden")
        return
      }
      setMembers(result.data || [])
    } catch {
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Filter members by search
  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members

    const query = search.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query) ||
        (m.email && m.email.toLowerCase().includes(query))
    )
  }, [members, search])

  function handleRoleSelect(member: MemberWithRole, newRole: string) {
    if (newRole === member.role) return
    setPendingChange({ member, newRole })
  }

  async function confirmRoleChange() {
    if (!pendingChange) return

    const { member, newRole } = pendingChange
    setIsUpdating(member.id)
    setPendingChange(null)

    try {
      const result = await updateMemberRole(
        member.id,
        newRole as "vorstand" | "trainer" | "mitglied"
      )
      if (!result.success) {
        toast.error(result.error || "Fehler beim Ändern der Rolle")
        return
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      )

      toast.success(
        `Rolle von ${member.first_name} ${member.last_name} zu ${ROLE_LABELS[newRole] || newRole} geändert`
      )
    } catch {
      toast.error("Fehler beim Ändern der Rolle")
    } finally {
      setIsUpdating(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Mitglieder gefunden</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Es sind noch keine aktiven Mitglieder im System vorhanden.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Mitglied suchen (Name oder E-Mail)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead className="w-[180px]">Rolle ändern</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {member.email || "–"}
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[member.role] || "outline"}>
                    {ROLE_LABELS[member.role] || member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isUpdating === member.id ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </div>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleSelect(member, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vorstand">Vorstand</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="mitglied">Mitglied</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMembers.length === 0 && search && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Keine Mitglieder gefunden für &quot;{search}&quot;
        </p>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!pendingChange}
        onOpenChange={() => setPendingChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolle ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange && (
                <>
                  Rolle von{" "}
                  <strong>
                    {pendingChange.member.first_name}{" "}
                    {pendingChange.member.last_name}
                  </strong>{" "}
                  von{" "}
                  <strong>
                    {ROLE_LABELS[pendingChange.member.role] ||
                      pendingChange.member.role}
                  </strong>{" "}
                  zu{" "}
                  <strong>
                    {ROLE_LABELS[pendingChange.newRole] ||
                      pendingChange.newRole}
                  </strong>{" "}
                  ändern?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Rolle ändern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
