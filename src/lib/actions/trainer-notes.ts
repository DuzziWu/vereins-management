"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface TrainerNote {
  id: string
  group_id: string
  trainer_id: string
  title: string | null
  content: string
  training_session_id: string | null
  created_at: string
  updated_at: string
}

export interface TrainerNoteWithGroup extends TrainerNote {
  group: {
    id: string
    name: string
  }
}

export interface TrainerNoteWithSession extends TrainerNote {
  group: {
    id: string
    name: string
  }
  training_session: {
    id: string
    date: string
    start_time: string
    location: string | null
  } | null
}

export interface TrainingSessionOption {
  id: string
  date: string
  start_time: string
  location: string | null
}

/**
 * Holt alle Notizen des eingeloggten Trainers (über alle Gruppen)
 */
export async function getMyTrainerNotes(): Promise<TrainerNoteWithSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      group:groups(id, name),
      training_session:training_sessions(id, date, start_time, location)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching trainer notes:", error)
    return []
  }

  return (data || []) as TrainerNoteWithSession[]
}

/**
 * Holt alle Notizen für eine bestimmte Gruppe (chronologisch, neueste zuerst)
 */
export async function getTrainerNotesForGroup(groupId: string): Promise<TrainerNoteWithSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      group:groups(id, name),
      training_session:training_sessions(id, date, start_time, location)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching trainer notes for group:", error)
    return []
  }

  return (data || []) as TrainerNoteWithSession[]
}

/**
 * Holt eine einzelne Notiz by ID
 */
export async function getTrainerNoteById(noteId: string): Promise<TrainerNoteWithSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      group:groups(id, name),
      training_session:training_sessions(id, date, start_time, location)
    `)
    .eq("id", noteId)
    .single()

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching trainer note:", error)
    }
    return null
  }

  return data as TrainerNoteWithSession
}

/**
 * Holt vergangene Training Sessions für eine Gruppe (für Dropdown)
 */
export async function getTrainingSessionsForGroup(groupId: string): Promise<TrainingSessionOption[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, date, start_time, location")
    .eq("group_id", groupId)
    .eq("is_cancelled", false)
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(30)

  if (error) {
    console.error("Error fetching training sessions:", error)
    return []
  }

  return (data || []) as TrainingSessionOption[]
}

export interface CreateTrainerNoteInput {
  group_id: string
  title?: string | null
  content: string
  training_session_id?: string | null
}

export interface UpdateTrainerNoteInput {
  title?: string | null
  content: string
  training_session_id?: string | null
}

/**
 * Erstellt eine neue Trainer-Notiz
 */
export async function createTrainerNote(
  input: CreateTrainerNoteInput
): Promise<{ success: boolean; error?: string; note?: TrainerNote }> {
  const supabase = await createClient()

  // Validierung
  if (!input.content || input.content.length < 10) {
    return { success: false, error: "Notiz muss mindestens 10 Zeichen haben" }
  }
  if (input.content.length > 5000) {
    return { success: false, error: "Notiz darf maximal 5000 Zeichen haben" }
  }
  if (input.title && input.title.length > 100) {
    return { success: false, error: "Titel darf maximal 100 Zeichen haben" }
  }

  // Get current user's profile_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Nicht authentifiziert" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return { success: false, error: "Profil nicht gefunden" }
  }

  const { data, error } = await supabase
    .from("trainer_notes")
    .insert({
      group_id: input.group_id,
      trainer_id: profile.id,
      title: input.title || null,
      content: input.content,
      training_session_id: input.training_session_id || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating trainer note:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/trainer/groups/${input.group_id}`)
  return { success: true, note: data as TrainerNote }
}

/**
 * Aktualisiert eine bestehende Trainer-Notiz
 */
export async function updateTrainerNote(
  noteId: string,
  input: UpdateTrainerNoteInput
): Promise<{ success: boolean; error?: string; note?: TrainerNote }> {
  const supabase = await createClient()

  // Validierung
  if (!input.content || input.content.length < 10) {
    return { success: false, error: "Notiz muss mindestens 10 Zeichen haben" }
  }
  if (input.content.length > 5000) {
    return { success: false, error: "Notiz darf maximal 5000 Zeichen haben" }
  }
  if (input.title && input.title.length > 100) {
    return { success: false, error: "Titel darf maximal 100 Zeichen haben" }
  }

  const { data, error } = await supabase
    .from("trainer_notes")
    .update({
      title: input.title || null,
      content: input.content,
      training_session_id: input.training_session_id || null,
    })
    .eq("id", noteId)
    .select()
    .single()

  if (error) {
    console.error("Error updating trainer note:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/trainer/groups/${data.group_id}`)
  return { success: true, note: data as TrainerNote }
}

/**
 * @deprecated Use createTrainerNote or updateTrainerNote instead
 * Legacy function for backwards compatibility with dashboard widget
 */
export async function saveTrainerNote(
  groupId: string,
  content: string
): Promise<{ success: boolean; error?: string; note?: TrainerNote }> {
  const supabase = await createClient()

  // Verwende die DB-Funktion für Upsert (legacy behavior)
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

  // Get note to know group_id for revalidation
  const { data: note } = await supabase
    .from("trainer_notes")
    .select("group_id")
    .eq("id", noteId)
    .single()

  const { error } = await supabase
    .from("trainer_notes")
    .delete()
    .eq("id", noteId)

  if (error) {
    console.error("Error deleting trainer note:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  if (note) {
    revalidatePath(`/trainer/groups/${note.group_id}`)
  }
  return { success: true }
}

/**
 * Sucht in Notizen für eine Gruppe (Client-side Filterung empfohlen, dies ist für Server-side)
 */
export async function searchTrainerNotes(
  groupId: string,
  searchTerm: string
): Promise<TrainerNoteWithSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trainer_notes")
    .select(`
      *,
      group:groups(id, name),
      training_session:training_sessions(id, date, start_time, location)
    `)
    .eq("group_id", groupId)
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error searching trainer notes:", error)
    return []
  }

  return (data || []) as TrainerNoteWithSession[]
}
