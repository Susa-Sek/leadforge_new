-- Migration: Search System Backend (PROJ-12, PROJ-13)
-- Created: 2026-02-08
-- Description: Adds search_history and search_results tables for lead search functionality

-- ============================================
-- 1. SEARCH HISTORY TABLE
-- ============================================
-- Stores all search requests with status tracking and Apify integration

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Search parameters
    search_query TEXT NOT NULL,                    -- e.g. "Steuerberater"
    location_query TEXT,                           -- e.g. "Buxtehude"
    max_results INTEGER DEFAULT 50,                -- User limit (10-500)
    include_decision_makers BOOLEAN DEFAULT false, -- Premium feature

    -- Status tracking (6 steps: validating, searching, extracting, enriching, deduplicating, completed)
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'validating', 'searching', 'extracting', 'enriching', 'deduplicating', 'completed', 'failed', 'cancelled')),

    -- Progress (0-100)
    progress_percent INTEGER DEFAULT 0
        CHECK (progress_percent >= 0 AND progress_percent <= 100),

    -- Apify Integration
    apify_run_id TEXT,                             -- Stage 1 Run ID
    apify_dataset_id TEXT,                         -- Stage 1 Dataset ID
    apify_enrichment_run_id TEXT,                  -- Stage 2 Run ID (optional)
    apify_enrichment_dataset_id TEXT,              -- Stage 2 Dataset ID (optional)

    -- Results
    leads_found INTEGER DEFAULT 0,                 -- Number of leads found
    leads_after_deduplication INTEGER,             -- After duplicate removal
    results_json JSONB,                            -- Raw results (for quick access)

    -- Credits
    credits_cost INTEGER NOT NULL,                 -- Calculated cost
    credits_deducted_at TIMESTAMPTZ,               -- When credits were deducted

    -- Caching
    cache_hash TEXT,                               -- Hash for search parameters (24h cache)
    cached_result_id UUID,                         -- Reference to cached result

    -- Performance tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Cost monitoring
    apify_cost_usd DECIMAL(10, 4),                 -- Actual Apify costs
    cost_per_lead DECIMAL(10, 4),                  -- Calculated price per lead

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_status ON public.search_history(status);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX idx_search_history_cache_hash ON public.search_history(cache_hash);

-- ============================================
-- 2. SEARCH RESULTS TABLE
-- ============================================
-- Stores detailed lead data from searches (normalized)

CREATE TABLE IF NOT EXISTS public.search_results (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    search_history_id UUID REFERENCES public.search_history(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Business data (Stage 1)
    company_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    email TEXT,                                    -- From Stage 2 enrichment

    -- Google Maps data
    google_maps_url TEXT,
    place_id TEXT,
    rating DECIMAL(3, 2),
    reviews_count INTEGER,
    category TEXT,

    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact data (Stage 2 - Premium)
    contact_person TEXT,
    phone_from_website TEXT,

    -- Social media links (Stage 2 - Premium)
    facebook_url TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,

    -- Opening hours (JSONB)
    opening_hours JSONB,

    -- Images
    image_url TEXT,

    -- Metadata
    source_actor TEXT DEFAULT 'compass/crawler-google-places',
    enriched BOOLEAN DEFAULT false,
    enrichment_source TEXT,                        -- e.g. 'vdrmota/contact-info-scraper'

    -- Duplicate handling
    duplicate_of UUID REFERENCES public.search_results(id),
    is_duplicate BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_results_search_history_id ON public.search_results(search_history_id);
CREATE INDEX idx_search_results_user_id ON public.search_results(user_id);
CREATE INDEX idx_search_results_company_name ON public.search_results(company_name);
CREATE INDEX idx_search_results_place_id ON public.search_results(place_id);
CREATE INDEX idx_search_results_website ON public.search_results(website);

-- GIN Index for JSONB opening_hours
CREATE INDEX idx_search_results_opening_hours ON public.search_results USING GIN (opening_hours);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;

-- search_history: Users can only see their own searches
CREATE POLICY "Users can view their own search history"
    ON public.search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history"
    ON public.search_history FOR UPDATE
    USING (auth.uid() = user_id);

-- search_results: Users can only see results from their searches
CREATE POLICY "Users can view their own search results"
    ON public.search_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search results"
    ON public.search_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search results"
    ON public.search_results FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. DATABASE FUNCTIONS
-- ============================================

-- Function: Calculate search cost based on parameters
CREATE OR REPLACE FUNCTION public.calculate_search_cost(
    p_max_results INTEGER,
    p_include_decision_makers BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_cost INTEGER;
    v_enrichment_cost INTEGER;
BEGIN
    -- Base cost: 1 credit per 10 results, minimum 1
    v_base_cost := GREATEST(1, CEIL(p_max_results::DECIMAL / 10));

    -- Enrichment cost: +50% if decision makers requested
    IF p_include_decision_makers THEN
        v_enrichment_cost := CEIL(v_base_cost * 0.5);
    ELSE
        v_enrichment_cost := 0;
    END IF;

    RETURN v_base_cost + v_enrichment_cost;
END;
$$;

-- Function: Check for cached search results (24h window)
CREATE OR REPLACE FUNCTION public.check_cached_search(
    p_user_id UUID,
    p_search_query TEXT,
    p_location_query TEXT,
    p_max_results INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cache_hash TEXT;
    v_cached_id UUID;
BEGIN
    -- Generate hash from search parameters
    v_cache_hash := MD5(
        LOWER(TRIM(p_search_query)) || '|' ||
        COALESCE(LOWER(TRIM(p_location_query)), '') || '|' ||
        p_max_results::TEXT
    );

    -- Look for completed search within 24 hours
    SELECT id INTO v_cached_id
    FROM public.search_history
    WHERE cache_hash = v_cache_hash
      AND user_id = p_user_id
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN v_cached_id;
END;
$$;

-- Function: Update search progress atomically
CREATE OR REPLACE FUNCTION public.update_search_progress(
    p_search_id UUID,
    p_status TEXT,
    p_progress_percent INTEGER,
    p_leads_found INTEGER DEFAULT NULL,
    p_results_json JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.search_history
    SET
        status = p_status,
        progress_percent = p_progress_percent,
        leads_found = COALESCE(p_leads_found, leads_found),
        results_json = COALESCE(p_results_json, results_json),
        updated_at = NOW()
    WHERE id = p_search_id;

    RETURN FOUND;
END;
$$;

-- Function: Mark search as completed with results
CREATE OR REPLACE FUNCTION public.complete_search(
    p_search_id UUID,
    p_leads_found INTEGER,
    p_leads_after_deduplication INTEGER,
    p_results_json JSONB,
    p_apify_cost_usd DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.search_history
    SET
        status = 'completed',
        progress_percent = 100,
        leads_found = p_leads_found,
        leads_after_deduplication = p_leads_after_deduplication,
        results_json = p_results_json,
        completed_at = NOW(),
        apify_cost_usd = p_apify_cost_usd,
        cost_per_lead = CASE
            WHEN p_leads_after_deduplication > 0 THEN
                p_apify_cost_usd / p_leads_after_deduplication
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = p_search_id;

    RETURN FOUND;
END;
$$;

-- Function: Mark search as failed
CREATE OR REPLACE FUNCTION public.fail_search(
    p_search_id UUID,
    p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.search_history
    SET
        status = 'failed',
        failed_at = NOW(),
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_search_id;

    RETURN FOUND;
END;
$$;

-- ============================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for search_history
CREATE TRIGGER update_search_history_updated_at
    BEFORE UPDATE ON public.search_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for search_results
CREATE TRIGGER update_search_results_updated_at
    BEFORE UPDATE ON public.search_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.calculate_search_cost(INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cached_search(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_search_progress(UUID, TEXT, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_search(UUID, INTEGER, INTEGER, JSONB, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_search(UUID, TEXT) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.search_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_results TO authenticated;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.search_history IS 'Stores all search requests with status tracking and Apify integration';
COMMENT ON TABLE public.search_results IS 'Stores detailed lead data from searches (normalized)';
COMMENT ON FUNCTION public.calculate_search_cost IS 'Calculate search cost: 1 credit per 10 results + 50% for enrichment';
COMMENT ON FUNCTION public.check_cached_search IS 'Check for cached search results within 24h window';
COMMENT ON FUNCTION public.update_search_progress IS 'Atomically update search progress and status';
COMMENT ON FUNCTION public.complete_search IS 'Mark search as completed with final results';
COMMENT ON FUNCTION public.fail_search IS 'Mark search as failed with error message';
