import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('[Invoices] Failed to fetch:', error);
      return NextResponse.json(
        { error: 'Rechnungen konnten nicht geladen werden' },
        { status: 500 }
      );
    }

    // Format invoices for response
    const formattedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      stripeInvoiceId: invoice.stripe_invoice_id,
      invoiceNumber: invoice.invoice_number,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      createdAt: invoice.created_at,
      // Helper fields
      formattedAmount: invoice.amount_paid
        ? `${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`
        : `${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      formattedDate: invoice.created_at
        ? new Date(invoice.created_at).toLocaleDateString('de-DE')
        : null,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    console.error('[Invoices] Error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
