// Deals Export API Route (Pro+ feature)
// POST /api/deals/export - Export deals to CSV

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ExportSchema = z.object({
  deal_ids: z.array(z.string().uuid()).optional(), // If not provided, export all
})

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escape quotes and wrap in quotes if contains special chars
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return ''
  return value.toFixed(2).replace('.', ',')
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

    // Check user plan
    const { data: planData, error: planError } = await supabase.rpc('get_user_plan', {
      p_user_id: user.id
    })

    if (planError) {
      console.error('Error getting user plan:', planError)
    }

    const userPlan = planData || 'free'

    // Export is Pro+ only
    if (userPlan === 'free') {
      return NextResponse.json(
        {
          error: 'Pro-Funktion erforderlich',
          code: 'PRO_REQUIRED',
          message: 'Der Export ist eine Pro-Funktion. Upgrade zu Pro, um Deals zu exportieren.'
        },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = ExportSchema.parse(body)

    // Build query
    let query = supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(name, company),
        stage:deal_stages(name)
      `)
      .eq('user_id', user.id)

    // Filter by specific IDs if provided
    if (validated.deal_ids && validated.deal_ids.length > 0) {
      query = query.in('id', validated.deal_ids)
    }

    // Fetch deals
    const { data: deals, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deals for export:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Deals' },
        { status: 500 }
      )
    }

    if (!deals || deals.length === 0) {
      return NextResponse.json(
        { error: 'Keine Deals zum Exportieren gefunden' },
        { status: 404 }
      )
    }

    // Generate CSV
    const headers = [
      'Titel',
      'Stage',
      'Wert',
      'Wahrscheinlichkeit',
      'Kontakt',
      'Firma',
      'Erwartetes Closing',
      'Tatsächliches Closing',
      'Status',
      'Abschlussgrund',
      'Beschreibung',
      'Erstellt am',
      'Aktualisiert am',
    ]

    const rows = deals.map(deal => {
      const status = deal.is_won === null ? 'Offen' :
                     deal.is_won === true ? 'Gewonnen' : 'Verloren'

      return [
        escapeCSV(deal.title),
        escapeCSV(deal.stage?.name || ''),
        formatCurrency(deal.value),
        deal.probability !== null ? `${deal.probability}%` : '',
        escapeCSV(deal.contact?.name || ''),
        escapeCSV(deal.contact?.company || ''),
        escapeCSV(deal.expected_close_date || ''),
        escapeCSV(deal.actual_close_date || ''),
        escapeCSV(status),
        escapeCSV(deal.close_reason || ''),
        escapeCSV(deal.description || ''),
        escapeCSV(deal.created_at ? new Date(deal.created_at).toLocaleString('de-DE') : ''),
        escapeCSV(deal.updated_at ? new Date(deal.updated_at).toLocaleString('de-DE') : ''),
      ]
    })

    // Add BOM for UTF-8 recognition in Excel
    const bom = '\uFEFF'
    const csv = bom + [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Generate filename
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-')
    const filename = `manyleads_deals_${dateStr}_${timeStr}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in deals export:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
