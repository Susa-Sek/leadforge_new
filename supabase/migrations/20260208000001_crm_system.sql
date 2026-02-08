-- Epic E7: CRM-System Migration
-- Tables: contacts, contact_tags, contact_tag_assignments, interactions, deal_stages, deals

-- ============================================
-- 1. CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT CHECK (LENGTH(notes) <= 10000),
  source_collection_id UUID REFERENCES search_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can only view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- ============================================
-- 2. CONTACT TAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6' CHECK (color ~ '^#[A-Fa-f0-9]{6}$'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contact_tags
CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_name ON contact_tags(name);

-- Enable RLS
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_tags
CREATE POLICY "Users can only view their own tags"
  ON contact_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own tags"
  ON contact_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own tags"
  ON contact_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own tags"
  ON contact_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. CONTACT TAG ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

-- Indexes for contact_tag_assignments
CREATE INDEX IF NOT EXISTS idx_cta_contact_id ON contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_cta_tag_id ON contact_tag_assignments(tag_id);

-- Enable RLS
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_tag_assignments
-- Users can only access assignments for their own contacts and tags
CREATE POLICY "Users can view assignments for their contacts"
  ON contact_tag_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_tag_assignments.contact_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assignments for their contacts"
  ON contact_tag_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_tag_assignments.contact_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assignments for their contacts"
  ON contact_tag_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_tag_assignments.contact_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. INTERACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'task')),
  notes TEXT CHECK (LENGTH(notes) <= 5000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);

-- Enable RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interactions
CREATE POLICY "Users can view interactions for their contacts"
  ON interactions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = interactions.contact_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interactions for their contacts"
  ON interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = interactions.contact_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON interactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. DEAL STAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS deal_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system defaults
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6B7280' CHECK (color ~ '^#[A-Fa-f0-9]{6}$'),
  is_system BOOLEAN DEFAULT FALSE,
  is_won_stage BOOLEAN DEFAULT FALSE,
  is_lost_stage BOOLEAN DEFAULT FALSE,
  default_probability INTEGER CHECK (default_probability >= 0 AND default_probability <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deal_stages
CREATE INDEX IF NOT EXISTS idx_deal_stages_user_id ON deal_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_order ON deal_stages(order_index);

-- Enable RLS
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_stages
CREATE POLICY "Users can view system stages and their own stages"
  ON deal_stages FOR SELECT
  USING (
    is_system = TRUE OR
    user_id IS NULL OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own custom stages"
  ON deal_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can update their own custom stages"
  ON deal_stages FOR UPDATE
  USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete their own custom stages"
  ON deal_stages FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- Insert default system stages (German)
INSERT INTO deal_stages (name, order_index, color, is_system, is_won_stage, is_lost_stage, default_probability) VALUES
  ('Lead', 1, '#9CA3AF', TRUE, FALSE, FALSE, 10),
  ('Kontaktiert', 2, '#3B82F6', TRUE, FALSE, FALSE, 25),
  ('Qualifiziert', 3, '#F59E0B', TRUE, FALSE, FALSE, 50),
  ('Angebot', 4, '#F97316', TRUE, FALSE, FALSE, 75),
  ('Geschlossen (Gewonnen)', 5, '#10B981', TRUE, TRUE, FALSE, 100),
  ('Geschlossen (Verloren)', 6, '#EF4444', TRUE, FALSE, TRUE, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. DEALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES deal_stages(id) ON DELETE RESTRICT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(12,2) CHECK (value >= 0),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  is_won BOOLEAN, -- NULL = not closed, TRUE = won, FALSE = lost
  close_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Users can only view their own deals"
  ON deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own deals"
  ON deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own deals"
  ON deals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own deals"
  ON deals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deals_updated_at();

-- ============================================
-- 7. HELPER FUNCTIONS FOR PLAN LIMITS
-- ============================================

-- Function to count contacts for a user
CREATE OR REPLACE FUNCTION get_user_contact_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM contacts
  WHERE user_id = p_user_id;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to count deals for a user
CREATE OR REPLACE FUNCTION get_user_deal_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM deals
  WHERE user_id = p_user_id;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to count tags for a user
CREATE OR REPLACE FUNCTION get_user_tag_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM contact_tags
  WHERE user_id = p_user_id;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's subscription plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  plan_name TEXT;
BEGIN
  SELECT s.plan_name INTO plan_name
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(plan_name, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 8. CONSTRAINT TRIGGERS FOR PLAN LIMITS
-- ============================================

-- Function to check contact limit before insert
CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan TEXT;
  max_contacts INTEGER;
BEGIN
  -- Get current count (excluding the new one)
  SELECT get_user_contact_count(NEW.user_id) INTO current_count;

  -- Get user's plan
  SELECT get_user_plan(NEW.user_id) INTO user_plan;

  -- Set max based on plan
  max_contacts := CASE user_plan
    WHEN 'free' THEN 50
    WHEN 'pro' THEN 500
    WHEN 'enterprise' THEN 1000000 -- Effectively unlimited
    ELSE 50 -- Default to free limit
  END;

  -- Check if limit would be exceeded
  IF current_count >= max_contacts THEN
    RAISE EXCEPTION 'Kontakt-Limit erreicht (%/%). Upgrade zu Pro für mehr Kontakte.', current_count, max_contacts
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_contact_limit_trigger
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_limit();

-- Function to check deal limit before insert
CREATE OR REPLACE FUNCTION check_deal_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan TEXT;
  max_deals INTEGER;
BEGIN
  -- Get current count (excluding the new one)
  SELECT get_user_deal_count(NEW.user_id) INTO current_count;

  -- Get user's plan
  SELECT get_user_plan(NEW.user_id) INTO user_plan;

  -- Set max based on plan
  max_deals := CASE user_plan
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 100
    WHEN 'enterprise' THEN 1000000 -- Effectively unlimited
    ELSE 10 -- Default to free limit
  END;

  -- Check if limit would be exceeded
  IF current_count >= max_deals THEN
    RAISE EXCEPTION 'Deal-Limit erreicht (%/%). Upgrade zu Pro für mehr Deals.', current_count, max_deals
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_deal_limit_trigger
  BEFORE INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION check_deal_limit();

-- Function to check tag limit before insert
CREATE OR REPLACE FUNCTION check_tag_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan TEXT;
  max_tags INTEGER;
BEGIN
  -- Get current count (excluding the new one)
  SELECT get_user_tag_count(NEW.user_id) INTO current_count;

  -- Get user's plan
  SELECT get_user_plan(NEW.user_id) INTO user_plan;

  -- Set max based on plan
  max_tags := CASE user_plan
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 20
    WHEN 'enterprise' THEN 1000000 -- Effectively unlimited
    ELSE 5 -- Default to free limit
  END;

  -- Check if limit would be exceeded
  IF current_count >= max_tags THEN
    RAISE EXCEPTION 'Tag-Limit erreicht (%/%). Upgrade zu Pro für mehr Tags.', current_count, max_tags
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_tag_limit_trigger
  BEFORE INSERT ON contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION check_tag_limit();

-- ============================================
-- 9. STATISTICS HELPER FUNCTIONS
-- ============================================

-- Function to get pipeline statistics for a user
CREATE OR REPLACE FUNCTION get_pipeline_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_pipeline_value DECIMAL;
  weighted_pipeline_value DECIMAL;
  open_deals_count INTEGER;
  avg_probability DECIMAL;
  won_count INTEGER;
  lost_count INTEGER;
  win_rate DECIMAL;
  avg_deal_size DECIMAL;
  closed_this_month INTEGER;
BEGIN
  -- Total pipeline value (open deals only)
  SELECT COALESCE(SUM(value), 0)
  INTO total_pipeline_value
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_won_stage = FALSE
  AND ds.is_lost_stage = FALSE;

  -- Weighted pipeline value
  SELECT COALESCE(SUM(value * probability / 100), 0)
  INTO weighted_pipeline_value
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_won_stage = FALSE
  AND ds.is_lost_stage = FALSE;

  -- Open deals count
  SELECT COUNT(*)
  INTO open_deals_count
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_won_stage = FALSE
  AND ds.is_lost_stage = FALSE;

  -- Average probability
  SELECT COALESCE(AVG(probability), 0)
  INTO avg_probability
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_won_stage = FALSE
  AND ds.is_lost_stage = FALSE;

  -- Won count
  SELECT COUNT(*)
  INTO won_count
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_won_stage = TRUE;

  -- Lost count
  SELECT COUNT(*)
  INTO lost_count
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND ds.is_lost_stage = TRUE;

  -- Win rate
  IF (won_count + lost_count) > 0 THEN
    win_rate := (won_count::DECIMAL / (won_count + lost_count)::DECIMAL) * 100;
  ELSE
    win_rate := 0;
  END IF;

  -- Average deal size (all deals with value)
  SELECT COALESCE(AVG(value), 0)
  INTO avg_deal_size
  FROM deals
  WHERE user_id = p_user_id
  AND value IS NOT NULL;

  -- Closed this month
  SELECT COUNT(*)
  INTO closed_this_month
  FROM deals d
  JOIN deal_stages ds ON d.stage_id = ds.id
  WHERE d.user_id = p_user_id
  AND (ds.is_won_stage = TRUE OR ds.is_lost_stage = TRUE)
  AND d.actual_close_date >= DATE_TRUNC('month', NOW())
  AND d.actual_close_date < DATE_TRUNC('month', NOW() + INTERVAL '1 month');

  result := jsonb_build_object(
    'total_pipeline_value', total_pipeline_value,
    'weighted_pipeline_value', weighted_pipeline_value,
    'open_deals_count', open_deals_count,
    'average_probability', ROUND(avg_probability, 2),
    'won_count', won_count,
    'lost_count', lost_count,
    'win_rate', ROUND(win_rate, 2),
    'average_deal_size', ROUND(avg_deal_size, 2),
    'closed_this_month', closed_this_month
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_contact_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_deal_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tag_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pipeline_stats(UUID) TO authenticated;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE contacts IS 'CRM contacts belonging to users';
COMMENT ON TABLE contact_tags IS 'Tags for organizing contacts';
COMMENT ON TABLE contact_tag_assignments IS 'Many-to-many relationship between contacts and tags';
COMMENT ON TABLE interactions IS 'Interaction history for contacts';
COMMENT ON TABLE deal_stages IS 'Pipeline stages for deals (system defaults + custom)';
COMMENT ON TABLE deals IS 'Sales deals/opportunities';

COMMENT ON FUNCTION get_pipeline_stats(UUID) IS 'Returns JSON object with pipeline statistics for a user';
