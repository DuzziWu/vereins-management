"use client"

import * as React from "react"
import { ChevronDown, Pencil, Star, Trash2, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { Member } from "./members-table"

interface Family {
  id: string
  name: string
  primary_member_id: string | null
  member_count: number
}

interface FamiliesListProps {
  families: Family[]
  members: Member[]
  onEdit: (family: Family) => void
  onDelete: (familyId: string) => void
}

export function FamiliesList({ families, members, onEdit, onDelete }: FamiliesListProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<Family | null>(null)
  const [openFamilies, setOpenFamilies] = React.useState<Set<string>>(new Set())

  function toggleFamily(id: string) {
    const next = new Set(openFamilies)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setOpenFamilies(next)
  }

  function getFamilyMembers(familyId: string): Member[] {
    return members.filter((m) => m.family_id === familyId)
  }

  function handleDelete() {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (families.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UsersRound className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Keine Familien</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Erstellen Sie eine Familie, um Mitglieder zu gruppieren.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {families.map((family) => {
          const familyMembers = getFamilyMembers(family.id)
          const primaryMember = familyMembers.find((m) => m.id === family.primary_member_id)
          const isOpen = openFamilies.has(family.id)

          return (
            <Collapsible
              key={family.id}
              open={isOpen}
              onOpenChange={() => toggleFamily(family.id)}
            >
              <div className="rounded-lg border bg-card">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{family.name}</div>
                        {primaryMember && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {primaryMember.first_name} {primaryMember.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {family.member_count} Mitglieder
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(family)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Bearbeiten</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(family)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Löschen</span>
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 py-3">
                    {familyMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Keine Mitglieder in dieser Familie
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {familyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-1"
                          >
                            <div className="flex items-center gap-2">
                              {member.id === family.primary_member_id && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
                              <span>
                                {member.first_name} {member.last_name}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.role === "vorstand"
                                ? "Vorstand"
                                : member.role === "trainer"
                                ? "Trainer"
                                : "Mitglied"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Familie auflösen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Familie <strong>{deleteTarget?.name}</strong> wird aufgelöst.
              Die Mitglieder bleiben erhalten, nur die Familien-Verknüpfung wird entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Familie auflösen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
