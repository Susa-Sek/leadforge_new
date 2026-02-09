/**
 * Admin User Plan Change API
 * PUT /api/admin/users/[id]/plan - Change user plan
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';
import { logUserPlanChange } from '@/lib/admin/audit';
import { z } from 'zod';

const changePlanSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting (strict - 100 req/min for plan changes)
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
    const validated = changePlanSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültiger Tarif', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { plan } = validated.data;

    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('plan_name, status')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current subscription:', fetchError);
    }

    const previousPlan = currentSub?.plan_name || 'free';

    // Determine period end date (30 days from now for active plans)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Update or create subscription
    const { data: updatedSub, error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: id,
        plan_name: plan,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (subError) {
      console.error('Error updating subscription:', subError);
      return NextResponse.json(
        { error: 'Fehler beim Ändern des Tarifs' },
        { status: 500 }
      );
    }

    // Log the plan change
    await logUserPlanChange(admin.id, id, previousPlan, plan);

    return NextResponse.json({ subscription: updatedSub, plan });
  } catch (err) {
    console.error('Error changing user plan:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}