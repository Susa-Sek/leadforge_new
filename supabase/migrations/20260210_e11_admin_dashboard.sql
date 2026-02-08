-- Migration: E11 Admin Dashboard
-- Created: 2026-02-10
-- Description: Tables and functions for admin dashboard (user management, audit logs, announcements, reports)

-- =====================================================
-- ENUM TYPE FOR ADMIN ACTIONS
-- =====================================================
CREATE TYPE admin_action_type AS ENUM (
  'USER_SUSPEND',
  'USER_UNSUSPEND',
  'USER_PLAN_CHANGE',
  'USER_ROLE_CHANGE',
  'CREDIT_ADJUSTMENT',
  'ANNOUNCEMENT_CREATE',
  'ANNOUNCEMENT_UPDATE',
  'ANNOUNCEMENT_DELETE',
  'REPORT_RESOLVE',
  'REPORT_DISMISS',
  'USER_DELETE',
  'SYSTEM_SETTING_CHANGE',
  'REFUND_ISSUED',
  'FORCE_PASSWORD_RESET'
);

-- =====================================================
-- PROFILES TABLE UPDATES
-- =====================================================
-- Add admin-related columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = TRUE;

-- =====================================================
-- ADMIN AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action admin_action_type NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'system', 'announcement', 'report', 'subscription', 'credit')),
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_created_at_brin ON admin_audit_logs USING BRIN (created_at);

-- =====================================================
-- SYSTEM ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE system_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'maintenance')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'paid', 'admins')),
  publish_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for announcements
CREATE INDEX idx_announcements_status ON system_announcements(status);
CREATE INDEX idx_announcements_publish_at ON system_announcements(publish_at);
CREATE INDEX idx_announcements_expires_at ON system_announcements(expires_at);
CREATE INDEX idx_announcements_priority ON system_announcements(priority);

-- =====================================================
-- REPORTS TABLE (USER REPORTS FOR MODERATION)
-- =====================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('spam', 'abuse', 'inappropriate_content', 'fake_profile', 'copyright', 'other')),
  description TEXT,
  evidence JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_type ON reports(type);

-- =====================================================
-- CREDIT ADJUSTMENTS TABLE (FOR ADMIN CREDIT CHANGES)
-- =====================================================
CREATE TABLE credit_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for credit adjustments
CREATE INDEX idx_credit_adjustments_user ON credit_adjustments(user_id);
CREATE INDEX idx_credit_adjustments_admin ON credit_adjustments(admin_id);
CREATE INDEX idx_credit_adjustments_created_at ON credit_adjustments(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Admin Audit Logs RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System Announcements RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published announcements" ON system_announcements
  FOR SELECT USING (
    status = 'published' AND
    (publish_at IS NULL OR publish_at <= NOW()) AND
    (expires_at IS NULL OR expires_at > NOW())
  );

CREATE POLICY "Admins can view all announcements" ON system_announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create announcements" ON system_announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update announcements" ON system_announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete announcements" ON system_announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reports RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (
    reporter_id = auth.uid()
  );

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    reporter_id = auth.uid()
  );

CREATE POLICY "Only admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Credit Adjustments RLS
ALTER TABLE credit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit adjustments" ON credit_adjustments
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all credit adjustments" ON credit_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create credit adjustments" ON credit_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles - Admin can view/update all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_admin_id UUID,
  p_action admin_action_type,
  p_target_type TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Suspend user
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can suspend users';
  END IF;

  -- Update user
  UPDATE profiles
  SET is_suspended = TRUE,
      suspended_at = NOW(),
      suspended_reason = p_reason,
      suspended_by = p_admin_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'USER_SUSPEND',
    'user',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Unsuspend user
CREATE OR REPLACE FUNCTION unsuspend_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can unsuspend users';
  END IF;

  -- Update user
  UPDATE profiles
  SET is_suspended = FALSE,
      suspended_at = NULL,
      suspended_reason = NULL,
      suspended_by = NULL,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'USER_UNSUSPEND',
    'user',
    p_user_id,
    '{}'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Adjust user credits
CREATE OR REPLACE FUNCTION adjust_user_credits(
  p_user_id UUID,
  p_admin_id UUID,
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can adjust credits';
  END IF;

  -- Get current balance
  SELECT credits INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Cannot reduce credits below zero';
  END IF;

  -- Update user credits
  UPDATE profiles
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record adjustment
  INSERT INTO credit_adjustments (user_id, admin_id, amount, reason, previous_balance, new_balance)
  VALUES (p_user_id, p_admin_id, p_amount, p_reason, v_current_balance, v_new_balance);

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'CREDIT_ADJUSTMENT',
    'credit',
    p_user_id,
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason,
      'previous_balance', v_current_balance,
      'new_balance', v_new_balance
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats(
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
  v_from TIMESTAMPTZ := COALESCE(p_from_date, NOW() - INTERVAL '30 days');
  v_to TIMESTAMPTZ := COALESCE(p_to_date, NOW());
BEGIN
  SELECT jsonb_build_object(
    'users', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM profiles),
      'new_this_period', (SELECT COUNT(*) FROM profiles WHERE created_at BETWEEN v_from AND v_to),
      'active_today', (SELECT COUNT(*) FROM profiles WHERE updated_at >= NOW() - INTERVAL '1 day'),
      'suspended', (SELECT COUNT(*) FROM profiles WHERE is_suspended = TRUE),
      'admins', (SELECT COUNT(*) FROM profiles WHERE role = 'admin')
    ),
    'subscriptions', jsonb_build_object(
      'total_active', (SELECT COUNT(*) FROM user_subscriptions WHERE status IN ('active', 'trialing')),
      'free_tier', (SELECT COUNT(*) FROM profiles p
                    WHERE NOT EXISTS (
                      SELECT 1 FROM user_subscriptions us
                      WHERE us.user_id = p.id AND us.status IN ('active', 'trialing')
                    )),
      'trialing', (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'trialing'),
      'past_due', (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'past_due')
    ),
    'credits', jsonb_build_object(
      'total_issued', (SELECT COALESCE(SUM(credits), 0) FROM profiles),
      'total_used', COALESCE((
        SELECT SUM(amount) FROM credit_transactions
        WHERE created_at BETWEEN v_from AND v_to AND amount < 0
      ), 0),
      'purchased_this_period', COALESCE((
        SELECT SUM(amount) FROM credit_transactions
        WHERE created_at BETWEEN v_from AND v_to AND transaction_type = 'purchase'
      ), 0)
    ),
    'searches', jsonb_build_object(
      'total_this_period', (SELECT COUNT(*) FROM search_queries WHERE created_at BETWEEN v_from AND v_to),
      'completed', (SELECT COUNT(*) FROM search_queries WHERE created_at BETWEEN v_from AND v_to AND status = 'completed'),
      'failed', (SELECT COUNT(*) FROM search_queries WHERE created_at BETWEEN v_from AND v_to AND status = 'failed')
    ),
    'reports', jsonb_build_object(
      'pending', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
      'investigating', (SELECT COUNT(*) FROM reports WHERE status = 'investigating'),
      'resolved', (SELECT COUNT(*) FROM reports WHERE status = 'resolved'),
      'dismissed', (SELECT COUNT(*) FROM reports WHERE status = 'dismissed')
    ),
    'period', jsonb_build_object(
      'from', v_from,
      'to', v_to
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get revenue statistics
CREATE OR REPLACE FUNCTION get_revenue_stats(
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
  v_from TIMESTAMPTZ := COALESCE(p_from_date, NOW() - INTERVAL '30 days');
  v_to TIMESTAMPTZ := COALESCE(p_to_date, NOW());
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', COALESCE((
      SELECT SUM(amount) FROM stripe_invoices
      WHERE status = 'paid' AND created BETWEEN v_from AND v_to
    ), 0),
    'refunds', COALESCE((
      SELECT SUM(amount_refunded) FROM stripe_invoices
      WHERE amount_refunded > 0 AND created BETWEEN v_from AND v_to
    ), 0),
    'new_subscriptions', (SELECT COUNT(*) FROM user_subscriptions WHERE created_at BETWEEN v_from AND v_to),
    'cancellations', (SELECT COUNT(*) FROM user_subscriptions WHERE canceled_at BETWEEN v_from AND v_to),
    'by_plan', COALESCE((
      SELECT jsonb_object_agg(plan_name, cnt)
      FROM (
        SELECT
          COALESCE(price_id, 'unknown') as plan_name,
          COUNT(*) as cnt
        FROM user_subscriptions
        WHERE created_at BETWEEN v_from AND v_to
        GROUP BY price_id
      ) subq
    ), '{}'::jsonb),
    'mrr_estimate', COALESCE((
      SELECT SUM(amount) / NULLIF(COUNT(DISTINCT DATE_TRUNC('month', created)), 0)
      FROM stripe_invoices
      WHERE status = 'paid' AND created >= NOW() - INTERVAL '3 months'
    ), 0) * (
      SELECT COUNT(DISTINCT DATE_TRUNC('month', created))
      FROM stripe_invoices
      WHERE status = 'paid' AND created >= NOW() - INTERVAL '3 months'
    ),
    'period', jsonb_build_object(
      'from', v_from,
      'to', v_to
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update announcement
CREATE OR REPLACE FUNCTION update_announcement(
  p_announcement_id UUID,
  p_admin_id UUID,
  p_updates JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can update announcements';
  END IF;

  UPDATE system_announcements
  SET
    title = COALESCE(p_updates->>'title', title),
    content = COALESCE(p_updates->>'content', content),
    priority = COALESCE(p_updates->>'priority', priority),
    type = COALESCE(p_updates->>'type', type),
    status = COALESCE(p_updates->>'status', status),
    target_audience = COALESCE(p_updates->>'target_audience', target_audience),
    publish_at = COALESCE((p_updates->>'publish_at')::timestamptz, publish_at),
    expires_at = COALESCE((p_updates->>'expires_at')::timestamptz, expires_at),
    updated_at = NOW()
  WHERE id = p_announcement_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'ANNOUNCEMENT_UPDATE',
    'announcement',
    p_announcement_id,
    p_updates
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete announcement
CREATE OR REPLACE FUNCTION delete_announcement(
  p_announcement_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can delete announcements';
  END IF;

  DELETE FROM system_announcements WHERE id = p_announcement_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'ANNOUNCEMENT_DELETE',
    'announcement',
    p_announcement_id,
    '{}'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resolve report
CREATE OR REPLACE FUNCTION resolve_report(
  p_report_id UUID,
  p_admin_id UUID,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  UPDATE reports
  SET
    status = 'resolved',
    resolution_note = p_resolution_note,
    resolved_by = p_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'REPORT_RESOLVE',
    'report',
    p_report_id,
    jsonb_build_object('note', p_resolution_note)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Dismiss report
CREATE OR REPLACE FUNCTION dismiss_report(
  p_report_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Only admins can dismiss reports';
  END IF;

  UPDATE reports
  SET
    status = 'dismissed',
    resolution_note = p_reason,
    resolved_by = p_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_report_id;

  -- Log action
  PERFORM log_audit_action(
    p_admin_id,
    'REPORT_DISMISS',
    'report',
    p_report_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_announcements_updated_at
  BEFORE UPDATE ON system_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED: Create default admin user (if needed)
-- Run this separately after creating your first admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
-- =====================================================
