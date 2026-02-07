/**
 * GET /api/search/results?searchId=xxx&page=1&limit=50
 * Returns search results with pagination
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type SearchResultsResponse, type SearchResultLead } from '@/lib/search/validation'

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

  if (!searchId) {
    return NextResponse.json(
      {
        error: 'Such-ID fehlt',
        code: 'MISSING_SEARCH_ID',
      },
      { status: 400 }
    )
  }

  console.log('[API /search/results] Fetching results:', { searchId, page, limit })

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
  // 4. FETCH RESULTS WITH PAGINATION
  // ============================================================================
  const offset = (page - 1) * limit

  const { data: results, error: resultsError, count } = await supabase
    .from('search_results')
    .select('*', { count: 'exact' })
    .eq('search_history_id', searchId)
    .eq('user_id', user.id)
    .eq('is_duplicate', false)
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
  // 5. CALCULATE SUMMARY STATISTICS
  // ============================================================================
  const { data: allStats } = await supabase
    .from('search_results')
    .select('email, phone, website, rating')
    .eq('search_history_id', searchId)
    .eq('user_id', user.id)
    .eq('is_duplicate', false)

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
  const response: SearchResultsResponse = {
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
  }

  console.log('[API /search/results] Returning', leads.length, 'leads')

  return NextResponse.json(response)
}
