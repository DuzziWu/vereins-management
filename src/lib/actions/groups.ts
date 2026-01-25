"use server"

import { createClient } from "@/lib/supabase/server"

export interface Group {
  id: string
  name: string
  description: string | null
  trainer_id: string | null
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
}

/**
 * Holt alle Gruppen (für Vorstand)
 */
export async function getAllGroups(): Promise<GroupWithTrainer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("Error fetching groups:", error)
    return []
  }

  return (data || []) as GroupWithTrainer[]
}

/**
 * Holt Gruppen eines bestimmten Trainers
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

  // Trainer sieht nur eigene Gruppen
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .eq("trainer_id", profile.id)
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error("Error fetching my groups:", error)
    return []
  }

  return (data || []) as GroupWithTrainer[]
}

/**
 * Holt eine einzelne Gruppe
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

  return data as GroupWithTrainer
}
