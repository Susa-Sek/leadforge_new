/**
 * Admin Users API - List all users
 * GET /api/admin/users - List users with search, filter, pagination
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { userListQuerySchema } from '@/lib/admin/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

export async function GET(request: Request) {
  // BUG-2 FIX: Apply rate limiting (1000 req/min)
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
    const validated = userListQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      search,
      role,
      is_suspended,
      plan,
      sort_by,
      sort_order,
      page,
      limit,
    } = validated.data;

    // Build base query with subscription info
    let dbQuery = supabase
      .from('profiles')
      .select(
        `
        *,
        subscription:user_subscriptions!left(status, plan_name, current_period_end)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (search) {
      dbQuery = dbQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (role) {
      dbQuery = dbQuery.eq('role', role);
    }

    if (plan) {
      dbQuery = dbQuery.eq('subscription.plan_name', plan);
    }

    if (is_suspended !== undefined) {
      dbQuery = dbQuery.eq('is_suspended', is_suspended === 'true');
    }

    // Sorting
    const orderColumn = sort_by === 'last_sign_in' ? 'updated_at' : sort_by;
    dbQuery = dbQuery.order(orderColumn, { ascending: sort_order === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    dbQuery = dbQuery.range(from, to);

    // Execute query
    const { data: users, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Benutzer' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      users,
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
    console.error('Unexpected error in admin users list:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
