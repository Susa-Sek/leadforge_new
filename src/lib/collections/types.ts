/**
 * Collection Types
 *
 * TypeScript types for collections and search history
 * Used by E6 - Sammlungen & Suchverlauf
 */

import { SearchResultLead } from '@/lib/search/types'

// ============================================================================
// COLLECTION TYPES
// ============================================================================

/** Collection item from API */
export interface Collection {
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

/** Collection list response from API */
export interface CollectionsResponse {
  collections: Collection[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/** Collection detail with leads */
export interface CollectionDetailResponse {
  collection: Collection
  leads: SearchResultLead[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

/** Collection statistics */
export interface CollectionStats {
  totalLeads: number
  averageRating: number | null
  totalReviews: number
  withWebsite: number
  withEmail: number
  withPhone: number
  withSocialMedia: number
}

// ============================================================================
// SEARCH HISTORY TYPES
// ============================================================================

/** Search history item */
export interface SearchHistoryItem {
  id: string
  query_params: {
    industry: string
    location: string
    max_results: number
  }
  result_count: number
  credits_used: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  duration_seconds?: number
  collection_id?: string
  error_message?: string
  created_at: string
  updated_at: string
}

/** Search history list response */
export interface SearchHistoryResponse {
  searches: SearchHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  summary: {
    total_searches: number
    total_credits_used: number
    total_leads_found: number
  }
}

/** Search retry response */
export interface SearchRetryResponse {
  new_search_id: string
  status: 'pending'
  estimated_cost: number
  message: string
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

/** Collection list filters */
export interface CollectionFilters {
  sort_by: 'date' | 'name' | 'count'
  sort_order: 'asc' | 'desc'
  search?: string
}

/** Search history filters */
export interface SearchHistoryFilters {
  status: 'all' | 'pending' | 'running' | 'completed' | 'failed'
  date_from?: string
  date_to?: string
}

// ============================================================================
// VIEW MODE
// ============================================================================

export type ViewMode = 'grid' | 'list'
