/**
 * POST /api/search/start
 * Initiates a new lead search
 * - Validates input
 * - Checks cache
 * - Deducts credits
 * - Starts Apify actor (or mock)
 * - Returns search ID for tracking
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkCredits, deductCredits } from '@/lib/actions/credits'
import {
  validateSearchParams,
  calculateSearchCost,
  type StartSearchRequest,
  type StartSearchResponse,
  type StartSearchError,
} from '@/lib/search/validation'
import { ApifyClient } from '@/lib/apify/client'
import { notifySearchComplete, notifySearchFailed } from '@/lib/notifications/integrations'

export async function POST(request: Request) {
  console.log('[API /search/start] Received request')

  // ============================================================================
  // 1. AUTHENTICATION
  // ============================================================================
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[API /search/start] Authentication failed:', authError)
    return NextResponse.json(
      {
        success: false,
        error: 'Nicht authentifiziert',
        code: 'UNAUTHORIZED',
      } as StartSearchError,
      { status: 401 }
    )
  }

  const userId = user.id
  console.log('[API /search/start] User:', userId)

  // ============================================================================
  // 2. PARSE & VALIDATE INPUT
  // ============================================================================
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Ungueltige JSON-Daten',
        code: 'VALIDATION_ERROR',
      } as StartSearchError,
      { status: 400 }
    )
  }

  const validation = validateSearchParams(body)

  if (!validation.success) {
    console.log('[API /search/start] Validation failed:', validation.errors.flatten())
    const flattened = validation.errors.flatten()
    const fieldErrors = flattened.fieldErrors as Record<string, string[] | undefined>
    const firstErrorEntry = Object.entries(fieldErrors)[0] as
      | [string, string[] | undefined]
      | undefined

    return NextResponse.json(
      {
        success: false,
        error: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        details: {
          field: firstErrorEntry?.[0],
          message: firstErrorEntry?.[1]?.[0],
        },
      } as StartSearchError,
      { status: 400 }
    )
  }

  const params: StartSearchRequest = validation.data
  console.log('[API /search/start] Validated params:', {
    searchQuery: params.searchQuery,
    locationQuery: params.locationQuery,
    maxResults: params.maxResults,
    includeDecisionMakers: params.includeDecisionMakers,
  })

  // ============================================================================
  // 3. CHECK CACHE (unless forceNewSearch)
  // ============================================================================
  if (!params.forceNewSearch) {
    try {
      const { data: cachedId, error: cacheError } = await supabase.rpc(
        'check_cached_search',
        {
          p_user_id: userId,
          p_search_query: params.searchQuery,
          p_location_query: params.locationQuery || '',
          p_max_results: params.maxResults,
        }
      )

      if (cacheError) {
        console.error('[API /search/start] Cache check error:', cacheError)
      } else if (cachedId) {
        console.log('[API /search/start] Cache hit:', cachedId)

        // Get cached search details
        const { data: cachedSearch } = await supabase
          .from('search_history')
          .select('leads_found')
          .eq('id', cachedId)
          .single()

        return NextResponse.json({
          success: true,
          searchId: cachedId,
          status: 'cached',
          creditsCost: 0,
          creditsRemaining: (await checkCredits(userId, 0)).available,
          cachedResultId: cachedId,
          message: 'Gecachte Ergebnisse aus den letzten 24 Stunden gefunden',
          leadsFound: cachedSearch?.leads_found || 0,
        } as StartSearchResponse)
      }
    } catch (error) {
      console.error('[API /search/start] Cache check failed:', error)
      // Continue without cache
    }
  }

  // ============================================================================
  // 4. CALCULATE & CHECK CREDITS
  // ============================================================================
  const creditsCost = calculateSearchCost(
    params.maxResults,
    params.includeDecisionMakers
  )

  console.log('[API /search/start] Credits required:', creditsCost)

  const creditCheck = await checkCredits(userId, creditsCost)

  if (!creditCheck.hasEnough) {
    console.log('[API /search/start] Insufficient credits:', {
      required: creditsCost,
      available: creditCheck.available,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Nicht genug Credits fuer diese Suche',
        code: 'INSUFFICIENT_CREDITS',
        details: {
          required: creditsCost,
          available: creditCheck.available,
          message: 'Kaufen Sie weitere Credits oder upgraden Sie Ihren Plan',
        },
      } as StartSearchError,
      { status: 402 }
    )
  }

  // ============================================================================
  // 5. DEDUCT CREDITS (atomic operation)
  // ============================================================================
  const deductResult = await deductCredits(userId, creditsCost, 'search', {
    search_query: params.searchQuery,
    location_query: params.locationQuery,
    max_results: params.maxResults,
  })

  if (!deductResult.success) {
    console.error('[API /search/start] Credit deduction failed:', deductResult.error)

    return NextResponse.json(
      {
        success: false,
        error: deductResult.error || 'Fehler beim Abziehen der Credits',
        code: 'SERVER_ERROR',
      } as StartSearchError,
      { status: 500 }
    )
  }

  console.log('[API /search/start] Credits deducted, remaining:', deductResult.remainingCredits)

  // ============================================================================
  // 6. CREATE SEARCH HISTORY RECORD
  // ============================================================================
  const cacheHash = generateCacheHash(
    params.searchQuery,
    params.locationQuery,
    params.maxResults
  )

  const { data: searchRecord, error: insertError } = await supabase
    .from('search_history')
    .insert({
      user_id: userId,
      search_query: params.searchQuery,
      location_query: params.locationQuery || null,
      max_results: params.maxResults,
      include_decision_makers: params.includeDecisionMakers,
      status: 'validating',
      progress_percent: 5,
      credits_cost: creditsCost,
      credits_deducted_at: new Date().toISOString(),
      cache_hash: cacheHash,
    })
    .select('id')
    .single()

  if (insertError || !searchRecord) {
    console.error('[API /search/start] Failed to create search record:', insertError)

    // Refund credits on failure
    const { addCredits } = await import('@/lib/actions/credits')
    await addCredits(userId, creditsCost, 'refund', { reason: 'search_creation_failed' })

    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Erstellen der Suche',
        code: 'SERVER_ERROR',
      } as StartSearchError,
      { status: 500 }
    )
  }

  const searchId = searchRecord.id
  console.log('[API /search/start] Search record created:', searchId)

  // ============================================================================
  // 7. START APIFY SEARCH (or mock)
  // ============================================================================
  try {
    // Update status to searching
    await supabase.rpc('update_search_progress', {
      p_search_id: searchId,
      p_status: 'searching',
      p_progress_percent: 10,
    })

    // Start Apify actor (or mock if not configured)
    const apifyResult = await ApifyClient.startStage1(
      params.searchQuery,
      params.locationQuery || 'Deutschland',
      params.maxResults
    )

    if (!apifyResult.success) {
      throw new Error(apifyResult.error || 'Apify start failed')
    }

    console.log('[API /search/start] Apify started:', {
      runId: apifyResult.runId,
      usedMock: apifyResult.usedMock,
    })

    // Update search record with Apify run ID
    await supabase
      .from('search_history')
      .update({
        apify_run_id: apifyResult.runId,
        apify_dataset_id: apifyResult.datasetId,
        status: 'searching',
        progress_percent: 15,
      })
      .eq('id', searchId)

    // If mock mode, trigger immediate processing
    if (apifyResult.usedMock) {
      // Schedule mock webhook processing
      setTimeout(() => {
        processMockWebhook(searchId, apifyResult.datasetId!, params.includeDecisionMakers)
      }, 2000)
    }

    // ============================================================================
    // 8. RETURN SUCCESS
    // ============================================================================
    return NextResponse.json({
      success: true,
      searchId,
      status: 'processing',
      creditsCost,
      creditsRemaining: deductResult.remainingCredits,
      estimatedTimeSeconds: apifyResult.usedMock ? 5 : 60,
      usedMock: apifyResult.usedMock,
    } as StartSearchResponse)
  } catch (error) {
    console.error('[API /search/start] Failed to start Apify:', error)

    // Mark search as failed
    await supabase.rpc('fail_search', {
      p_search_id: searchId,
      p_error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    // Refund credits
    const { addCredits } = await import('@/lib/actions/credits')
    await addCredits(userId, creditsCost, 'refund', { reason: 'search_start_failed' })

    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Starten der Suche',
        code: 'SERVER_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      } as StartSearchError,
      { status: 500 }
    )
  }
}

/**
 * Generate cache hash for search parameters
 */
function generateCacheHash(
  searchQuery: string,
  locationQuery: string | undefined,
  maxResults: number
): string {
  const crypto = require('crypto')
  return crypto
    .createHash('md5')
    .update(
      `${searchQuery.toLowerCase().trim()}|${(locationQuery || '').toLowerCase().trim()}|${maxResults}`
    )
    .digest('hex')
}

/**
 * Process mock webhook for development mode
 */
async function processMockWebhook(
  searchId: string,
  datasetId: string,
  includeEnrichment: boolean
) {
  // Declare variables outside try block for catch block access
  let searchData: { user_id: string; max_results: number; search_query: string } | null = null
  let searchDataLocal: { user_id: string; max_results: number; search_query: string } | null = null
  let supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>> | null = null

  try {
    const { getDatasetItems, getMockEnrichmentResults } = await import('@/lib/apify/client')
    const { createClient } = await import('@/lib/supabase/server')

    supabase = await createClient()

    // Get mock data
    const items = await getDatasetItems(datasetId)

    console.log('[MOCK] Processing', items.length, 'items for search', searchId)

    // Update to extracting status
    await supabase.rpc('update_search_progress', {
      p_search_id: searchId,
      p_status: 'extracting',
      p_progress_percent: 40,
      p_leads_found: items.length,
    })

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Update to enriching (if enabled)
    if (includeEnrichment) {
      await supabase.rpc('update_search_progress', {
        p_search_id: searchId,
        p_status: 'enriching',
        p_progress_percent: 65,
      })

      // Simulate enrichment delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Update to deduplicating
    await supabase.rpc('update_search_progress', {
      p_search_id: searchId,
      p_status: 'deduplicating',
      p_progress_percent: 85,
    })

    // Simulate deduplication delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get search details for user_id and search query
    const { data: searchDataResult } = await supabase
      .from('search_history')
      .select('user_id, max_results, search_query')
      .eq('id', searchId)
      .single()

    searchData = searchDataResult

    if (!searchData) {
      console.error('[MOCK] Search not found:', searchId)
      return
    }

    // Store searchData in local const for type narrowing
    searchDataLocal = searchData

    // Map and save results
    const typedItems = items as Record<string, unknown>[]
    const leadsToInsert = typedItems.map((item, index) => {
      const location = item.location as Record<string, number> | undefined
      const imageUrls = item.imageUrls as string[] | undefined

      return {
        search_history_id: searchId,
        user_id: searchDataLocal!.user_id,
        company_name: String(item.title || `Unternehmen ${index + 1}`),
        address: String(item.address || ''),
        phone: item.phone ? String(item.phone) : null,
        website: item.website ? String(item.website) : null,
        email: item.email ? String(item.email) : null,
        google_maps_url: String(item.url || ''),
        place_id: String(item.placeId || `mock_${index}`),
        rating: item.totalScore ? Number(item.totalScore) : null,
        reviews_count: item.reviewsCount ? Number(item.reviewsCount) : null,
        category: item.categoryName ? String(item.categoryName) : null,
        latitude: location?.lat ? Number(location.lat) : null,
        longitude: location?.lng ? Number(location.lng) : null,
        image_url: imageUrls?.[0] ? String(imageUrls[0]) : null,
        source_actor: 'mock',
        enriched: includeEnrichment,
      }
    })

    // Save to search_results
    const { error: insertError } = await supabase.from('search_results').insert(leadsToInsert)

    if (insertError) {
      console.error('[MOCK] Failed to insert results:', insertError)
    }

    // Complete the search
    await supabase.rpc('complete_search', {
      p_search_id: searchId,
      p_leads_found: items.length,
      p_leads_after_deduplication: items.length,
      p_results_json: { leads: items },
      p_apify_cost_usd: 0,
    })

    // Send notification to user
    if (searchData && searchDataLocal && supabase) {
      await notifySearchComplete(
        supabase,
        searchDataLocal!.user_id,
        searchId,
        searchDataLocal!.search_query || 'Suche',
        items.length
      )
    }

    console.log('[MOCK] Search completed:', searchId)
  } catch (error) {
    console.error('[MOCK] Failed to process mock webhook:', error)

    // Notify user of failure
    if (searchData && searchDataLocal && supabase) {
      await notifySearchFailed(
        supabase,
        searchDataLocal!.user_id,
        searchId,
        searchDataLocal!.search_query || 'Suche',
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const errorSupabase = await createClient()

    await errorSupabase.rpc('fail_search', {
      p_search_id: searchId,
      p_error_message: error instanceof Error ? error.message : 'Mock processing failed',
    })
  }
}
