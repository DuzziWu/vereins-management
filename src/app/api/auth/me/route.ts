import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/auth/me - Get current user info including is_vorstand
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("user_id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      profile_id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      is_vorstand: profile.role === "vorstand",
    },
  })
}
