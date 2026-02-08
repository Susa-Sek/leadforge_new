/**
 * Bulk Mark Read API
 *
 * POST /api/notifications/bulk/read
 *
 * Marks multiple notifications as read by their IDs
 *
 * Body:
 * - ids: string[] - Array of notification IDs to mark as read
 *
 * @module NotificationsAPI
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const BulkMarkReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = BulkMarkReadSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingabe', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { ids } = validationResult.data

    // Update all notifications to read
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('Error bulk marking notifications as read:', error)
      return NextResponse.json(
        { error: 'Fehler beim Markieren als gelesen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: (data || []).length,
      message: `${(data || []).length} Benachrichtigungen als gelesen markiert`,
    })
  } catch (error) {
    console.error('Unexpected error in bulk mark read:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
