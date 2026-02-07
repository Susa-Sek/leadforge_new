'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Request password reset email
 * Called from /passwort-vergessen page
 */
export async function requestPasswordReset(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=recovery`,
  })

  return { error: error?.message || null }
}

/**
 * Reset password with token
 * Called from /passwort-zuruecksetzen page
 */
export async function resetPassword(token_hash: string, newPassword: string) {
  const supabase = await createClient()

  // First verify the recovery token
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash,
  })

  if (verifyError) {
    return { error: verifyError.message }
  }

  // Then update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { error: updateError.message }
  }

  return { error: null }
}
