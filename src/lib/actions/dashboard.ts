'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type DashboardStats = {
  credits: number
  searches: number
  contacts: number
  collections: number
}

const defaultStats: DashboardStats = {
  credits: 0,
  searches: 0,
  contacts: 0,
  collections: 0,
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Use regular client for auth check
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('[getDashboardStats] No authenticated user')
    return defaultStats
  }

  console.log('[getDashboardStats] Fetching stats for user:', user.id)

  // Use service client for database queries to bypass RLS
  const serviceClient = createServiceClient()

  try {
    const [creditsResult, searchesResult, contactsResult, collectionsResult] =
      await Promise.all([
        serviceClient
          .from('user_credits')
          .select('total_credits, used_credits')
          .eq('user_id', user.id)
          .maybeSingle(),
        serviceClient
          .from('search_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        serviceClient
          .from('crm_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        serviceClient
          .from('search_collections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

    if (creditsResult.error) {
      console.error('[getDashboardStats] Credits query error:', creditsResult.error)
    }
    if (searchesResult.error) {
      console.error('[getDashboardStats] Searches query error:', searchesResult.error)
    }
    if (contactsResult.error) {
      console.error('[getDashboardStats] Contacts query error:', contactsResult.error)
    }
    if (collectionsResult.error) {
      console.error('[getDashboardStats] Collections query error:', collectionsResult.error)
    }

    const credits = creditsResult.data
      ? creditsResult.data.total_credits - creditsResult.data.used_credits
      : 0

    console.log('[getDashboardStats] Stats fetched successfully:', { credits, searches: searchesResult.count, contacts: contactsResult.count, collections: collectionsResult.count })

    return {
      credits,
      searches: searchesResult.count ?? 0,
      contacts: contactsResult.count ?? 0,
      collections: collectionsResult.count ?? 0,
    }
  } catch (error) {
    console.error('[getDashboardStats] Unexpected error:', error)
    return defaultStats
  }
}
