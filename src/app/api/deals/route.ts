// Deals API Routes - PROJ-21
// GET /api/deals - List deals with filter/pagination
// POST /api/deals - Create new deal

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DealSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel zu lang'),
  description: z.string().max(2000, 'Beschreibung zu lang').optional().nullable(),
  contact_id: z.string().uuid('Ungültige Kontakt-ID').optional().nullable(),
  stage_id: z.string().uuid('Ungültige Stage-ID'),
  value: z.coerce.number().min(0, 'Wert muss positiv sein').optional().nullable(),
  probability: z.coerce.number().min(0).max(100, 'Wahrscheinlichkeit muss zwischen 0 und 100 sein').optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
})

const DealFilterSchema = z.object({
  stage_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  min_value: z.coerce.number().optional(),
  max_value: z.coerce.number().optional(),
  min_probability: z.coerce.number().optional(),
  max_probability: z.coerce.number().optional(),
  expected_close_from: z.string().optional(),
  expected_close_to: z.string().optional(),
  is_open: z.boolean().optional(),
  sort_by: z.enum(['title', 'value', 'probability', 'expected_close_date', 'created_at']).optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).optional().default(1),
  per_page: z.coerce.number().min(1).max(100).optional().default(20),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      stage_id: searchParams.get('stage_id') || undefined,
      contact_id: searchParams.get('contact_id') || undefined,
      min_value: searchParams.get('min_value') || undefined,
      max_value: searchParams.get('max_value') || undefined,
      min_probability: searchParams.get('min_probability') || undefined,
      max_probability: searchParams.get('max_probability') || undefined,
      expected_close_from: searchParams.get('expected_close_from') || undefined,
      expected_close_to: searchParams.get('expected_close_to') || undefined,
      is_open: searchParams.get('is_open') === 'true' ? true :
               searchParams.get('is_open') === 'false' ? false : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '20',
    }

    const filters = DealFilterSchema.parse(queryData)

    // Build base query
    let query = supabase
      .from('deals')
      .select(
        `*,
        contact:contacts(id, name, company),
        stage:deal_stages(id, name, color, is_won_stage, is_lost_stage)`,
        { count: 'exact' }
      )
      .eq('user_id', user.id)

    // Apply filters
    if (filters.stage_id) {
      query = query.eq('stage_id', filters.stage_id)
    }

    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }

    if (filters.min_value !== undefined) {
      query = query.gte('value', filters.min_value)
    }

    if (filters.max_value !== undefined) {
      query = query.lte('value', filters.max_value)
    }

    if (filters.min_probability !== undefined) {
      query = query.gte('probability', filters.min_probability)
    }

    if (filters.max_probability !== undefined) {
      query = query.lte('probability', filters.max_probability)
    }

    if (filters.expected_close_from) {
      query = query.gte('expected_close_date', filters.expected_close_from)
    }

    if (filters.expected_close_to) {
      query = query.lte('expected_close_date', filters.expected_close_to)
    }

    if (filters.is_open !== undefined) {
      if (filters.is_open) {
        query = query.is('is_won', null)
      } else {
        query = query.not('is_won', 'is', null)
      }
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.per_page
    const to = from + filters.per_page - 1
    query = query.range(from, to)

    // Execute query
    const { data: deals, error, count } = await query

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Deals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      deals: deals || [],
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
    console.error('Error in deals GET:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = DealSchema.parse(body)

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

    // Validate stage_id
    const { data: stage, error: stageError } = await supabase
      .from('deal_stages')
      .select('id, default_probability, is_won_stage, is_lost_stage')
      .or(`is_system.eq.true,and(user_id.eq.${user.id},is_system.eq.false)`)
      .eq('id', validated.stage_id)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Ausgewählte Stage nicht gefunden' },
        { status: 404 }
      )
    }

    // Set default probability if not provided
    let probability = validated.probability
    if (probability === null || probability === undefined) {
      probability = stage.default_probability || 10
    }

    // Set is_won based on stage
    let isWon = null
    if (stage.is_won_stage) {
      isWon = true
    } else if (stage.is_lost_stage) {
      isWon = false
    }

    // Insert deal
    const { data: deal, error: insertError } = await supabase
      .from('deals')
      .insert({
        ...validated,
        user_id: user.id,
        probability,
        is_won: isWon,
        actual_close_date: isWon !== null ? new Date().toISOString().split('T')[0] : null,
      })
      .select()
      .single()

    if (insertError) {
      // Check for plan limit error
      if (insertError.message?.includes('Deal-Limit erreicht')) {
        return NextResponse.json(
          {
            error: 'Deal-Limit erreicht',
            code: 'PLAN_LIMIT_REACHED',
            message: insertError.message
          },
          { status: 403 }
        )
      }
      console.error('Error creating deal:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Deals' },
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
      .eq('id', deal!.id)
      .single()

    return NextResponse.json({
      deal: completeDeal || deal,
      message: 'Deal erfolgreich erstellt'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in deals POST:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
