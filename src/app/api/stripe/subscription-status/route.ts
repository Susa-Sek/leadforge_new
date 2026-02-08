import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due', 'canceled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // No subscription found - return free plan
    if (subError || !subscription) {
      return NextResponse.json({
        plan: 'free',
        planId: 'free',
        status: 'active',
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
      });
    }

    // Calculate days left in trial
    let daysLeftInTrial: number | null = null;
    if (subscription.trial_end && subscription.status === 'trialing') {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      daysLeftInTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      plan: subscription.plan_name || subscription.plan_id,
      planId: subscription.plan_id || 'free',
      status: subscription.status,
      isTrial: subscription.status === 'trialing',
      trialEndsAt: subscription.trial_end,
      daysLeftInTrial,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    });
  } catch (error: any) {
    console.error('[Subscription Status] Error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
