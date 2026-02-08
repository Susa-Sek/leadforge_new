/**
 * Notification Preferences API
 *
 * GET /api/notifications/preferences - Get user preferences
 * POST /api/notifications/preferences - Update preferences
 * PUT /api/notifications/preferences - Update single preference
 *
 * @module NotificationsAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getPreferences,
  updatePreference,
  updatePreferences,
  initializePreferences,
  getUserPlanTier,
} from '@/lib/notifications/service'
import {
  updatePreferencesSchema,
  updateSinglePreferenceSchema,
  NOTIFICATION_LIMITS,
} from '@/lib/notifications/validation'

/**
 * GET /api/notifications/preferences
 *
 * Get user's notification preferences
 */
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get preferences
    const { preferences, error } = await getPreferences(supabase, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    // Get plan tier for feature flags
    const planTier = await getUserPlanTier(supabase, user.id)
    const limits = NOTIFICATION_LIMITS[planTier]

    return NextResponse.json({
      preferences,
      plan_tier: planTier,
      features: {
        can_disable_types: limits.canDisableTypes,
        available_channels: limits.channels,
        max_notifications: limits.maxNotifications,
        retention_days: limits.retentionDays,
      },
    })
  } catch (error) {
    console.error('Unexpected error in get preferences:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/preferences
 *
 * Initialize default preferences (for new users)
 */
export async function POST() {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Initialize default preferences
    const { success, error } = await initializePreferences(supabase, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    // Fetch the created preferences
    const { preferences } = await getPreferences(supabase, user.id)

    return NextResponse.json({
      success,
      preferences,
      message: 'Benachrichtigungseinstellungen initialisiert',
    })
  } catch (error) {
    console.error('Unexpected error in initialize preferences:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 * PATCH /api/notifications/preferences
 *
 * Update notification preferences
 * Can accept either a single preference or an array of preferences
 */
export async function PUT(request: NextRequest) {
  return handleUpdatePreferences(request)
}

export async function PATCH(request: NextRequest) {
  return handleUpdatePreferences(request)
}

/**
 * Helper function to handle preference updates
 */
async function handleUpdatePreferences(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Check if it's a single preference update or bulk update
    if (body.preferences && Array.isArray(body.preferences)) {
      // Bulk update
      const validationResult = updatePreferencesSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Ungueltige Eingabe', details: validationResult.error.issues },
          { status: 400 }
        )
      }

      const { preferences } = validationResult.data
      const { success, error } = await updatePreferences(supabase, user.id, preferences)

      if (error) {
        return NextResponse.json(
          { error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success,
        message: 'Einstellungen aktualisiert',
      })
    } else {
      // Single preference update
      const validationResult = updateSinglePreferenceSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Ungueltige Eingabe', details: validationResult.error.issues },
          { status: 400 }
        )
      }

      const preference = validationResult.data
      const { success, error } = await updatePreference(supabase, user.id, preference as any)

      if (error) {
        return NextResponse.json(
          { error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success,
        message: 'Einstellung aktualisiert',
      })
    }
  } catch (error) {
    console.error('Unexpected error in update preferences:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
