// Deal Stage Update API Route
// PATCH /api/deals/[id]/stage - Update deal stage (for Drag-and-Drop)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const StageUpdateSchema = z.object({
  stage_id: z.string().uuid('Ungültige Stage-ID'),
  is_won: z.boolean().optional().nullable(),
  actual_close_date: z.string().optional().nullable(),
  close_reason: z.string().max(500, 'Abschlussgrund zu lang').optional().nullable(),
})

// Helper function to verify deal ownership
async function verifyDealOwnership(supabase: any, dealId: string, userId: string) {
  const { data: deal, error } = await supabase
    .from('deals')
    .select('id')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single()

  if (error || !deal) {
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
    const isOwner = await verifyDealOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Deal nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = StageUpdateSchema.parse(body)

    // Validate stage_id
    const { data: stage, error: stageError } = await supabase
      .from('deal_stages')
      .select('id, name, color, is_won_stage, is_lost_stage, default_probability')
      .or(`is_system.eq.true,and(user_id.eq.${user.id},is_system.eq.false)`)
      .eq('id', validated.stage_id)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Ausgewählte Stage nicht gefunden' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      stage_id: validated.stage_id,
    }

    // Auto-set fields based on stage type
    if (stage.is_won_stage) {
      updateData.is_won = validated.is_won !== undefined ? validated.is_won : true
      updateData.actual_close_date = validated.actual_close_date || new Date().toISOString().split('T')[0]
      updateData.close_reason = null // Clear close reason when won
      updateData.probability = 100
    } else if (stage.is_lost_stage) {
      updateData.is_won = validated.is_won !== undefined ? validated.is_won : false
      updateData.actual_close_date = validated.actual_close_date || new Date().toISOString().split('T')[0]
      updateData.close_reason = validated.close_reason || null
      updateData.probability = 0
    } else {
      // Moving to an open stage - clear close data
      updateData.is_won = null
      updateData.actual_close_date = null
      updateData.close_reason = null
      // Reset probability to stage default if not specified
      updateData.probability = stage.default_probability || 10
    }

    // Update deal
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating deal stage:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Stage' },
        { status: 500 }
      )
    }

    // Fetch complete deal with relations
    const { data: completeDeal } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, company),
        stage:deal_stages(id, name, color, is_won_stage, is_lost_stage)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      deal: completeDeal || deal,
      message: `Deal erfolgreich in "${stage.name}" verschoben`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in deal stage PATCH:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
