/**
 * Search History API
 *
 * GET /api/search/history
 *
 * Returns chronological list of all user's searches with filtering and pagination
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 * - status: 'all' | 'pending' | 'running' | 'completed' | 'failed'
 * - date_from: ISO date string
 * - date_to: ISO date string
 *
 * @module SearchHistoryAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['all', 'pending', 'running', 'completed', 'failed']).default('all'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})

// Search history item type
interface SearchHistoryItem {
  id: string
  query_params: {
    industry: string
    location: string
    max_results: number
  }
  result_count: number
  credits_used: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  duration_seconds?: number
  collection_id?: string
  error_message?: string
  created_at: string
  updated_at: string
}

// Summary stats type
interface SearchSummary {
  total_searches: number
  total_credits_used: number
  total_leads_found: number
}

/**
 * GET /api/search/history
 *
 * Get chronological list of all searches with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: queryResult.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, status, date_from, date_to } = queryResult.data
    const offset = (page - 1) * limit

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // BUG-2 FIX: Get user's plan tier for gating
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const planTier = subError ? 'free' : (subscription?.plan_tier || 'free')
    const isFreeUser = planTier === 'free'

    // BUG-2 FIX: Free users can only see last 30 days of history
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const freeUserDateLimit = thirtyDaysAgo.toISOString()

    // Build base query
    let dbQuery = supabase
      .from('search_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply status filter (if not 'all')
    if (status !== 'all') {
      dbQuery = dbQuery.eq('status', status)
    }

    // BUG-2 FIX: Apply date range filters with free user limit
    // Free users can only see searches from last 30 days
    const effectiveDateFrom = isFreeUser
      ? (date_from && new Date(date_from) > thirtyDaysAgo ? date_from : freeUserDateLimit)
      : date_from

    if (effectiveDateFrom) {
      dbQuery = dbQuery.gte('created_at', effectiveDateFrom)
    }
    if (date_to) {
      dbQuery = dbQuery.lte('created_at', date_to)
    }

    // Apply sorting (newest first) and pagination
    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Error fetching search history:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden des Suchverlaufs' },
        { status: 500 }
      )
    }

    // Transform data into search history format
    const searches: SearchHistoryItem[] = (data || []).map((item) => {
      const queryParams = item.query_params as { industry?: string; location?: string; max_results?: number }

      // Calculate duration in seconds
      let duration_seconds: number | undefined
      if (item.created_at && item.updated_at) {
        const created = new Date(item.created_at).getTime()
        const updated = new Date(item.updated_at).getTime()
        duration_seconds = Math.round((updated - created) / 1000)
      }

      return {
        id: item.id,
        query_params: {
          industry: queryParams?.industry || 'Unbekannte Branche',
          location: queryParams?.location || 'Unbekannter Ort',
          max_results: queryParams?.max_results || 0,
        },
        result_count: item.result_count || item.leads_found || 0,
        credits_used: item.credits_cost || item.credits_used || 0,
        status: item.status,
        progress: item.progress_percent || undefined,
        duration_seconds,
        collection_id: item.status === 'completed' ? item.id : undefined,
        error_message: item.error_message || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
    })

    // Calculate summary stats from the current result set
    const total = count || 0

    // For accurate summary, we need to query without pagination
    let summaryQuery = supabase
      .from('search_history')
      .select('credits_cost, credits_used, result_count, leads_found, leads_after_deduplication')
      .eq('user_id', user.id)

    // Apply the same filters for consistency
    if (status !== 'all') {
      summaryQuery = summaryQuery.eq('status', status)
    }
    // BUG-2 FIX: Apply same date limit for free users in summary
    if (effectiveDateFrom) {
      summaryQuery = summaryQuery.gte('created_at', effectiveDateFrom)
    }
    if (date_to) {
      summaryQuery = summaryQuery.lte('created_at', date_to)
    }

    const { data: summaryData, error: summaryError } = await summaryQuery

    const summary: SearchSummary = {
      total_searches: total,
      total_credits_used: 0,
      total_leads_found: 0,
    }

    if (!summaryError && summaryData) {
      summary.total_credits_used = summaryData.reduce(
        (sum, item) => sum + (item.credits_cost || item.credits_used || 0),
        0
      )
      summary.total_leads_found = summaryData.reduce(
        (sum, item) => sum + (item.leads_after_deduplication || item.result_count || item.leads_found || 0),
        0
      )
    }

    const totalPages = Math.ceil(total / limit)

    // BUG-2 FIX: Include plan limit info in response
    const planLimitInfo = {
      plan_tier: planTier,
      history_days_limit: isFreeUser ? 30 : null,
      oldest_visible_date: isFreeUser ? freeUserDateLimit : null,
      upgrade_url: isFreeUser ? '/dashboard/einstellungen?tab=abonnement' : null,
    }

    return NextResponse.json({
      searches,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_more: offset + searches.length < total,
      },
      summary,
      plan_limit: planLimitInfo,
    })
  } catch (error) {
    console.error('Unexpected error in search history:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
