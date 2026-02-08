// Single Contact API Routes
// GET /api/contacts/[id] - Get contact details
// PUT /api/contacts/[id] - Update contact
// DELETE /api/contacts/[id] - Delete contact

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ContactUpdateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200, 'Name zu lang').optional(),
  company: z.string().min(1, 'Firma ist erforderlich').max(200, 'Firma zu lang').optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable(),
  phone: z.string().max(50, 'Telefonnummer zu lang').optional().nullable(),
  address: z.string().max(500, 'Adresse zu lang').optional().nullable(),
  website: z.string().url('Ungültige Website-URL').optional().nullable(),
  notes: z.string().max(10000, 'Notizen zu lang (max 10.000 Zeichen)').optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
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

export async function GET(
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

    // Fetch contact with tags and linked deals
    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        *,
        tags:contact_tag_assignments(
          tag:contact_tags(id, name, color)
        ),
        deals:id(
          id,
          title,
          value,
          probability,
          stage:deal_stages(name, color)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Kontakt nicht gefunden' },
          { status: 404 }
        )
      }
      console.error('Error fetching contact:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden des Kontakts' },
        { status: 500 }
      )
    }

    // Transform the response
    const transformedContact = {
      ...contact,
      tags: contact.tags?.map((t: any) => t.tag).filter(Boolean) || [],
    }

    return NextResponse.json({ contact: transformedContact })
  } catch (error) {
    console.error('Error in contact GET:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validated = ContactUpdateSchema.parse(body)
    const { tag_ids, ...contactData } = validated

    // Check for duplicate email if email is being changed
    if (contactData.email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', contactData.email)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Ein Kontakt mit dieser E-Mail-Adresse existiert bereits' },
          { status: 409 }
        )
      }
    }

    // Update contact
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating contact:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Kontakts' },
        { status: 500 }
      )
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tag assignments
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', id)

      // Insert new tag assignments
      if (tag_ids.length > 0) {
        const tagAssignments = tag_ids.map(tagId => ({
          contact_id: id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase
          .from('contact_tag_assignments')
          .insert(tagAssignments)

        if (tagError) {
          console.error('Error updating tags:', tagError)
        }
      }
    }

    // Fetch complete contact with tags
    const { data: completeContact } = await supabase
      .from('contacts')
      .select(`
        *,
        tags:contact_tag_assignments(
          tag:contact_tags(id, name, color)
        )
      `)
      .eq('id', id)
      .single()

    const transformedContact = completeContact ? {
      ...completeContact,
      tags: completeContact.tags?.map((t: any) => t.tag).filter(Boolean) || []
    } : contact

    return NextResponse.json({
      contact: transformedContact,
      message: 'Kontakt erfolgreich aktualisiert'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contact PUT:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete contact (interactions and tag assignments will be cascaded)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting contact:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen des Kontakts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Kontakt erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error in contact DELETE:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
