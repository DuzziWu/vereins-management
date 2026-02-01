import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// GET /api/messages/unread
// Get unread message counts for ALL groups the user is in.
// Returns: { unread: [{ group_id, group_name, unread_count }], total_unread }
// Uses direct queries (replaces RPC function that was failing).
// ============================================================
export async function GET() {
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  try {
    // 1. Find all groups the user participates in (member, trainer, co-trainer)
    const [memberRes, trainerRes, coTrainerRes] = await Promise.all([
      supabase
        .from("group_members")
        .select("group_id")
        .eq("profile_id", profile.id),
      supabase
        .from("groups")
        .select("id")
        .eq("trainer_id", profile.id)
        .eq("is_active", true)
        .eq("chat_enabled", true),
      supabase
        .from("group_trainers")
        .select("group_id")
        .eq("profile_id", profile.id),
    ])

    // Collect unique group IDs
    const groupIdSet = new Set<string>()
    for (const row of memberRes.data || []) groupIdSet.add(row.group_id)
    for (const row of trainerRes.data || []) groupIdSet.add(row.id)
    for (const row of coTrainerRes.data || []) groupIdSet.add(row.group_id)

    const groupIds = Array.from(groupIdSet)

    if (groupIds.length === 0) {
      return NextResponse.json({ unread: [], total_unread: 0 })
    }

    // 2. Get group info (name + chat_enabled) and read status in parallel
    const [groupsRes, readsRes] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name, chat_enabled")
        .in("id", groupIds)
        .eq("is_active", true)
        .eq("chat_enabled", true),
      supabase
        .from("group_chat_reads")
        .select("group_id, last_read_at")
        .eq("profile_id", profile.id)
        .in("group_id", groupIds),
    ])

    const groups = groupsRes.data || []
    const reads = readsRes.data || []

    // Build a map of group_id -> last_read_at
    const readMap = new Map<string, string>()
    for (const r of reads) {
      readMap.set(r.group_id, r.last_read_at)
    }

    // 3. Count unread messages per group
    const unreadResults = await Promise.all(
      groups.map(async (group) => {
        const lastReadAt = readMap.get(group.id)

        let query = supabase
          .from("group_messages")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id)

        if (lastReadAt) {
          query = query.gt("created_at", lastReadAt)
        }

        const { count } = await query

        return {
          group_id: group.id,
          group_name: group.name,
          unread_count: count ?? 0,
        }
      })
    )

    const totalUnread = unreadResults.reduce(
      (sum, r) => sum + r.unread_count,
      0
    )

    return NextResponse.json({
      unread: unreadResults,
      total_unread: totalUnread,
    })
  } catch (err) {
    console.error("Error fetching unread counts:", err)
    return NextResponse.json(
      { error: "Fehler beim Laden der ungelesenen Nachrichten" },
      { status: 500 }
    )
  }
}
