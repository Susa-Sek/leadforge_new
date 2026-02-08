import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

// Validation schema
const upgradeSchema = z.object({
  planId: z.enum(['pro', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']),
});

// Price ID mapping
const getPriceId = (planId: string, interval: string): string | null => {
  const priceMap: Record<string, Record<string, string | undefined>> = {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    },
  };

  return priceMap[planId]?.[interval] || null;
};

export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = upgradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Plan-Auswahl' },
        { status: 400 }
      );
    }

    const { planId, billingInterval } = validation.data;

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (subError || !currentSub) {
      return NextResponse.json(
        { error: 'Kein aktives Abonnement gefunden. Bitte upgraden Sie zuerst.' },
        { status: 404 }
      );
    }

    if (!currentSub.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Keine Stripe-Abonnement-ID gefunden' },
        { status: 400 }
      );
    }

    // Check if already on this plan
    if (currentSub.plan_id === planId) {
      return NextResponse.json(
        { error: `Sie sind bereits im ${planId === 'pro' ? 'Pro' : 'Enterprise'} Plan.` },
        { status: 409 }
      );
    }

    // Get new price ID
    const newPriceId = getPriceId(planId, billingInterval);
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Preis nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Determine if upgrade or downgrade
    const planHierarchy: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
    const currentPlanLevel = planHierarchy[currentSub.plan_id || 'free'];
    const newPlanLevel = planHierarchy[planId];
    const isUpgrade = newPlanLevel > currentPlanLevel;

    // Update subscription in Stripe
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
    const currentItemId = subscription.items.data[0].id;

    await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
      items: [
        {
          id: currentItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: isUpgrade ? 'create_prorations' : 'none',
      metadata: {
        userId: user.id,
        planId,
        billingInterval,
        previousPlan: currentSub.plan_id,
        changeType: isUpgrade ? 'upgrade' : 'downgrade',
      },
    });

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        plan_name: planId === 'pro' ? 'Pro' : 'Enterprise',
        stripe_price_id: newPriceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSub.id);

    if (updateError) {
      console.error('[Upgrade] Failed to update database:', updateError);
      return NextResponse.json(
        { error: 'Datenbank-Update fehlgeschlagen' },
        { status: 500 }
      );
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: isUpgrade ? 'subscription_upgraded' : 'subscription_downgraded',
      title: isUpgrade ? 'Upgrade erfolgreich' : 'Downgrade geplant',
      message: isUpgrade
        ? `Sie wurden erfolgreich auf ${planId === 'pro' ? 'Pro' : 'Enterprise'} upgradet.`
        : `Ihr Downgrade zu ${planId === 'pro' ? 'Pro' : 'Free'} wird am Ende der aktuellen Periode aktiv.`,
    });

    return NextResponse.json({
      success: true,
      isUpgrade,
      message: isUpgrade
        ? `Upgrade zu ${planId === 'pro' ? 'Pro' : 'Enterprise'} erfolgreich!`
        : `Downgrade zu ${planId === 'pro' ? 'Pro' : 'Free'} wurde geplant.`,
    });
  } catch (error: any) {
    console.error('[Upgrade] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
