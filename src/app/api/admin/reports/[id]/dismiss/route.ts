/**
 * Admin Dismiss Report API
 * POST /api/admin/reports/[id]/dismiss - Dismiss a report
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { dismissReportSchema } from '@/lib/admin/validation';
import { logReportDismiss } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (strict - 100 req/min for moderation actions)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const { id } = await params;

  console.log('[Admin Dismiss Report API] POST operation by:', admin.id);

  // Use service client to bypass RLS
  const supabase = createServiceClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = dismissReportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { reason } = validated.data;

    // Call the dismiss function
    const { data: success, error } = await supabase.rpc('dismiss_report', {
      p_report_id: id,
      p_admin_id: admin.id,
      p_reason: reason,
    });

    if (error) {
      console.error('Error dismissing report:', error);
      return NextResponse.json(
        { error: 'Fehler beim Ablehnen der Meldung: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Meldung konnte nicht abgelehnt werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logReportDismiss(admin.id, id, reason);

    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich abgelehnt',
    });
  } catch (err) {
    console.error('Error dismissing report:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
