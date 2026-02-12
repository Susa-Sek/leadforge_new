/**
 * Admin Unsuspend User API
 * POST /api/admin/users/[id]/unsuspend - Unsuspend a user
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { logUserUnsuspend } from '@/lib/admin/audit';
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

  console.log('[Admin Unsuspend User API] POST operation by:', admin.id);

  // Use service client to bypass RLS
  const supabase = createServiceClient();

  try {
    // Call the unsuspend function
    const { data: success, error } = await supabase.rpc('unsuspend_user', {
      p_user_id: id,
      p_admin_id: admin.id,
    });

    if (error) {
      console.error('Error unsuspending user:', error);
      return NextResponse.json(
        { error: 'Fehler beim Entsperren des Benutzers: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Benutzer konnte nicht entsperrt werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logUserUnsuspend(admin.id, id);

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich entsperrt',
    });
  } catch (err) {
    console.error('Error unsuspending user:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
