import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ============================================================
// GET /api/workgroups/unread-counts
// Get unread message counts for workgroups the current user participates in.
// Vorstand sees all workgroups (oversight role).
// Returns: { unread: [{ workgroup_id, workgroup_name, unread_count }], total_unread }
// ============================================================
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  try {
    const isVorstand = profile.role === "vorstand"

    let workgroupIds: string[]

    if (isVorstand) {
      // Vorstand sees all active workgroups
      const { data: allWorkgroups } = await supabase
        .from("workgroups")
        .select("id")
        .neq("status", "archived")

      workgroupIds = (allWorkgroups ?? []).map((w) => w.id)
    } else {
      // Regular member: only their workgroups
      const { data: memberships } = await supabase
        .from("workgroup_members")
        .select("workgroup_id")
        .eq("profile_id", profile.id)

      workgroupIds = (memberships ?? []).map((m) => m.workgroup_id)
    }

    if (workgroupIds.length === 0) {
      return NextResponse.json({ unread: [], total_unread: 0 })
    }

    // Fetch workgroup names + read status in parallel
    const [workgroupsRes, readsRes] = await Promise.all([
      supabase
        .from("workgroups")
        .select("id, name")
        .in("id", workgroupIds)
        .neq("status", "archived"),
      supabase
        .from("workgroup_message_reads")
        .select("workgroup_id, last_read_at")
        .eq("profile_id", profile.id)
        .in("workgroup_id", workgroupIds),
    ])

    const workgroups = workgroupsRes.data ?? []
    const reads = readsRes.data ?? []

    const readMap = new Map<string, string>()
    for (const r of reads) {
      readMap.set(r.workgroup_id, r.last_read_at)
    }

    // Count unread messages per workgroup
    const unreadResults = await Promise.all(
      workgroups.map(async (wg) => {
        const lastReadAt = readMap.get(wg.id)

        let query = supabase
          .from("workgroup_messages")
          .select("*", { count: "exact", head: true })
          .eq("workgroup_id", wg.id)

        if (lastReadAt) {
          query = query.gt("created_at", lastReadAt)
        }

        const { count } = await query

        return {
          workgroup_id: wg.id,
          workgroup_name: wg.name,
          unread_count: count ?? 0,
        }
      })
    )

    const totalUnread = unreadResults.reduce((sum, r) => sum + r.unread_count, 0)

    return NextResponse.json({
      unread: unreadResults,
      total_unread: totalUnread,
    })
  } catch (err) {
    console.error("Error fetching workgroup unread counts:", err)
    return NextResponse.json(
      { error: "Fehler beim Laden der ungelesenen Nachrichten" },
      { status: 500 }
    )
  }
}
