/**
 * Search Validation Schemas
 * Zod schemas for search requests and responses
 */

import { z } from 'zod'

// ============================================================================
// SEARCH REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for starting a new search
 * - searchQuery: Required, at least 2 chars
 * - locationQuery: Optional
 * - maxResults: 10-500, default 50
 * - includeDecisionMakers: Premium feature
 * - forceNewSearch: Skip cache
 */
export const startSearchRequestSchema = z.object({
  searchQuery: z
    .string()
    .min(2, 'Suchbegriff muss mindestens 2 Zeichen haben')
    .max(100, 'Suchbegriff darf maximal 100 Zeichen haben')
    .regex(
      /^[a-zA-Z0-9\s\-\u00e4\u00f6\u00fc\u00df]+$/,
      'Ungueltige Zeichen im Suchbegriff'
    ),

  locationQuery: z
    .string()
    .max(100)
    .regex(
      /^[a-zA-Z0-9\s,\.\-\u00e4\u00f6\u00fc\u00df]*$/,
      'Ungueltige Zeichen im Standort'
    )
    .optional(),

  maxResults: z
    .number()
    .min(10, 'Mindestens 10 Ergebnisse')
    .max(500, 'Maximal 500 Ergebnisse')
    .default(50),

  includeDecisionMakers: z.boolean().default(false),

  forceNewSearch: z.boolean().default(false),
})

export type StartSearchRequest = z.infer<typeof startSearchRequestSchema>

// ============================================================================
// SEARCH RESPONSE SCHEMAS
// ============================================================================

/**
 * Successful search start response
 */
export const startSearchResponseSchema = z.object({
  success: z.literal(true),
  searchId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'cached']),
  creditsCost: z.number().int().min(0),
  creditsRemaining: z.number().int().min(0),
  cachedResultId: z.string().uuid().optional(),
  message: z.string().optional(),
  estimatedTimeSeconds: z.number().int().optional(),
})

export type StartSearchResponse = z.infer<typeof startSearchResponseSchema>

/**
 * Error response for search start
 */
export const startSearchErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'INSUFFICIENT_CREDITS',
    'VALIDATION_ERROR',
    'RATE_LIMIT',
    'PLAN_LIMIT',
    'SERVER_ERROR',
  ]),
  details: z
    .object({
      required: z.number().optional(),
      available: z.number().optional(),
      field: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
})

export type StartSearchError = z.infer<typeof startSearchErrorSchema>

// ============================================================================
// SEARCH STATUS SCHEMAS
// ============================================================================

/**
 * Search status values (6 steps)
 */
export const searchStatusSchema = z.enum([
  'pending',
  'validating',
  'searching',
  'extracting',
  'enriching',
  'deduplicating',
  'completed',
  'failed',
  'cancelled',
])

export type SearchStatus = z.infer<typeof searchStatusSchema>

/**
 * Progress information
 */
export const searchProgressSchema = z.object({
  percent: z.number().int().min(0).max(100),
  currentStep: z.number().int().min(1).max(6),
  totalSteps: z.literal(6),
  stepName: z.string(),
  leadsFound: z.number().int().min(0),
  leadsExpected: z.number().int().min(0),
})

export type SearchProgress = z.infer<typeof searchProgressSchema>

/**
 * Full search status response
 */
export const searchStatusResponseSchema = z.object({
  searchId: z.string().uuid(),
  status: searchStatusSchema,
  progress: searchProgressSchema,
  results: z
    .object({
      totalCount: z.number().int(),
      uniqueCount: z.number().int(),
      withEmail: z.number().int(),
      withPhone: z.number().int(),
      withWebsite: z.number().int(),
    })
    .optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
  timestamps: z.object({
    started: z.string().datetime(),
    updated: z.string().datetime(),
    completed: z.string().datetime().optional(),
  }),
})

export type SearchStatusResponse = z.infer<typeof searchStatusResponseSchema>

// ============================================================================
// SEARCH RESULTS SCHEMAS
// ============================================================================

/**
 * Individual lead result
 */
export const searchResultLeadSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  googleMapsUrl: z.string().url(),
  rating: z.number().min(1).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  category: z.string().optional(),
  contactPerson: z.string().optional(),
  phoneFromWebsite: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      youtube: z.string().url().optional(),
    })
    .optional(),
  openingHours: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDuplicate: z.boolean().default(false),
})

export type SearchResultLead = z.infer<typeof searchResultLeadSchema>

/**
 * Search results response
 */
export const searchResultsResponseSchema = z.object({
  searchId: z.string().uuid(),
  status: z.literal('completed'),
  summary: z.object({
    totalFound: z.number().int(),
    afterDeduplication: z.number().int(),
    withEmail: z.number().int(),
    withPhone: z.number().int(),
    withWebsite: z.number().int(),
    averageRating: z.number().optional(),
  }),
  leads: z.array(searchResultLeadSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int(),
    hasMore: z.boolean(),
  }),
})

export type SearchResultsResponse = z.infer<typeof searchResultsResponseSchema>

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

/**
 * Apify webhook payload
 */
export const apifyWebhookPayloadSchema = z.object({
  runId: z.string(),
  datasetId: z.string(),
  status: z.enum(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']),
  searchId: z.string().optional(), // Our custom data
  actId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  stats: z
    .object({
      inputBodyLen: z.number(),
      outputBodyLen: z.number(),
    })
    .optional(),
})

export type ApifyWebhookPayload = z.infer<typeof apifyWebhookPayloadSchema>

/**
 * Webhook response
 */
export const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processed: z
    .object({
      leads: z.number().int(),
      stage: z.enum(['stage1_completed', 'stage2_completed', 'enrichment_skipped']),
    })
    .optional(),
})

export type WebhookResponse = z.infer<typeof webhookResponseSchema>

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate progress percentage based on status and leads
 */
export function calculateProgress(
  status: SearchStatus,
  leadsFound: number,
  maxResults: number,
  stage: 'stage1' | 'stage2' | 'complete' = 'stage1'
): number {
  const baseProgress: Record<SearchStatus, number> = {
    pending: 0,
    validating: 5,
    searching: 10,
    extracting: 20,
    enriching: 60,
    deduplicating: 80,
    completed: 100,
    failed: 100,
    cancelled: 0,
  }

  const base = baseProgress[status] || 0

  // Dynamic progress during extraction phase
  if (status === 'extracting') {
    const extractionProgress = Math.min(40, (leadsFound / maxResults) * 40)
    return base + extractionProgress
  }

  // Dynamic progress during enrichment phase
  if (status === 'enriching') {
    const enrichmentProgress = Math.min(20, (leadsFound / maxResults) * 20)
    return base + enrichmentProgress
  }

  return base
}

/**
 * Map status to step number (1-6)
 */
export function getStepNumber(status: SearchStatus): number {
  const stepMap: Record<SearchStatus, number> = {
    pending: 1,
    validating: 1,
    searching: 2,
    extracting: 3,
    enriching: 4,
    deduplicating: 5,
    completed: 6,
    failed: 6,
    cancelled: 0,
  }
  return stepMap[status] || 1
}

/**
 * Get step name in German
 */
export function getStepName(status: SearchStatus): string {
  const nameMap: Record<SearchStatus, string> = {
    pending: 'Validierung',
    validating: 'Validierung',
    searching: 'Suche gestartet',
    extracting: 'Daten extrahieren',
    enriching: 'Kontakte anreichern',
    deduplicating: 'Duplikate entfernen',
    completed: 'Ergebnisse bereit',
    failed: 'Fehlgeschlagen',
    cancelled: 'Abgebrochen',
  }
  return nameMap[status] || 'Unbekannt'
}

/**
 * Validate search parameters
 */
export function validateSearchParams(
  data: unknown
): { success: true; data: StartSearchRequest } | { success: false; errors: z.ZodError } {
  const result = startSearchRequestSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

/**
 * Calculate search cost in credits
 * 1 credit per 10 results + 50% for enrichment
 */
export function calculateSearchCost(
  maxResults: number,
  includeDecisionMakers: boolean
): number {
  const baseCost = Math.max(1, Math.ceil(maxResults / 10))
  const enrichmentCost = includeDecisionMakers ? Math.ceil(baseCost * 0.5) : 0
  return baseCost + enrichmentCost
}
