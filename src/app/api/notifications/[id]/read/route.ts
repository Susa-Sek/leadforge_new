/**
 * Mark Read API
 *
 * POST /api/notifications/:id/read
 *
 * Marks a single notification as read
 *
 * @module NotificationsAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { markAsRead } from '@/lib/notifications/service'

// URL parameter validation
const paramsSchema = z.object({
  id: z.string().uuid(),
})

/**
 * POST /api/notifications/:id/read
 *
 * Marks a single notification as read
 */
export async function POST(
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

    // Mark as read
    const { success, error } = await markAsRead(supabase, id, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Benachrichtigung nicht gefunden oder bereits gelesen' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Benachrichtigung als gelesen markiert',
    })
  } catch (error) {
    console.error('Unexpected error in mark read:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
