// Single Contact Tag API Routes
// PUT /api/contact-tags/[id] - Update tag
// DELETE /api/contact-tags/[id] - Delete tag

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TagUpdateSchema = z.object({
  name: z.string().min(1, 'Tag-Name ist erforderlich').max(50, 'Tag-Name zu lang').optional(),
  color: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'Ungültiger Farbcode').optional(),
})

const validColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
]

// Helper function to verify tag ownership
async function verifyTagOwnership(supabase: any, tagId: string, userId: string) {
  const { data: tag, error } = await supabase
    .from('contact_tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single()

  if (error || !tag) {
    return false
  }
  return true
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
    const isOwner = await verifyTagOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Tag nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = TagUpdateSchema.parse(body)

    // Normalize color if provided
    let updateData: any = { ...validated }
    if (validated.color) {
      if (!validColors.includes(validated.color.toUpperCase())) {
        updateData.color = '#3B82F6' // Default to blue
      }
    }

    // Check for duplicate name if changing name
    if (validated.name) {
      const { data: existing } = await supabase
        .from('contact_tags')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', validated.name)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Ein Tag mit diesem Namen existiert bereits' },
          { status: 409 }
        )
      }
    }

    // Update tag
    const { data: tag, error: updateError } = await supabase
      .from('contact_tags')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tag:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tag,
      message: 'Tag erfolgreich aktualisiert'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contact-tag PUT:', error)
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
    const isOwner = await verifyTagOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Tag nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Delete tag (assignments will be cascaded)
    const { error: deleteError } = await supabase
      .from('contact_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting tag:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen des Tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tag erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error in contact-tag DELETE:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
