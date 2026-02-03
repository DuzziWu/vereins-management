"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { clubSettingsSchema, type ClubSettingsFormData } from "@/lib/validations/club-settings"
import type { ClubSettings } from "@/lib/database.types"

export async function getClubSettings(): Promise<ClubSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("club_settings")
    .select("*")
    .limit(1)
    .single()

  if (error) {
    // PGRST116 = No rows found -> auto-create default entry
    if (error.code === "PGRST116") {
      const { data: newSettings, error: insertError } = await supabase
        .from("club_settings")
        .insert({ club_name: "Mein Verein" })
        .select()
        .single()

      if (insertError) {
        // Insert may fail if user is not Vorstand (RLS) or race condition
        // In that case, try reading again (another request may have created it)
        const { data: retryData } = await supabase
          .from("club_settings")
          .select("*")
          .limit(1)
          .single()
        return retryData || null
      }

      return newSettings
    }
    console.error("Error fetching club settings:", error)
    return null
  }

  return data
}

export async function updateClubSettings(
  formData: ClubSettingsFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Vorstand-Check
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return { success: false, error: "Nur Vorstandsmitglieder können Einstellungen ändern" }
  }

  // Validierung
  const parsed = clubSettingsSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Ungültige Eingabe" }
  }

  // Leere Strings zu null konvertieren
  const upsertData = {
    club_name: parsed.data.club_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address_street: parsed.data.address_street || null,
    address_zip: parsed.data.address_zip || null,
    address_city: parsed.data.address_city || null,
    website_url: parsed.data.website_url || null,
    updated_at: new Date().toISOString(),
  }

  // Bestehenden Eintrag holen (für Upsert mit korrekter ID)
  const { data: existing } = await supabase
    .from("club_settings")
    .select("id")
    .limit(1)
    .single()

  let error
  if (existing) {
    // Update bestehenden Eintrag
    ;({ error } = await supabase
      .from("club_settings")
      .update(upsertData)
      .eq("id", existing.id))
  } else {
    // Kein Eintrag vorhanden -> Insert (Upsert-Pattern)
    ;({ error } = await supabase
      .from("club_settings")
      .insert(upsertData))
  }

  if (error) {
    console.error("Error updating club settings:", error)
    return { success: false, error: "Fehler beim Speichern der Einstellungen" }
  }

  revalidatePath("/settings")
  revalidatePath("/", "layout")
  return { success: true }
}

/**
 * Validates file content by checking magic bytes.
 * JPG starts with FF D8 FF, PNG starts with 89 50 4E 47.
 */
async function validateImageMagicBytes(
  file: File
): Promise<"image/jpeg" | "image/png" | null> {
  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // JPG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }

  // PNG: 89 50 4E 47
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png"
  }

  return null
}

export async function uploadLogo(
  formData: FormData
): Promise<{ success: boolean; error?: string; logoUrl?: string }> {
  const supabase = await createClient()

  // Vorstand-Check
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return { success: false, error: "Nur Vorstandsmitglieder können das Logo ändern" }
  }

  const file = formData.get("logo") as File
  if (!file) {
    return { success: false, error: "Keine Datei ausgewählt" }
  }

  // Client-seitige MIME-Type Validierung
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    return { success: false, error: "Nur JPG und PNG Dateien sind erlaubt" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Maximale Dateigröße: 2MB" }
  }

  // Server-seitige Magic-Bytes Validierung
  const detectedType = await validateImageMagicBytes(file)
  if (!detectedType) {
    return { success: false, error: "Ungültiges Dateiformat. Nur echte JPG und PNG Dateien sind erlaubt." }
  }

  // Altes Logo löschen falls vorhanden
  const { data: settings } = await supabase
    .from("club_settings")
    .select("id, logo_path")
    .limit(1)
    .single()

  if (!settings) {
    return { success: false, error: "Keine Einstellungen gefunden" }
  }

  if (settings.logo_path) {
    await supabase.storage.from("club-assets").remove([settings.logo_path])
  }

  // Neues Logo hochladen (verwende detektierten MIME-Type statt client-seitigem file.type)
  const fileExt = detectedType === "image/png" ? "png" : "jpg"
  const fileName = `logo-${Date.now()}.${fileExt}`
  const filePath = `logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("club-assets")
    .upload(filePath, file, {
      contentType: detectedType,
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading logo:", uploadError)
    return { success: false, error: "Fehler beim Hochladen des Logos" }
  }

  // Logo-Pfad in club_settings speichern
  const { error: updateError } = await supabase
    .from("club_settings")
    .update({
      logo_path: filePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settings.id)

  if (updateError) {
    console.error("Error updating logo path:", updateError)
    // Upload rückgängig machen
    await supabase.storage.from("club-assets").remove([filePath])
    return { success: false, error: "Fehler beim Speichern des Logo-Pfads" }
  }

  // Öffentliche URL generieren
  const { data: publicUrl } = supabase.storage
    .from("club-assets")
    .getPublicUrl(filePath)

  revalidatePath("/settings")
  revalidatePath("/", "layout")
  return { success: true, logoUrl: publicUrl.publicUrl }
}

export async function deleteLogo(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Vorstand-Check
  const { data: isVorstand } = await supabase.rpc("is_vorstand")
  if (!isVorstand) {
    return { success: false, error: "Nur Vorstandsmitglieder können das Logo entfernen" }
  }

  const { data: settings } = await supabase
    .from("club_settings")
    .select("id, logo_path")
    .limit(1)
    .single()

  if (!settings) {
    return { success: false, error: "Keine Einstellungen gefunden" }
  }

  if (!settings.logo_path) {
    return { success: true }
  }

  // Datei aus Storage löschen
  const { error: deleteError } = await supabase.storage
    .from("club-assets")
    .remove([settings.logo_path])

  if (deleteError) {
    console.error("Error deleting logo file:", deleteError)
    return { success: false, error: "Fehler beim Löschen der Logo-Datei" }
  }

  // Logo-Pfad in club_settings entfernen
  const { error: updateError } = await supabase
    .from("club_settings")
    .update({
      logo_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settings.id)

  if (updateError) {
    console.error("Error clearing logo path:", updateError)
    return { success: false, error: "Fehler beim Aktualisieren der Einstellungen" }
  }

  revalidatePath("/settings")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getLogoUrl(): Promise<string | null> {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("club_settings")
    .select("logo_path")
    .limit(1)
    .single()

  if (!settings?.logo_path) {
    return null
  }

  const { data: publicUrl } = supabase.storage
    .from("club-assets")
    .getPublicUrl(settings.logo_path)

  return publicUrl.publicUrl
}
