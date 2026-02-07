/**
 * GET /api/search/status?searchId=xxx
 * Returns current search status and progress
 * Used for polling when realtime connection is unavailable
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  searchStatusSchema,
  calculateProgress,
  getStepNumber,
  getStepName,
  type SearchStatusResponse,
  type SearchStatus,
} from '@/lib/search/validation'

export async function GET(request: Request) {
  console.log('[API /search/status] Received request')

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
  // 2. GET SEARCH ID FROM QUERY PARAMS
  // ============================================================================
  const { searchParams } = new URL(request.url)
  const searchId = searchParams.get('searchId')

  if (!searchId) {
    return NextResponse.json(
      {
        error: 'Such-ID fehlt',
        code: 'MISSING_SEARCH_ID',
      },
      { status: 400 }
    )
  }

  console.log('[API /search/status] Checking status for:', searchId)

  // ============================================================================
  // 3. FETCH SEARCH HISTORY
  // ============================================================================
  const { data: searchData, error: searchError } = await supabase
    .from('search_history')
    .select('*')
    .eq('id', searchId)
    .eq('user_id', user.id) // RLS ensures this, but explicit check for safety
    .single()

  if (searchError || !searchData) {
    console.error('[API /search/status] Search not found:', searchError)
    return NextResponse.json(
      {
        error: 'Suche nicht gefunden',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    )
  }

  // ============================================================================
  // 4. BUILD RESPONSE
  // ============================================================================
  const status = searchData.status as SearchStatus
  const progress = calculateProgress(
    status,
    searchData.leads_found || 0,
    searchData.max_results || 50
  )

  const response: SearchStatusResponse = {
    searchId: searchData.id,
    status,
    progress: {
      percent: progress,
      currentStep: getStepNumber(status),
      totalSteps: 6,
      stepName: getStepName(status),
      leadsFound: searchData.leads_found || 0,
      leadsExpected: searchData.max_results || 50,
    },
    timestamps: {
      started: searchData.started_at,
      updated: searchData.updated_at,
      completed: searchData.completed_at || undefined,
    },
  }

  // Add results summary if completed
  if (status === 'completed') {
    // Get summary statistics
    const { data: statsData } = await supabase
      .from('search_results')
      .select('email, phone, website', { count: 'exact' })
      .eq('search_history_id', searchId)
      .eq('user_id', user.id)
      .eq('is_duplicate', false)

    if (statsData) {
      const withEmail = statsData.filter((r) => r.email).length
      const withPhone = statsData.filter((r) => r.phone).length
      const withWebsite = statsData.filter((r) => r.website).length

      response.results = {
        totalCount: searchData.leads_found || 0,
        uniqueCount: searchData.leads_after_deduplication || searchData.leads_found || 0,
        withEmail,
        withPhone,
        withWebsite,
      }
    }
  }

  // Add error info if failed
  if (status === 'failed' && searchData.error_message) {
    response.error = {
      message: searchData.error_message,
      code: 'SEARCH_FAILED',
      retryable: true,
    }
  }

  console.log('[API /search/status] Returning status:', {
    searchId,
    status,
    progress: response.progress.percent,
  })

  return NextResponse.json(response)
}
