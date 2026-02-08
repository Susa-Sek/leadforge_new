/**
 * Single Notification API
 *
 * GET /api/notifications/:id - Get single notification
 * DELETE /api/notifications/:id - Delete notification
 *
 * @module NotificationsAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getNotification, deleteNotification } from '@/lib/notifications/service'
import { notificationIdSchema } from '@/lib/notifications/validation'

// URL parameter validation
const paramsSchema = z.object({
  id: z.string().uuid(),
})

/**
 * GET /api/notifications/:id
 *
 * Get a single notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate URL parameters
    const { id } = await params
    const paramsResult = paramsSchema.safeParse({ id })

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Ungueltige Benachrichtigungs-ID', details: paramsResult.error.issues },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get notification
    const { notification, error } = await getNotification(supabase, id, user.id)

    if (error) {
      if (error === 'Benachrichtigung nicht gefunden') {
        return NextResponse.json(
          { error },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Unexpected error in get notification:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/:id
 *
 * Delete a notification by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate URL parameters
    const { id } = await params
    const paramsResult = paramsSchema.safeParse({ id })

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Ungueltige Benachrichtigungs-ID', details: paramsResult.error.issues },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Delete notification
    const { success, error } = await deleteNotification(supabase, id, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Benachrichtigung konnte nicht geloescht werden' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Benachrichtigung erfolgreich geloescht',
    })
  } catch (error) {
    console.error('Unexpected error in delete notification:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
