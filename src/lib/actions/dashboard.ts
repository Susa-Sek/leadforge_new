'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return defaultStats
  }

  const [creditsResult, searchesResult, contactsResult, collectionsResult] =
    await Promise.all([
      supabase
        .from('user_credits')
        .select('total_credits, used_credits')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('search_results')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('search_collections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

  const credits = creditsResult.data
    ? creditsResult.data.total_credits - creditsResult.data.used_credits
    : 0

  return {
    credits,
    searches: searchesResult.count ?? 0,
    contacts: contactsResult.count ?? 0,
    collections: collectionsResult.count ?? 0,
  }
}
