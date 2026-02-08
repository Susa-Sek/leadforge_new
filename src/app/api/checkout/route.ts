// API Route: /api/checkout
// Proxies checkout session creation for frontend compatibility

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPriceId } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, interval, successUrl, cancelUrl } = body;

    if (!planId || !interval) {
      return NextResponse.json(
        { error: "Plan ID und Intervall erforderlich" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    let { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Get price ID
    const priceId = getPriceId(planId, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: "Ungültiger Plan oder Intervall" },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/cancel`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Session" },
      { status: 500 }
    );
  }
}
