"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface MemberWithRole {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
  status: string | null
  user_id: string | null
}

/**
 * Holt alle aktiven Mitglieder mit ihren Rollen (nur für Vorstand)
 */
export async function getAllMembersWithRoles(): Promise<{
  success: boolean
  data?: MemberWithRole[]
  error?: string
}> {
  const supabase = await createClient()

  // Vorstand-Check
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return { success: false, error: "Nur Vorstandsmitglieder können Rollen verwalten" }
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, status, user_id")
    .eq("status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })

  if (error) {
    console.error("Error fetching members with roles:", error)
    return { success: false, error: "Fehler beim Laden der Mitglieder" }
  }

  // E-Mail-Adressen aus auth.users holen (Batch-Abfrage via RPC)
  const userIds = (profiles || [])
    .filter((p) => p.user_id)
    .map((p) => p.user_id as string)

  let emailMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: emailRows, error: emailError } = await supabase
      .rpc("get_member_emails", { user_ids: userIds })

    if (!emailError && emailRows) {
      for (const row of emailRows) {
        if (row.email) {
          emailMap[row.user_id] = row.email
        }
      }
    }
  }

  const membersWithRoles: MemberWithRole[] = (profiles || []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.user_id ? (emailMap[p.user_id] || null) : null,
    role: p.role,
    status: p.status,
    user_id: p.user_id,
  }))

  return { success: true, data: membersWithRoles }
}

/**
 * Ändert die Rolle eines Mitglieds (nur für Vorstand)
 * Prüft: Letzter Vorstand kann nicht degradiert werden
 */
export async function updateMemberRole(
  profileId: string,
  newRole: "vorstand" | "trainer" | "mitglied"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Vorstand-Check
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return { success: false, error: "Nur Vorstandsmitglieder können Rollen ändern" }
  }

  // Validierung der neuen Rolle
  if (!["vorstand", "trainer", "mitglied"].includes(newRole)) {
    return { success: false, error: "Ungültige Rolle" }
  }

  // Aktuelles Profil laden
  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", profileId)
    .single()

  if (profileError || !targetProfile) {
    return { success: false, error: "Mitglied nicht gefunden" }
  }

  // Wenn Vorstand degradiert wird: prüfe ob letzter Vorstand
  if (targetProfile.role === "vorstand" && newRole !== "vorstand") {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "vorstand")
      .eq("status", "active")

    if (countError) {
      console.error("Error counting Vorstand members:", countError)
      return { success: false, error: "Fehler bei der Überprüfung" }
    }

    if (count !== null && count <= 1) {
      return {
        success: false,
        error: "Es muss mindestens ein Vorstandsmitglied geben",
      }
    }
  }

  // Rolle aktualisieren
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)

  if (updateError) {
    console.error("Error updating member role:", updateError)
    return { success: false, error: "Fehler beim Ändern der Rolle" }
  }

  revalidatePath("/settings")
  revalidatePath("/", "layout")
  return { success: true }
}
