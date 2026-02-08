/**
 * Collection Detail API
 *
 * GET /api/collections/[id] - Get collection details with leads
 * DELETE /api/collections/[id] - Delete collection
 *
 * Query Parameters for GET:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 *
 * @module CollectionDetailAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Query parameter validation schema for GET
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// Collection detail type
interface CollectionDetail {
  id: string
  name: string
  query_params: {
    industry: string
    location: string
    max_results: number
  }
  result_count: number
  status: string
  credits_used: number
  created_at: string
  updated_at: string
}

// Lead item type
interface CollectionLead {
  id: string
  place_id: string
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  review_count?: number
  opening_hours?: Record<string, string>
  image_url?: string
  social_media: {
    instagram?: string
    facebook?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    twitter?: string
  }
  latitude?: number
  longitude?: number
}

/**
 * GET /api/collections/[id]
 *
 * Get collection details with paginated leads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    const uuidResult = uuidSchema.safeParse(id)

    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Sammlungs-ID' },
        { status: 400 }
      )
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Query-Parameter', details: queryResult.error.issues },
        { status: 400 }
      )
    }

    const { page, limit } = queryResult.data
    const offset = (page - 1) * limit

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Fetch collection metadata
    const { data: collectionData, error: collectionError } = await supabase
      .from('search_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collectionData) {
      return NextResponse.json(
        { error: 'Sammlung nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if collection is accessible (completed or failed)
    if (!['completed', 'failed'].includes(collectionData.status)) {
      return NextResponse.json(
        { error: 'Sammlung ist noch nicht verfügbar' },
        { status: 403 }
      )
    }

    // Transform collection data
    const queryParams = collectionData.query_params as { industry?: string; location?: string; max_results?: number }
    const industry = queryParams?.industry || 'Unbekannte Branche'
    const location = queryParams?.location || 'Unbekannter Ort'

    const collection: CollectionDetail = {
      id: collectionData.id,
      name: `${industry} in ${location}`,
      query_params: {
        industry,
        location,
        max_results: queryParams?.max_results || 0,
      },
      result_count: collectionData.result_count || 0,
      status: collectionData.status,
      credits_used: collectionData.credits_used || 0,
      created_at: collectionData.created_at,
      updated_at: collectionData.updated_at,
    }

    // Fetch leads with pagination
    const { data: leadsData, error: leadsError, count } = await supabase
      .from('search_results')
      .select('*', { count: 'exact' })
      .eq('search_history_id', id)
      .eq('user_id', user.id)
      .eq('is_duplicate', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Leads' },
        { status: 500 }
      )
    }

    // Transform leads data
    const leads: CollectionLead[] = (leadsData || []).map((item) => ({
      id: item.id,
      place_id: item.place_id || '',
      name: item.company_name || 'Unbekannt',
      address: item.address || '',
      phone: item.phone || undefined,
      email: item.email || undefined,
      website: item.website || undefined,
      rating: item.rating ? Number(item.rating) : undefined,
      review_count: item.reviews_count || undefined,
      opening_hours: item.opening_hours as Record<string, string> | undefined,
      image_url: item.image_url || undefined,
      social_media: {
        instagram: item.instagram_url || undefined,
        facebook: item.facebook_url || undefined,
        linkedin: item.linkedin_url || undefined,
        youtube: item.youtube_url || undefined,
        tiktok: item.tiktok_url || undefined,
        twitter: item.twitter_url || undefined,
      },
      latitude: item.latitude ? Number(item.latitude) : undefined,
      longitude: item.longitude ? Number(item.longitude) : undefined,
    }))

    const total = count || 0

    return NextResponse.json({
      collection,
      leads,
      pagination: {
        page,
        limit,
        total,
        has_more: offset + leads.length < total,
      },
    })
  } catch (error) {
    console.error('Unexpected error in collection detail:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/collections/[id]
 *
 * Delete a collection (hard delete with CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    const uuidResult = uuidSchema.safeParse(id)

    if (!uuidResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Sammlungs-ID' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Verify collection exists and belongs to user
    const { data: collectionData, error: collectionError } = await supabase
      .from('search_history')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collectionData) {
      return NextResponse.json(
        { error: 'Sammlung nicht gefunden' },
        { status: 404 }
      )
    }

    // Delete the collection (CASCADE will delete related search_results)
    const { error: deleteError } = await supabase
      .from('search_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting collection:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Sammlung' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in collection delete:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
