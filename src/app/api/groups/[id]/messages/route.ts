import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { sendMessageSchema } from "@/lib/validations/chat"
import {
  isValidUUID,
  getAuthenticatedProfile,
  isGroupParticipant,
  getGroupWithChatCheck,
  sanitizeContent,
  checkRateLimit,
} from "@/lib/api/chat-helpers"

// ============================================================
// GET /api/groups/[id]/messages
// Load messages with cursor-based pagination (50 per batch)
// Query params:
//   - before: ISO timestamp for cursor (load messages before this time)
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Validate UUID
  if (!isValidUUID(groupId)) {
    return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 })
  }

  // Authenticate
  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check group exists and has chat enabled
  const groupCheck = await getGroupWithChatCheck(supabase, groupId)
  if (!groupCheck.valid) return groupCheck.response

  // Check group membership (DSGVO: no Vorstand override)
  const isParticipant = await isGroupParticipant(supabase, profile.id, groupId)
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Gruppe" },
      { status: 403 }
    )
  }

  // Parse and validate cursor parameter
  const searchParams = request.nextUrl.searchParams
  const before = searchParams.get("before")

  if (before && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(before)) {
    return NextResponse.json({ error: "Invalid cursor format" }, { status: 400 })
  }

  // BUG-3 fix: Get member join date to filter out pre-join messages
  const { data: membership } = await supabase
    .from("group_members")
    .select("created_at")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .maybeSingle()

  // Build query: load 50 messages, ordered by created_at DESC (newest first)
  let query = supabase
    .from("group_messages")
    .select("id, group_id, sender_id, sender_display_name, content, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50)

  // Apply cursor if provided
  if (before) {
    query = query.lt("created_at", before)
  }

  // BUG-3: Only show messages created after the member joined the group
  // (trainers see all messages — they are not in group_members)
  if (membership?.created_at) {
    query = query.gte("created_at", membership.created_at)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Nachrichten" },
      { status: 500 }
    )
  }

  // Return messages in chronological order (oldest first) for display
  const sortedMessages = (messages || []).reverse()

  return NextResponse.json({
    messages: sortedMessages,
    has_more: (messages || []).length === 50,
  })
}

// ============================================================
// POST /api/groups/[id]/messages
// Send a new message
// Body: { content: string }
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: groupId } = await params

  // Validate UUID
  if (!isValidUUID(groupId)) {
    return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 })
  }

  // Authenticate
  const auth = await getAuthenticatedProfile(supabase)
  if ("error" in auth) return auth.error
  const { profile } = auth

  // Check group exists and has chat enabled
  const groupCheck = await getGroupWithChatCheck(supabase, groupId)
  if (!groupCheck.valid) return groupCheck.response

  // Check group membership (DSGVO: no Vorstand override)
  const isParticipant = await isGroupParticipant(supabase, profile.id, groupId)
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Kein Zugriff: Du bist kein Mitglied dieser Gruppe" },
      { status: 403 }
    )
  }

  // Rate limiting: max 10 messages per minute (DB-based, shared across instances)
  const allowed = await checkRateLimit(supabase, profile.id)
  if (!allowed) {
    return NextResponse.json(
      { error: "Zu viele Nachrichten. Bitte warte einen Moment." },
      { status: 429 }
    )
  }

  // Parse and validate body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validation = sendMessageSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  // Sanitize content (XSS prevention)
  const sanitizedContent = sanitizeContent(validation.data.content)

  if (sanitizedContent.length === 0) {
    return NextResponse.json(
      { error: "Nachricht darf nicht leer sein" },
      { status: 400 }
    )
  }

  if (sanitizedContent.length > 1000) {
    return NextResponse.json(
      { error: "Nachricht darf maximal 1000 Zeichen lang sein" },
      { status: 400 }
    )
  }

  // Insert message (sender_display_name is set by DB trigger)
  const { data: message, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: groupId,
      sender_id: profile.id,
      sender_display_name: "placeholder", // Will be overwritten by trigger
      content: sanitizedContent,
    })
    .select("id, group_id, sender_id, sender_display_name, content, created_at")
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Nachricht konnte nicht gesendet werden" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message }, { status: 201 })
}
