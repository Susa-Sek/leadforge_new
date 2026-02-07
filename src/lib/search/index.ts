/**
 * Search Module - Centralized exports for E4/E5 Search System
 *
 * This module exports all types, schemas and utilities for:
 * - Search operations (start, status, results)
 * - Rating and review count filters
 * - Validation schemas
 *
 * @example
 * ```typescript
 * import {
 *   type SearchResultLead,
 *   type RatingFilterParams,
 *   validateSearchParams,
 *   calculateSearchCost
 * } from '@/lib/search'
 * ```
 */

// ============================================================================
// Types (from validation.ts)
// ============================================================================
export type {
  StartSearchRequest,
  StartSearchResponse,
  StartSearchError,
  SearchStatus,
  SearchProgress,
  SearchStatusResponse,
  SearchResultLead,
  SearchResultsResponse,
  ApifyWebhookPayload,
  WebhookResponse,
  SearchResultFilters,
  RatingFilterQuery,
  RatingRange,
  ReviewCountRange,
} from './validation'

// ============================================================================
// Schemas (for validation)
// ============================================================================
export {
  startSearchRequestSchema,
  startSearchResponseSchema,
  startSearchErrorSchema,
  searchStatusSchema,
  searchProgressSchema,
  searchStatusResponseSchema,
  searchResultLeadSchema,
  searchResultsResponseSchema,
  apifyWebhookPayloadSchema,
  webhookResponseSchema,
  searchResultFiltersSchema,
  ratingFilterQuerySchema,
  ratingRangeSchema,
  reviewCountRangeSchema,
} from './validation'

// ============================================================================
// Utility Functions
// ============================================================================
export {
  calculateProgress,
  getStepNumber,
  getStepName,
  validateSearchParams,
  calculateSearchCost,
} from './validation'

// ============================================================================
// Client-safe Types (from types.ts - no server imports)
// ============================================================================
export type {
  SearchParams,
  SearchProgress as SearchProgressClient,
  SearchStatus as SearchStatusClient,
  SearchStatusResponse as SearchStatusResponseClient,
  SearchResultLead as SearchResultLeadClient,
  RatingFilterParams,
  RatingRange as RatingRangeClient,
  ReviewCountRange as ReviewCountRangeClient,
  SearchResultFilters as SearchResultFiltersClient,
  SearchResultsResponseWithFilters,
} from './types'

// Re-export client-safe calculateSearchCost
export { calculateSearchCost as calculateSearchCostClient } from './types'

// ============================================================================
// Rating Filter Specific Exports
// ============================================================================

/**
 * Default rating range (min: 0, max: 5)
 */
export const DEFAULT_RATING_RANGE = { min: 0, max: 5 } as const

/**
 * Default review count range (min: 0, max: 1000)
 */
export const DEFAULT_REVIEW_COUNT_RANGE = { min: 0, max: 1000 } as const

/**
 * Quick filter presets for ratings
 */
export const RATING_FILTER_PRESETS = {
  topRated: { min: 4.5, max: 5, label: 'Top-Rated (4.5+)' },
  highlyRated: { min: 4.0, max: 5, label: 'Sehr gut (4.0+)' },
  goodRated: { min: 3.5, max: 5, label: 'Gut (3.5+)' },
  any: { min: 0, max: 5, label: 'Alle Bewertungen' },
} as const

/**
 * Quick filter presets for review counts
 */
export const REVIEW_COUNT_PRESETS = {
  many: { min: 50, label: 'Viele Bewertungen (50+)' },
  moderate: { min: 20, label: 'Moderate Bewertungen (20+)' },
  some: { min: 5, label: 'Einige Bewertungen (5+)' },
  any: { min: 0, label: 'Alle' },
} as const

/**
 * Build query string from rating filter params
 */
export function buildRatingFilterQuery(params: Partial<{
  min_rating: number
  max_rating: number
  min_review_count: number
  max_review_count: number
}>): string {
  const parts: string[] = []

  if (params.min_rating !== undefined && params.min_rating > 0) {
    parts.push(`min_rating=${params.min_rating}`)
  }
  if (params.max_rating !== undefined && params.max_rating < 5) {
    parts.push(`max_rating=${params.max_rating}`)
  }
  if (params.min_review_count !== undefined && params.min_review_count > 0) {
    parts.push(`min_review_count=${params.min_review_count}`)
  }
  if (params.max_review_count !== undefined) {
    parts.push(`max_review_count=${params.max_review_count}`)
  }

  return parts.join('&')
}

/**
 * Check if any rating filters are active
 */
export function hasActiveRatingFilters(filters: {
  minRating?: number | null
  maxRating?: number | null
  minReviewCount?: number | null
  maxReviewCount?: number | null
}): boolean {
  return !!(
    filters.minRating !== null &&
    filters.minRating !== undefined &&
    filters.minRating > 0
  ) || !!(
    filters.maxRating !== null &&
    filters.maxRating !== undefined &&
    filters.maxRating < 5
  ) || !!(
    filters.minReviewCount !== null &&
    filters.minReviewCount !== undefined &&
    filters.minReviewCount > 0
  ) || !!(
    filters.maxReviewCount !== null &&
    filters.maxReviewCount !== undefined
  )
}

/**
 * Format rating filter for display
 */
export function formatRatingFilterLabel(
  min: number | null,
  max: number | null
): string {
  if (min === null && max === null) return 'Alle Bewertungen'
  if (min !== null && max === null) return `${min}+ Sterne`
  if (min === null && max !== null) return `Bis ${max} Sterne`
  return `${min}-${max} Sterne`
}

/**
 * Format review count filter for display
 */
export function formatReviewCountFilterLabel(
  min: number | null,
  max: number | null
): string {
  if (min === null && max === null) return 'Alle'
  if (min !== null && max === null) return `${min}+ Bewertungen`
  if (min === null && max !== null) return `Bis ${max} Bewertungen`
  return `${min}-${max} Bewertungen`
}

/**
 * Validate rating filter range
 * Returns null if valid, error message if invalid
 */
export function validateRatingFilter(
  min: number | null,
  max: number | null
): string | null {
  if (min !== null && (min < 0 || min > 5)) {
    return 'Minimale Bewertung muss zwischen 0 und 5 liegen'
  }
  if (max !== null && (max < 0 || max > 5)) {
    return 'Maximale Bewertung muss zwischen 0 und 5 liegen'
  }
  if (min !== null && max !== null && min > max) {
    return 'Minimale Bewertung darf nicht größer als maximale Bewertung sein'
  }
  return null
}

/**
 * Validate review count filter range
 * Returns null if valid, error message if invalid
 */
export function validateReviewCountFilter(
  min: number | null,
  max: number | null
): string | null {
  if (min !== null && (min < 0 || !Number.isInteger(min))) {
    return 'Minimale Anzahl muss eine positive Ganzzahl sein'
  }
  if (max !== null && (max < 0 || !Number.isInteger(max))) {
    return 'Maximale Anzahl muss eine positive Ganzzahl sein'
  }
  if (min !== null && max !== null && min > max) {
    return 'Minimale Anzahl darf nicht größer als maximale Anzahl sein'
  }
  return null
}
