'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreditDeductResult = {
  success: boolean
  remainingCredits: number
  error?: string
}

export type CreditCheckResult = {
  hasEnough: boolean
  available: number
  required: number
}

/**
 * Deduct credits from user's account
 * Uses row-level locking to prevent race conditions
 *
 * @param userId - The user ID to deduct credits from
 * @param amount - Amount of credits to deduct (must be positive)
 * @param reason - Reason for deduction (e.g., 'search', 'export', 'scrape')
 * @param metadata - Optional metadata (search_id, etc.)
 * @returns CreditDeductResult with success status and remaining credits
 *
 * @throws Error if insufficient credits or database error
 */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<CreditDeductResult> {
  const supabase = await createClient()

  // Validation
  if (!userId) {
    return { success: false, remainingCredits: 0, error: 'User ID required' }
  }

  if (!amount || amount <= 0) {
    return { success: false, remainingCredits: 0, error: 'Amount must be positive' }
  }

  if (!reason) {
    return { success: false, remainingCredits: 0, error: 'Reason required' }
  }

  try {
    // Use RPC for atomic operation with row-level locking
    // This prevents race conditions when multiple requests try to deduct simultaneously
    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_metadata: metadata || {},
    })

    if (error) {
      // Check for specific error messages from the function
      if (error.message.includes('Insufficient credits')) {
        return {
          success: false,
          remainingCredits: 0,
          error: 'Nicht genug Credits',
        }
      }
      throw error
    }

    // Revalidate dashboard to reflect new credit count
    revalidatePath('/dashboard')

    return {
      success: true,
      remainingCredits: data as number,
    }
  } catch (error) {
    console.error('Error deducting credits:', error)
    return {
      success: false,
      remainingCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if user has enough credits
 * Lightweight check without locking
 *
 * @param userId - The user ID to check
 * @param requiredAmount - Amount of credits required
 * @returns CreditCheckResult with availability info
 */
export async function checkCredits(
  userId: string,
  requiredAmount: number
): Promise<CreditCheckResult> {
  const supabase = await createClient()

  if (!userId) {
    return { hasEnough: false, available: 0, required: requiredAmount }
  }

  if (!requiredAmount || requiredAmount <= 0) {
    return { hasEnough: true, available: 0, required: 0 }
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error checking credits:', error)
      return { hasEnough: false, available: 0, required: requiredAmount }
    }

    const available = (data?.total_credits || 0) - (data?.used_credits || 0)

    return {
      hasEnough: available >= requiredAmount,
      available,
      required: requiredAmount,
    }
  } catch (error) {
    console.error('Error checking credits:', error)
    return { hasEnough: false, available: 0, required: requiredAmount }
  }
}

/**
 * Add credits to user's account (for admin or purchase flows)
 *
 * @param userId - The user ID to add credits to
 * @param amount - Amount of credits to add
 * @param reason - Reason for adding credits (e.g., 'purchase', 'bonus', 'refund')
 * @param metadata - Optional metadata (payment_id, etc.)
 * @returns CreditDeductResult with success status and new total
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<CreditDeductResult> {
  const supabase = await createClient()

  if (!userId) {
    return { success: false, remainingCredits: 0, error: 'User ID required' }
  }

  if (!amount || amount <= 0) {
    return { success: false, remainingCredits: 0, error: 'Amount must be positive' }
  }

  try {
    const { data, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_metadata: metadata || {},
    })

    if (error) {
      throw error
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      remainingCredits: data as number,
    }
  } catch (error) {
    console.error('Error adding credits:', error)
    return {
      success: false,
      remainingCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get current credit balance for user
 *
 * @param userId - The user ID
 * @returns Object with total, used, and remaining credits
 */
export async function getCreditBalance(userId: string): Promise<{
  total: number
  used: number
  remaining: number
  error?: string
}> {
  const supabase = await createClient()

  if (!userId) {
    return { total: 0, used: 0, remaining: 0, error: 'User ID required' }
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw error
    }

    const total = data?.total_credits || 0
    const used = data?.used_credits || 0

    return {
      total,
      used,
      remaining: total - used,
    }
  } catch (error) {
    console.error('Error getting credit balance:', error)
    return {
      total: 0,
      used: 0,
      remaining: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
