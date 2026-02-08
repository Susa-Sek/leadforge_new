/**
 * Dismiss All API
 *
 * POST /api/notifications/dismiss-all
 *
 * Marks all notifications as read (same as mark-all-read but semantically different)
 *
 * @module NotificationsAPI
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markAllAsRead } from '@/lib/notifications/service'

/**
 * POST /api/notifications/dismiss-all
 *
 * Dismisses (marks as read) all notifications for the authenticated user
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

    // Mark all as read (dismiss all)
    const { count, error } = await markAllAsRead(supabase, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count,
      dismissed: count,
      message: `${count} Benachrichtigungen verworfen`,
    })
  } catch (error) {
    console.error('Unexpected error in dismiss all:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
