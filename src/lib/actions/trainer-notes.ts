"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface TrainerNote {
  id: string
  group_id: string
  trainer_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface TrainerNoteWithGroup extends TrainerNote {
  group: {
    id: string
    name: string
  }
}

/**
 * Holt alle Notizen des eingeloggten Trainers
 */
export async function getMyTrainerNotes(): Promise<TrainerNoteWithGroup[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      group:groups(id, name)
    `)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching trainer notes:", error)
    return []
  }

  return (data || []) as TrainerNoteWithGroup[]
}

/**
 * Holt eine einzelne Notiz für eine bestimmte Gruppe
 */
export async function getTrainerNoteForGroup(groupId: string): Promise<TrainerNote | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select("*")
    .eq("group_id", groupId)
    .single()

  if (error) {
    // PGRST116 = No rows found - das ist ok
    if (error.code !== "PGRST116") {
      console.error("Error fetching trainer note:", error)
    }
    return null
  }

  return data as TrainerNote
}

/**
 * Speichert oder aktualisiert eine Trainer-Notiz (Upsert)
 * Verwendet die DB-Funktion für Autosave
 */
export async function saveTrainerNote(
  groupId: string,
  content: string
): Promise<{ success: boolean; error?: string; note?: TrainerNote }> {
  const supabase = await createClient()

  // Verwende die DB-Funktion für Upsert
  const { data, error } = await supabase.rpc("upsert_trainer_note", {
    p_group_id: groupId,
    p_content: content,
  })

  if (error) {
    console.error("Error saving trainer note:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, note: data as TrainerNote }
}

/**
 * Löscht eine Trainer-Notiz
 */
export async function deleteTrainerNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("trainer_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("Error deleting trainer note:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
