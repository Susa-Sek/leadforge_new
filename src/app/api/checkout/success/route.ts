import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    // Get session_id from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID fehlt' },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout-Session nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid' && !session.subscription) {
      return NextResponse.json(
        { error: 'Zahlung nicht abgeschlossen' },
        { status: 400 }
      );
    }

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const subscription = session.subscription as Stripe.Subscription | null;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Ungültige Session-Metadaten' },
        { status: 400 }
      );
    }

    // Get subscription details
    let trialEndsAt: string | null = null;
    let currentPeriodEnd: string | null = null;
    let status = 'active';

    if (subscription) {
      // BUG-FIX: Stripe API 2026 returns dates as strings
      trialEndsAt = (subscription as any).trial_end
        ? new Date((subscription as any).trial_end).toISOString()
        : null;
      currentPeriodEnd = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end).toISOString()
        : null;
      status = subscription.status;
    }

    return NextResponse.json({
      success: true,
      planId,
      planName: planId === 'pro' ? 'Pro' : 'Enterprise',
      isTrial: !!trialEndsAt,
      trialEndsAt,
      currentPeriodEnd,
      status,
      customerEmail: (session.customer as Stripe.Customer)?.email,
    });
  } catch (error: any) {
    console.error('[Checkout Success] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
