import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated', authError },
      { status: 401 }
    )
  }

  // Test profile query
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Test credits query
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
    },
    profile,
    profileError,
    credits,
    creditsError,
    computedCredits: credits ? {
      total: credits.total_credits,
      used: credits.used_credits,
      remaining: credits.total_credits - credits.used_credits,
    } : null,
  })
}