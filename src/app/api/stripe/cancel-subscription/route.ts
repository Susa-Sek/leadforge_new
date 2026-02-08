import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

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

    // Get request body (optional immediate cancel)
    const body = await request.json().catch(() => ({}));
    const immediate = body.immediate === true;

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Kein aktives Abonnement gefunden' },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Keine Stripe-Abonnement-ID gefunden' },
        { status: 400 }
      );
    }

    // Cancel in Stripe
    const stripe = getStripeClient();
    if (immediate) {
      // Immediate cancellation
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: !immediate,
        status: immediate ? 'canceled' : subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Cancel Subscription] Failed to update database:', updateError);
      return NextResponse.json(
        { error: 'Datenbank-Update fehlgeschlagen' },
        { status: 500 }
      );
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'subscription_canceled',
      title: immediate ? 'Abonnement sofort gekündigt' : 'Abonnement gekündigt',
      message: immediate
        ? 'Ihr Abonnement wurde sofort beendet.'
        : `Ihr Abonnement wurde gekündigt und endet am ${new Date(subscription.current_period_end!).toLocaleDateString('de-DE')}.`,
    });

    return NextResponse.json({
      success: true,
      immediate,
      message: immediate
        ? 'Ihr Abonnement wurde sofort gekündigt.'
        : 'Ihr Abonnement wurde gekündigt und läuft am Ende der aktuellen Periode aus.',
    });
  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
