import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const supabase = await createClient()

  // Sign out the user
  await supabase.auth.signOut()

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request) {
  const supabase = await createClient()

  // Sign out the user
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
