/**
 * POST /api/webhooks/apify
 * Receives webhook callbacks from Apify
 * Processes Stage 1 and Stage 2 results
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ApifyClient,
  type Stage1Output,
  type Stage2Output,
} from '@/lib/apify/client'
import {
  apifyWebhookPayloadSchema,
  type ApifyWebhookPayload,
} from '@/lib/search/validation'

export async function POST(request: Request) {
  console.log('[WEBHOOK /apify] Received webhook')

  // ============================================================================
  // 1. VERIFY WEBHOOK SIGNATURE (if configured)
  // ============================================================================
  const signature = request.headers.get('x-apify-webhook-signature')
  const secret = process.env.APIFY_WEBHOOK_SECRET

  // TODO: Implement proper signature verification if Apify provides it
  // For now, we rely on searchId validation and the payload format

  // ============================================================================
  // 2. PARSE WEBHOOK PAYLOAD
  // ============================================================================
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    console.error('[WEBHOOK /apify] Invalid JSON payload')
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  // Validate payload structure
  const validation = apifyWebhookPayloadSchema.safeParse(payload)
  if (!validation.success) {
    console.error('[WEBHOOK /apify] Invalid payload structure:', validation.error.flatten())
    return NextResponse.json(
      { success: false, error: 'Invalid payload structure' },
      { status: 400 }
    )
  }

  const data: ApifyWebhookPayload = validation.data
  console.log('[WEBHOOK /apify] Validated payload:', {
    runId: data.runId,
    datasetId: data.datasetId,
    status: data.status,
    actId: data.actId,
  })

  // ============================================================================
  // 3. FIND SEARCH BY APIFY RUN ID
  // ============================================================================
  // We need to find the search by apify_run_id or apify_enrichment_run_id
  const supabase = await createClient()

  const { data: searchData, error: searchError } = await supabase
    .from('search_history')
    .select('*')
    .or(`apify_run_id.eq.${data.runId},apify_enrichment_run_id.eq.${data.runId}`)
    .single()

  if (searchError || !searchData) {
    console.error('[WEBHOOK /apify] Search not found for run:', data.runId)
    return NextResponse.json(
      { success: false, error: 'Search not found' },
      { status: 404 }
    )
  }

  const searchId = searchData.id
  const userId = searchData.user_id
  const isStage1 = searchData.apify_run_id === data.runId
  const isStage2 = searchData.apify_enrichment_run_id === data.runId

  console.log('[WEBHOOK /apify] Found search:', {
    searchId,
    isStage1,
    isStage2,
    apifyStatus: data.status,
  })

  // ============================================================================
  // 4. HANDLE FAILED STATUS
  // ============================================================================
  if (data.status === 'FAILED' || data.status === 'TIMED_OUT' || data.status === 'ABORTED') {
    console.error('[WEBHOOK /apify] Apify run failed:', data.status)

    // Mark search as failed
    await supabase.rpc('fail_search', {
      p_search_id: searchId,
      p_error_message: `Apify run ${data.status}: ${data.runId}`,
    })

    // Refund credits
    const { addCredits } = await import('@/lib/actions/credits')
    await addCredits(userId, searchData.credits_cost, 'refund', {
      reason: 'apify_run_failed',
      run_id: data.runId,
      status: data.status,
    })

    return NextResponse.json({
      success: false,
      error: `Apify run ${data.status}`,
    })
  }

  // ============================================================================
  // 5. HANDLE STAGE 1 COMPLETION
  // ============================================================================
  if (isStage1 && data.status === 'SUCCEEDED') {
    console.log('[WEBHOOK /apify] Processing Stage 1 completion')

    try {
      // Update status to extracting
      await supabase.rpc('update_search_progress', {
        p_search_id: searchId,
        p_status: 'extracting',
        p_progress_percent: 40,
      })

      // Fetch dataset items
      const items = await ApifyClient.getDatasetItems(data.datasetId)
      console.log('[WEBHOOK /apify] Fetched', items.length, 'items from dataset')

      // Map and save Stage 1 results
      const typedItems = items as Stage1Output[]
      const leadsToInsert = typedItems.map((item, index) => ({
        search_history_id: searchId,
        user_id: userId,
        company_name: item.title || `Unternehmen ${index + 1}`,
        address: item.address || '',
        phone: item.phone || null,
        website: item.website || null,
        google_maps_url: item.url || '',
        place_id: item.placeId || `unknown_${index}`,
        rating: item.totalScore || null,
        reviews_count: item.reviewsCount || null,
        category: item.categoryName || null,
        latitude: item.location?.lat || null,
        longitude: item.location?.lng || null,
        opening_hours: item.openingHours ? JSON.parse(JSON.stringify(item.openingHours)) : null,
        image_url: item.imageUrls?.[0] || null,
        source_actor: data.actId || 'compass/crawler-google-places',
        enriched: false,
      }))

      // Save to database
      const { error: insertError } = await supabase.from('search_results').insert(leadsToInsert)

      if (insertError) {
        console.error('[WEBHOOK /apify] Failed to insert Stage 1 results:', insertError)
        throw insertError
      }

      console.log('[WEBHOOK /apify] Saved', leadsToInsert.length, 'Stage 1 results')

      // Update progress
      await supabase.rpc('update_search_progress', {
        p_search_id: searchId,
        p_status: 'extracting',
        p_progress_percent: 50,
        p_leads_found: items.length,
      })

      // ============================================================================
      // 6. CHECK IF STAGE 2 (ENRICHMENT) NEEDED
      // ============================================================================
      if (searchData.include_decision_makers) {
        console.log('[WEBHOOK /apify] Starting Stage 2 enrichment')

        // Get websites to enrich
        const websites = leadsToInsert
          .map((lead) => lead.website)
          .filter((url): url is string => !!url && url.length > 0)
          .slice(0, 50) // Limit to 50 websites

        if (websites.length > 0) {
          // Update status to enriching
          await supabase.rpc('update_search_progress', {
            p_search_id: searchId,
            p_status: 'enriching',
            p_progress_percent: 60,
          })

          // Start enrichment actor
          const enrichmentResult = await ApifyClient.startStage2(websites)

          if (enrichmentResult.success) {
            // Update search with enrichment run ID
            await supabase
              .from('search_history')
              .update({
                apify_enrichment_run_id: enrichmentResult.runId,
                apify_enrichment_dataset_id: enrichmentResult.datasetId,
              })
              .eq('id', searchId)

            console.log('[WEBHOOK /apify] Stage 2 enrichment started:', enrichmentResult.runId)

            return NextResponse.json({
              success: true,
              message: 'Stage 1 complete, Stage 2 enrichment started',
              processed: {
                leads: items.length,
                stage: 'stage1_completed',
              },
            })
          } else {
            console.warn('[WEBHOOK /apify] Enrichment failed to start, continuing without enrichment')
          }
        } else {
          console.log('[WEBHOOK /apify] No websites to enrich')
        }
      }

      // ============================================================================
      // 7. COMPLETE SEARCH (no enrichment needed or enrichment skipped)
      // ============================================================================
      await completeSearch(supabase, searchId, items.length, items)

      return NextResponse.json({
        success: true,
        message: 'Search completed successfully',
        processed: {
          leads: items.length,
          stage: 'enrichment_skipped',
        },
      })
    } catch (error) {
      console.error('[WEBHOOK /apify] Error processing Stage 1:', error)

      // Mark search as failed
      await supabase.rpc('fail_search', {
        p_search_id: searchId,
        p_error_message: error instanceof Error ? error.message : 'Stage 1 processing failed',
      })

      // Refund credits
      const { addCredits } = await import('@/lib/actions/credits')
      await addCredits(userId, searchData.credits_cost, 'refund', {
        reason: 'stage1_processing_failed',
        error: error instanceof Error ? error.message : 'Unknown',
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Stage 1 processing failed',
        },
        { status: 500 }
      )
    }
  }

  // ============================================================================
  // 8. HANDLE STAGE 2 COMPLETION (ENRICHMENT)
  // ============================================================================
  if (isStage2 && data.status === 'SUCCEEDED') {
    console.log('[WEBHOOK /apify] Processing Stage 2 completion')

    try {
      // Fetch enrichment results
      const enrichmentItems = await ApifyClient.getDatasetItems(data.datasetId)
      console.log('[WEBHOOK /apify] Fetched', enrichmentItems.length, 'enrichment items')

      // Create a map of website -> enrichment data
      const enrichmentMap = new Map<string, Stage2Output>()
      for (const item of enrichmentItems as Stage2Output[]) {
        if (item.url) {
          enrichmentMap.set(item.url.toLowerCase(), item)
        }
      }

      // Get existing leads
      const { data: existingLeads } = await supabase
        .from('search_results')
        .select('id, website')
        .eq('search_history_id', searchId)
        .eq('user_id', userId)

      if (existingLeads) {
        // Update leads with enrichment data
        for (const lead of existingLeads) {
          if (!lead.website) continue

          const enrichment = enrichmentMap.get(lead.website.toLowerCase())
          if (!enrichment) continue

          await supabase
            .from('search_results')
            .update({
              email: enrichment.emails?.[0] || null,
              phone_from_website: enrichment.phones?.[0] || null,
              contact_person: enrichment.contactName || null,
              facebook_url: enrichment.socialLinks?.facebook || null,
              instagram_url: enrichment.socialLinks?.instagram || null,
              linkedin_url: enrichment.socialLinks?.linkedin || null,
              twitter_url: enrichment.socialLinks?.twitter || null,
              enriched: true,
              enrichment_source: data.actId || 'vdrmota/contact-info-scraper',
            })
            .eq('id', lead.id)
        }

        console.log('[WEBHOOK /apify] Updated', existingLeads.length, 'leads with enrichment data')
      }

      // Complete the search
      await completeSearch(
        supabase,
        searchId,
        searchData.leads_found || enrichmentItems.length,
        null
      )

      return NextResponse.json({
        success: true,
        message: 'Stage 2 enrichment complete',
        processed: {
          leads: enrichmentItems.length,
          stage: 'stage2_completed',
        },
      })
    } catch (error) {
      console.error('[WEBHOOK /apify] Error processing Stage 2:', error)

      // Don't fail the search completely, just mark enrichment as failed
      // The Stage 1 results are still valuable
      await completeSearch(
        supabase,
        searchId,
        searchData.leads_found || 0,
        null
      )

      return NextResponse.json({
        success: true,
        message: 'Search completed (enrichment partially failed)',
        processed: {
          leads: searchData.leads_found || 0,
          stage: 'stage2_completed',
        },
      })
    }
  }

  // Unknown webhook type
  console.warn('[WEBHOOK /apify] Unknown webhook type:', { isStage1, isStage2, status: data.status })

  return NextResponse.json({
    success: true,
    message: 'Webhook received but not processed',
  })
}

/**
 * Complete a search and mark it as done
 */
async function completeSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchId: string,
  leadsFound: number,
  resultsJson: unknown
) {
  console.log('[WEBHOOK /apify] Completing search:', searchId)

  // Update to deduplicating
  await supabase.rpc('update_search_progress', {
    p_search_id: searchId,
    p_status: 'deduplicating',
    p_progress_percent: 85,
  })

  // Simple deduplication: mark duplicates based on place_id
  const { data: duplicates } = await supabase
    .from('search_results')
    .select('id, place_id')
    .eq('search_history_id', searchId)
    .order('created_at', { ascending: true })

  if (duplicates && duplicates.length > 0) {
    const seenPlaceIds = new Set<string>()
    const duplicateIds: string[] = []

    for (const lead of duplicates) {
      if (seenPlaceIds.has(lead.place_id)) {
        duplicateIds.push(lead.id)
      } else {
        seenPlaceIds.add(lead.place_id)
      }
    }

    // Mark duplicates
    if (duplicateIds.length > 0) {
      await supabase
        .from('search_results')
        .update({ is_duplicate: true })
        .in('id', duplicateIds)

      console.log('[WEBHOOK /apify] Marked', duplicateIds.length, 'duplicates')
    }
  }

  // Count unique leads
  const { count: uniqueCount } = await supabase
    .from('search_results')
    .select('*', { count: 'exact', head: true })
    .eq('search_history_id', searchId)
    .eq('is_duplicate', false)

  // Calculate Apify cost (approximate)
  // Stage 1: $0.004/lead, Stage 2: $0.002/page
  const apifyCostUsd = leadsFound * 0.004

  // Complete the search
  await supabase.rpc('complete_search', {
    p_search_id: searchId,
    p_leads_found: leadsFound,
    p_leads_after_deduplication: uniqueCount || leadsFound,
    p_results_json: resultsJson ? JSON.parse(JSON.stringify(resultsJson)) : null,
    p_apify_cost_usd: apifyCostUsd,
  })

  console.log('[WEBHOOK /apify] Search completed:', {
    searchId,
    leadsFound,
    uniqueCount,
    apifyCostUsd,
  })
}
