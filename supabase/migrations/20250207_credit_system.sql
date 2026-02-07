-- Migration: Credit System Backend (PROJ-10)
-- Created: 2026-02-07
-- Description: Adds credit_transactions table and atomic credit operation functions

-- ============================================
-- 1. CREDIT TRANSACTIONS TABLE (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deduct', 'add', 'reset', 'refund')),
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view their own transactions
CREATE POLICY "Users can view their own credit transactions."
    ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert transactions (via functions)
CREATE POLICY "System can insert credit transactions."
    ON public.credit_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- ============================================
-- 2. ATOMIC CREDIT DEDUCTION FUNCTION
-- ============================================
-- Uses SELECT FOR UPDATE to prevent race conditions

CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_credits INTEGER;
    v_used_credits INTEGER;
    v_available INTEGER;
    v_new_used INTEGER;
BEGIN
    -- Validate inputs
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Lock the row for update (prevents race conditions)
    SELECT total_credits, used_credits
    INTO v_total_credits, v_used_credits
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Check if user has credits record
    IF v_total_credits IS NULL THEN
        RAISE EXCEPTION 'User credits record not found';
    END IF;

    -- Calculate available credits
    v_available := v_total_credits - v_used_credits;

    -- Check if enough credits
    IF v_available < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits: required %, available %', p_amount, v_available;
    END IF;

    -- Calculate new used amount
    v_new_used := v_used_credits + p_amount;

    -- Update used_credits
    UPDATE public.user_credits
    SET used_credits = v_new_used,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        reason,
        metadata,
        balance_after
    ) VALUES (
        p_user_id,
        p_amount,
        'deduct',
        p_reason,
        p_metadata,
        v_available - p_amount
    );

    -- Return remaining credits
    RETURN v_available - p_amount;
END;
$$;

-- ============================================
-- 3. ATOMIC CREDIT ADDITION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_credits INTEGER;
    v_used_credits INTEGER;
    v_available INTEGER;
    v_new_total INTEGER;
BEGIN
    -- Validate inputs
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Lock the row for update
    SELECT total_credits, used_credits
    INTO v_total_credits, v_used_credits
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Check if user has credits record
    IF v_total_credits IS NULL THEN
        -- Create new record if doesn't exist
        INSERT INTO public.user_credits (user_id, total_credits, used_credits)
        VALUES (p_user_id, p_amount, 0);

        v_available := p_amount;
        v_new_total := p_amount;
    ELSE
        -- Update total_credits
        v_new_total := v_total_credits + p_amount;
        v_available := v_new_total - v_used_credits;

        UPDATE public.user_credits
        SET total_credits = v_new_total,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        reason,
        metadata,
        balance_after
    ) VALUES (
        p_user_id,
        p_amount,
        'add',
        p_reason,
        p_metadata,
        v_available
    );

    -- Return new total credits
    RETURN v_available;
END;
$$;

-- ============================================
-- 4. CREDIT RESET FUNCTION (For PROJ-11)
-- ============================================
-- Template for monthly credit reset (called by pg_cron or manually)

/*
-- Enable pg_cron extension (requires superuser):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly reset at 00:00 on 1st of each month:
-- SELECT cron.schedule('monthly-credit-reset', '0 0 1 * *', 'SELECT reset_monthly_credits()');
*/

CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS TABLE (
    user_id UUID,
    old_total INTEGER,
    new_total INTEGER,
    reset_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only admins can run this
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Only admins can reset credits';
    END IF;

    RETURN QUERY
    WITH reset_data AS (
        SELECT
            uc.user_id,
            uc.total_credits as old_total,
            -- Reset to subscription plan limit (30 for free, etc.)
            COALESCE(
                (SELECT p.credits_limit
                 FROM public.subscriptions s
                 JOIN public.plans p ON s.plan_id = p.id
                 WHERE s.user_id = uc.user_id
                 AND s.status = 'active'
                 LIMIT 1),
                30  -- Default free plan
            ) as new_total
        FROM public.user_credits uc
        WHERE uc.used_credits > 0  -- Only process users who used credits
    ),
    update_credits AS (
        UPDATE public.user_credits uc
        SET total_credits = r.new_total,
            used_credits = 0,
            updated_at = NOW()
        FROM reset_data r
        WHERE uc.user_id = r.user_id
        RETURNING uc.user_id, r.old_total, uc.total_credits as new_total, NOW() as reset_date
    )
    SELECT * FROM update_credits;
END;
$$;

-- ============================================
-- 5. SINGLE USER CREDIT RESET
-- ============================================

CREATE OR REPLACE FUNCTION public.reset_user_credits(
    p_user_id UUID,
    p_new_total INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_total INTEGER;
    v_old_used INTEGER;
    v_old_total INTEGER;
BEGIN
    -- Get current values
    SELECT total_credits, used_credits
    INTO v_old_total, v_old_used
    FROM public.user_credits
    WHERE user_id = p_user_id;

    -- Determine new total
    IF p_new_total IS NULL THEN
        -- Use subscription plan limit
        SELECT COALESCE(p.credits_limit, 30)
        INTO v_new_total
        FROM public.subscriptions s
        JOIN public.plans p ON s.plan_id = p.id
        WHERE s.user_id = p_user_id
        AND s.status = 'active'
        LIMIT 1;

        -- Fallback to 30 if no subscription found
        IF v_new_total IS NULL THEN
            v_new_total := 30;
        END IF;
    ELSE
        v_new_total := p_new_total;
    END IF;

    -- Update credits
    UPDATE public.user_credits
    SET total_credits = v_new_total,
        used_credits = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        reason,
        balance_after
    ) VALUES (
        p_user_id,
        v_old_used,
        'reset',
        'Monthly credit reset',
        v_new_total
    );

    RETURN v_new_total;
END;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.deduct_credits(UUID, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(UUID, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_credits(UUID, INTEGER) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.deduct_credits IS 'Atomically deduct credits from user account with row-level locking. Returns remaining credits.';
COMMENT ON FUNCTION public.add_credits IS 'Atomically add credits to user account. Returns new available credits.';
COMMENT ON FUNCTION public.reset_monthly_credits IS 'Reset all user credits to their plan limit (monthly cron job). Admin only.';
COMMENT ON FUNCTION public.reset_user_credits IS 'Reset specific user credits. Can specify new total or use plan limit.';
COMMENT ON TABLE public.credit_transactions IS 'Audit trail for all credit operations (deduct, add, reset, refund)';
