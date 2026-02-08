// Contacts API Routes - PROJ-20
// GET /api/contacts - List contacts with filter/pagination/search
// POST /api/contacts - Create new contact

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimitMiddleware, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

// Validation schemas
const ContactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200, 'Name zu lang'),
  company: z.string().min(1, 'Firma ist erforderlich').max(200, 'Firma zu lang'),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable(),
  phone: z.string().max(50, 'Telefonnummer zu lang').optional().nullable(),
  address: z.string().max(500, 'Adresse zu lang').optional().nullable(),
  website: z.string().url('Ungültige Website-URL').optional().nullable(),
  notes: z.string().max(10000, 'Notizen zu lang (max 10.000 Zeichen)').optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

const ContactFilterSchema = z.object({
  search: z.string().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  sort_by: z.enum(['name', 'company', 'email', 'created_at']).optional().default('created_at'),
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

    // Rate limiting check
    const rateLimitResult = await rateLimitMiddleware(user.id, 'contacts', RATE_LIMITS.contacts)
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      search: searchParams.get('search') || undefined,
      tag_ids: searchParams.getAll('tag_ids'),
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '20',
    }

    const filters = ContactFilterSchema.parse(queryData)

    // Build base query with tags
    let query = supabase
      .from('contacts')
      .select(
        `*,
        tags:contact_tag_assignments(
          tag:contact_tags(id, name, color)
        )`,
        { count: 'exact' }
      )
      .eq('user_id', user.id)

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Apply tag filter
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      query = query.in('contact_tag_assignments.tag_id', filters.tag_ids)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.per_page
    const to = from + filters.per_page - 1
    query = query.range(from, to)

    // Execute query
    const { data: contacts, error, count } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Kontakte' },
        { status: 500 }
      )
    }

    // Transform the response to flatten tags
    const transformedContacts = contacts?.map(contact => ({
      ...contact,
      tags: contact.tags?.map((t: any) => t.tag).filter(Boolean) || []
    })) || []

    // Check rate limit for headers
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const rateLimitInfo = await checkRateLimit(user.id, 'contacts', RATE_LIMITS.contacts)

    return NextResponse.json({
      contacts: transformedContacts,
      pagination: {
        page: filters.page,
        per_page: filters.per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.per_page),
      }
    }, { headers: getRateLimitHeaders(rateLimitInfo, RATE_LIMITS.contacts) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contacts GET:', error)
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

    // Rate limiting check for contact creation (stricter limit)
    const rateLimitResult = await rateLimitMiddleware(user.id, 'contactCreate', RATE_LIMITS.contactCreate)
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: rateLimitResult.status, headers: rateLimitResult.headers }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = ContactSchema.parse(body)
    const { tag_ids, ...contactData } = validated

    // Check for duplicate email
    if (contactData.email) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', contactData.email)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Ein Kontakt mit dieser E-Mail-Adresse existiert bereits' },
          { status: 409 }
        )
      }
    }

    // Insert contact
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        ...contactData,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Check for plan limit error
      if (insertError.message?.includes('Kontakt-Limit erreicht')) {
        return NextResponse.json(
          {
            error: 'Kontakt-Limit erreicht',
            code: 'PLAN_LIMIT_REACHED',
            message: insertError.message
          },
          { status: 403 }
        )
      }
      console.error('Error creating contact:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Kontakts' },
        { status: 500 }
      )
    }

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0 && contact) {
      const tagAssignments = tag_ids.map(tagId => ({
        contact_id: contact.id,
        tag_id: tagId,
      }))

      const { error: tagError } = await supabase
        .from('contact_tag_assignments')
        .insert(tagAssignments)

      if (tagError) {
        console.error('Error adding tags:', tagError)
        // Don't fail the whole request if tags fail
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
      .eq('id', contact!.id)
      .single()

    const transformedContact = completeContact ? {
      ...completeContact,
      tags: completeContact.tags?.map((t: any) => t.tag).filter(Boolean) || []
    } : contact

    // Get rate limit headers for successful creation
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const rateLimitInfo = await checkRateLimit(user.id, 'contactCreate', RATE_LIMITS.contactCreate)

    return NextResponse.json({
      contact: transformedContact,
      message: 'Kontakt erfolgreich erstellt'
    }, { status: 201, headers: getRateLimitHeaders(rateLimitInfo, RATE_LIMITS.contactCreate) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contacts POST:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
