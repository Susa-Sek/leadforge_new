// Single Interaction API Routes
// DELETE /api/contacts/[id]/interactions/[interactionId] - Delete interaction

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to verify contact ownership
async function verifyContactOwnership(supabase: any, contactId: string, userId: string) {
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single()

  if (error || !contact) {
    return false
  }
  return true
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; interactionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contactId, interactionId } = await params

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Verify contact ownership
    const isOwner = await verifyContactOwnership(supabase, contactId, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Kontakt nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Delete interaction
    const { error: deleteError } = await supabase
      .from('interactions')
      .delete()
      .eq('id', interactionId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting interaction:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Interaktion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Interaktion erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error in interaction DELETE:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
