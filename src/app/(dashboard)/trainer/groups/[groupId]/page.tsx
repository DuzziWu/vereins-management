import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  UserCheck,
  MessageCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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

interface PageProps {
  params: Promise<{ groupId: string }>
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function TrainerGroupDetailPage({ params }: PageProps) {
  const { groupId } = await params

  // Validate groupId is a valid UUID before querying the database
  if (!groupId || !UUID_REGEX.test(groupId)) {
    redirect("/trainer/groups")
  }

  const profile = await getMyProfile()

  if (!profile) {
    redirect("/login")
  }

  if (profile.role !== "trainer" && profile.role !== "vorstand") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Fetch group details with trainer info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase
    .from("groups")
    .select(
      `
      id,
      name,
      description,
      training_day,
      training_start_time,
      training_end_time,
      training_location,
      max_members,
      chat_enabled,
      is_active,
      trainer_id,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `
    )
    .eq("id", groupId)
    .single() as any)

  if (groupError || !group) {
    redirect("/trainer/groups")
  }

  // Ownership verification: check user is trainer, co-trainer, or vorstand
  const isMainTrainer = group.trainer_id === profile.id

  let isCoTrainer = false
  if (!isMainTrainer && profile.role !== "vorstand") {
    const { data: coTrainerEntry } = await supabase
      .from("group_trainers")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profile.id)
      .maybeSingle()

    isCoTrainer = !!coTrainerEntry

    if (!isCoTrainer) {
      redirect("/trainer/groups")
    }
  }

  // Fetch co-trainers and members in parallel
  const [coTrainersResult, membersResult] = await Promise.all([
    supabase
      .from("group_trainers")
      .select(
        "profile:profiles!group_trainers_profile_id_fkey(id, first_name, last_name)"
      )
      .eq("group_id", groupId),
    supabase
      .from("group_members")
      .select(
        "profile:profiles!group_members_profile_id_fkey(id, first_name, last_name)"
      )
      .eq("group_id", groupId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coTrainers = (coTrainersResult.data || [])
    .map((ct: any) => ct.profile)
    .filter(Boolean) as { id: string; first_name: string; last_name: string }[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (membersResult.data || [])
    .map((m: any) => m.profile)
    .filter(Boolean) as { id: string; first_name: string; last_name: string }[]

  const trainer = group.trainer as {
    id: string
    first_name: string
    last_name: string
  } | null

  const dayName = group.training_day || null

  const timeRange =
    group.training_start_time && group.training_end_time
      ? `${group.training_start_time.slice(0, 5)}\u2013${group.training_end_time.slice(0, 5)}`
      : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/trainer/groups" aria-label="Zurueck zur Gruppenuebersicht">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold sm:text-3xl truncate">
                {group.name}
              </h1>
              {!group.is_active && (
                <Badge variant="secondary">Inaktiv</Badge>
              )}
            </div>
            {group.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
        </div>
        {group.chat_enabled && (
          <Button variant="outline" className="shrink-0 self-start sm:self-auto" asChild>
            <Link href={`/trainer/groups/${group.id}/chat`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Gruppen-Chat
            </Link>
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trainer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                {trainer
                  ? `${trainer.first_name} ${trainer.last_name}`
                  : "Nicht zugewiesen"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trainingszeit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                {dayName && timeRange
                  ? `${dayName}, ${timeRange}`
                  : dayName || timeRange || "Noch nicht festgelegt"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trainingsort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                {group.training_location || "Kein Ort festgelegt"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mitglieder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">
                {members.length}
                {group.max_members ? ` / ${group.max_members}` : ""} Mitglieder
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {members
                  .sort((a, b) => a.last_name.localeCompare(b.last_name))
                  .map((member) => (
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
    </div>
  )
}
