-- E9 Export System Migration
-- Tables: export_logs, export_templates, scheduled_exports
-- Functions: cleanup_expired_exports, calculate_next_run, update_scheduled_export_next_runs
-- Triggers: auto-update next_run for scheduled exports, template usage tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. EXPORT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Export Definition
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')) DEFAULT 'pending',
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),

  -- File Information
  file_path TEXT,                              -- Supabase Storage Path: exports/{user_id}/{export_id}.{ext}
  file_size_bytes INTEGER,
  file_name TEXT NOT NULL,                     -- manyleads_{type}_YYYY-MM-DD_HH-mm.{ext}

  -- Export Details
  row_count INTEGER,
  processed_rows INTEGER DEFAULT 0,
  column_selection JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ['name', 'company', 'email', ...]
  filters_applied JSONB,                       -- { tags: [], stages: [], dateFrom: '' }

  -- Source Tracking
  template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
  source_type TEXT,                            -- 'contacts', 'deals', 'search_results'
  source_query TEXT,                           -- Fuer Leads: Original-Suchquery
  source_collection_id UUID,                   -- Fuer Sammlungs-Export

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,             -- Auto-delete nach 7/30/90 Tagen
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for export_logs
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_status ON export_logs(status);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_status ON export_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires_at ON export_logs(expires_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_export_logs_template ON export_logs(template_id);

-- RLS Policies for export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own exports"
  ON export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own exports"
  ON export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own exports"
  ON export_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own exports"
  ON export_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. EXPORT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Template Definition
  name TEXT NOT NULL,
  description TEXT,
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),

  -- Configuration
  column_selection JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Welche Spalten exportieren
  default_filters JSONB,                       -- { stages: [], tags: [], hasEmail: true }
  format_options JSONB,                        -- { includeSummary: true, includeInteractions: false }

  -- Team-Sharing (Enterprise)
  is_public BOOLEAN DEFAULT FALSE,
  organization_id UUID,

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for export_templates
CREATE INDEX IF NOT EXISTS idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_export_templates_is_public ON export_templates(is_public, organization_id) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_export_templates_usage ON export_templates(user_id, usage_count DESC);

-- RLS Policies for export_templates
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates and public templates"
  ON export_templates FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = TRUE
    OR (
      is_public = TRUE
      AND organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can only manage their own templates"
  ON export_templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 3. SCHEDULED EXPORTS TABLE (Enterprise)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id UUID REFERENCES export_templates(id) ON DELETE CASCADE NOT NULL,

  -- Configuration
  name TEXT NOT NULL,                          -- z.B. "Wochentliche Kontakte"
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, fuer weekly
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- Fuer monthly
  time_of_day TIME NOT NULL,                   -- z.B. '08:00'
  timezone TEXT DEFAULT 'Europe/Berlin',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Run Tracking
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_export_id UUID REFERENCES export_logs(id),
  last_error_message TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,

  -- E-Mail Delivery
  email_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ['user@example.com', ...]
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('attachment', 'link')) DEFAULT 'link',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scheduled_exports
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user_id ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_active ON scheduled_exports(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = TRUE;

-- RLS Policies for scheduled_exports
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own scheduled exports"
  ON scheduled_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own scheduled exports"
  ON scheduled_exports FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 4. DATABASE FUNCTIONS
-- ============================================

-- Auto-cleanup fuer abgelaufene Exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_expired_count INTEGER;
BEGIN
  -- Mark expired exports
  UPDATE export_logs
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND status != 'expired';

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Delete very old expired exports (after 30 days)
  DELETE FROM export_logs
  WHERE status = 'expired'
    AND expires_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleanup complete: % expired, % deleted', v_expired_count, v_deleted_count;
END;
$$;

-- Calculate next run for scheduled export
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_time_of_day TIME,
  p_timezone TEXT DEFAULT 'Europe/Berlin'
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_next TIMESTAMPTZ;
  v_current_date DATE;
BEGIN
  v_now := NOW() AT TIME ZONE p_timezone;
  v_current_date := CURRENT_DATE;

  IF p_frequency = 'daily' THEN
    v_next := (v_current_date + p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '1 day';
    END IF;

  ELSIF p_frequency = 'weekly' THEN
    -- Berechne naechsten Wochentag
    v_next := (v_current_date +
      (p_day_of_week - EXTRACT(DOW FROM v_current_date)::INTEGER + 7) % 7 +
      p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '7 days';
    END IF;

  ELSIF p_frequency = 'monthly' THEN
    -- Berechne naechsten Monatstag
    v_next := (DATE_TRUNC('month', v_current_date) +
      (p_day_of_month - 1) +
      p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '1 month';
    END IF;
  END IF;

  RETURN v_next;
END;
$$;

-- Update next_run for all active scheduled exports
CREATE OR REPLACE FUNCTION update_scheduled_export_next_runs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE scheduled_exports
  SET next_run_at = calculate_next_run(
    frequency,
    day_of_week,
    day_of_month,
    time_of_day,
    timezone
  )
  WHERE is_active = TRUE;
END;
$$;

-- Create export job function
CREATE OR REPLACE FUNCTION create_export_job(
  p_user_id UUID,
  p_export_type TEXT,
  p_format TEXT,
  p_file_name TEXT,
  p_column_selection JSONB,
  p_filters_applied JSONB DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_source_query TEXT DEFAULT NULL,
  p_row_count INTEGER DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_export_id UUID;
  v_default_expires TIMESTAMPTZ;
BEGIN
  -- Default expiration: 30 days for pro, 90 for enterprise
  -- This will be overridden by the application based on plan
  IF p_expires_at IS NULL THEN
    v_default_expires := NOW() + INTERVAL '30 days';
  ELSE
    v_default_expires := p_expires_at;
  END IF;

  INSERT INTO export_logs (
    user_id,
    export_type,
    status,
    format,
    file_name,
    column_selection,
    filters_applied,
    template_id,
    source_type,
    source_query,
    row_count,
    expires_at
  ) VALUES (
    p_user_id,
    p_export_type,
    'pending',
    p_format,
    p_file_name,
    p_column_selection,
    p_filters_applied,
    p_template_id,
    p_source_type,
    p_source_query,
    p_row_count,
    v_default_expires
  )
  RETURNING id INTO v_export_id;

  RETURN v_export_id;
END;
$$;

-- Update export progress
CREATE OR REPLACE FUNCTION update_export_progress(
  p_export_id UUID,
  p_processed_rows INTEGER,
  p_status TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE export_logs
  SET
    processed_rows = p_processed_rows,
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_export_id;
END;
$$;

-- Complete export
CREATE OR REPLACE FUNCTION complete_export(
  p_export_id UUID,
  p_file_path TEXT,
  p_file_size_bytes INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE export_logs
  SET
    status = 'completed',
    file_path = p_file_path,
    file_size_bytes = p_file_size_bytes,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_export_id;
END;
$$;

-- Fail export
CREATE OR REPLACE FUNCTION fail_export(
  p_export_id UUID,
  p_error_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE export_logs
  SET
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_export_id;
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger: Auto-update next_run on INSERT/UPDATE of scheduled_exports
CREATE OR REPLACE FUNCTION trigger_update_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run_at := calculate_next_run(
    NEW.frequency,
    NEW.day_of_week,
    NEW.day_of_month,
    NEW.time_of_day,
    NEW.timezone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scheduled_export_next_run ON scheduled_exports;
CREATE TRIGGER trigger_scheduled_export_next_run
  BEFORE INSERT OR UPDATE ON scheduled_exports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_next_run();

-- Trigger: Increment template usage when export is created with template
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE export_templates
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_template_usage ON export_logs;
CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON export_logs
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION increment_template_usage();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_export_logs_updated_at ON export_logs;
CREATE TRIGGER trigger_export_logs_updated_at
  BEFORE UPDATE ON export_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_export_templates_updated_at ON export_templates;
CREATE TRIGGER trigger_export_templates_updated_at
  BEFORE UPDATE ON export_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_scheduled_exports_updated_at ON scheduled_exports;
CREATE TRIGGER trigger_scheduled_exports_updated_at
  BEFORE UPDATE ON scheduled_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CRON JOBS
-- ============================================

-- Schedule cleanup job (runs daily at 3 AM)
SELECT cron.schedule(
  'cleanup-export-logs',
  '0 3 * * *',
  'SELECT cleanup_expired_exports()'
);

-- ============================================
-- 7. STORAGE BUCKET SETUP
-- ============================================

-- Note: Storage bucket 'exports' needs to be created via Supabase Dashboard or CLI
-- The bucket should be PRIVATE with RLS policies

-- Storage Policy (to be applied via Supabase Dashboard):
-- CREATE POLICY "Users can only access their own exports"
--   ON storage.objects FOR ALL
--   USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
