"use server"

import { createClient } from "@/lib/supabase/server"

export interface Group {
  id: string
  name: string
  description: string | null
  trainer_id: string | null
  training_day: string | null
  training_start_time: string | null
  training_end_time: string | null
  training_location: string | null
  max_members: number | null
  chat_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GroupWithTrainer extends Group {
  trainer: {
    id: string
    first_name: string
    last_name: string
  } | null
  member_count?: number
  age_range?: string
  co_trainers?: {
    id: string
    first_name: string
    last_name: string
  }[]
}

export interface TrainerProfile {
  id: string
  first_name: string
  last_name: string
}

export interface ActiveProfile {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  functional_tags: string[] | null
}

// Helper: calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  return age
}

/**
 * Holt alle Gruppen (für Vorstand) inkl. Mitgliederanzahl und Altersbereich
 * BUG-12: Kein is_active Filter - Vorstand sieht auch deaktivierte Gruppen
 */
export async function getAllGroups(): Promise<GroupWithTrainer[]> {
  const supabase = await createClient()

  // BUG-12: Don't filter by is_active - Vorstand needs to see all groups
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .order("name")

  if (error) {
    console.error("Error fetching groups:", error)
    return []
  }

  const groups = (data || []) as GroupWithTrainer[]
  if (groups.length === 0) return []

  // BUG-11: Batch fetch member data and co-trainers (avoids N+1 queries)
  const groupIds = groups.map(g => g.id)

  const [membersResult, coTrainersResult] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id, profile:profiles!group_members_profile_id_fkey(date_of_birth)")
      .in("group_id", groupIds),
    supabase
      .from("group_trainers")
      .select("group_id, profile:profiles!group_trainers_profile_id_fkey(id, first_name, last_name)")
      .in("group_id", groupIds),
  ])

  // Build per-group member data
  const membersByGroup = new Map<string, { count: number; ages: number[] }>()
  for (const gm of (membersResult.data || [])) {
    const groupId = gm.group_id
    if (!membersByGroup.has(groupId)) {
      membersByGroup.set(groupId, { count: 0, ages: [] })
    }
    const entry = membersByGroup.get(groupId)!
    entry.count++
    const memberProfile = gm.profile as { date_of_birth: string | null } | null
    if (memberProfile?.date_of_birth) {
      entry.ages.push(calculateAge(memberProfile.date_of_birth))
    }
  }

  // Build per-group co-trainer data
  const coTrainersByGroup = new Map<string, TrainerProfile[]>()
  for (const ct of (coTrainersResult.data || [])) {
    const groupId = ct.group_id
    if (!coTrainersByGroup.has(groupId)) {
      coTrainersByGroup.set(groupId, [])
    }
    const trainerProfile = ct.profile as TrainerProfile | null
    if (trainerProfile) {
      coTrainersByGroup.get(groupId)!.push(trainerProfile)
    }
  }

  return groups.map((group) => {
    const memberData = membersByGroup.get(group.id)
    const memberCount = memberData?.count ?? 0
    let ageRange = "Keine Mitglieder"

    if (memberData && memberData.ages.length > 0) {
      const minAge = Math.min(...memberData.ages)
      const maxAge = Math.max(...memberData.ages)
      ageRange = minAge === maxAge ? `${minAge} Jahre` : `${minAge} - ${maxAge} Jahre`
    }

    return {
      ...group,
      member_count: memberCount,
      age_range: ageRange,
      co_trainers: coTrainersByGroup.get(group.id) || [],
    }
  })
}

/**
 * Holt Gruppen eines bestimmten Trainers (inkl. Co-Trainer-Zuordnung)
 */
export async function getMyGroups(): Promise<GroupWithTrainer[]> {
  const supabase = await createClient()

  // Hole zuerst den User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Hole die Profile ID des Users
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return []
  }

  // Vorstand sieht alle Gruppen
  if (profile.role === "vorstand") {
    return getAllGroups()
  }

  // Trainer sieht Gruppen wo er Trainer oder Co-Trainer ist
  if (profile.role === "trainer") {
    // Get groups where user is main trainer
    const { data: trainerGroups } = await supabase
      .from("groups")
      .select(`
        *,
        trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
      `)
      .eq("trainer_id", profile.id)
      .eq("is_active", true)

    // Get groups where user is co-trainer
    const { data: coTrainerGroupIds } = await supabase
      .from("group_trainers")
      .select("group_id")
      .eq("profile_id", profile.id)

    let coTrainerGroups: GroupWithTrainer[] = []
    if (coTrainerGroupIds && coTrainerGroupIds.length > 0) {
      const ids = coTrainerGroupIds.map((ct) => ct.group_id)
      const { data } = await supabase
        .from("groups")
        .select(`
          *,
          trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
        `)
        .in("id", ids)
        .eq("is_active", true)

      coTrainerGroups = (data || []) as GroupWithTrainer[]
    }

    // Merge and deduplicate
    const allGroups = [...(trainerGroups || []), ...coTrainerGroups] as GroupWithTrainer[]
    const uniqueGroups = allGroups.filter(
      (group, index, self) => index === self.findIndex((g) => g.id === group.id)
    )

    // BUG-11: Batch fetch member data instead of N+1 RPC calls
    const groupIds = uniqueGroups.map(g => g.id)

    const { data: membersData } = await supabase
      .from("group_members")
      .select("group_id, profile:profiles!group_members_profile_id_fkey(date_of_birth)")
      .in("group_id", groupIds)

    const membersByGroup = new Map<string, { count: number; ages: number[] }>()
    for (const gm of (membersData || [])) {
      const groupId = gm.group_id
      if (!membersByGroup.has(groupId)) {
        membersByGroup.set(groupId, { count: 0, ages: [] })
      }
      const entry = membersByGroup.get(groupId)!
      entry.count++
      const memberProfile = gm.profile as { date_of_birth: string | null } | null
      if (memberProfile?.date_of_birth) {
        entry.ages.push(calculateAge(memberProfile.date_of_birth))
      }
    }

    return uniqueGroups.map((group) => {
      const memberData = membersByGroup.get(group.id)
      const memberCount = memberData?.count ?? 0
      let ageRange = "Keine Mitglieder"

      if (memberData && memberData.ages.length > 0) {
        const minAge = Math.min(...memberData.ages)
        const maxAge = Math.max(...memberData.ages)
        ageRange = minAge === maxAge ? `${minAge} Jahre` : `${minAge} - ${maxAge} Jahre`
      }

      return {
        ...group,
        member_count: memberCount,
        age_range: ageRange,
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }

  // Mitglied sieht nur Gruppen in denen er Mitglied ist
  const { data: memberGroupIds } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("profile_id", profile.id)

  if (!memberGroupIds || memberGroupIds.length === 0) {
    return []
  }

  const ids = memberGroupIds.map((mg) => mg.group_id)
  const { data: memberGroups, error } = await supabase
    .from("groups")
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .in("id", ids)
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("Error fetching my groups:", error)
    return []
  }

  return (memberGroups || []) as GroupWithTrainer[]
}

/**
 * Holt eine einzelne Gruppe mit allen Details
 */
export async function getGroup(groupId: string): Promise<GroupWithTrainer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .eq("id", groupId)
    .single()

  if (error) {
    console.error("Error fetching group:", error)
    return null
  }

  // Fetch co-trainers
  const { data: coTrainersData } = await supabase
    .from("group_trainers")
    .select("profile:profiles!group_trainers_profile_id_fkey(id, first_name, last_name)")
    .eq("group_id", groupId)

  // Fetch member count and age range
  const [countResult, ageResult] = await Promise.all([
    supabase.rpc("get_group_member_count", { p_group_id: groupId }),
    supabase.rpc("get_group_age_range", { p_group_id: groupId }),
  ])

  const group = data as GroupWithTrainer
  group.member_count = countResult.data ?? 0
  group.age_range = ageResult.data ?? "Keine Mitglieder"
  group.co_trainers = (coTrainersData || [])
    .map((ct: { profile: TrainerProfile | null }) => ct.profile)
    .filter(Boolean) as TrainerProfile[]

  return group
}

/**
 * Holt alle Profile mit Rolle 'trainer' oder 'vorstand' (aktiv)
 * Für Trainer-Auswahl-Dropdowns
 */
export async function getTrainerProfiles(): Promise<TrainerProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("role", ["trainer", "vorstand"])
    .eq("status", "active")
    .order("last_name")

  if (error) {
    console.error("Error fetching trainer profiles:", error)
    return []
  }

  return (data || []) as TrainerProfile[]
}

/**
 * Holt alle aktiven Profile für Mitglieder-Zuordnung
 */
export async function getActiveProfiles(): Promise<ActiveProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, date_of_birth, functional_tags")
    .eq("status", "active")
    .order("last_name")

  if (error) {
    console.error("Error fetching active profiles:", error)
    return []
  }

  return (data || []) as ActiveProfile[]
}
