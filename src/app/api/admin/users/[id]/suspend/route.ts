/**
 * Admin Suspend User API
 * POST /api/admin/users/[id]/suspend - Suspend a user
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { suspendUserSchema } from '@/lib/admin/validation';
import { logUserSuspend } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (strict - 100 req/min for destructive operations)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const { id } = await params;

  console.log('[Admin Suspend User API] POST operation by:', admin.id);

  // Use service client to bypass RLS
  const supabase = createServiceClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = suspendUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { reason } = validated.data;

    // Prevent self-suspension
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst sperren' },
        { status: 400 }
      );
    }

    // Call the suspend function
    const { data: success, error } = await supabase.rpc('suspend_user', {
      p_user_id: id,
      p_admin_id: admin.id,
      p_reason: reason,
    });

    if (error) {
      console.error('Error suspending user:', error);
      return NextResponse.json(
        { error: 'Fehler beim Sperren des Benutzers: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Benutzer konnte nicht gesperrt werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logUserSuspend(admin.id, id, reason);

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich gesperrt',
    });
  } catch (err) {
    console.error('Error suspending user:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
