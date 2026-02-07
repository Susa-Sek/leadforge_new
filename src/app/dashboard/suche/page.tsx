/**
 * Search Page (Server Component)
 *
 * Server-side rendered search page that:
 * - Authenticates the user
 * - Fetches credit balance
 * - Determines subscription plan tier
 * - Renders client component with initial data
 *
 * @module SuchePage
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/actions/credits'
import { SearchPageClient } from './search-page-client'

/** User subscription plan tier */
type PlanTier = 'free' | 'pro' | 'enterprise'

/**
 * Fetch user's subscription plan tier from profile
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch plan for
 * @returns Plan tier (defaults to 'free' if not found)
 */
async function getUserPlanTier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<PlanTier> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.log('[SuchePage] No plan tier found, defaulting to free')
      return 'free'
    }

    const tier = data.plan_tier as PlanTier
    if (['free', 'pro', 'enterprise'].includes(tier)) {
      return tier
    }

    return 'free'
  } catch (err) {
    console.error('[SuchePage] Error fetching plan tier:', err)
    return 'free'
  }
}

export default async function SuchePage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's credit balance and plan tier
  const [credits, planTier] = await Promise.all([
    getCreditBalance(user.id),
    getUserPlanTier(supabase, user.id),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lead-Suche</h2>
        <p className="text-muted-foreground">
          Finde qualifizierte B2B-Leads mit KI-gestützter Suche. Filtere nach Branche, Standort und mehr.
        </p>
      </div>

      {/* Search Page Client Component */}
      <SearchPageClient
        userId={user.id}
        userCredits={credits.remaining}
        userTotalCredits={credits.total}
        planTier={planTier}
      />
    </div>
  )
}
