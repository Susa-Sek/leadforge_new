/**
 * GET /api/search/results?searchId=xxx&page=1&limit=50
 * Returns search results with pagination and optional filtering
 *
 * Query Parameters:
 * - searchId (required): UUID of the search
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - min_rating: Minimum rating filter (0-5)
 * - max_rating: Maximum rating filter (0-5)
 * - min_review_count: Minimum review count filter (>= 0)
 * - max_review_count: Maximum review count filter (>= 0)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type SearchResultsResponse, type SearchResultLead, type SearchResultFilters } from '@/lib/search/validation'

export async function GET(request: Request) {
  console.log('[API /search/results] Received request')

  // ============================================================================
  // 1. AUTHENTICATION
  // ============================================================================
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        error: 'Nicht authentifiziert',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  // ============================================================================
  // 2. GET QUERY PARAMS
  // ============================================================================
  const { searchParams } = new URL(request.url)
  const searchId = searchParams.get('searchId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

  // Rating filter params
  const minRating = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : null
  const maxRating = searchParams.get('max_rating') ? parseFloat(searchParams.get('max_rating')!) : null
  const minReviewCount = searchParams.get('min_review_count') ? parseInt(searchParams.get('min_review_count')!, 10) : null
  const maxReviewCount = searchParams.get('max_review_count') ? parseInt(searchParams.get('max_review_count')!, 10) : null

  if (!searchId) {
    return NextResponse.json(
      {
        error: 'Such-ID fehlt',
        code: 'MISSING_SEARCH_ID',
      },
      { status: 400 }
    )
  }

  // ============================================================================
  // 2b. VALIDATE FILTER PARAMETERS
  // ============================================================================
  const filterErrors: string[] = []

  // Validate rating range (0-5)
  if (minRating !== null && (minRating < 0 || minRating > 5)) {
    filterErrors.push('min_rating muss zwischen 0 und 5 liegen')
  }
  if (maxRating !== null && (maxRating < 0 || maxRating > 5)) {
    filterErrors.push('max_rating muss zwischen 0 und 5 liegen')
  }
  if (minRating !== null && maxRating !== null && minRating > maxRating) {
    filterErrors.push('min_rating darf nicht größer als max_rating sein')
  }

  // Validate review count range (>= 0)
  if (minReviewCount !== null && (isNaN(minReviewCount) || minReviewCount < 0)) {
    filterErrors.push('min_review_count muss >= 0 sein')
  }
  if (maxReviewCount !== null && (isNaN(maxReviewCount) || maxReviewCount < 0)) {
    filterErrors.push('max_review_count muss >= 0 sein')
  }
  if (minReviewCount !== null && maxReviewCount !== null && minReviewCount > maxReviewCount) {
    filterErrors.push('min_review_count darf nicht größer als max_review_count sein')
  }

  if (filterErrors.length > 0) {
    return NextResponse.json(
      {
        error: 'Ungültige Filter-Parameter',
        code: 'VALIDATION_ERROR',
        details: filterErrors,
      },
      { status: 400 }
    )
  }

  console.log('[API /search/results] Fetching results:', {
    searchId,
    page,
    limit,
    filters: {
      minRating,
      maxRating,
      minReviewCount,
      maxReviewCount,
    },
  })

  // ============================================================================
  // 3. VERIFY SEARCH EXISTS AND IS COMPLETED
  // ============================================================================
  const { data: searchData, error: searchError } = await supabase
    .from('search_history')
    .select('status, leads_found, leads_after_deduplication')
    .eq('id', searchId)
    .eq('user_id', user.id)
    .single()

  if (searchError || !searchData) {
    return NextResponse.json(
      {
        error: 'Suche nicht gefunden',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    )
  }

  if (searchData.status !== 'completed') {
    return NextResponse.json(
      {
        error: 'Suche noch nicht abgeschlossen',
        code: 'SEARCH_IN_PROGRESS',
        status: searchData.status,
      },
      { status: 409 }
    )
  }

  // ============================================================================
  // 4. FETCH RESULTS WITH PAGINATION AND FILTERS
  // ============================================================================
  const offset = (page - 1) * limit

  // Build the base query
  let resultsQuery = supabase
    .from('search_results')
    .select('*', { count: 'exact' })
    .eq('search_history_id', searchId)
    .eq('user_id', user.id)
    .eq('is_duplicate', false)

  // Apply rating filters
  if (minRating !== null) {
    resultsQuery = resultsQuery.gte('rating', minRating)
  }
  if (maxRating !== null) {
    resultsQuery = resultsQuery.lte('rating', maxRating)
  }

  // Apply review count filters
  if (minReviewCount !== null) {
    resultsQuery = resultsQuery.gte('reviews_count', minReviewCount)
  }
  if (maxReviewCount !== null) {
    resultsQuery = resultsQuery.lte('reviews_count', maxReviewCount)
  }

  // Apply ordering and pagination
  const { data: results, error: resultsError, count } = await resultsQuery
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (resultsError) {
    console.error('[API /search/results] Error fetching results:', resultsError)
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der Ergebnisse',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }

  // ============================================================================
  // 5. CALCULATE SUMMARY STATISTICS (with filters applied)
  // ============================================================================
  let statsQuery = supabase
    .from('search_results')
    .select('email, phone, website, rating')
    .eq('search_history_id', searchId)
    .eq('user_id', user.id)
    .eq('is_duplicate', false)

  // Apply the same rating and review count filters to stats
  if (minRating !== null) {
    statsQuery = statsQuery.gte('rating', minRating)
  }
  if (maxRating !== null) {
    statsQuery = statsQuery.lte('rating', maxRating)
  }
  if (minReviewCount !== null) {
    statsQuery = statsQuery.gte('reviews_count', minReviewCount)
  }
  if (maxReviewCount !== null) {
    statsQuery = statsQuery.lte('reviews_count', maxReviewCount)
  }

  const { data: allStats } = await statsQuery

  const totalCount = count || 0
  const withEmail = allStats?.filter((r) => r.email).length || 0
  const withPhone = allStats?.filter((r) => r.phone).length || 0
  const withWebsite = allStats?.filter((r) => r.website).length || 0
  const ratings = allStats?.filter((r) => r.rating).map((r) => r.rating as number) || []
  const averageRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0

  // ============================================================================
  // 6. MAP RESULTS TO RESPONSE FORMAT
  // ============================================================================
  const leads: SearchResultLead[] = (results || []).map((item) => ({
    id: item.id,
    companyName: item.company_name,
    address: item.address || '',
    phone: item.phone || undefined,
    email: item.email || undefined,
    website: item.website || undefined,
    googleMapsUrl: item.google_maps_url || '',
    rating: item.rating ? Number(item.rating) : undefined,
    reviewsCount: item.reviews_count || undefined,
    category: item.category || undefined,
    contactPerson: item.contact_person || undefined,
    phoneFromWebsite: item.phone_from_website || undefined,
    socialLinks: {
      facebook: item.facebook_url || undefined,
      instagram: item.instagram_url || undefined,
      linkedin: item.linkedin_url || undefined,
      twitter: item.twitter_url || undefined,
      youtube: item.youtube_url || undefined,
    },
    openingHours: item.opening_hours as Record<string, string> | undefined,
    imageUrl: item.image_url || undefined,
    latitude: item.latitude ? Number(item.latitude) : undefined,
    longitude: item.longitude ? Number(item.longitude) : undefined,
    isDuplicate: item.is_duplicate || false,
  }))

  // ============================================================================
  // 7. BUILD RESPONSE
  // ============================================================================
  const response: SearchResultsResponse & { filters: SearchResultFilters } = {
    searchId,
    status: 'completed',
    summary: {
      totalFound: searchData.leads_found || 0,
      afterDeduplication: searchData.leads_after_deduplication || searchData.leads_found || 0,
      withEmail,
      withPhone,
      withWebsite,
      averageRating,
    },
    leads,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: offset + leads.length < totalCount,
    },
    filters: {
      applied: {
        minRating,
        maxRating,
        minReviewCount,
        maxReviewCount,
      },
      filteredCount: totalCount,
    },
  }

  console.log('[API /search/results] Returning', leads.length, 'leads (filtered from', totalCount, ')')

  return NextResponse.json(response)
}
