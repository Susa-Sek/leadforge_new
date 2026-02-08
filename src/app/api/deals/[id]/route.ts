// Single Deal API Routes
// GET /api/deals/[id] - Get deal details
// PUT /api/deals/[id] - Update deal
// DELETE /api/deals/[id] - Delete deal

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/service'
import { z } from 'zod'

const DealUpdateSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel zu lang').optional(),
  description: z.string().max(2000, 'Beschreibung zu lang').optional().nullable(),
  contact_id: z.string().uuid('Ungültige Kontakt-ID').optional().nullable(),
  stage_id: z.string().uuid('Ungültige Stage-ID').optional(),
  value: z.coerce.number().min(0, 'Wert muss positiv sein').optional().nullable(),
  probability: z.coerce.number().min(0).max(100, 'Wahrscheinlichkeit muss zwischen 0 und 100 sein').optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
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

    // Fetch deal with relations
    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, company, email, phone),
        stage:deal_stages(id, name, color, is_won_stage, is_lost_stage)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal nicht gefunden' },
          { status: 404 }
        )
      }
      console.error('Error fetching deal:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden des Deals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Error in deal GET:', error)
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
    const isOwner = await verifyDealOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Deal nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = DealUpdateSchema.parse(body)

    // Validate contact_id if provided
    if (validated.contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', validated.contact_id)
        .eq('user_id', user.id)
        .single()

      if (contactError || !contact) {
        return NextResponse.json(
          { error: 'Ausgewählter Kontakt nicht gefunden' },
          { status: 404 }
        )
      }
    }

    // Validate stage_id if provided
    if (validated.stage_id) {
      const { data: stage, error: stageError } = await supabase
        .from('deal_stages')
        .select('id, is_won_stage, is_lost_stage, default_probability')
        .or(`is_system.eq.true,and(user_id.eq.${user.id},is_system.eq.false)`)
        .eq('id', validated.stage_id)
        .single()

      if (stageError || !stage) {
        return NextResponse.json(
          { error: 'Ausgewählte Stage nicht gefunden' },
          { status: 404 }
        )
      }

      // Auto-set is_won based on stage if not explicitly provided
      if (validated.is_won === undefined || validated.is_won === null) {
        if (stage.is_won_stage) {
          validated.is_won = true
          if (!validated.actual_close_date) {
            validated.actual_close_date = new Date().toISOString().split('T')[0]
          }
        } else if (stage.is_lost_stage) {
          validated.is_won = false
          if (!validated.actual_close_date) {
            validated.actual_close_date = new Date().toISOString().split('T')[0]
          }
        }
      }

      // Auto-set probability based on stage if not explicitly provided
      if (validated.probability === undefined || validated.probability === null) {
        validated.probability = stage.default_probability
      }
    }

    // Get old stage for comparison before update
    let oldStageName = ''
    if (validated.stage_id) {
      const { data: oldDeal } = await supabase
        .from('deals')
        .select('stage:deal_stages(name)')
        .eq('id', id)
        .single()
      if (oldDeal?.stage && Array.isArray(oldDeal.stage) && oldDeal.stage.length > 0) {
        oldStageName = oldDeal.stage[0]?.name || ''
      }
    }

    // Update deal
    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating deal:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Deals' },
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

    // Send notification if stage changed
    if (validated.stage_id && completeDeal?.stage && oldStageName) {
      const newStage = completeDeal.stage as { name: string; is_won_stage: boolean; is_lost_stage: boolean }
      const newStageName = newStage.name || ''

      if (newStageName !== oldStageName) {
        // Send deal_status_change notification
        await createNotification(
          supabase,
          user.id,
          'deal_status_change',
          {
            deal_id: id,
            deal_name: completeDeal.title || 'Deal',
            old_status: oldStageName,
            new_status: newStageName,
            is_won: newStage.is_won_stage,
            is_lost: newStage.is_lost_stage,
          },
          `/dashboard/deals/${id}`
        )
      }
    }

    return NextResponse.json({
      deal: completeDeal || deal,
      message: 'Deal erfolgreich aktualisiert'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in deal PUT:', error)
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
    const isOwner = await verifyDealOwnership(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Deal nicht gefunden oder keine Berechtigung' },
        { status: 403 }
      )
    }

    // Delete deal
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting deal:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen des Deals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Deal erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error in deal DELETE:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
