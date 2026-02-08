/**
 * Notifications API - List Endpoint
 *
 * GET /api/notifications
 *
 * Returns paginated list of user's notifications
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - filter: 'all' | 'read' | 'unread' (default: 'all')
 * - sort_by: 'date' | 'type' (default: 'date')
 * - sort_order: 'asc' | 'desc' (default: 'desc')
 *
 * @module NotificationsAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getNotifications, getUnreadCount, getPlanInfo } from '@/lib/notifications/service'
import { listNotificationsQuerySchema } from '@/lib/notifications/validation'

/**
 * GET /api/notifications
 *
 * List all notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = listNotificationsQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      filter: searchParams.get('filter'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Ungueltige Query-Parameter', details: queryResult.error.issues },
        { status: 400 }
      )
    }

    const options = queryResult.data

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Fetch notifications
    const { data, error } = await getNotifications(supabase, user.id, options)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    // Get unread count for header badge
    const { count: unreadCount } = await getUnreadCount(supabase, user.id)

    // Get plan info for limit display
    const planInfo = await getPlanInfo(supabase, user.id)

    return NextResponse.json({
      notifications: data?.notifications || [],
      pagination: data?.pagination || {
        page: options.page,
        limit: options.limit,
        total: 0,
        total_pages: 0,
      },
      unread_count: unreadCount,
      plan_info: {
        tier: planInfo.plan_tier,
        monthly_count: planInfo.monthly_count,
        max_notifications: planInfo.max_notifications,
        remaining: planInfo.remaining,
        has_reached_limit: planInfo.has_reached_limit,
      },
    })
  } catch (error) {
    console.error('Unexpected error in notifications list:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 *
 * Delete all read notifications for the authenticated user
 */
export async function DELETE(request: NextRequest) {
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

    // Delete read notifications
    const { count, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true)
      .select('id')

    if (error) {
      console.error('Error deleting read notifications:', error)
      return NextResponse.json(
        { error: 'Fehler beim Loeschen der Benachrichtigungen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      deleted_count: count || 0,
      message: `${count || 0} gelesene Benachrichtigungen geloescht`,
    })
  } catch (error) {
    console.error('Unexpected error in notifications delete:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
