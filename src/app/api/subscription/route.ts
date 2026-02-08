// API Route: /api/subscription
// Proxies to /api/stripe/subscription-status for frontend compatibility

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      // Return free plan as default
      const { data: credits } = await supabase
        .from("user_credits")
        .select("total_credits, used_credits")
        .eq("user_id", user.id)
        .single();

      return NextResponse.json({
        subscription: {
          plan: "free",
          status: "active",
          billingInterval: "monthly",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          creditsUsed: credits?.used_credits || 0,
          creditsTotal: credits?.total_credits || 30,
        },
      });
    }

    // Determine billing interval from price ID
    const isYearly = subscription.stripe_price_id?.includes("yearly") ||
                     process.env.STRIPE_PRICE_PRO_YEARLY === subscription.stripe_price_id;

    return NextResponse.json({
      subscription: {
        plan: subscription.plan_id as any,
        status: subscription.status as any,
        billingInterval: isYearly ? "yearly" : "monthly",
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialStart: subscription.trial_start,
        trialEnd: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        creditsUsed: 0, // Will be fetched from user context
        creditsTotal: subscription.plan_id === "pro" ? 500 : subscription.plan_id === "enterprise" ? 2000 : 30,
      },
    });
  } catch (error) {
    console.error("[Subscription API] Error:", error);
    return NextResponse.json(
      { error: "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}
