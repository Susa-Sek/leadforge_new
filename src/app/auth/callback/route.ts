import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // 1. Email OTP Verification (Email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
  }

  // 2. OAuth Callback (Google, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }

  // 3. Password Recovery - redirect to reset page
  if (type === 'recovery') {
    // Supabase sends token_hash in recovery emails
    // We redirect to our custom reset page
    if (token_hash) {
      return NextResponse.redirect(
        new URL(`/passwort-zuruecksetzen?token_hash=${token_hash}&type=recovery`, request.url)
      )
    }
    return NextResponse.redirect(new URL('/login?error=recovery_failed', request.url))
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
