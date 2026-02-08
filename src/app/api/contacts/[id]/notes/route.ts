// Contact Notes API Route (for Autosave)
// PATCH /api/contacts/[id]/notes - Update contact notes

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const NotesUpdateSchema = z.object({
  notes: z.string().max(10000, 'Notizen zu lang (max 10.000 Zeichen)').nullable(),
})

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Verify ownership
    const isOwner = await verifyContactOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Kontakt nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = NotesUpdateSchema.parse(body)

    // Update notes
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update({ notes: validated.notes })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, notes, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating notes:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Notizen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      contact,
      message: 'Notizen gespeichert',
      saved_at: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in notes PATCH:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
