/**
 * Admin Reports API
 * GET /api/admin/reports - List reports for moderation
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { reportListQuerySchema } from '@/lib/admin/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

export async function GET(request: Request) {
  // BUG-2 FIX: Apply rate limiting (readonly - 2000 req/min for GET)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.READONLY);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const supabase = await createClient();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = reportListQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { status, type, page, limit } = validated.data;

    // Build query
    let dbQuery = supabase
      .from('reports')
      .select(
        `
        *,
        reporter:profiles!reporter_id(id, email, full_name),
        reported_user:profiles!reported_user_id(id, email, full_name),
        resolver:profiles!resolved_by(id, email, full_name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    if (type) {
      dbQuery = dbQuery.eq('type', type);
    }

    // Sorting - pending first, then by created_at
    dbQuery = dbQuery.order('status', { ascending: true });
    dbQuery = dbQuery.order('created_at', { ascending: false });

    // Pagination
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;
    dbQuery = dbQuery.range(fromIndex, toIndex);

    const { data: reports, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Meldungen' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
