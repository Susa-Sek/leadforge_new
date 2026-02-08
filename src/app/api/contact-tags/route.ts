// Contact Tags API Routes
// GET /api/contact-tags - List user's tags
// POST /api/contact-tags - Create tag

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TagSchema = z.object({
  name: z.string().min(1, 'Tag-Name ist erforderlich').max(50, 'Tag-Name zu lang'),
  color: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'Ungültiger Farbcode').optional().default('#3B82F6'),
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

    // Fetch tags with usage count
    const { data: tags, error } = await supabase
      .from('contact_tags')
      .select(`
        *,
        usage_count:contact_tag_assignments(count)
      `)
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Tags' },
        { status: 500 }
      )
    }

    // Transform to get proper usage count
    const transformedTags = tags?.map(tag => ({
      ...tag,
      usage_count: tag.usage_count?.[0]?.count || 0
    })) || []

    return NextResponse.json({ tags: transformedTags })
  } catch (error) {
    console.error('Error in contact-tags GET:', error)
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
    const validated = TagSchema.parse(body)

    // Normalize color to valid preset
    let color = validated.color
    if (!validColors.includes(color.toUpperCase())) {
      color = '#3B82F6' // Default to blue
    }

    // Check for duplicate tag name
    const { data: existing } = await supabase
      .from('contact_tags')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', validated.name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ein Tag mit diesem Namen existiert bereits' },
        { status: 409 }
      )
    }

    // Insert tag
    const { data: tag, error: insertError } = await supabase
      .from('contact_tags')
      .insert({
        name: validated.name,
        color: color,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Check for plan limit error
      if (insertError.message?.includes('Tag-Limit erreicht')) {
        return NextResponse.json(
          {
            error: 'Tag-Limit erreicht',
            code: 'PLAN_LIMIT_REACHED',
            message: insertError.message
          },
          { status: 403 }
        )
      }
      console.error('Error creating tag:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tag,
      message: 'Tag erfolgreich erstellt'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contact-tags POST:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
