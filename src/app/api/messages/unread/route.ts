import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// GET /api/messages/unread
// Get unread message counts for ALL groups the user is in.
// Returns: { unread: [{ group_id, group_name, unread_count }], total_unread }
// Uses a single aggregate DB function instead of per-group queries (PERF-1).
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

  // Single aggregate query via DB function (replaces N+1 loop)
  const { data: unreadData, error } = await supabase.rpc(
    "get_unread_message_counts",
    { p_profile_id: profile.id }
  )

  if (error) {
    console.error("Error fetching unread counts:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der ungelesenen Nachrichten" },
      { status: 500 }
    )
  }

  const unreadResults = (unreadData || []).map(
    (row: { group_id: string; group_name: string; unread_count: number }) => ({
      group_id: row.group_id,
      group_name: row.group_name,
      unread_count: row.unread_count,
    })
  )

  const totalUnread = unreadResults.reduce(
    (sum: number, r: { unread_count: number }) => sum + r.unread_count,
    0
  )

  return NextResponse.json({
    unread: unreadResults,
    total_unread: totalUnread,
  })
}
