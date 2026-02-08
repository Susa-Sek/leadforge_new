// API Route: /api/billing/portal
// Creates Stripe Customer Portal session for frontend compatibility

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get user's stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Kein Stripe-Konto gefunden" },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/einstellungen/abrechnung`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Billing Portal API] Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Billing Portals" },
      { status: 500 }
    );
  }
}
