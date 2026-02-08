/**
 * Search Retry API
 *
 * POST /api/search/retry
 *
 * Retry a previous search with the same parameters
 * Rate limited to 5 requests per minute per user
 *
 * Request Body:
 * {
 *   search_id: string;  // UUID of the search to retry
 * }
 *
 * Response:
 * {
 *   new_search_id: string;
 *   status: 'pending';
 *   estimated_cost: number;
 *   message: string;
 * }
 *
 * Error Codes:
 * - 400: Invalid request or search still running
 * - 401: Not authenticated
 * - 402: Insufficient credits
 * - 404: Original search not found
 * - 429: Rate limit exceeded
 *
 * @module SearchRetryAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { hasEnoughCredits, calculateSearchCost } from '@/lib/credits'

// Request body validation schema
const retryRequestSchema = z.object({
  search_id: z.string().uuid(),
})

// Rate limiting store (in-memory, per user)
// For production, consider using Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 5 // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

/**
 * Check if user is rate limited
 * Returns true if rate limited, false otherwise
 */
function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit) {
    // First request
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  // Check if window has expired
  if (now > userLimit.resetTime) {
    // Reset window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  // Check if limit exceeded
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return true
  }

  // Increment count
  userLimit.count++
  return false
}

/**
 * Get remaining time for rate limit reset
 */
function getRateLimitResetTime(userId: string): number {
  const userLimit = rateLimitStore.get(userId)
  if (!userLimit) return 0
  return Math.max(0, Math.ceil((userLimit.resetTime - Date.now()) / 1000))
}

/**
 * POST /api/search/retry
 *
 * Retry a previous search with the same parameters
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================================================
    // 1. AUTHENTICATION
    // ============================================================================
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const userId = user.id

    // ============================================================================
    // 2. RATE LIMITING CHECK
    // ============================================================================
    if (isRateLimited(userId)) {
      const resetSeconds = getRateLimitResetTime(userId)
      return NextResponse.json(
        {
          error: 'Rate limit überschritten',
          code: 'RATE_LIMIT',
          details: {
            max_requests: RATE_LIMIT_MAX,
            window_seconds: RATE_LIMIT_WINDOW / 1000,
            retry_after_seconds: resetSeconds,
            message: `Maximal ${RATE_LIMIT_MAX} Wiederholungen pro Minute erlaubt. Bitte warten Sie ${resetSeconds} Sekunden.`,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetSeconds),
          },
        }
      )
    }

    // ============================================================================
    // 3. PARSE & VALIDATE REQUEST BODY
    // ============================================================================
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Ungültige JSON-Daten' },
        { status: 400 }
      )
    }

    const validation = retryRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Ungültige Anfrage',
          code: 'VALIDATION_ERROR',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { search_id } = validation.data

    // ============================================================================
    // 4. FETCH ORIGINAL SEARCH
    // ============================================================================
    const { data: originalSearch, error: searchError } = await supabase
      .from('search_history')
      .select('*')
      .eq('id', search_id)
      .eq('user_id', userId)
      .single()

    if (searchError || !originalSearch) {
      return NextResponse.json(
        {
          error: 'Original-Suche nicht gefunden',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // ============================================================================
    // 5. VALIDATE SEARCH STATUS
    // ============================================================================
    // Cannot retry if search is still running
    if (['pending', 'validating', 'searching', 'extracting', 'enriching', 'deduplicating'].includes(originalSearch.status)) {
      return NextResponse.json(
        {
          error: 'Suche läuft noch',
          code: 'SEARCH_IN_PROGRESS',
          details: {
            status: originalSearch.status,
            message: 'Eine laufende Suche kann nicht wiederholt werden. Bitte warten Sie auf den Abschluss.',
          },
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // 6. EXTRACT QUERY PARAMETERS
    // ============================================================================
    const queryParams = originalSearch.query_params as {
      searchQuery?: string
      locationQuery?: string
      maxResults?: number
      includeDecisionMakers?: boolean
      industry?: string
      location?: string
    } || {}

    // Support both old and new query_params format
    const searchQuery = queryParams.searchQuery || queryParams.industry || originalSearch.search_query
    const locationQuery = queryParams.locationQuery || queryParams.location || originalSearch.location_query
    const maxResults = queryParams.maxResults || originalSearch.max_results || 50
    const includeDecisionMakers = queryParams.includeDecisionMakers || originalSearch.include_decision_makers || false

    if (!searchQuery) {
      return NextResponse.json(
        {
          error: 'Suchparameter konnten nicht geladen werden',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      )
    }

    // ============================================================================
    // 7. CALCULATE & CHECK CREDITS
    // ============================================================================
    const estimatedCost = calculateSearchCost(maxResults)

    const creditStatus = await hasEnoughCredits(userId, estimatedCost)

    if (!creditStatus.hasEnough) {
      return NextResponse.json(
        {
          error: 'Nicht genügend Credits',
          code: 'INSUFFICIENT_CREDITS',
          details: {
            required: estimatedCost,
            available: creditStatus.available,
            deficit: creditStatus.deficit,
            message: `Für diese Wiederholung benötigen Sie ${estimatedCost} Credits. Verfügbar: ${creditStatus.available}.`,
          },
        },
        { status: 402 }
      )
    }

    // ============================================================================
    // 8. START NEW SEARCH VIA INTERNAL API CALL
    // ============================================================================
    // Build the request URL for the search/start endpoint
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const searchStartUrl = `${protocol}://${host}/api/search/start`

    const searchStartResponse = await fetch(searchStartUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the authorization cookie for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        searchQuery,
        locationQuery,
        maxResults,
        includeDecisionMakers,
        forceNewSearch: true, // Always force new search for retry
      }),
    })

    if (!searchStartResponse.ok) {
      const errorData = await searchStartResponse.json().catch(() => ({}))

      // Pass through specific error codes
      if (searchStartResponse.status === 402) {
        return NextResponse.json(
          {
            error: errorData.error || 'Nicht genügend Credits',
            code: 'INSUFFICIENT_CREDITS',
            details: errorData.details,
          },
          { status: 402 }
        )
      }

      return NextResponse.json(
        {
          error: errorData.error || 'Fehler beim Starten der Wiederholung',
          code: errorData.code || 'SERVER_ERROR',
          details: errorData.details,
        },
        { status: searchStartResponse.status }
      )
    }

    const searchResult = await searchStartResponse.json()

    // ============================================================================
    // 9. RETURN SUCCESS RESPONSE
    // ============================================================================
    return NextResponse.json({
      new_search_id: searchResult.searchId,
      status: 'pending',
      estimated_cost: estimatedCost,
      original_search_id: search_id,
      message: 'Suche wurde gestartet',
      credits_remaining: searchResult.creditsRemaining,
    })
  } catch (error) {
    console.error('Unexpected error in search retry:', error)
    return NextResponse.json(
      {
        error: 'Interner Server-Fehler',
        code: 'SERVER_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/search/retry
 *
 * Get rate limit status for retry endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const userLimit = rateLimitStore.get(user.id)
    const now = Date.now()

    let remaining = RATE_LIMIT_MAX
    let resetSeconds = 0

    if (userLimit) {
      if (now > userLimit.resetTime) {
        // Window expired, full limit available
        remaining = RATE_LIMIT_MAX
      } else {
        remaining = Math.max(0, RATE_LIMIT_MAX - userLimit.count)
        resetSeconds = Math.ceil((userLimit.resetTime - now) / 1000)
      }
    }

    return NextResponse.json({
      rate_limit: {
        max: RATE_LIMIT_MAX,
        remaining,
        reset_seconds: resetSeconds,
        window_seconds: RATE_LIMIT_WINDOW / 1000,
      },
    })
  } catch (error) {
    console.error('Error in retry rate limit check:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
