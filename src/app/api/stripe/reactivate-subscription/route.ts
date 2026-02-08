import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

export async function POST() {
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

    // Get subscription that is marked for cancellation
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('cancel_at_period_end', true)
      .in('status', ['active', 'trialing'])
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Kein gekündigtes Abonnement gefunden, das reaktiviert werden kann' },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Keine Stripe-Abonnement-ID gefunden' },
        { status: 400 }
      );
    }

    // Reactivate in Stripe
    const stripe = getStripeClient();
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Reactivate Subscription] Failed to update database:', updateError);
      return NextResponse.json(
        { error: 'Datenbank-Update fehlgeschlagen' },
        { status: 500 }
      );
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'subscription_reactivated',
      title: 'Abonnement reaktiviert',
      message: 'Ihr Abonnement läuft weiter! Vielen Dank, dass Sie bei uns bleiben.',
    });

    return NextResponse.json({
      success: true,
      message: 'Ihr Abonnement wurde erfolgreich reaktiviert.',
    });
  } catch (error: any) {
    console.error('[Reactivate Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
