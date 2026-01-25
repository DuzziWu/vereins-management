"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type NotificationType = "invitation" | "document" | "event" | "group_change" | "system"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read_at: string | null
  created_at: string
}

/**
 * Holt alle Benachrichtigungen des eingeloggten Users
 */
export async function getMyNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<Notification[]> {
  const supabase = await createClient()

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (options?.unreadOnly) {
    query = query.is("read_at", null)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return (data || []) as Notification[]
}

/**
 * Holt die Anzahl ungelesener Benachrichtigungen
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_unread_notification_count")

  if (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }

  return data || 0
}

/**
 * Markiert eine einzelne Benachrichtigung als gelesen
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  })

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Markiert alle Benachrichtigungen als gelesen
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { error } = await supabase.rpc("mark_all_notifications_read")

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Löscht eine Benachrichtigung
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)

  if (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Erstellt eine neue Benachrichtigung (nur für Vorstand)
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}): Promise<{ success: boolean; error?: string; notification?: Notification }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("create_notification", {
    p_user_id: params.userId,
    p_type: params.type,
    p_title: params.title,
    p_message: params.message,
    p_link: params.link,
  })

  if (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true, notification: data as Notification }
}

/**
 * Erstellt Benachrichtigungen für mehrere User (Bulk)
 * Nützlich für Event-Ankündigungen etc.
 */
export async function createBulkNotifications(params: {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  link?: string
}): Promise<{ success: boolean; error?: string; count: number }> {
  const supabase = await createClient()
  let successCount = 0

  // Hole zuerst den User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Nicht authentifiziert", count: 0 }
  }

  // Prüfe ob User Vorstand ist
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profile?.role !== "vorstand") {
    return { success: false, error: "Nur Vorstand kann Benachrichtigungen erstellen", count: 0 }
  }

  // Erstelle Benachrichtigungen für jeden User
  for (const userId of params.userIds) {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    })

    if (!error) {
      successCount++
    }
  }

  return { success: successCount > 0, count: successCount }
}
