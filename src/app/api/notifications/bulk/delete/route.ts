/**
 * Bulk Delete API
 *
 * POST /api/notifications/bulk/delete
 *
 * Deletes multiple notifications by their IDs
 *
 * Body:
 * - ids: string[] - Array of notification IDs to delete
 *
 * @module NotificationsAPI
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const BulkDeleteSchema = z.object({
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
    const validationResult = BulkDeleteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ungueltige Eingabe', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { ids } = validationResult.data

    // Delete all notifications
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('Error bulk deleting notifications:', error)
      return NextResponse.json(
        { error: 'Fehler beim Loeschen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: (data || []).length,
      message: `${(data || []).length} Benachrichtigungen geloescht`,
    })
  } catch (error) {
    console.error('Unexpected error in bulk delete:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
