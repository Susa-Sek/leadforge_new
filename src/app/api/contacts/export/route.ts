// Contacts Export API Route (Pro+ feature)
// POST /api/contacts/export - Export contacts to CSV

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ExportSchema = z.object({
  contact_ids: z.array(z.string().uuid()).optional(), // If not provided, export all
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
          message: 'Der Export ist eine Pro-Funktion. Upgrade zu Pro, um Kontakte zu exportieren.'
        },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = ExportSchema.parse(body)

    // Build query
    let query = supabase
      .from('contacts')
      .select(`
        *,
        tags:contact_tag_assignments(
          tag:contact_tags(name)
        )
      `)
      .eq('user_id', user.id)

    // Filter by specific IDs if provided
    if (validated.contact_ids && validated.contact_ids.length > 0) {
      query = query.in('id', validated.contact_ids)
    }

    // Fetch contacts
    const { data: contacts, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts for export:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Kontakte' },
        { status: 500 }
      )
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Keine Kontakte zum Exportieren gefunden' },
        { status: 404 }
      )
    }

    // Generate CSV
    const headers = [
      'Name',
      'Firma',
      'E-Mail',
      'Telefon',
      'Adresse',
      'Website',
      'Tags',
      'Notizen',
      'Erstellt am',
      'Aktualisiert am',
    ]

    const rows = contacts.map(contact => {
      const tags = contact.tags?.map((t: any) => t.tag?.name).filter(Boolean).join(', ') || ''

      return [
        escapeCSV(contact.name),
        escapeCSV(contact.company),
        escapeCSV(contact.email || ''),
        escapeCSV(contact.phone || ''),
        escapeCSV(contact.address || ''),
        escapeCSV(contact.website || ''),
        escapeCSV(tags),
        escapeCSV(contact.notes || ''),
        escapeCSV(contact.created_at ? new Date(contact.created_at).toLocaleString('de-DE') : ''),
        escapeCSV(contact.updated_at ? new Date(contact.updated_at).toLocaleString('de-DE') : ''),
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
    const filename = `manyleads_kontakte_${dateStr}_${timeStr}.csv`

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
    console.error('Error in contacts export:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
