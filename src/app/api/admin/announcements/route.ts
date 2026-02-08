/**
 * Admin Announcements API
 * GET /api/admin/announcements - List announcements
 * POST /api/admin/announcements - Create announcement
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { createAnnouncementSchema } from '@/lib/admin/validation';
import { logAnnouncementCreate } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

// GET - List all announcements
export async function GET(request: Request) {
  // BUG-2 FIX: Apply rate limiting (standard - 1000 req/min)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.READONLY);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query - admins see all
    let dbQuery = supabase
      .from('system_announcements')
      .select(
        `
        *,
        creator:profiles!created_by(id, email, full_name),
        publisher:profiles!published_by(id, email, full_name)
      `
      )
      .order('created_at', { ascending: false });

    // Optional status filter
    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    const { data: announcements, error } = await dbQuery;

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Ankündigungen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST - Create announcement
export async function POST(request: Request) {
  // BUG-2 FIX: Apply rate limiting (standard - 1000 req/min)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STANDARD);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const supabase = await createClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = createAnnouncementSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      priority,
      type,
      target_audience,
      publish_at,
      expires_at,
    } = validated.data;

    // Create announcement
    const { data: announcement, error } = await supabase
      .from('system_announcements')
      .insert({
        title,
        content,
        priority,
        type,
        target_audience,
        publish_at: publish_at || null,
        expires_at: expires_at || null,
        created_by: admin.id,
        status: publish_at && new Date(publish_at) > new Date() ? 'draft' : 'published',
        published_by: !publish_at || new Date(publish_at) <= new Date() ? admin.id : null,
        published_at: !publish_at || new Date(publish_at) <= new Date() ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Ankündigung' },
        { status: 500 }
      );
    }

    // Log the action
    await logAnnouncementCreate(admin.id, announcement.id, title);

    return NextResponse.json(
      { announcement },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating announcement:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
