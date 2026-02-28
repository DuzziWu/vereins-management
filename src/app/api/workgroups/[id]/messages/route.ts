import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { workgroupSendMessageSchema } from "@/lib/validations/chat"
import {
  isValidUUID,
  getAuthenticatedProfile,
  sanitizeContent,
} from "@/lib/api/chat-helpers"

const ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/**
 * Check if the given profile is a member of the workgroup.
 */
async function isWorkgroupMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  workgroupId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workgroup_members")
    .select("profile_id")
    .eq("workgroup_id", workgroupId)
    .eq("profile_id", profileId)
    .maybeSingle()
  return !!data
}

/**
 * Check if the given profile is a member OR Vorstand.
 * Vorstand can read all workgroup chats (oversight role per spec).
 */
async function isWorkgroupMemberOrVorstand(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: { id: string; role: string },
  workgroupId: string
): Promise<boolean> {
  if (profile.role === "vorstand") return true
  return isWorkgroupMember(supabase, profile.id, workgroupId)
}

// ============================================================
// GET /api/workgroups/[id]/messages
// Load messages with cursor-based pagination (50 per batch).
// Query params:
//   - before: ISO timestamp — load messages before this time (older)
//   - after:  ISO timestamp — load messages after this time (polling)
// Access: workgroup members + Vorstand (read-only oversight)
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: workgroupId } = await params

  if (!isValidUUID(workgroupId)) {
    return NextResponse.json({ error: "Invalid workgroup ID format" }, { status: 400 })
  }

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check workgroup exists
  const { data: workgroup, error: wgError } = await supabase
    .from("workgroups")
    .select("id")
    .eq("id", workgroupId)
    .single()

  if (wgError || !workgroup) {
    return NextResponse.json({ error: "Workgroup nicht gefunden" }, { status: 404 })
  }

  // Access: members + Vorstand
  const hasAccess = await isWorkgroupMemberOrVorstand(supabase, profile, workgroupId)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Workgroup" },
      { status: 403 }
    )
  }

  // Parse cursor params
  const searchParams = request.nextUrl.searchParams
  const before = searchParams.get("before")
  const after = searchParams.get("after")

  if (before && !ISO_REGEX.test(before)) {
    return NextResponse.json({ error: "Ungültiges Cursor-Format" }, { status: 400 })
  }
  if (after && !ISO_REGEX.test(after)) {
    return NextResponse.json({ error: "Ungültiges Cursor-Format" }, { status: 400 })
  }

  // When `after` is provided: polling for new messages (ascending, no limit)
  // When `before` or nothing: load newest 50 (descending)
  const isPolling = !!after

  let query = supabase
    .from("workgroup_messages")
    .select("id, workgroup_id, sender_id, sender_display_name, content, created_at")
    .eq("workgroup_id", workgroupId)
    .order("created_at", { ascending: isPolling })

  if (!isPolling) {
    query = query.limit(50)
  }

  if (before) query = query.lt("created_at", before)
  if (after) query = query.gt("created_at", after)

  const { data: messages, error } = await query

  if (error) {
    console.error("Error fetching workgroup messages:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Nachrichten" },
      { status: 500 }
    )
  }

  // Return chronological order (oldest first) for display
  const sortedMessages = isPolling
    ? (messages ?? [])
    : (messages ?? []).reverse()

  return NextResponse.json({
    messages: sortedMessages,
    has_more: !isPolling && (messages ?? []).length === 50,
  })
}

// ============================================================
// POST /api/workgroups/[id]/messages
// Send a new message.
// Body: { content: string }
// Access: workgroup members only (Vorstand cannot write unless member)
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: workgroupId } = await params

  if (!isValidUUID(workgroupId)) {
    return NextResponse.json({ error: "Invalid workgroup ID format" }, { status: 400 })
  }

  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check workgroup exists
  const { data: workgroup, error: wgError } = await supabase
    .from("workgroups")
    .select("id")
    .eq("id", workgroupId)
    .single()

  if (wgError || !workgroup) {
    return NextResponse.json({ error: "Workgroup nicht gefunden" }, { status: 404 })
  }

  // Only members can send (Vorstand cannot write unless also a member)
  const isMember = await isWorkgroupMember(supabase, profile.id, workgroupId)
  if (!isMember) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Workgroup" },
      { status: 403 }
    )
  }

  // Rate limiting: max 10 messages per minute
  const { data: allowed, error: rateError } = await supabase.rpc(
    "check_workgroup_chat_rate_limit",
    { p_profile_id: profile.id, p_max_count: 10, p_window_seconds: 60 }
  )
  if (!rateError && allowed === false) {
    return NextResponse.json(
      { error: "Zu viele Nachrichten. Bitte warte einen Moment." },
      { status: 429 }
    )
  }

  // Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 })
  }

  const validation = workgroupSendMessageSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  // Sanitize (XSS prevention)
  const sanitizedContent = sanitizeContent(validation.data.content)
  if (sanitizedContent.length === 0) {
    return NextResponse.json(
      { error: "Nachricht darf nicht leer sein" },
      { status: 400 }
    )
  }

  // Insert — sender_display_name is set by DB trigger (privacy)
  const { data: message, error } = await supabase
    .from("workgroup_messages")
    .insert({
      workgroup_id: workgroupId,
      sender_id: profile.id,
      sender_display_name: "placeholder", // overwritten by trigger
      content: sanitizedContent,
    })
    .select("id, workgroup_id, sender_id, sender_display_name, content, created_at")
    .single()

  if (error) {
    console.error("Error sending workgroup message:", error)
    return NextResponse.json(
      { error: "Nachricht konnte nicht gesendet werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message }, { status: 201 })
}
