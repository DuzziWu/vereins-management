'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

// ============================================
// CAPTCHA VERIFICATION
// ============================================
async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // In development without secret key, always pass
  if (!secretKey) {
    console.log('CAPTCHA verification skipped (no secret key configured)')
    return true
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('CAPTCHA verification error:', error)
    return false
  }
}

// ============================================
// LOGIN
// ============================================
export async function login(formData: { email: string; password: string; captchaToken?: string }) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  const { email, password, captchaToken } = formData

  // Check if CAPTCHA is required (more than 3 failed attempts)
  const { data: failedCount } = await serviceClient.rpc('get_failed_login_count', {
    check_email: email,
    check_ip: ip,
  })

  // Validate CAPTCHA if required
  if ((failedCount || 0) >= 3) {
    if (!captchaToken) {
      return {
        error: 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte lösen Sie das CAPTCHA.',
        requiresCaptcha: true,
      }
    }

    const isValidCaptcha = await verifyCaptcha(captchaToken)
    if (!isValidCaptcha) {
      return {
        error: 'CAPTCHA-Validierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        requiresCaptcha: true,
      }
    }
  }

  // Attempt login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Log the attempt
  await serviceClient.from('login_attempts').insert({
    email,
    ip_address: ip,
    success: !error,
  })

  if (error) {
    return {
      error: 'Email oder Passwort falsch',
      requiresCaptcha: (failedCount || 0) >= 2, // Will be 3 after this attempt
    }
  }

  // Check if account is active
  if (data.user) {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('is_active')
      .eq('user_id', data.user.id)
      .single()

    if (profile && !profile.is_active) {
      // Sign out the user since their account is inactive
      await supabase.auth.signOut()
      return {
        error: 'Ihr Konto ist deaktiviert. Bitte kontaktieren Sie den Vorstand.',
        requiresCaptcha: false,
      }
    }
  }

  return { success: true }
}

// ============================================
// LOGOUT
// ============================================
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================
// GET CURRENT USER
// ============================================
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return {
    ...user,
    profile,
  }
}

// ============================================
// CHECK IF CAPTCHA IS REQUIRED
// ============================================
export async function checkCaptchaRequired(email: string) {
  const serviceClient = await createServiceClient()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  const { data: failedCount } = await serviceClient.rpc('get_failed_login_count', {
    check_email: email,
    check_ip: ip,
  })

  return (failedCount || 0) >= 3
}
