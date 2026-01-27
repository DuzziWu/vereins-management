"use client"

import * as React from "react"
import { Loader2, UserPlus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/validations/membership-type"

export interface MemberWithoutFee {
  id: string
  type: "individual" | "family"
  name: string
  membershipTypeName: string | null
  annualFee: number
  familyId?: string
}

interface AddSingleFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  membersWithoutFee: MemberWithoutFee[]
  isLoading: boolean
  onAdd: (memberIds: string[], familyIds: string[]) => Promise<void>
}

export function AddSingleFeeDialog({
  open,
  onOpenChange,
  year,
  membersWithoutFee,
  isLoading,
  onAdd,
}: AddSingleFeeDialogProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set())
    }
  }, [open])

  function handleToggle(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  function handleSelectAll() {
    if (selectedIds.size === membersWithoutFee.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(membersWithoutFee.map((m) => m.id)))
    }
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) return

    setIsSubmitting(true)
    try {
      const selectedMembers = membersWithoutFee.filter((m) => selectedIds.has(m.id))
      const memberIds = selectedMembers
        .filter((m) => m.type === "individual")
        .map((m) => m.id)
      const familyIds = selectedMembers
        .filter((m) => m.type === "family")
        .map((m) => m.familyId!)

      await onAdd(memberIds, familyIds)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = membersWithoutFee
    .filter((m) => selectedIds.has(m.id))
    .reduce((sum, m) => sum + m.annualFee, 0)

  const individuals = membersWithoutFee.filter((m) => m.type === "individual")
  const families = membersWithoutFee.filter((m) => m.type === "family")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Beitrag hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie Mitglieder oder Familien ohne Beitrag für {year} aus.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : membersWithoutFee.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Alle Beiträge vorhanden</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Für alle aktiven Mitglieder wurden bereits Beiträge für {year} generiert.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                {selectedIds.size === membersWithoutFee.length
                  ? "Keine auswählen"
                  : "Alle auswählen"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} ausgewählt
              </span>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {families.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Familien
                    </h4>
                    <div className="space-y-2">
                      {families.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedIds.has(member.id)}
                              onCheckedChange={() => handleToggle(member.id)}
                            />
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.membershipTypeName || "Keine Beitragsart"}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium tabular-nums">
                            {formatCurrency(member.annualFee)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {individuals.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Einzelmitglieder
                    </h4>
                    <div className="space-y-2">
                      {individuals.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedIds.has(member.id)}
                              onCheckedChange={() => handleToggle(member.id)}
                            />
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.membershipTypeName || "Keine Beitragsart"}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium tabular-nums">
                            {formatCurrency(member.annualFee)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Gesamt:</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0 || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Hinzufügen...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {selectedIds.size} Beitrag{selectedIds.size !== 1 ? "e" : ""} hinzufügen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
