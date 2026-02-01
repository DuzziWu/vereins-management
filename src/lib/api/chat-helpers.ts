import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// PROJ-14: Chat API Helper Functions
// ============================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Get authenticated user and their profile.
 * Returns { user, profile } or { error: NextResponse }.
 */
export async function getAuthenticatedProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    }
  }

  return { user, profile }
}

/**
 * Check if a user (by profile_id) is a member or trainer of a group.
 * DSGVO: NO Vorstand override -- only actual group participants.
 */
export async function isGroupParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  groupId: string
): Promise<boolean> {
  // Check if the user is a regular member
  const { data: member } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle()

  if (member) return true

  // Check if the user is the main trainer
  const { data: group } = await supabase
    .from("groups")
    .select("trainer_id")
    .eq("id", groupId)
    .single()

  if (group?.trainer_id === profileId) return true

  // Check if the user is a co-trainer
  const { data: coTrainer } = await supabase
    .from("group_trainers")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle()

  return !!coTrainer
}

/**
 * Check if a group exists and has chat enabled.
 */
export async function getGroupWithChatCheck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string
): Promise<{ valid: true; group: { id: string; chat_enabled: boolean; name: string } } | { valid: false; response: NextResponse }> {
  const { data: group, error } = await supabase
    .from("groups")
    .select("id, chat_enabled, name")
    .eq("id", groupId)
    .eq("is_active", true)
    .single()

  if (error || !group) {
    return {
      valid: false,
      response: NextResponse.json({ error: "Gruppe nicht gefunden" }, { status: 404 }),
    }
  }

  if (!group.chat_enabled) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Chat ist für diese Gruppe nicht aktiviert" },
        { status: 403 }
      ),
    }
  }

  return { valid: true, group }
}

/**
 * Check if the user is a trainer (main or co-trainer) of the group.
 * Used for trainer badge display.
 */
export async function isTrainerOfGroup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  groupId: string
): Promise<boolean> {
  const { data: group } = await supabase
    .from("groups")
    .select("trainer_id")
    .eq("id", groupId)
    .single()

  if (group?.trainer_id === profileId) return true

  const { data: coTrainer } = await supabase
    .from("group_trainers")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle()

  return !!coTrainer
}

/**
 * Simple HTML sanitization: strip all HTML tags to prevent XSS.
 * Preserves text content and newlines.
 */
export function sanitizeContent(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
}

// ============================================================
// Rate Limiting (DB-based, shared across all server instances)
// SEC-1: Replaced in-memory Map with DB function for distributed deployments.
// ============================================================

/**
 * Check rate limit for a user via DB function.
 * Returns true if allowed, false if rate limited.
 * Max 10 messages per minute per user.
 */
export async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_chat_rate_limit", {
    p_profile_id: profileId,
    p_max_count: 10,
    p_window_seconds: 60,
  })

  if (error) {
    console.error("Rate limit check failed:", error)
    // Fail open: allow the message if rate limit check fails
    return true
  }

  return data === true
}
