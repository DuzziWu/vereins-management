"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Users, Search, ChevronRight, ChevronLeft, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { cn } from "@/lib/utils"

interface GroupWithMembers {
  id: string
  name: string
  members: {
    id: string
    first_name: string
    last_name: string
  }[]
}

interface EventAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
  onSuccess?: () => void
}

type Step = "groups" | "members"

export function EventAssignmentDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onSuccess,
}: EventAssignmentDialogProps) {
  const [step, setStep] = useState<Step>("groups")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch groups with members and existing assignments
  useEffect(() => {
    if (!open) return

    async function loadData() {
      setIsLoading(true)
      try {
        const [groupsRes, assignmentsRes] = await Promise.all([
          fetch("/api/groups/with-members"),
          fetch(`/api/events/${eventId}/assignments`),
        ])

        let loadedGroups: GroupWithMembers[] = []
        if (groupsRes.ok) {
          const groupsJson = await groupsRes.json()
          loadedGroups = groupsJson.groups || []
          setGroups(loadedGroups)
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          const existingIds = new Set<string>(
            (assignmentsData.assignments || []).map((a: { profile_id: string }) => a.profile_id)
          )
          setExistingAssignments(existingIds)
          setSelectedMemberIds(existingIds)

          // Pre-select groups that have assigned members
          const groupsWithAssignedMembers = new Set<string>()
          for (const group of loadedGroups) {
            for (const member of group.members) {
              if (existingIds.has(member.id)) {
                groupsWithAssignedMembers.add(group.id)
                break
              }
            }
          }
          setSelectedGroupIds(groupsWithAssignedMembers)
        }
      } catch {
        toast.error("Fehler beim Laden der Gruppen")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [open, eventId])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("groups")
      setSearchQuery("")
    }
  }, [open])

  // Get all members from selected groups
  const availableMembers = useMemo(() => {
    const memberMap = new Map<string, { id: string; first_name: string; last_name: string; groups: string[] }>()

    groups
      .filter((g) => selectedGroupIds.has(g.id))
      .forEach((group) => {
        group.members.forEach((member) => {
          if (memberMap.has(member.id)) {
            memberMap.get(member.id)!.groups.push(group.name)
          } else {
            memberMap.set(member.id, { ...member, groups: [group.name] })
          }
        })
      })

    return Array.from(memberMap.values()).sort((a, b) =>
      a.last_name.localeCompare(b.last_name)
    )
  }, [groups, selectedGroupIds])

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return availableMembers
    const query = searchQuery.toLowerCase()
    return availableMembers.filter(
      (m) =>
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query)
    )
  }, [availableMembers, searchQuery])

  // Auto-select all members when moving to step 2
  useEffect(() => {
    if (step === "members") {
      // Only auto-select members that aren't already assigned
      const newMemberIds = new Set(selectedMemberIds)
      availableMembers.forEach((m) => {
        if (!existingAssignments.has(m.id)) {
          newMemberIds.add(m.id)
        }
      })
      setSelectedMemberIds(newMemberIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, availableMembers])

  function handleGroupToggle(groupId: string) {
    const newSelected = new Set(selectedGroupIds)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroupIds(newSelected)
  }

  function handleMemberToggle(memberId: string) {
    const newSelected = new Set(selectedMemberIds)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMemberIds(newSelected)
  }

  function handleSelectAllMembers() {
    const newSelected = new Set(selectedMemberIds)
    filteredMembers.forEach((m) => newSelected.add(m.id))
    setSelectedMemberIds(newSelected)
  }

  function handleDeselectAllMembers() {
    const newSelected = new Set(selectedMemberIds)
    filteredMembers.forEach((m) => newSelected.delete(m.id))
    setSelectedMemberIds(newSelected)
  }

  async function handleSubmit() {
    if (selectedMemberIds.size === 0) {
      toast.warning("Keine Teilnehmer ausgewählt")
      return
    }

    setIsSubmitting(true)
    try {
      // Build assignments with group association
      const assignments: { profile_id: string; group_id: string | null }[] = []
      const addedMemberIds = new Set<string>()

      groups.forEach((group) => {
        if (!selectedGroupIds.has(group.id)) return
        group.members.forEach((member) => {
          if (selectedMemberIds.has(member.id) && !addedMemberIds.has(member.id)) {
            assignments.push({ profile_id: member.id, group_id: group.id })
            addedMemberIds.add(member.id)
          }
        })
      })

      const response = await fetch(`/api/events/${eventId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Fehler beim Speichern")
      }

      toast.success(`${assignments.length} Teilnehmer zugewiesen`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMembersFromCurrentGroups = availableMembers.filter((m) =>
    selectedMemberIds.has(m.id)
  ).length

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {step === "groups" ? "Gruppen auswählen" : "Mitglieder auswählen"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === "groups"
              ? `Wähle die Gruppen für "${eventTitle}"`
              : `Wähle die Teilnehmer aus den ausgewählten Gruppen`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        ) : step === "groups" ? (
          // Step 1: Group Selection
          <ScrollArea className="h-[300px] py-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Keine Gruppen verfügbar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedGroupIds.has(group.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedGroupIds.has(group.id)}
                        onCheckedChange={() => handleGroupToggle(group.id)}
                      />
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.members.length} Mitglieder
                        </p>
                      </div>
                    </div>
                    {selectedGroupIds.has(group.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          // Step 2: Member Selection
          <div className="py-4 space-y-4">
            {/* Search and Select All */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Mitglied suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedMembersFromCurrentGroups} von {availableMembers.length} ausgewählt
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllMembers}
                >
                  Alle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllMembers}
                >
                  Keine
                </Button>
              </div>
            </div>

            {/* Members List */}
            <ScrollArea className="h-[250px]">
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Keine Treffer" : "Keine Mitglieder in den ausgewählten Gruppen"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center justify-between rounded-md p-2 cursor-pointer transition-colors",
                        selectedMemberIds.has(member.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleMemberToggle(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedMemberIds.has(member.id)}
                          onCheckedChange={() => handleMemberToggle(member.id)}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.groups.length > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {member.groups.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {existingAssignments.has(member.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Bereits eingeladen
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <ResponsiveDialogFooter className="gap-2">
          {step === "groups" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => setStep("members")}
                disabled={selectedGroupIds.size === 0}
              >
                Weiter
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("groups")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Speichern
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
