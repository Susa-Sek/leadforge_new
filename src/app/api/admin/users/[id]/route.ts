/**
 * Admin User Detail API
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { updateUserSchema } from '@/lib/admin/validation';
import { logUserPlanChange, logUserRoleChange } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

// GET - User details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (readonly - 2000 req/min for GET)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.READONLY);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const { id } = await params;
  const supabase = await createClient();

  try {
    // Get user with related data
    const { data: user, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        subscription:user_subscriptions!left(*),
        searches:search_queries(count),
        collections:saved_collections(count),
        contacts:contacts(count),
        deals:deals(count),
        credit_transactions:credit_transactions(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Benutzer nicht gefunden' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Error fetching user details:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Benutzerdetails' },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (strict - 100 req/min for user updates)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const updates = validated.data;

    // Get current user data for comparison
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('role, credits')
      .eq('id', id)
      .single();

    // BUG-5 FIX: Check if this is the last admin and trying to remove admin role
    if (updates.role && updates.role !== 'admin' && currentUser?.role === 'admin') {
      const { count: adminCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (!countError && adminCount === 1) {
        return NextResponse.json(
          { error: 'Der letzte Admin kann nicht entfernt werden' },
          { status: 400 }
        );
      }
    }

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.credits !== undefined) updateData.credits = updates.credits;
    updateData.updated_at = new Date().toISOString();

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Benutzers' },
        { status: 500 }
      );
    }

    // Log role change if applicable
    if (updates.role !== undefined && updates.role !== currentUser.role) {
      await logUserRoleChange(admin.id, id, currentUser.role, updates.role);
    }

    // BUG-2 FIX: Update plan in user_subscriptions if plan changed
    if (updates.plan !== undefined) {
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('plan_name')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (currentSub && currentSub.plan_name !== updates.plan) {
        // Update existing subscription or create new one
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: id,
            plan_name: updates.plan,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (!subError) {
          await logUserPlanChange(admin.id, id, currentSub.plan_name, updates.plan);
        }
      }
    }

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
