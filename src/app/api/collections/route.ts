/**
 * Collections API - List Endpoint
 *
 * GET /api/collections
 *
 * Returns paginated list of user's collections (completed/failed searches)
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sort_by: 'date' | 'name' | 'count' (default: 'date')
 * - sort_order: 'asc' | 'desc' (default: 'desc')
 * - search: string (filter by name)
 *
 * @module CollectionsAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(['date', 'name', 'count']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

// Collection list item type
interface CollectionItem {
  id: string
  name: string
  query_params: {
    industry: string
    location: string
    max_results: number
  }
  result_count: number
  status: 'completed' | 'failed'
  created_at: string
  updated_at: string
}

/**
 * GET /api/collections
 *
 * List all collections for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
      search: searchParams.get('search'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: queryResult.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, sort_by, sort_order, search } = queryResult.data
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

    // BUG-2 FIX: For free users, limit to max 50 collections
    const maxCollectionsForFree = 50

    // Build query
    let dbQuery = supabase
      .from('search_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['completed', 'failed'])

    // Apply search filter if provided
    if (search) {
      // Search in query_params JSONB
      dbQuery = dbQuery.or(
        `query_params->>industry.ilike.%${search}%,query_params->>location.ilike.%${search}%`
      )
    }

    // Apply sorting
    const sortColumn =
      sort_by === 'date'
        ? 'created_at'
        : sort_by === 'count'
          ? 'result_count'
          : 'created_at' // 'name' not directly sortable, use date as fallback

    dbQuery = dbQuery.order(sortColumn, { ascending: sort_order === 'asc' })

    // BUG-2 FIX: Apply pagination with free user limit
    // Free users can only see up to 50 collections
    const effectiveLimit = isFreeUser
      ? Math.min(limit, maxCollectionsForFree - offset)
      : limit

    // For free users exceeding limit, still run query to get total count
    // but clamp the range to return empty results
    const rangeStart = isFreeUser && offset >= maxCollectionsForFree
      ? maxCollectionsForFree
      : offset
    const rangeEnd = isFreeUser && offset >= maxCollectionsForFree
      ? maxCollectionsForFree - 1
      : offset + effectiveLimit - 1

    dbQuery = dbQuery.range(rangeStart, rangeEnd)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Sammlungen' },
        { status: 500 }
      )
    }

    // Transform data into collection format
    const collections: CollectionItem[] = (data || []).map((item) => {
      const queryParams = item.query_params as { industry?: string; location?: string; max_results?: number }
      const industry = queryParams?.industry || 'Unbekannte Branche'
      const location = queryParams?.location || 'Unbekannter Ort'

      return {
        id: item.id,
        name: `${industry} in ${location}`,
        query_params: {
          industry,
          location,
          max_results: queryParams?.max_results || 0,
        },
        result_count: item.result_count || 0,
        status: item.status as 'completed' | 'failed',
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
    })

    // Sort by name if requested (client-side sorting)
    if (sort_by === 'name') {
      collections.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name)
        return sort_order === 'asc' ? comparison : -comparison
      })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    // BUG-2 FIX: Include plan limit info in response
    const planLimitInfo = {
      plan_tier: planTier,
      max_collections: isFreeUser ? maxCollectionsForFree : null,
      current_count: total,
      has_reached_limit: isFreeUser ? total >= maxCollectionsForFree : false,
      upgrade_url: isFreeUser ? '/dashboard/einstellungen?tab=abonnement' : null,
    }

    return NextResponse.json({
      collections,
      pagination: {
        page,
        limit,
        total: isFreeUser ? Math.min(total, maxCollectionsForFree) : total,
        total_pages: Math.ceil((isFreeUser ? Math.min(total, maxCollectionsForFree) : total) / limit),
      },
      plan_limit: planLimitInfo,
    })
  } catch (error) {
    console.error('Unexpected error in collections list:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
