-- ============================================
-- E10: Notification System Migration
-- ============================================
-- This migration creates the notification system tables,
-- functions, triggers, and RLS policies for the Manyleads.io
-- notification infrastructure.
--
-- Tables:
--   - notifications: Core notification storage
--   - notification_preferences: Per-user, per-type preferences
--
-- Functions:
--   - create_notification: Creates notification with plan limit check
--   - mark_notification_read: Marks single notification as read
--   - mark_all_notifications_read: Marks all user notifications as read
--   - get_unread_count: Fast unread count for badge display
--   - cleanup_old_notifications: Retention cleanup (30/90 days based on plan)
--
-- Triggers:
--   - Auto-cleanup expired notifications
--   - Realtime broadcast on new notification
--
-- ============================================

-- ============================================
-- ENUM TYPE: Notification Types
-- ============================================
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'search_complete',           -- Search completed successfully
        'search_failed',             -- Search failed
        'export_complete',           -- Export completed
        'export_failed',             -- Export failed
        'low_credits',               -- Credits below 10%
        'credits_depleted',          -- No credits remaining
        'credit_purchase_success',   -- Credits purchased
        'deal_status_change',        -- Deal moved to new stage
        'deal_assigned',             -- Deal assigned to user
        'deal_deadline_approaching', -- Deal deadline within 24h
        'system_maintenance',        -- Scheduled maintenance
        'system_announcement',       -- Important announcement
        'subscription_expiring',     -- Subscription expires soon
        'subscription_expired'       -- Subscription expired
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification content
    type notification_type NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Flexible metadata storage

    -- Read status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Optional action link
    action_url TEXT,

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive notifications

    -- Constraints
    CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0)
);

-- ============================================
-- INDEXES: notifications
-- ============================================
-- Essential for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ============================================
-- TABLE: notification_preferences
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    -- Composite primary key (user_id + type)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,

    -- Delivery channels
    in_app BOOLEAN DEFAULT TRUE,
    email BOOLEAN DEFAULT FALSE,
    push BOOLEAN DEFAULT FALSE,

    -- Quiet hours (optional, format: HH:MM in 24h)
    quiet_hours_start TIME,
    quiet_hours_end TIME,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, type)
);

-- ============================================
-- INDEXES: notification_preferences
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================
-- ROW LEVEL SECURITY: Enable
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: notifications
-- ============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own notifications (for marking read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: notification_preferences
-- ============================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON notification_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Create Notification with Plan Check
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_action_url TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
    v_plan_tier TEXT;
    v_monthly_count INTEGER;
    v_max_notifications INTEGER;
BEGIN
    -- Get user's plan tier
    SELECT COALESCE(plan_tier, 'free') INTO v_plan_tier
    FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Default to free if no subscription found
    IF v_plan_tier IS NULL THEN
        v_plan_tier := 'free';
    END IF;

    -- Set plan limits
    v_max_notifications := CASE v_plan_tier
        WHEN 'free' THEN 100
        WHEN 'pro' THEN 1000
        WHEN 'enterprise' THEN 10000
        ELSE 100
    END;

    -- Count notifications this month
    SELECT COUNT(*) INTO v_monthly_count
    FROM notifications
    WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', NOW());

    -- Check if limit reached
    IF v_monthly_count >= v_max_notifications THEN
        -- For free users, drop the notification silently
        IF v_plan_tier = 'free' THEN
            RETURN NULL;
        END IF;
        -- For paid users, still create but could log warning
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        action_url,
        expires_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_action_url,
        p_expires_at
    )
    RETURNING id INTO v_notification_id;

    -- Broadcast to realtime (using pg_notify for simplicity)
    PERFORM pg_notify(
        'notification:' || p_user_id::text,
        json_build_object(
            'event', 'new_notification',
            'payload', json_build_object(
                'id', v_notification_id,
                'type', p_type,
                'title', p_title,
                'message', p_message,
                'data', p_data,
                'action_url', p_action_url,
                'created_at', NOW()
            )
        )::text
    );

    RETURN v_notification_id;
END;
$$;

-- ============================================
-- FUNCTION: Mark Notification as Read
-- ============================================
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE notifications
    SET read = TRUE,
        read_at = NOW()
    WHERE id = p_notification_id
      AND user_id = p_user_id
      AND read = FALSE;

    RETURN FOUND;
END;
$$;

-- ============================================
-- FUNCTION: Mark All Notifications as Read
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE,
        read_at = NOW()
    WHERE user_id = p_user_id
      AND read = FALSE;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN v_updated_count;
END;
$$;

-- ============================================
-- FUNCTION: Get Unread Count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_count(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id
      AND read = FALSE
      AND (expires_at IS NULL OR expires_at > NOW());

    RETURN v_count;
END;
$$;

-- ============================================
-- FUNCTION: Get Monthly Notification Count
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_notification_count(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id
      AND created_at >= DATE_TRUNC('month', NOW());

    RETURN v_count;
END;
$$;

-- ============================================
-- FUNCTION: Cleanup Old Notifications
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TABLE (deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_free_deleted INTEGER;
    v_pro_deleted INTEGER;
    v_enterprise_deleted INTEGER;
BEGIN
    -- Delete free user notifications older than 30 days
    WITH deleted_free AS (
        DELETE FROM notifications n
        WHERE n.created_at < NOW() - INTERVAL '30 days'
          AND EXISTS (
              SELECT 1 FROM subscriptions s
              WHERE s.user_id = n.user_id
                AND s.plan_tier = 'free'
                AND s.status IN ('active', 'trialing')
          )
        RETURNING n.id
    )
    SELECT COUNT(*) INTO v_free_deleted FROM deleted_free;

    -- Delete pro user notifications older than 90 days
    WITH deleted_pro AS (
        DELETE FROM notifications n
        WHERE n.created_at < NOW() - INTERVAL '90 days'
          AND EXISTS (
              SELECT 1 FROM subscriptions s
              WHERE s.user_id = n.user_id
                AND s.plan_tier = 'pro'
                AND s.status IN ('active', 'trialing')
          )
        RETURNING n.id
    )
    SELECT COUNT(*) INTO v_pro_deleted FROM deleted_pro;

    -- Delete enterprise notifications older than 365 days
    WITH deleted_enterprise AS (
        DELETE FROM notifications n
        WHERE n.created_at < NOW() - INTERVAL '365 days'
          AND EXISTS (
              SELECT 1 FROM subscriptions s
              WHERE s.user_id = n.user_id
                AND s.plan_tier = 'enterprise'
                AND s.status IN ('active', 'trialing')
          )
        RETURNING n.id
    )
    SELECT COUNT(*) INTO v_enterprise_deleted FROM deleted_enterprise;

    -- Also delete expired notifications
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW();

    RETURN QUERY SELECT v_free_deleted + v_pro_deleted + v_enterprise_deleted;
END;
$$;

-- ============================================
-- FUNCTION: Initialize Default Preferences
-- ============================================
CREATE OR REPLACE FUNCTION initialize_notification_preferences(
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert default preferences for all notification types
    INSERT INTO notification_preferences (user_id, type, in_app, email, push)
    SELECT
        p_user_id,
        t.type,
        TRUE as in_app,  -- All types enabled in-app by default
        CASE
            WHEN t.type IN ('low_credits', 'credits_depleted', 'subscription_expiring', 'subscription_expired') THEN TRUE
            ELSE FALSE
        END as email,    -- Critical types get email by default
        FALSE as push    -- Push disabled by default
    FROM (
        SELECT unnest(enum_range(NULL::notification_type)) as type
    ) t
    ON CONFLICT (user_id, type) DO NOTHING;
END;
$$;

-- ============================================
-- TRIGGER: Auto-initialize preferences on user creation
-- ============================================
CREATE OR REPLACE FUNCTION trigger_initialize_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM initialize_notification_preferences(NEW.id);
    RETURN NEW;
END;
$$;

-- Note: This trigger should be added to auth.users if possible,
-- otherwise call initialize_notification_preferences after user signup

-- ============================================
-- TRIGGER: Update notifications.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_notifications_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_notifications_timestamp();

-- ============================================
-- TRIGGER: Update notification_preferences.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_notification_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_notification_preferences_timestamp();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION create_notification(UUID, notification_type, TEXT, TEXT, JSONB, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_notification_preferences(UUID) TO authenticated;

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON TABLE notifications IS 'Core notification storage with plan-based limits and retention';
COMMENT ON TABLE notification_preferences IS 'Per-user, per-type notification delivery preferences';
COMMENT ON FUNCTION create_notification IS 'Creates notification with plan limit validation and realtime broadcast';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Daily cleanup job - 30 days retention for free, 90 for pro, 365 for enterprise';

-- ============================================
-- END OF MIGRATION
-- ============================================
