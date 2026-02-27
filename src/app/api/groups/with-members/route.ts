import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// GET /api/groups/with-members
// Lädt alle Gruppen mit ihren Mitgliedern für den Zuweisungs-Dialog
// ============================================================
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Hole Profil für Berechtigungsprüfung
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Nur Vorstand/Trainer dürfen Gruppen mit Mitgliedern sehen
  if (!["vorstand", "trainer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Hole Gruppen basierend auf Rolle
  let groupsQuery = supabase
    .from("groups")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  // Trainer sieht nur seine eigenen Gruppen
  if (profile.role === "trainer") {
    // Hole Gruppen wo User Trainer oder Co-Trainer ist
    const { data: trainerGroupIds } = await supabase
      .from("groups")
      .select("id")
      .eq("trainer_id", profile.id)
      .eq("is_active", true)

    const { data: coTrainerGroupIds } = await supabase
      .from("group_trainers")
      .select("group_id")
      .eq("profile_id", profile.id)

    const allGroupIds = [
      ...(trainerGroupIds?.map((g) => g.id) || []),
      ...(coTrainerGroupIds?.map((g) => g.group_id) || []),
    ]

    if (allGroupIds.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    groupsQuery = groupsQuery.in("id", allGroupIds)
  }

  const { data: groups, error: groupsError } = await groupsQuery

  if (groupsError) {
    console.error("Error fetching groups:", groupsError)
    return NextResponse.json({ error: groupsError.message }, { status: 500 })
  }

  if (!groups || groups.length === 0) {
    return NextResponse.json({ groups: [] })
  }

  // Hole Mitglieder für alle Gruppen
  const groupIds = groups.map((g) => g.id)

  const { data: memberships, error: membersError } = await supabase
    .from("group_members")
    .select(`
      group_id,
      profile:profiles!group_members_profile_id_fkey(id, first_name, last_name)
    `)
    .in("group_id", groupIds)

  if (membersError) {
    console.error("Error fetching members:", membersError)
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  // Gruppiere Mitglieder nach Gruppe
  const membersByGroup = new Map<
    string,
    { id: string; first_name: string; last_name: string }[]
  >()

  for (const m of memberships || []) {
    const groupId = m.group_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberProfile = m.profile as any

    if (!memberProfile) continue

    if (!membersByGroup.has(groupId)) {
      membersByGroup.set(groupId, [])
    }
    membersByGroup.get(groupId)!.push(memberProfile)
  }

  // Erstelle Ergebnis mit Mitgliedern
  const groupsWithMembers = groups.map((group) => ({
    id: group.id,
    name: group.name,
    members: (membersByGroup.get(group.id) || []).sort((a, b) =>
      a.last_name.localeCompare(b.last_name)
    ),
  }))

  return NextResponse.json({ groups: groupsWithMembers })
}
