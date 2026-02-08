// API Route: /api/subscription/cancel
// Proxies subscription cancellation for frontend compatibility

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { immediately = false } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Keine aktive Subscription gefunden" },
        { status: 404 }
      );
    }

    if (immediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    return NextResponse.json({
      success: true,
      canceled: immediately,
      cancelAtPeriodEnd: !immediately,
    });
  } catch (error) {
    console.error("[Cancel Subscription API] Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Kündigen der Subscription" },
      { status: 500 }
    );
  }
}
