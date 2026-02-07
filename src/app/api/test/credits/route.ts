// Test API Route for Credit System
// DELETE THIS FILE BEFORE PRODUCTION
// Usage: GET /api/test/credits - Check current balance
// Usage: POST /api/test/credits - Test deduct/add operations

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  deductCredits,
  addCredits,
  checkCredits,
  getCreditBalance,
} from '@/lib/actions/credits'
import {
  hasEnoughCredits,
  calculateSearchCost,
  isLowOnCredits,
} from '@/lib/credits/check'

// GET: Check current credit status
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get balance
    const balance = await getCreditBalance(user.id)

    // Check various scenarios
    const check10 = await checkCredits(user.id, 10)
    const check50 = await checkCredits(user.id, 50)
    const isLow = await isLowOnCredits(user.id, 20)

    // Calculate costs
    const searchCost = calculateSearchCost(50)

    return NextResponse.json({
      user_id: user.id,
      balance,
      checks: {
        for_10: check10,
        for_50: check50,
      },
      is_low_on_credits: isLow,
      cost_examples: {
        search_50_results: searchCost,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Test credit operations
// Body: { action: 'deduct' | 'add', amount: number }
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, amount = 1 } = body

    if (!action || !['deduct', 'add'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "deduct" or "add"' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    let result

    if (action === 'deduct') {
      // Check first
      const check = await hasEnoughCredits(user.id, amount)
      if (!check.hasEnough) {
        return NextResponse.json(
          {
            error: 'Nicht genug Credits',
            required: amount,
            available: check.available,
            deficit: check.deficit,
          },
          { status: 402 }
        )
      }

      // Deduct
      result = await deductCredits(user.id, amount, 'test_api_call', {
        test: true,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Add credits
      result = await addCredits(user.id, amount, 'test_add', {
        test: true,
        timestamp: new Date().toISOString(),
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, action },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      action,
      amount,
      remaining_credits: result.remainingCredits,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Reset user credits to default (30)
export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Reset using the RPC function
    const { data, error } = await supabase.rpc('reset_user_credits', {
      p_user_id: user.id,
      p_new_total: 30,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Credits reset to 30',
      new_total: data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
