"use client"

import { useState, useCallback, useEffect } from "react"
import { Users, CalendarDays, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { GroupNotesList } from "./group-notes-list"
import {
  getTrainerNotesForGroup,
  getTrainingSessionsForGroup,
  type TrainerNoteWithSession,
  type TrainingSessionOption,
} from "@/lib/actions"

interface GroupMember {
  id: string
  first_name: string
  last_name: string
}

interface CoTrainer {
  id: string
  first_name: string
  last_name: string
}

interface GroupDetailTabsProps {
  groupId: string
  members: GroupMember[]
  coTrainers: CoTrainer[]
  isTrainer: boolean // User is main trainer or co-trainer
}

export function GroupDetailTabs({
  groupId,
  members,
  coTrainers,
  isTrainer,
}: GroupDetailTabsProps) {
  const [notes, setNotes] = useState<TrainerNoteWithSession[]>([])
  const [sessions, setSessions] = useState<TrainingSessionOption[]>([])
  const [notesLoading, setNotesLoading] = useState(true)

  // Load notes and sessions when tab is accessed
  const loadNotesData = useCallback(async () => {
    setNotesLoading(true)
    try {
      const [notesData, sessionsData] = await Promise.all([
        getTrainerNotesForGroup(groupId),
        getTrainingSessionsForGroup(groupId),
      ])
      setNotes(notesData)
      setSessions(sessionsData)
    } catch (error) {
      console.error("Error loading notes data:", error)
    } finally {
      setNotesLoading(false)
    }
  }, [groupId])

  // Initial load for notes
  useEffect(() => {
    if (isTrainer) {
      loadNotesData()
    }
  }, [isTrainer, loadNotesData])

  const handleNotesRefresh = async () => {
    const notesData = await getTrainerNotesForGroup(groupId)
    setNotes(notesData)
  }

  const sortedMembers = [...members].sort((a, b) =>
    a.last_name.localeCompare(b.last_name)
  )

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-4">
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Mitglieder</span>
          <Badge variant="secondary" className="ml-1">
            {members.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="training" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Training</span>
        </TabsTrigger>
        {isTrainer && (
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Meine Notizen</span>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Members Tab */}
      <TabsContent value="members" className="space-y-4">
        {/* Co-Trainers */}
        {coTrainers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Co-Trainer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {coTrainers.map((ct) => (
                  <Badge key={ct.id} variant="secondary">
                    {ct.first_name} {ct.last_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Mitglieder ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Keine Mitglieder in dieser Gruppe.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        {member.first_name} {member.last_name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Training Tab */}
      <TabsContent value="training">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Training-Übersicht und Anwesenheit wird in Kürze verfügbar sein.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notes Tab (only for trainers) */}
      {isTrainer && (
        <TabsContent value="notes">
          {notesLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <GroupNotesList
              groupId={groupId}
              initialNotes={notes}
              trainingSessions={sessions}
              onRefresh={handleNotesRefresh}
            />
          )}
        </TabsContent>
      )}
    </Tabs>
  )
}
