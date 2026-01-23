'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// ============================================
// REQUEST PASSWORD RESET
// ============================================
export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  // Check rate limit (max 3 requests per hour)
  const { data: allowed } = await serviceClient.rpc('check_reset_rate_limit', {
    check_email: email,
    check_ip: ip,
  })

  // Log the attempt regardless of rate limit (for tracking)
  await serviceClient.from('password_reset_attempts').insert({
    email: email.toLowerCase(),
    ip_address: ip,
  })

  // If rate limited, still return success (security: don't reveal rate limit status)
  if (!allowed) {
    console.log('Password reset rate limited for:', email)
    return { success: true }
  }

  // Always return success message (security: don't reveal if email exists)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
  })

  // Log error but don't expose it to user
  if (error) {
    console.error('Password reset error:', error.message)
  }

  return { success: true }
}

// ============================================
// CONFIRM PASSWORD RESET
// ============================================
export async function confirmPasswordReset(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: 'Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.' }
  }

  return { success: true }
}
