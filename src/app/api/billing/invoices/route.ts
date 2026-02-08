// API Route: /api/billing/invoices
// Returns invoice list for frontend compatibility

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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
      return NextResponse.json({ invoices: [], has_more: false });
    }

    // Try to fetch from Stripe first
    try {
      const invoices = await stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: limit,
        starting_after: offset > 0 ? undefined : undefined,
      });

      const formattedInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        description: invoice.description || `Rechnung ${invoice.number}`,
      }));

      return NextResponse.json({
        invoices: formattedInvoices,
        has_more: invoices.has_more,
      });
    } catch (stripeError) {
      // Fallback to local database
      const { data: localInvoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[Invoices API] Database error:", error);
        return NextResponse.json({ invoices: [], has_more: false });
      }

      return NextResponse.json({
        invoices: localInvoices || [],
        has_more: false,
      });
    }
  } catch (error) {
    console.error("[Invoices API] Error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Rechnungen" },
      { status: 500 }
    );
  }
}
