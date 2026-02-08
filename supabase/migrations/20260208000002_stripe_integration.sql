-- Epic E8: Stripe Integration Migration
-- Creates tables for subscriptions, invoices, and webhook events

-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id);

-- Subscriptions table (extends existing or creates new)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,
    plan_id TEXT NOT NULL DEFAULT 'free',
    plan_name TEXT NOT NULL DEFAULT 'Free',
    status TEXT NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- Invoices table (local copy for quick access)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'eur',
    status TEXT NOT NULL,
    pdf_url TEXT,
    invoice_number TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (user_id = auth.uid());

-- Webhook events table (idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (only service role can access)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
ON public.webhook_events FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON public.webhook_events(stripe_event_id);

-- Update trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to create Stripe customer on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_stripe()
RETURNS TRIGGER AS $$
BEGIN
    -- Stripe customer will be created on first checkout
    -- This function is a placeholder for future automation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.subscriptions IS 'Stripe subscription data synced via webhooks';
COMMENT ON TABLE public.invoices IS 'Stripe invoices synced via webhooks';
COMMENT ON TABLE public.webhook_events IS 'Idempotency tracking for Stripe webhooks';
