import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

// Validation schema
const checkoutSchema = z.object({
  planId: z.enum(['pro', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']),
});

// Price ID mapping from environment variables
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
        { error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Plan-Auswahl. Bitte wählen Sie Pro oder Enterprise.' },
        { status: 400 }
      );
    }

    const { planId, billingInterval } = validation.data;

    // Get price ID
    const priceId = getPriceId(planId, billingInterval);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Preis nicht konfiguriert. Bitte kontaktieren Sie den Support.' },
        { status: 500 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Stripe Checkout] Failed to get profile:', profileError);
      return NextResponse.json(
        { error: 'Profil nicht gefunden.' },
        { status: 500 }
      );
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSub && existingSub.plan_id === planId) {
      return NextResponse.json(
        { error: 'Sie haben bereits einen aktiven ' + planId + ' Plan.' },
        { status: 409 }
      );
    }

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id;

    const stripe = getStripeClient();

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.full_name || undefined,
        metadata: {
          userId: user.id,
          email: user.email!,
        },
      });

      customerId = customer.id;

      // Store in profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Build success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/upgrade?canceled=true`;

    // Create checkout session (stripe client already initialized above)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: user.id,
          planId,
          billingInterval,
        },
      },
      automatic_tax: { enabled: true },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        planId,
        billingInterval,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Checkout-Session konnte nicht erstellt werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}
