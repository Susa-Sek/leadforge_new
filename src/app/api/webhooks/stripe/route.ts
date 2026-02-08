import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

// Lazy initialization - only create client when needed
const getStripeClient = () => getStripe();

// Webhook secret - checked at runtime
const getWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return secret;
};

// Event Handler Registry
const handlers: Record<string, (event: Stripe.Event, supabase: any) => Promise<void>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'customer.subscription.trial_will_end': handleTrialWillEnd,
};

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Invalid signature:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Idempotency check - has this event already been processed?
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      if (existingEvent.processed) {
        console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
        return NextResponse.json({ received: true, status: 'already_processed' });
      }
      // Event exists but not processed - continue processing
    }

    // Store event in database (upsert)
    const { error: upsertError } = await supabase
      .from('webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: false,
        payload: event as any,
        created_at: new Date().toISOString(),
      }, { onConflict: 'stripe_event_id' });

    if (upsertError) {
      console.error('[Stripe Webhook] Failed to store event:', upsertError);
      // Continue processing anyway
    }

    // Get handler for this event type
    const handler = handlers[event.type];

    if (handler) {
      try {
        await handler(event, supabase);

        // Mark as processed
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: null
          })
          .eq('stripe_event_id', event.id);

        console.log(`[Stripe Webhook] Event ${event.id} processed successfully`);
      } catch (handlerError: any) {
        console.error(`[Stripe Webhook] Handler error for ${event.type}:`, handlerError);

        // Store error
        await supabase
          .from('webhook_events')
          .update({
            processed: false,
            error: handlerError.message
          })
          .eq('stripe_event_id', event.id);

        // Return 200 anyway so Stripe doesn't retry immediately
        // We'll handle retries manually if needed
        return NextResponse.json({
          received: true,
          status: 'error',
          message: handlerError.message
        });
      }
    } else {
      // Unknown event type - log but return success
      console.log(`[Stripe Webhook] No handler for event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error: any) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handler: checkout.session.completed
async function handleCheckoutCompleted(event: Stripe.Event, supabase: any) {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log(`[Stripe Webhook] Processing checkout.session.completed: ${session.id}`);

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !planId || !customerId || !subscriptionId) {
    throw new Error(`Missing required data: userId=${userId}, planId=${planId}, customer=${customerId}, subscription=${subscriptionId}`);
  }

  // Retrieve subscription details from Stripe
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Update profile with stripe_customer_id
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId);

  if (profileError) {
    console.error('[Stripe Webhook] Failed to update profile:', profileError);
    throw profileError;
  }

  // Create or update subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan_id: planId,
      plan_name: planId === 'pro' ? 'Pro' : 'Enterprise',
      status: subscription.status,
      // BUG-FIX: Stripe API 2026-01-28.clover returns dates as strings, not unix timestamps
      // BUG-FIX: Cast to any for Stripe API 2026 type compatibility
      current_period_start: new Date((subscription as any).current_period_start).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      // BUG-FIX: Stripe API 2026 returns dates as strings
      trial_start: subscription.trial_start ? new Date(subscription.trial_start).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (subError) {
    console.error('[Stripe Webhook] Failed to create subscription:', subError);
    throw subError;
  }

  // Create notification for user
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'subscription_created',
    title: 'Willkommen im ' + (planId === 'pro' ? 'Pro' : 'Enterprise') + ' Plan!',
    message: `Ihr Abonnement wurde erfolgreich erstellt. ${subscription.trial_end ? 'Ihre Testphase läuft bis ' + new Date(subscription.trial_end).toLocaleDateString('de-DE') + '.' : ''}`,
  });

  console.log(`[Stripe Webhook] Subscription created for user ${userId}, plan ${planId}`);
}

// Handler: invoice.payment_succeeded
async function handlePaymentSucceeded(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log(`[Stripe Webhook] Processing invoice.payment_succeeded: ${invoice.id}`);

  const customerId = invoice.customer as string;
  // BUG-FIX: Stripe API 2026 - subscription property type change
  const subscriptionId = (invoice as any).subscription as string;

  // Find user by stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    throw new Error(`No user found with stripe_customer_id: ${customerId}`);
  }

  // Store invoice
  const { error: invoiceError } = await supabase
    .from('invoices')
    .upsert({
      user_id: profile.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_number: invoice.number,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

  if (invoiceError) {
    console.error('[Stripe Webhook] Failed to store invoice:', invoiceError);
    throw invoiceError;
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: profile.id,
    type: 'payment_succeeded',
    title: 'Zahlung erfolgreich',
    message: `Ihre Rechnung über ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()} wurde bezahlt.`,
  });

  console.log(`[Stripe Webhook] Invoice stored for user ${profile.id}`);
}

// Handler: invoice.payment_failed
async function handlePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log(`[Stripe Webhook] Processing invoice.payment_failed: ${invoice.id}`);

  const customerId = invoice.customer as string;
  // BUG-FIX: Stripe API 2026 - subscription property type change
  const subscriptionId = (invoice as any).subscription as string;

  // Find user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    throw new Error(`No user found with stripe_customer_id: ${customerId}`);
  }

  // Update subscription status to past_due
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId);
  }

  // Store invoice with failed status
  await supabase
    .from('invoices')
    .upsert({
      user_id: profile.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      amount_due: invoice.amount_due,
      amount_paid: 0,
      amount_remaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: 'open',
      description: invoice.description,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_number: invoice.number,
      created_at: new Date().toISOString(),
    }, { onConflict: 'stripe_invoice_id' });

  // Create notification
  await supabase.from('notifications').insert({
    user_id: profile.id,
    type: 'payment_failed',
    title: 'Zahlung fehlgeschlagen',
    message: `Die Zahlung über ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()} ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode.`,
  });

  console.log(`[Stripe Webhook] Payment failed notification sent to user ${profile.id}`);
}

// Handler: customer.subscription.updated
async function handleSubscriptionUpdated(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`[Stripe Webhook] Processing customer.subscription.updated: ${subscription.id}`);

  // Find subscription in our database
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*, profiles!inner(id, email)')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!existingSub) {
    console.warn(`[Stripe Webhook] Subscription ${subscription.id} not found in database`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const oldPlanId = existingSub.plan_id;

  // Determine new plan from price ID
  let newPlanId = oldPlanId;
  const proMonthlyPrice = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proYearlyPrice = process.env.STRIPE_PRICE_PRO_YEARLY;
  const enterpriseMonthlyPrice = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY;
  const enterpriseYearlyPrice = process.env.STRIPE_PRICE_ENTERPRISE_YEARLY;

  if (priceId === proMonthlyPrice || priceId === proYearlyPrice) {
    newPlanId = 'pro';
  } else if (priceId === enterpriseMonthlyPrice || priceId === enterpriseYearlyPrice) {
    newPlanId = 'enterprise';
  }

  // Update subscription
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      plan_id: newPlanId,
      plan_name: newPlanId === 'pro' ? 'Pro' : 'Enterprise',
      status: subscription.status,
      // BUG-FIX: Stripe API 2026-01-28.clover returns dates as strings, not unix timestamps
      // BUG-FIX: Cast to any for Stripe API 2026 type compatibility
      current_period_start: new Date((subscription as any).current_period_start).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      // BUG-FIX: Stripe API 2026 returns dates as strings
      trial_start: subscription.trial_start ? new Date(subscription.trial_start).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    throw updateError;
  }

  // Check for plan change
  if (oldPlanId !== newPlanId) {
    const planHierarchy: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
    const isUpgrade = planHierarchy[newPlanId] > planHierarchy[oldPlanId];

    await supabase.from('notifications').insert({
      user_id: existingSub.user_id,
      type: isUpgrade ? 'subscription_upgraded' : 'subscription_downgraded',
      title: isUpgrade ? 'Upgrade erfolgreich' : 'Downgrade geplant',
      message: isUpgrade
        ? `Sie wurden erfolgreich auf ${newPlanId === 'pro' ? 'Pro' : 'Enterprise'} upgradet.`
        // BUG-FIX: Stripe API 2026 dates are strings
        : `Ihr Downgrade zu ${newPlanId === 'pro' ? 'Pro' : 'Free'} wird am ${new Date((subscription as any).current_period_end).toLocaleDateString('de-DE')} aktiv.`,
    });
  }

  // Check for cancellation/reactivation
  if (subscription.cancel_at_period_end && !existingSub.cancel_at_period_end) {
    await supabase.from('notifications').insert({
      user_id: existingSub.user_id,
      type: 'subscription_canceled',
      title: 'Abonnement gekündigt',
      // BUG-FIX: Stripe API 2026 dates are strings
      message: `Ihr Abonnement wurde gekündigt und endet am ${new Date((subscription as any).current_period_end).toLocaleDateString('de-DE')}. Sie können es bis dahin reaktivieren.`,
    });
  } else if (!subscription.cancel_at_period_end && existingSub.cancel_at_period_end) {
    await supabase.from('notifications').insert({
      user_id: existingSub.user_id,
      type: 'subscription_reactivated',
      title: 'Abonnement reaktiviert',
      message: 'Ihr Abonnement läuft weiter! Vielen Dank, dass Sie bleiben.',
    });
  }

  console.log(`[Stripe Webhook] Subscription ${subscription.id} updated`);
}

// Handler: customer.subscription.deleted
async function handleSubscriptionDeleted(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`[Stripe Webhook] Processing customer.subscription.deleted: ${subscription.id}`);

  // Find and update subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!existingSub) {
    console.warn(`[Stripe Webhook] Subscription ${subscription.id} not found`);
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan_id: 'free',
      plan_name: 'Free',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Create notification
  await supabase.from('notifications').insert({
    user_id: existingSub.user_id,
    type: 'subscription_ended',
    title: 'Abonnement beendet',
    message: 'Ihr Abonnement wurde beendet. Sie wurden auf den Free-Plan zurückgesetzt.',
  });

  console.log(`[Stripe Webhook] Subscription ${subscription.id} marked as canceled`);
}

// Handler: customer.subscription.trial_will_end
async function handleTrialWillEnd(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(`[Stripe Webhook] Processing customer.subscription.trial_will_end: ${subscription.id}`);

  // Find user
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!sub) {
    console.warn(`[Stripe Webhook] Subscription ${subscription.id} not found`);
    return;
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: sub.user_id,
    type: 'trial_ending',
    title: 'Ihre Testphase endet in 3 Tagen',
    message: 'Stellen Sie sicher, dass Ihre Zahlungsmethode aktuell ist, um eine Unterbrechung zu vermeiden.',
  });

  console.log(`[Stripe Webhook] Trial ending notification sent for subscription ${subscription.id}`);
}
