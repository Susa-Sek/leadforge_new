/**
 * Unread Count API
 *
 * GET /api/notifications/unread-count
 *
 * Fast endpoint to get the unread notification count
 * Used by header badge and polling
 *
 * @module NotificationsAPI
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/notifications/service'

/**
 * GET /api/notifications/unread-count
 *
 * Returns the count of unread notifications for the authenticated user
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

    // Get unread count
    const { count, error } = await getUnreadCount(supabase, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      unread_count: count,
    })
  } catch (error) {
    console.error('Unexpected error in unread count:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
