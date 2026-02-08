/**
 * Admin Credits API
 * GET /api/admin/credits - List credit transactions
 * POST /api/admin/credits - Add/remove credits
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { creditAdjustmentSchema, creditTransactionQuerySchema } from '@/lib/admin/validation';
import { logCreditAdjustment } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

// GET - List credit transactions
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
    const validated = creditTransactionQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { user_id, from, to, page, limit } = validated.data;

    // Build query
    let dbQuery = supabase
      .from('credit_adjustments')
      .select(
        `
        *,
        user:profiles!user_id(id, email, full_name),
        admin:profiles!admin_id(id, email, full_name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (user_id) {
      dbQuery = dbQuery.eq('user_id', user_id);
    }

    if (from) {
      dbQuery = dbQuery.gte('created_at', from);
    }

    if (to) {
      dbQuery = dbQuery.lte('created_at', to);
    }

    // Sorting
    dbQuery = dbQuery.order('created_at', { ascending: false });

    // Pagination
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;
    dbQuery = dbQuery.range(fromIndex, toIndex);

    const { data: transactions, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching credit adjustments:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Transaktionen' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      transactions,
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
    console.error('Error fetching credit transactions:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST - Adjust user credits
export async function POST(request: Request) {
  // BUG-2 FIX: Apply rate limiting (financial - 50 req/min for credit adjustments)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.FINANCIAL);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const supabase = await createClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = creditAdjustmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { user_id, amount, reason } = validated.data;

    // Get current user balance
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    const previousBalance = user.credits || 0;
    const newBalance = previousBalance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Guthaben kann nicht unter 0 fallen' },
        { status: 400 }
      );
    }

    // Call the adjust credits function
    const { data: success, error } = await supabase.rpc('adjust_user_credits', {
      p_user_id: user_id,
      p_admin_id: admin.id,
      p_amount: amount,
      p_reason: reason,
    });

    if (error) {
      console.error('Error adjusting credits:', error);
      return NextResponse.json(
        { error: 'Fehler beim Anpassen des Guthabens: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Guthaben konnte nicht angepasst werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logCreditAdjustment(admin.id, user_id, amount, reason, previousBalance, newBalance);

    return NextResponse.json({
      success: true,
      message: `Guthaben erfolgreich ${amount > 0 ? 'hinzugefügt' : 'entfernt'}`,
      adjustment: {
        user_id,
        amount,
        previous_balance: previousBalance,
        new_balance: newBalance,
        reason,
      },
    });
  } catch (err) {
    console.error('Error adjusting credits:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
