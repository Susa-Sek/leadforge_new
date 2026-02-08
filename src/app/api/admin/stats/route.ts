/**
 * Admin Statistics API
 * GET /api/admin/stats - Get dashboard statistics
 */

import { NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { getCachedDashboardStats } from '@/lib/admin/stats';
import { adminStatsQuerySchema } from '@/lib/admin/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

export async function GET(request: Request) {
  // BUG-2 FIX: Apply rate limiting (standard - 1000 req/min)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STANDARD);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = adminStatsQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { from, to } = validated.data;

    // Parse dates
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    // Get cached stats
    const stats = await getCachedDashboardStats(fromDate, toDate);

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
