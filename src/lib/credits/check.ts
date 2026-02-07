import { createClient } from '@/lib/supabase/server'

export type CreditStatus = {
  hasEnough: boolean
  available: number
  required: number
  deficit: number
}

/**
 * Check if user has enough credits for an operation
 * Lightweight synchronous-style check for use in API routes
 *
 * @param userId - The user ID to check
 * @param requiredAmount - Amount of credits required
 * @returns CreditStatus object with detailed info
 *
 * @example
 * ```typescript
 * const status = await hasEnoughCredits(userId, 10);
 * if (!status.hasEnough) {
 *   return Response.json(
 *     { error: `Nicht genug Credits. Noch verfügbar: ${status.available}` },
 *     { status: 402 }
 *   );
 * }
 * ```
 */
export async function hasEnoughCredits(
  userId: string,
  requiredAmount: number
): Promise<CreditStatus> {
  const supabase = await createClient()

  // Default response for invalid inputs
  const defaultResponse: CreditStatus = {
    hasEnough: false,
    available: 0,
    required: requiredAmount,
    deficit: requiredAmount,
  }

  if (!userId) {
    return defaultResponse
  }

  if (!requiredAmount || requiredAmount <= 0) {
    return {
      hasEnough: true,
      available: 0,
      required: 0,
      deficit: 0,
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Credit check failed:', error)
      return defaultResponse
    }

    const available = (data?.total_credits || 0) - (data?.used_credits || 0)
    const deficit = Math.max(0, requiredAmount - available)

    return {
      hasEnough: available >= requiredAmount,
      available,
      required: requiredAmount,
      deficit,
    }
  } catch (error) {
    console.error('Credit check error:', error)
    return defaultResponse
  }
}

/**
 * Quick credit check that throws if insufficient credits
 * Useful for early-exit in API handlers
 *
 * @param userId - The user ID to check
 * @param requiredAmount - Amount of credits required
 * @throws Error with message "Nicht genug Credits" if insufficient
 *
 * @example
 * ```typescript
 * try {
 *   await requireCredits(userId, 10);
 *   // Proceed with operation
 * } catch (error) {
 *   return Response.json({ error: error.message }, { status: 402 });
 * }
 * ```
 */
export async function requireCredits(
  userId: string,
  requiredAmount: number
): Promise<void> {
  const status = await hasEnoughCredits(userId, requiredAmount)

  if (!status.hasEnough) {
    throw new Error(
      `Nicht genug Credits. Benötigt: ${requiredAmount}, Verfügbar: ${status.available}`
    )
  }
}

/**
 * Calculate credit cost for search based on parameters
 *
 * @param maxResults - Maximum results requested
 * @returns Credit cost (1 credit per 10 results, min 1)
 *
 * @example
 * ```typescript
 * const cost = calculateSearchCost(50); // Returns 5
 * const cost = calculateSearchCost(5);  // Returns 1
 * ```
 */
export function calculateSearchCost(maxResults: number): number {
  if (!maxResults || maxResults <= 0) {
    return 1
  }
  // 1 credit per 10 results, minimum 1 credit
  return Math.max(1, Math.ceil(maxResults / 10))
}

/**
 * Calculate credit cost for export operations
 *
 * @param leadCount - Number of leads to export
 * @param format - Export format ('csv' or 'excel')
 * @returns Credit cost
 */
export function calculateExportCost(
  leadCount: number,
  format: 'csv' | 'excel' = 'csv'
): number {
  if (!leadCount || leadCount <= 0) {
    return 0
  }

  // Base cost: 1 credit per 50 leads
  const baseCost = Math.max(1, Math.ceil(leadCount / 50))

  // Excel costs 2x (more processing)
  if (format === 'excel') {
    return baseCost * 2
  }

  return baseCost
}

/**
 * Credit costs for different operations
 * Centralized configuration for credit pricing
 */
export const CREDIT_COSTS = {
  // Search operations (per 10 results)
  SEARCH_BASE: 1,
  SEARCH_PER_RESULTS: 10,

  // Export operations (per 50 leads)
  EXPORT_CSV_BASE: 1,
  EXPORT_EXCEL_MULTIPLIER: 2,

  // CRM operations
  CRM_IMPORT: 0, // Free
  CRM_EXPORT: 1,

  // Minimum costs
  MIN_SEARCH_COST: 1,
  MIN_EXPORT_COST: 1,
} as const

/**
 * Check if user is low on credits (below threshold)
 *
 * @param userId - The user ID to check
 * @param threshold - Threshold percentage (default: 20%)
 * @returns boolean indicating if credits are low
 */
export async function isLowOnCredits(
  userId: string,
  threshold: number = 20
): Promise<boolean> {
  const supabase = await createClient()

  if (!userId) {
    return true
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      return true
    }

    const total = data?.total_credits || 0
    const used = data?.used_credits || 0
    const remaining = total - used

    if (total === 0) {
      return true
    }

    const percentage = (remaining / total) * 100
    return percentage < threshold
  } catch {
    return true
  }
}
