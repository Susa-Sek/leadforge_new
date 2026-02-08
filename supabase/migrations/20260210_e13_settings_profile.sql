-- Epic E13: Settings & Profile Migration
-- Creates user_settings table and extends profiles table

-- =====================================================
-- EXTEND PROFILES TABLE
-- =====================================================

-- Add new columns to profiles table for E13
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT, -- encrypted
ADD COLUMN IF NOT EXISTS pending_deletion_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Regional Settings
  language VARCHAR(10) DEFAULT 'de',
  timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
  date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FUNCTION: Create user_settings on profile creation
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default user_settings for new user
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to create user_settings for existing users and new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_profile_created_settings'
  ) THEN
    CREATE TRIGGER on_profile_created_settings
      AFTER INSERT ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_settings();
  END IF;
END $$;

-- Create settings for existing users (if any are missing)
INSERT INTO user_settings (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_settings IS 'User preferences for regional settings (language, timezone, date format, currency)';
COMMENT ON COLUMN profiles.company_name IS 'User company name for profile display';
COMMENT ON COLUMN profiles.job_title IS 'User job title/position';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image in storage';
COMMENT ON COLUMN profiles.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN profiles.two_factor_secret IS 'Encrypted TOTP secret for 2FA';
COMMENT ON COLUMN profiles.pending_deletion_at IS 'Timestamp when account will be permanently deleted (30 days after request)';
COMMENT ON COLUMN profiles.deletion_requested_at IS 'Timestamp when user requested account deletion';
