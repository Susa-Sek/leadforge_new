// Contact Interactions API Routes
// GET /api/contacts/[id]/interactions - List interactions
// POST /api/contacts/[id]/interactions - Create interaction

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InteractionSchema = z.object({
  type: z.enum(['email', 'call', 'meeting', 'note', 'task'])
    .refine(val => ['email', 'call', 'meeting', 'note', 'task'].includes(val), {
      message: 'Ungültiger Interaktionstyp'
    }),
  notes: z.string().max(5000, 'Notizen zu lang (max 5.000 Zeichen)').optional().nullable(),
})

const InteractionFilterSchema = z.object({
  type: z.enum(['email', 'call', 'meeting', 'note', 'task']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  per_page: z.coerce.number().min(1).max(50).optional().default(10),
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
    const { id: contactId } = await params

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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      type: (searchParams.get('type') as any) || undefined,
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '10',
    }

    const filters = InteractionFilterSchema.parse(queryData)

    // Build query
    let query = supabase
      .from('interactions')
      .select('*', { count: 'exact' })
      .eq('contact_id', contactId)
      .eq('user_id', user.id)

    // Apply type filter
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    // Apply sorting (newest first)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const from = (filters.page - 1) * filters.per_page
    const to = from + filters.per_page - 1
    query = query.range(from, to)

    // Execute query
    const { data: interactions, error, count } = await query

    if (error) {
      console.error('Error fetching interactions:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Interaktionen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      interactions: interactions || [],
      pagination: {
        page: filters.page,
        per_page: filters.per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.per_page),
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in interactions GET:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contactId } = await params

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

    // Parse and validate body
    const body = await request.json()
    const validated = InteractionSchema.parse(body)

    // Check plan limit for interactions
    const { data: planData, error: planError } = await supabase.rpc('get_user_plan', {
      p_user_id: user.id
    })

    if (planError) {
      console.error('Error getting user plan:', planError)
    }

    const userPlan = planData || 'free'
    const maxInteractions = userPlan === 'free' ? 10 : userPlan === 'pro' ? 50 : 1000000

    // Count existing interactions for this contact
    const { count: currentCount, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)

    if (countError) {
      console.error('Error counting interactions:', countError)
    }

    if ((currentCount || 0) >= maxInteractions) {
      return NextResponse.json(
        {
          error: 'Interaktions-Limit erreicht',
          code: 'PLAN_LIMIT_REACHED',
          message: `Sie haben das Limit von ${maxInteractions} Interaktionen erreicht. Upgrade zu Pro für mehr Interaktionen.`
        },
        { status: 403 }
      )
    }

    // Insert interaction
    const { data: interaction, error: insertError } = await supabase
      .from('interactions')
      .insert({
        ...validated,
        contact_id: contactId,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating interaction:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Interaktion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      interaction,
      message: 'Interaktion erfolgreich erstellt'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in interactions POST:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
