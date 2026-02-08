/**
 * Mark All Read API
 *
 * POST /api/notifications/read-all
 * POST /api/notifications/mark-all-read (alias)
 *
 * Marks all notifications as read for the authenticated user
 *
 * @module NotificationsAPI
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markAllAsRead } from '@/lib/notifications/service'

/**
 * POST /api/notifications/read-all
 *
 * Marks all notifications as read for the authenticated user
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

    // Mark all as read
    const { count, error } = await markAllAsRead(supabase, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count,
      marked_as_read: count,
      message: `${count} Benachrichtigungen als gelesen markiert`,
    })
  } catch (error) {
    console.error('Unexpected error in mark all read:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
