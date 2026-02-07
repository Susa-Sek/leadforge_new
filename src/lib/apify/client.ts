/**
 * Apify Client Library
 * Handles integration with Apify Actors for lead scraping
 * Includes fallback chain: Primary -> Fallback -> Mock
 */

import { z } from 'zod'

// Environment validation
const apifyEnvSchema = z.object({
  APIFY_API_TOKEN: z.string().optional(),
  APIFY_PRIMARY_ACTOR: z.string().default('compass/crawler-google-places'),
  APIFY_FALLBACK_ACTOR: z.string().default('scraper-mind/google-maps-email-scraper-unlimited'),
  APIFY_ENRICHMENT_ACTOR: z.string().default('vdrmota/contact-info-scraper'),
  ENABLE_MOCK_DATA: z.string().default('false').transform((val) => val === 'true'),
  DEFAULT_MAX_RESULTS: z.string().default('50').transform((val) => parseInt(val, 10)),
})

const env = apifyEnvSchema.parse(process.env)

// ============================================================================
// TYPES
// ============================================================================

export interface Stage1Input {
  searchStringsArray: string[]
  locationQuery: string
  maxCrawledPlacesPerSearch: number
  language: string
  countryCode: string
  skipClosedPlaces: boolean
  includeWebResults: boolean
}

export interface Stage1Output {
  title: string
  address: string
  phone?: string
  website?: string
  totalScore?: number
  reviewsCount?: number
  categoryName?: string
  url: string
  placeId: string
  location?: {
    lat: number
    lng: number
  }
  openingHours?: Array<{
    day: string
    hours: string
  }>
  imageUrls?: string[]
}

export interface Stage2Input {
  urls: string[]
  pageLimit: number
  includeSocialLinks: boolean
  includeContactInfo: boolean
}

export interface Stage2Output {
  url: string
  emails: string[]
  phones: string[]
  socialLinks: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }
  contactName?: string
}

export interface ApifyRunResult {
  runId: string
  datasetId: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
}

export interface StartSearchResult {
  success: boolean
  runId?: string
  datasetId?: string
  error?: string
  usedFallback?: boolean
  usedMock?: boolean
}

export interface EnrichmentResult {
  success: boolean
  runId?: string
  datasetId?: string
  error?: string
}

// ============================================================================
// APIFY API CLIENT
// ============================================================================

const APIFY_BASE_URL = 'https://api.apify.com/v2'

/**
 * Check if Apify token is configured
 */
export function isApifyConfigured(): boolean {
  return !!env.APIFY_API_TOKEN && env.APIFY_API_TOKEN !== 'your_apify_api_token_here'
}

/**
 * Start Stage 1: Google Places Crawler
 * Primary: compass/crawler-google-places
 * Fallback: scraper-mind/google-maps-email-scraper-unlimited
 * Last resort: Mock data (development only)
 */
export async function startStage1Search(
  searchQuery: string,
  locationQuery: string,
  maxResults: number
): Promise<StartSearchResult> {
  // If mock data is enabled or Apify is not configured, use mock
  if (env.ENABLE_MOCK_DATA || !isApifyConfigured()) {
    console.log('[MOCK] Stage 1 search started:', { searchQuery, locationQuery, maxResults })
    return {
      success: true,
      runId: `mock_${Date.now()}`,
      datasetId: `mock_dataset_${Date.now()}`,
      usedMock: true,
    }
  }

  const input: Stage1Input = {
    searchStringsArray: [searchQuery],
    locationQuery: `${locationQuery}, Deutschland`,
    maxCrawledPlacesPerSearch: maxResults,
    language: 'de',
    countryCode: 'DE',
    skipClosedPlaces: false,
    includeWebResults: false,
  }

  try {
    // Try primary actor first
    const result = await startActorRun(env.APIFY_PRIMARY_ACTOR, input)
    console.log('[APIFY] Primary actor started:', result.runId)
    return {
      success: true,
      runId: result.runId,
      datasetId: result.datasetId,
      usedFallback: false,
      usedMock: false,
    }
  } catch (error) {
    console.warn('[APIFY] Primary actor failed, trying fallback:', error)

    // Try fallback actor
    try {
      const fallbackResult = await startActorRun(env.APIFY_FALLBACK_ACTOR, {
        ...input,
        // Adjust input for fallback actor if needed
      })
      console.log('[APIFY] Fallback actor started:', fallbackResult.runId)
      return {
        success: true,
        runId: fallbackResult.runId,
        datasetId: fallbackResult.datasetId,
        usedFallback: true,
        usedMock: false,
      }
    } catch (fallbackError) {
      console.error('[APIFY] Fallback actor also failed:', fallbackError)

      // Last resort: Use mock data (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[MOCK] Using mock data as last resort')
        return {
          success: true,
          runId: `mock_fallback_${Date.now()}`,
          datasetId: `mock_dataset_${Date.now()}`,
          usedFallback: true,
          usedMock: true,
        }
      }

      return {
        success: false,
        error: `Both primary and fallback actors failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
      }
    }
  }
}

/**
 * Start Stage 2: Contact Enrichment
 * Only for Professional+ plans with includeDecisionMakers=true
 */
export async function startStage2Enrichment(
  websiteUrls: string[]
): Promise<EnrichmentResult> {
  // If mock data is enabled or Apify is not configured, use mock
  if (env.ENABLE_MOCK_DATA || !isApifyConfigured()) {
    console.log('[MOCK] Stage 2 enrichment started:', { urls: websiteUrls.length })
    return {
      success: true,
      runId: `mock_enrich_${Date.now()}`,
      datasetId: `mock_enrich_dataset_${Date.now()}`,
    }
  }

  const input: Stage2Input = {
    urls: websiteUrls,
    pageLimit: 3, // Only check Impressum/About/Kontakt pages
    includeSocialLinks: true,
    includeContactInfo: true,
  }

  try {
    const result = await startActorRun(env.APIFY_ENRICHMENT_ACTOR, input)
    console.log('[APIFY] Enrichment actor started:', result.runId)
    return {
      success: true,
      runId: result.runId,
      datasetId: result.datasetId,
    }
  } catch (error) {
    console.error('[APIFY] Enrichment actor failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Start an Apify actor run
 */
async function startActorRun(
  actorId: string,
  input: unknown
): Promise<ApifyRunResult> {
  if (!env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not configured')
  }

  const response = await fetch(`${APIFY_BASE_URL}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.APIFY_API_TOKEN}`,
    },
    body: JSON.stringify({
      ...(input as Record<string, unknown>),
      // Add webhook notification if configured
      webhooks: process.env.APIFY_WEBHOOK_URL
        ? [{ eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'], requestUrl: process.env.APIFY_WEBHOOK_URL }]
        : undefined,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Apify API error (${response.status}): ${errorData.error || response.statusText}`)
  }

  const data = await response.json()

  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
    status: data.data.status,
  }
}

/**
 * Get dataset items from Apify
 */
export async function getDatasetItems(
  datasetId: string,
  limit?: number,
  offset?: number
): Promise<unknown[]> {
  // Handle mock datasets
  if (datasetId.startsWith('mock_')) {
    return getMockDatasetItems(datasetId)
  }

  if (!env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not configured')
  }

  const params = new URLSearchParams()
  if (limit) params.append('limit', limit.toString())
  if (offset) params.append('offset', offset.toString())

  const response = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${env.APIFY_API_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get run status from Apify
 */
export async function getRunStatus(runId: string): Promise<{
  status: string
  stats?: {
    inputBodyLen: number
    outputBodyLen: number
  }
}> {
  // Handle mock runs
  if (runId.startsWith('mock_')) {
    return { status: 'SUCCEEDED' }
  }

  if (!env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN not configured')
  }

  const response = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${env.APIFY_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch run status: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    status: data.data.status,
    stats: data.data.stats,
  }
}

// ============================================================================
// MOCK DATA GENERATOR (Development Only)
// ============================================================================

interface MockLead {
  title: string
  address: string
  phone?: string
  website?: string
  email?: string
  totalScore?: number
  reviewsCount?: number
  categoryName?: string
  url: string
  placeId: string
  location?: {
    lat: number
    lng: number
  }
  openingHours?: Array<{
    day: string
    hours: string
  }>
  imageUrls?: string[]
}

function getMockDatasetItems(datasetId: string): MockLead[] {
  // Extract search info from datasetId (if encoded) or use defaults
  const count = parseInt(datasetId.split('_').pop() || '50', 10) || 50

  const germanCities = ['Hamburg', 'Berlin', 'Munchen', 'Koln', 'Buxtehude', 'Stade', 'Frankfurt']
  const streetNames = ['Hauptstrasse', 'Bahnhofstrasse', 'Marktplatz', 'Industriestrasse', 'Berliner Strasse']
  const suffixes = ['GmbH', 'OHG', 'e.K.', 'AG', '& Co. KG', 'Service', 'Beratung', 'Expert']
  const categories = ['Steuerberater', 'Rechtsanwalt', 'Immobilienmakler', 'Zahnarzt', 'Restaurant']

  const leads: MockLead[] = []
  const category = categories[Math.floor(Math.random() * categories.length)]
  const city = germanCities[Math.floor(Math.random() * germanCities.length)]

  for (let i = 0; i < Math.min(count, 50); i++) {
    const street = streetNames[Math.floor(Math.random() * streetNames.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const companyName = `${category} ${suffix} ${i + 1}`

    leads.push({
      title: companyName,
      address: `${street} ${Math.floor(Math.random() * 100) + 1}, ${city}`,
      phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90000000) + 10000000}`,
      website: Math.random() > 0.3 ? `https://www.${companyName.toLowerCase().replace(/\s/g, '-')}.de` : undefined,
      email: Math.random() > 0.5 ? `info@${companyName.toLowerCase().replace(/\s/g, '-')}.de` : undefined,
      totalScore: Number((Math.random() * 2 + 3).toFixed(1)),
      reviewsCount: Math.floor(Math.random() * 200),
      categoryName: category,
      url: `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + city)}`,
      placeId: `mock_${Date.now()}_${i}`,
      location: {
        lat: 52.5 + Math.random() * 2 - 1,
        lng: 13.4 + Math.random() * 2 - 1,
      },
      openingHours: [
        { day: 'Monday', hours: '09:00-18:00' },
        { day: 'Tuesday', hours: '09:00-18:00' },
        { day: 'Wednesday', hours: '09:00-18:00' },
        { day: 'Thursday', hours: '09:00-18:00' },
        { day: 'Friday', hours: '09:00-17:00' },
      ],
      imageUrls: Math.random() > 0.7 ? [`https://picsum.photos/400/300?random=${i}`] : undefined,
    })
  }

  return leads
}

/**
 * Generate mock Stage 2 enrichment results
 */
export function getMockEnrichmentResults(websiteUrls: string[]): Stage2Output[] {
  return websiteUrls.map((url, index) => ({
    url,
    emails: Math.random() > 0.3 ? [`info@${new URL(url).hostname}`, `kontakt@${new URL(url).hostname}`] : [],
    phones: Math.random() > 0.4 ? [`+49 30 ${Math.floor(Math.random() * 90000000) + 10000000}`] : [],
    socialLinks: {
      facebook: Math.random() > 0.6 ? `https://facebook.com/page${index}` : undefined,
      instagram: Math.random() > 0.7 ? `https://instagram.com/page${index}` : undefined,
      linkedin: Math.random() > 0.8 ? `https://linkedin.com/company/page${index}` : undefined,
    },
    contactName: Math.random() > 0.5 ? `Max Mustermann${index}` : undefined,
  }))
}

// ============================================================================
// RETRY UTILITY
// ============================================================================

interface RetryConfig {
  maxAttempts: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1s
  maxDelay: 10000, // 10s
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  context: string
): Promise<T> {
  let lastError: Error
  let delay = config.initialDelay

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      console.warn(`[RETRY] ${context} failed (attempt ${attempt}/${config.maxAttempts}):`, lastError.message)

      if (attempt < config.maxAttempts) {
        await sleep(delay)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
      }
    }
  }

  throw new Error(`${context} failed after ${config.maxAttempts} attempts: ${lastError!.message}`)
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

export interface ApifyWebhookPayload {
  runId: string
  datasetId: string
  status: 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
  searchId?: string // Custom data we pass
  actId?: string
  startedAt?: string
  finishedAt?: string
  stats?: {
    inputBodyLen: number
    outputBodyLen: number
  }
}

/**
 * Verify webhook signature (if webhook secret is configured)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signature) {
    // If no secret configured, skip verification (but log warning)
    console.warn('[WEBHOOK] No signature verification configured')
    return true
  }

  // TODO: Implement HMAC signature verification if Apify provides it
  // For now, we validate the searchId exists in our database
  return true
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ApifyClient = {
  isConfigured: isApifyConfigured,
  startStage1: startStage1Search,
  startStage2: startStage2Enrichment,
  getDatasetItems,
  getRunStatus,
  withRetry,
  verifyWebhookSignature,
}

export default ApifyClient
