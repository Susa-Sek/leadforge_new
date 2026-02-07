# E4 Lead Search - Technical Architecture Document

## Overview

Dieses Dokument beschreibt die vollstaendige Architektur fuer die E4 Phase (PROJ-12 bis PROJ-15) der Manyleads.io Plattform. Es deckt die Lead-Suche, Apify-Integration, Fortschrittsanzeige und Fallback-Strategien ab.

**Status:** Architektur Review Bereit
**Zuletzt aktualisiert:** 2026-02-07
**Verantwortlich:** Solution Architect

---

## Inhaltsverzeichnis

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema Extensions](#2-database-schema-extensions)
3. [API Contract Specification](#3-api-contract-specification)
4. [Apify Integration Flow](#4-apify-integration-flow)
5. [Real-Time Update Strategy](#5-real-time-update-strategy)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Fallback Chain Design](#7-fallback-chain-design)
8. [Component Structure (Frontend)](#8-component-structure-frontend)
9. [Environment Variables](#9-environment-variables)
10. [Security Considerations](#10-security-considerations)

---

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Search Form    │  │  Progress UI    │  │  Results Table  │                   │
│  │  (/dashboard/   │  │  (Real-time)    │  │  (Sammlungen)   │                   │
│  │   suche)        │  │                 │  │                 │                   │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘                   │
└───────────┼─────────────────────────────────────────────────────────────────────┘
            │ POST /api/search/start
            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────┐  │
│  │  POST /api/search/start │  │ POST /api/webhooks/apify│  │GET /api/search/ │  │
│  │  - Validation           │  │ - Receive results       │  │    status       │  │
│  │  - Credit check         │  │ - Process dataset       │  │ - Poll progress │  │
│  │  - Start Apify Actor    │  │ - Enrichment Stage 2    │  │ - Fallback poll │  │
│  │  - Create DB entry      │  │ - Save results          │  │                 │  │
│  └───────────┬─────────────┘  └───────────┬─────────────┘  └─────────────────┘  │
└──────────────┼─────────────────────────────┼────────────────────────────────────┘
               │                             │
               │ POST                        │ Webhook callback
               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APIFY PLATFORM                                      │
│  ┌─────────────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │ Stage 1: Google Maps Crawler        │    │ Stage 2: Contact Enrichment     │  │
│  │ compass/crawler-google-places       │───▶│ vdrmota/contact-info-scraper    │  │
│  │                                     │    │                                 │  │
│  │ Input: searchStringsArray           │    │ Input: Website URLs             │  │
│  │        locationQuery                │    │ Output: Emails, Contacts,       │  │
│  │        maxCrawledPlacesPerSearch    │    │         Social Links            │  │
│  │                                     │    │                                 │  │
│  │ Output: Business List               │    │ (Nur fuer Professional+)        │  │
│  └─────────────────────────────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
               │                             │
               │                             │
               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE DATABASE                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│  │ search_history   │  │ search_results   │  │ credit_transactions│              │
│  │ - search params  │  │ - apify_run_id   │  │ - Credit audit    │               │
│  │ - status         │  │ - dataset_id     │  │   trail           │               │
│  │ - credits_used   │  │ - results (JSONB)│  │                   │               │
│  │ - progress_steps │  │ - stage (1/2)    │  │                   │               │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Extensions

### 2.1 New Tables

#### search_history Table

Speichert alle Suchanfragen eines Users mit Status-Tracking.

```sql
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Suchparameter
    search_query TEXT NOT NULL,                    -- z.B. "Steuerberater"
    location_query TEXT,                           -- z.B. "Buxtehude"
    max_results INTEGER DEFAULT 50,                -- User-Limit (10-500)
    include_decision_makers BOOLEAN DEFAULT false, -- Premium-Feature

    -- Status-Tracking
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'validating', 'searching', 'extracting', 'enriching', 'deduplicating', 'completed', 'failed', 'cancelled')),

    -- Fortschritt (0-100)
    progress_percent INTEGER DEFAULT 0
        CHECK (progress_percent >= 0 AND progress_percent <= 100),

    -- Apify Integration
    apify_run_id TEXT,                             -- Stage 1 Run ID
    apify_dataset_id TEXT,                         -- Stage 1 Dataset ID
    apify_enrichment_run_id TEXT,                  -- Stage 2 Run ID (optional)
    apify_enrichment_dataset_id TEXT,              -- Stage 2 Dataset ID (optional)

    -- Ergebnisse
    leads_found INTEGER DEFAULT 0,                 -- Anzahl gefundener Leads
    leads_after_deduplication INTEGER,             -- Nach Duplikat-Entfernung
    results_json JSONB,                            -- Rohergebnisse (fuer schnellen Zugriff)

    -- Credits
    credits_cost INTEGER NOT NULL,                 -- Berechnete Kosten
    credits_deducted_at TIMESTAMPTZ,               -- Wann Credits abgezogen

    -- Caching
    cache_hash TEXT,                               -- Hash fuer Suchparameter (24h Cache)
    cached_result_id UUID,                         -- Referenz auf gecachtes Ergebnis

    -- Performance-Tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Kosten-Monitoring
    apify_cost_usd DECIMAL(10, 4),                 -- Tatsaechliche Apify-Kosten
    cost_per_lead DECIMAL(10, 4),                  -- Berechneter Preis pro Lead

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes fuer Performance
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_status ON public.search_history(status);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX idx_search_history_cache_hash ON public.search_history(cache_hash);

-- Trigger fuer updated_at
CREATE TRIGGER update_search_history_updated_at
    BEFORE UPDATE ON public.search_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### search_results Table

Speichert die detaillierten Lead-Daten einer Suche (normalisiert).

```sql
CREATE TABLE IF NOT EXISTS public.search_results (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    search_history_id UUID REFERENCES public.search_history(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Unternehmensdaten (Stage 1)
    company_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    email TEXT,                                    -- Aus Stage 2 Anreicherung

    -- Google Maps Daten
    google_maps_url TEXT,
    place_id TEXT,
    rating DECIMAL(3, 2),
    reviews_count INTEGER,
    category TEXT,

    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Kontaktdaten (Stage 2 - Premium)
    contact_person TEXT,
    phone_from_website TEXT,

    -- Social Media Links (Stage 2 - Premium)
    facebook_url TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    tiktok_url TEXT,

    -- Oeffnungszeiten (JSONB)
    opening_hours JSONB,

    -- Bilder
    image_url TEXT,

    -- Metadaten
    source_actor TEXT DEFAULT 'compass/crawler-google-places',
    enriched BOOLEAN DEFAULT false,
    enrichment_source TEXT,                        -- z.B. 'vdrmota/contact-info-scraper'

    -- Duplikat-Handling
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

-- GIN Index fuer JSONB opening_hours
CREATE INDEX idx_search_results_opening_hours ON public.search_results USING GIN (opening_hours);
```

### 2.2 RLS Policies

```sql
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
```

### 2.3 Database Functions

```sql
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_search_cost(INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cached_search(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_search_progress(UUID, TEXT, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_search(UUID, INTEGER, INTEGER, JSONB, DECIMAL) TO authenticated;
```

---

## 3. API Contract Specification

### 3.1 POST /api/search/start

Initiiert eine neue Lead-Suche.

#### Request

```typescript
interface StartSearchRequest {
  searchQuery: string;           // Branche/Suchbegriff (required)
  locationQuery: string;         // Standort (optional)
  maxResults: number;            // 10-500 (default: 50)
  includeDecisionMakers: boolean; // Premium-Feature (default: false)
  forceNewSearch: boolean;       // Cache umgehen (default: false)
}

// Example
{
  "searchQuery": "Steuerberater",
  "locationQuery": "Buxtehude",
  "maxResults": 50,
  "includeDecisionMakers": false,
  "forceNewSearch": false
}
```

#### Response (Success - 200)

```typescript
interface StartSearchResponse {
  success: true;
  searchId: string;              // UUID der Suchanfrage
  status: 'pending' | 'processing' | 'cached';
  creditsCost: number;           // Berechnete Kosten
  creditsRemaining: number;      // Verbleibende Credits nach Abzug
  cachedResultId?: string;       // Falls gecachte Ergebnisse vorhanden
  message?: string;              // z.B. "Ergebnisse aus Cache geladen"
}

// Example
{
  "success": true,
  "searchId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "creditsCost": 5,
  "creditsRemaining": 245
}
```

#### Response (Cached - 200)

```typescript
{
  "success": true,
  "searchId": "cached-id",
  "status": "cached",
  "creditsCost": 0,
  "creditsRemaining": 250,
  "cachedResultId": "550e8400-e29b-41d4-a716-446655440001",
  "message": "Gecachte Ergebnisse aus den letzten 24 Stunden gefunden"
}
```

#### Response (Error - 400/402/429)

```typescript
interface StartSearchError {
  success: false;
  error: string;
  code: 'INSUFFICIENT_CREDITS' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'PLAN_LIMIT';
  details?: {
    required?: number;
    available?: number;
    field?: string;
    message?: string;
  };
}

// Example: Insufficient Credits
{
  "success": false,
  "error": "Nicht genug Credits fuer diese Suche",
  "code": "INSUFFICIENT_CREDITS",
  "details": {
    "required": 5,
    "available": 2,
    "message": "Kaufen Sie weitere Credits oder upgraden Sie Ihren Plan"
  }
}
```

### 3.2 GET /api/search/status

Polling-Endpunkt fuer Such-Status (Fallback wenn Webhook fehlschlaegt).

#### Request

```
GET /api/search/status?searchId=550e8400-e29b-41d4-a716-446655440000
```

#### Response (Success - 200)

```typescript
interface SearchStatusResponse {
  searchId: string;
  status: 'pending' | 'validating' | 'searching' | 'extracting' | 'enriching' | 'deduplicating' | 'completed' | 'failed';
  progress: {
    percent: number;             // 0-100
    currentStep: number;         // 1-6
    totalSteps: 6;
    stepName: string;            // Aktueller Schrittname
    leadsFound: number;          // Aktuelle Anzahl gefundener Leads
    leadsExpected: number;       // Erwartete Anzahl (maxResults)
  };
  results?: {
    leads: SearchResultLead[];
    totalCount: number;
    uniqueCount: number;         // Nach Duplikat-Entfernung
  };
  error?: {
    message: string;
    code: string;
    retryable: boolean;
  };
  timestamps: {
    started: string;
    updated: string;
    completed?: string;
  };
}

// Example: In Progress
{
  "searchId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "extracting",
  "progress": {
    "percent": 45,
    "currentStep": 4,
    "totalSteps": 6,
    "stepName": "Daten extrahieren",
    "leadsFound": 23,
    "leadsExpected": 50
  },
  "timestamps": {
    "started": "2026-02-07T14:30:00Z",
    "updated": "2026-02-07T14:30:15Z"
  }
}
```

### 3.3 POST /api/webhooks/apify

Empfaengt Webhook-Callbacks von Apify.

#### Request (From Apify)

```typescript
interface ApifyWebhookPayload {
  runId: string;                 // Apify Actor Run ID
  datasetId: string;             // Apify Dataset ID
  status: 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED';
  searchId: string;              // Unsere interne Search ID (via customData)
  actId?: string;                // Actor ID
  startedAt?: string;
  finishedAt?: string;
  stats?: {
    inputBodyLen: number;
    outputBodyLen: number;
  };
}

// Example
{
  "runId": "abc123-def456",
  "datasetId": "xyz789",
  "status": "SUCCEEDED",
  "searchId": "550e8400-e29b-41d4-a716-446655440000",
  "actId": "compass/crawler-google-places",
  "startedAt": "2026-02-07T14:30:00Z",
  "finishedAt": "2026-02-07T14:32:00Z"
}
```

#### Response (Success - 200)

```typescript
{
  "success": true,
  "message": "Webhook processed successfully",
  "processed": {
    "leads": 50,
    "stage": "stage1_completed"
  }
}
```

#### Security

Der Webhook muss validiert werden durch:
1. Pruefung der `searchId` gegen unsere Datenbank
2. IP-Whitelisting (Apify IPs)
3. Optional: Secret Token im Header `X-Apify-Webhook-Secret`

### 3.4 GET /api/search/results

Holt die vollstaendigen Suchergebnisse.

#### Request

```
GET /api/search/results?searchId=550e8400-e29b-41d4-a716-446655440000&page=1&limit=50
```

#### Response

```typescript
interface SearchResultsResponse {
  searchId: string;
  status: 'completed';
  summary: {
    totalFound: number;
    afterDeduplication: number;
    withEmail: number;
    withPhone: number;
    withWebsite: number;
    averageRating: number;
  };
  leads: SearchResultLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface SearchResultLead {
  id: string;
  companyName: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl: string;
  rating?: number;
  reviewsCount?: number;
  category?: string;
  contactPerson?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
  openingHours?: Record<string, string>;
  imageUrl?: string;
}
```

---

## 4. Apify Integration Flow

### 4.1 Stage 1: Google Maps Crawler

**Actor:** `compass/crawler-google-places`

#### Input Schema

```typescript
interface Stage1Input {
  searchStringsArray: string[];     // ["Steuerberater"]
  locationQuery: string;            // "Buxtehude, Deutschland"
  maxCrawledPlacesPerSearch: number; // 50
  language: string;                 // "de"
  countryCode: string;              // "DE"
  skipClosedPlaces: boolean;        // false
  includeWebResults: boolean;       // false
}
```

#### Output Schema

```typescript
interface Stage1Output {
  title: string;                    // Firmenname
  address: string;                  // Vollstaendige Adresse
  phone?: string;                   // Telefonnummer
  website?: string;                 // Website-URL
  totalScore?: number;              // Bewertung (1-5)
  reviewsCount?: number;            // Anzahl Bewertungen
  categoryName?: string;            // Kategorie
  url: string;                      // Google Maps URL
  placeId: string;                  // Google Place ID
  location?: {
    lat: number;
    lng: number;
  };
  openingHours?: Array<{
    day: string;
    hours: string;
  }>;
  imageUrls?: string[];
}
```

### 4.2 Stage 2: Contact Enrichment (Optional)

**Actor:** `vdrmota/contact-info-scraper`

Nur fuer Professional+ Plaene. Wird automatisch nach Stage 1 gestartet.

#### Input Schema

```typescript
interface Stage2Input {
  urls: string[];                   // Website URLs aus Stage 1
  pageLimit: number;                // 3 (nur Impressum/About/Kontakt)
  includeSocialLinks: boolean;      // true
  includeContactInfo: boolean;      // true
}
```

#### Output Schema

```typescript
interface Stage2Output {
  url: string;                      // Gescrapte URL
  emails: string[];                 // Gefundene Email-Adressen
  phones: string[];                 // Telefonnummern von Website
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  contactName?: string;             // Aus Impressum geparst
}
```

### 4.3 Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SEARCH INITIATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

User klickt "Suche starten"
        │
        ▼
┌───────────────┐
│  Validation   │
│  - Pflichtfelder
│  - Credits?   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  Cache Check  │
│  (24h Window) │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Gecacht   Kein Cache
   │         │
   ▼         ▼
Return    Deduct
Cached    Credits
Results       │
              ▼
      ┌───────────────┐
      │ Create DB     │
      │ search_history│
      │ Status:pending│
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │ Start Apify   │
      │ Actor Stage 1 │
      │ compass/...   │
      └───────┬───────┘
              │
              ▼
      Return {searchId, status: "processing"}

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            WEBHOOK HANDLING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Apify Webhook POST /api/webhooks/apify
        │
        ▼
┌───────────────┐
│ Validate Sig  │
│ Check searchId│
└───────┬───────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│ Fetch Dataset │────▶│ Status FAILED?│
│ Items         │     └───────┬───────┘
└───────┬───────┘             │
        │                     ▼
        │               ┌───────────────┐
        │               │ Mark Failed   │
        │               │ Try Fallback  │
        │               └───────────────┘
        ▼
┌───────────────┐
│ Map + Save    │
│ to search_    │
│ results       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Decision Maker│
│ Enabled?      │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
  Ja        Nein
   │         │
   ▼         ▼
Start    Update
Stage 2   Status:
Actor    extracting
   │    → completed
   ▼
┌───────────────┐
│ Wait Stage 2  │
│ Webhook       │
└───────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FALLBACK ACTIVATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Primary Actor Failed
        │
        ▼
┌───────────────┐
│ compass/...   │
│ unavailable   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Fallback 1:   │
│ scraper-mind/ │
│ google-maps-  │
│ email-scraper │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Success?      │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
  Ja        Nein
   │         │
   ▼         ▼
Return   Fallback 2:
Results  Mock Data
         (Dev only)
```

---

## 5. Real-Time Update Strategy

### 5.1 Dual Strategy: Realtime + Polling

Fuer maximale Zuverlaessigkeit nutzen wir beide Ansaetze:

#### Option A: Supabase Realtime (Primaer)

```typescript
// Client-seitige Implementation
const channel = supabase
  .channel(`search-${searchId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'search_history',
      filter: `id=eq.${searchId}`,
    },
    (payload) => {
      const { status, progress_percent, leads_found } = payload.new;
      updateProgressUI({ status, progress: progress_percent, leadsFound: leads_found });
    }
  )
  .subscribe();
```

**Vorteile:**
- Sofortige Updates (typisch < 100ms)
- Weniger Server-Load als Polling
- Elegante Architektur

**Nachteile:**
- Verbindung kann abbrechen
- Browser-Tab im Hintergrund: Verbindung pausiert

#### Option B: Polling (Fallback)

```typescript
// Polling alle 5 Sekunden
const pollInterval = setInterval(async () => {
  const status = await fetchSearchStatus(searchId);
  updateProgressUI(status);

  if (status.status === 'completed' || status.status === 'failed') {
    clearInterval(pollInterval);
  }
}, 5000);

// Stop nach 5 Minuten Timeout
setTimeout(() => {
  clearInterval(pollInterval);
  handleTimeout();
}, 5 * 60 * 1000);
```

**Vorteile:**
- Funktioniert immer
- Einfacher zu debuggen
- Keine WebSocket-Probleme

**Nachteile:**
- Hoher Server-Load bei vielen Usern
- Verzoegerung bis zu 5 Sekunden

### 5.2 Hybrid-Implementation

```typescript
class SearchProgressTracker {
  private realtimeChannel: RealtimeChannel | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastUpdate: number = Date.now();

  startTracking(searchId: string) {
    // 1. Starte Realtime
    this.setupRealtime(searchId);

    // 2. Starte Polling als Backup (alle 10 Sekunden)
    this.pollInterval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - this.lastUpdate;

      // Nur pollen wenn Realtime > 15 Sekunden still
      if (timeSinceLastUpdate > 15000) {
        this.pollStatus(searchId);
      }
    }, 10000);
  }

  private setupRealtime(searchId: string) {
    this.realtimeChannel = supabase
      .channel(`search-${searchId}`)
      .on('postgres_changes', { /* ... */ }, (payload) => {
        this.lastUpdate = Date.now();
        this.onProgressUpdate(payload.new);
      })
      .subscribe();
  }

  stopTracking() {
    this.realtimeChannel?.unsubscribe();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}
```

### 5.3 Progress Step Mapping

Die 6 Schritte der Fortschrittsanzeige werden auf Apify-Status und Datenbank-Updates gemappt:

| Schritt | UI-Name | DB-Status | Trigger | Progress |
|---------|---------|-----------|---------|----------|
| 1 | Validierung | `validating` | POST /api/search/start | 0-10% |
| 2 | Suche gestartet | `searching` | Apify Run Created | 10-20% |
| 3 | Daten extrahiert | `extracting` | Webhook: Stage 1 Complete | 20-60% |
| 4 | Kontakte angereichert | `enriching` | Webhook: Stage 2 Start | 60-80% |
| 5 | Duplikate entfernt | `deduplicating` | Daten-Mapping Complete | 80-95% |
| 6 | Ergebnisse bereit | `completed` | Daten in DB gespeichert | 100% |

### 5.4 Progress Bar Algorithm

```typescript
function calculateProgress(
  status: SearchStatus,
  leadsFound: number,
  maxResults: number,
  stage: 'stage1' | 'stage2' | 'complete'
): number {
  const baseProgress = {
    pending: 0,
    validating: 5,
    searching: 10,
    extracting: 20,
    enriching: 60,
    deduplicating: 80,
    completed: 100,
    failed: 100,
  }[status] || 0;

  // Dynamischer Fortschritt basierend auf gefundenen Leads
  if (status === 'extracting') {
    const extractionProgress = Math.min(
      40, // Max 40% innerhalb dieser Phase
      (leadsFound / maxResults) * 40
    );
    return baseProgress + extractionProgress;
  }

  return baseProgress;
}
```

---

## 6. Error Handling Strategy

### 6.1 Error Categories

| Kategorie | Beispiele | Reaktion | User-Feedback |
|-----------|-----------|----------|---------------|
| **Validation** | Fehlende Felder, Ungueltiger Standort | Sofortige Fehlermeldung | Inline-Validierung |
| **Credit** | Nicht genug Credits, Plan-Limit | Blockierung + Upsell | Dialog mit Upgrade-Link |
| **Apify** | Actor nicht verfuegbar, Timeout | Fallback-Kette | "Wir versuchen Alternative..." |
| **Network** | Connection Timeout, 5xx | Retry (max 3x) | "Verbindung wird wiederhergestellt..." |
| **Data** | 0 Ergebnisse, Duplikate | Hinweis | "Keine Ergebnisse - Tipps zur Suche" |

### 6.2 Apify-Specific Error Handling

```typescript
interface ApifyErrorHandler {
  // HTTP 404: Actor nicht verfuegbar
  handleActorUnavailable: () => Promise<{
    useFallback: boolean;
    fallbackActor: string;
  }>;

  // HTTP 429: Rate Limit
  handleRateLimit: (retryCount: number) => Promise<{
    retryAfter: number;
    shouldRetry: boolean;
  }>;

  // Status FAILED/TIMED_OUT
  handleRunFailure: (error: string) => Promise<{
    retryable: boolean;
    fallbackToMock: boolean;
  }>;

  // 0 Ergebnisse
  handleNoResults: () => {
    suggestBroaderSearch: boolean;
    message: string;
  };
}

// Implementation
class ApifyErrorHandlerImpl implements ApifyErrorHandler {
  async handleActorUnavailable() {
    // Log error
    console.error('Primary actor unavailable, activating fallback');

    return {
      useFallback: true,
      fallbackActor: process.env.APIFY_FALLBACK_ACTOR!,
    };
  }

  async handleRateLimit(retryCount: number) {
    const maxRetries = 2;

    if (retryCount >= maxRetries) {
      return { retryAfter: 0, shouldRetry: false };
    }

    // Exponential backoff: 1s, 2s
    return {
      retryAfter: Math.pow(2, retryCount) * 1000,
      shouldRetry: true,
    };
  }
}
```

### 6.3 Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,  // 1s
  maxDelay: 10000,     // 10s
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  context: string
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Log failure
      console.warn(`${context} failed (attempt ${attempt}/${config.maxAttempts}):`, error);

      // Don't retry if it's a validation error
      if (error instanceof ValidationError) {
        throw error;
      }

      if (attempt < config.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw new Error(`${context} failed after ${config.maxAttempts} attempts: ${lastError!.message}`);
}
```

### 6.4 User-Facing Error Messages

| Fehler | User-Message | Aktion |
|--------|--------------|--------|
| INSUFFICIENT_CREDITS | "Nicht genug Credits fuer diese Suche. Benoetigt: {required}, Verfuegbar: {available}." | Link zu /dashboard/preise |
| VALIDATION_ERROR | "Bitte fuellen Sie alle Pflichtfelder aus." | Focus auf erstes fehlerhaftes Feld |
| APIFY_UNAVAILABLE | "Unser Scraping-Service ist voruebergehend nicht verfuegbar. Wir versuchen eine Alternative." | Auto-Fallback anzeigen |
| TIMEOUT | "Die Suche dauert laenger als erwartet. Bitte haben Sie einen Moment Geduld." | Fortfahren mit Polling |
| NO_RESULTS | "Keine Ergebnisse fuer diese Suche gefunden. Versuchen Sie es mit einem breiteren Suchbegriff oder groeßerem Standort." | Tipps anzeigen |
| RATE_LIMIT | "Zu viele Suchanfragen. Bitte warten Sie einen Moment." | Countdown anzeigen |

---

## 7. Fallback Chain Design

### 7.1 Fallback Chain Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        FALLBACK CHAIN ARCHITECTURE                           │
└──────────────────────────────────────────────────────────────────────────────┘

Level 1: Primary (compass/crawler-google-places)
         │
         ├── Success → Continue to Stage 2 (optional)
         │
         └── Failure → Activate Level 2
                       │
                       ▼
Level 2: Fallback 1 (scraper-mind/google-maps-email-scraper-unlimited)
         │
         ├── Success → Skip Stage 2 (all-in-one)
         │
         └── Failure → Activate Level 3
                       │
                       ▼
Level 3: Fallback 2 (Mock Data - DEV only)
         │
         └── Success → Return mock results
                       (mit Hinweis "Demo-Modus")
```

### 7.2 Activation Conditions

| Level | Trigger | Implementation |
|-------|---------|----------------|
| Primary | Default | `APIFY_PRIMARY_ACTOR` |
| Fallback 1 | HTTP 404, 5xx, Timeout | `APIFY_FALLBACK_ACTOR` |
| Fallback 2 | Both failed, `NODE_ENV=development` | Mock Data Generator |

### 7.3 Mock Data Generator (Development)

```typescript
// src/lib/search/mock-data-generator.ts

interface MockLead {
  name: string;
  address: string;
  phone: string;
  website?: string;
  email?: string;
  rating: number;
  reviewsCount: number;
  category: string;
}

class MockDataGenerator {
  private germanCities = ['Hamburg', 'Berlin', 'Muenchen', 'Koeln', 'Buxtehude', 'Stade'];
  private streetNames = ['Hauptstrasse', 'Bahnhofstrasse', 'Marktplatz', 'Industriestrasse'];

  generate(searchQuery: string, location: string, count: number): MockLead[] {
    const leads: MockLead[] = [];

    for (let i = 0; i < count; i++) {
      leads.push({
        name: `${searchQuery} ${this.getRandomSuffix()}`,
        address: `${this.getRandomStreet()} ${Math.floor(Math.random() * 100) + 1}, ${location}`,
        phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90000000) + 10000000}`,
        website: Math.random() > 0.3 ? `https://www.${searchQuery.toLowerCase().replace(/\s/g, '-')}-${i}.de` : undefined,
        email: Math.random() > 0.5 ? `info@${searchQuery.toLowerCase().replace(/\s/g, '-')}-${i}.de` : undefined,
        rating: Number((Math.random() * 2 + 3).toFixed(1)),
        reviewsCount: Math.floor(Math.random() * 200),
        category: searchQuery,
      });
    }

    // Kuenstliche Verzoegerung fuer realistisches Verhalten
    return leads;
  }

  private getRandomSuffix(): string {
    const suffixes = ['GmbH', 'OHG', 'e.K.', 'AG', '& Co. KG', 'Service', 'Beratung'];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  private getRandomStreet(): string {
    return this.streetNames[Math.floor(Math.random() * this.streetNames.length)];
  }
}

// Usage
export async function generateMockSearchResults(
  searchQuery: string,
  location: string,
  count: number
): Promise<SearchResult[]> {
  const generator = new MockDataGenerator();
  const leads = generator.generate(searchQuery, location, count);

  // Kuenstliche Verzoegerung (2-4 Sekunden)
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  return leads.map(lead => ({
    ...lead,
    id: crypto.randomUUID(),
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(lead.address)}`,
    placeId: `mock_${Math.random().toString(36).substr(2, 9)}`,
    source: 'mock',
  }));
}
```

### 7.4 Outscraper API (Alternative Option)

Falls beide Apify Actors ausfallen, kann Outscraper als externe Alternative dienen:

```typescript
// src/lib/search/outscraper-client.ts

interface OutscraperConfig {
  apiKey: string;
  baseUrl: 'https://api.outscraper.com/v2';
}

class OutscraperClient {
  constructor(private config: OutscraperConfig) {}

  async searchGoogleMaps(
    query: string,
    location: string,
    limit: number
  ): Promise<OutscraperResult[]> {
    const response = await fetch(
      `${this.config.baseUrl}/search?` +
      `query=${encodeURIComponent(`${query} in ${location}`)}` +
      `&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': this.config.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outscraper API error: ${response.status}`);
    }

    return await response.json();
  }
}
```

**Hinweis:** Outscraper ist als dritte Option dokumentiert, aber nicht in der automatischen Fallback-Kette. Kann manuell aktiviert werden.

---

## 8. Component Structure (Frontend)

### 8.1 Component Hierarchy

```
src/app/dashboard/suche/
├── page.tsx                    # Hauptseite
├── layout.tsx                  # (optional) Suche-spezifisches Layout
└── components/
    ├── search-form.tsx         # Suchformular (PROJ-12)
    ├── search-progress.tsx     # Fortschrittsanzeige (PROJ-14)
    ├── search-results.tsx      # Ergebnis-Tabelle (Basis)
    ├── progress-steps.tsx      # 6-Schritt Visualisierung
    ├── credit-preview.tsx      # Credit-Kosten-Vorschau
    └── search-validation.tsx   # Formular-Validierung

src/components/search/
├── active-search-banner.tsx    # Globaler Banner fuer laufende Suchen
├── search-provider.tsx         # React Context fuer Search-State
├── use-search.ts               # Hook fuer Search-Operationen
├── use-search-progress.ts      # Hook fuer Progress-Tracking
└── search-utils.ts             # Hilfsfunktionen

src/lib/search/
├── apify-client.ts             # Apify API Client
├── search-service.ts           # High-level Search Service
├── mock-data-generator.ts      # Mock Data fuer DEV
├── outscraper-client.ts        # Outscraper Integration (optional)
└── types.ts                    # TypeScript Interfaces
```

### 8.2 Key Components Specification

#### SearchForm Component

```typescript
interface SearchFormProps {
  onSearchStart: (params: SearchParams) => Promise<void>;
  userCredits: number;
  userPlan: 'free' | 'starter' | 'professional' | 'enterprise';
  planLimits: {
    maxResults: number;
    includeDecisionMakers: boolean;
  };
}

// Features:
// - Branche Dropdown (mit Autocomplete)
// - Standort Input (mit Geo-Suggestion)
// - Max Ergebnisse Slider (10-500, plan-limited)
// - Credit Preview (live Berechnung)
// - Validierung (mindestens ein Feld)
// - Submit Button (disabled bei ungueltig/keine Credits)
```

#### SearchProgress Component

```typescript
interface SearchProgressProps {
  searchId: string;
  steps: SearchStep[];
  currentStep: number;
  progress: number;           // 0-100
  leadsFound: number;
  leadsExpected: number;
  status: SearchStatus;
  onCancel?: () => void;
  estimatedTimeRemaining?: number; // Sekunden
}

// Features:
// - 6 Schritte mit Icons
// - Fortschrittsbalken (animiert)
// - "X von Y Leads gefunden"
// - ETA-Anzeige
// - Abbrechen-Button (optional)
// - Auto-Redirect zu Ergebnissen bei Completion
```

#### ActiveSearchBanner Component

```typescript
interface ActiveSearchBannerProps {
  searchId: string;
  progress: number;
  currentStep: string;
  onClick: () => void;        // Navigiert zu /dashboard/suche
}

// Features:
// - Fixed Position (top oder bottom)
// - Mini-Progress-Bar
// - Aktueller Schritt-Name
// - Click zum Oeffnen der Suchseite
// - Wird auf allen Dashboard-Seiten angezeigt
```

### 8.3 React Hooks

#### useSearch Hook

```typescript
interface UseSearchReturn {
  // State
  searchId: string | null;
  status: SearchStatus;
  progress: SearchProgress;
  results: SearchResult[] | null;
  error: SearchError | null;

  // Actions
  startSearch: (params: SearchParams) => Promise<void>;
  cancelSearch: () => Promise<void>;
  reset: () => void;

  // Meta
  isLoading: boolean;
  canCancel: boolean;
}

function useSearch(): UseSearchReturn {
  // Implementation:
  // - POST /api/search/start
  // - Realtime/Polling fuer Progress
  // - GET /api/search/results bei Completion
  // - Error Handling
  // - localStorage persistence fuer Recovery
}
```

#### useSearchProgress Hook

```typescript
interface UseSearchProgressReturn {
  progress: number;
  currentStep: number;
  stepName: string;
  leadsFound: number;
  isComplete: boolean;
  isFailed: boolean;
}

function useSearchProgress(searchId: string): UseSearchProgressReturn {
  // Implementation:
  // - Supabase Realtime Subscription
  // - Polling Fallback
  // - Step-Mapping
}
```

---

## 9. Environment Variables

### 9.1 Required for E4 Phase

```bash
# ============================================
# APIFY CONFIGURATION (Required)
# ============================================
# Von https://console.apify.com/account#/integrations
APIFY_API_TOKEN=apify_api_xxxxx

# Webhook Secret fuer Signatur-Validierung (optional)
APIFY_WEBHOOK_SECRET=whsec_xxxxx

# Actor Konfiguration
APIFY_PRIMARY_ACTOR=compass/crawler-google-places
APIFY_FALLBACK_ACTOR=scraper-mind/google-maps-email-scraper-unlimited
APIFY_ENRICHMENT_ACTOR=vdrmota/contact-info-scraper

# ============================================
# FEATURE FLAGS (Optional)
# ============================================
# Mock-Daten fuer Entwicklung
ENABLE_MOCK_DATA=false

# Outscraper als zusaetzliche Option (optional)
OUTSCRAPER_API_KEY=os_xxxxx

# ============================================
# SEARCH CONFIGURATION
# ============================================
# Default Limits
DEFAULT_MAX_RESULTS=50
MAX_SEARCH_TIMEOUT_MINUTES=5
CACHE_DURATION_HOURS=24

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
```

### 9.2 Variable Documentation

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APIFY_API_TOKEN` | **Ja** | - | Apify API Token |
| `APIFY_WEBHOOK_SECRET` | Nein | - | Secret fuer Webhook-Validierung |
| `APIFY_PRIMARY_ACTOR` | Nein | compass/... | Primaerer Scraping Actor |
| `APIFY_FALLBACK_ACTOR` | Nein | scraper-mind/... | Fallback Actor |
| `APIFY_ENRICHMENT_ACTOR` | Nein | vdrmota/... | Stage 2 Enrichment |
| `ENABLE_MOCK_DATA` | Nein | false | Mock-Daten fuer DEV |
| `OUTSCRAPER_API_KEY` | Nein | - | Alternative API (optional) |
| `DEFAULT_MAX_RESULTS` | Nein | 50 | Standard-Limit fuer Suchen |
| `MAX_SEARCH_TIMEOUT` | Nein | 5 | Timeout in Minuten |
| `CACHE_DURATION_HOURS` | Nein | 24 | Cache-Gultigkeit |

---

## 10. Security Considerations

### 10.1 Input Validation

```typescript
// Zod Schema fuer Suchparameter
import { z } from 'zod';

const searchParamsSchema = z.object({
  searchQuery: z.string()
    .min(2, 'Suchbegriff muss mindestens 2 Zeichen haben')
    .max(100, 'Suchbegriff darf maximal 100 Zeichen haben')
    .regex(/^[a-zA-Z0-9\s\-\u00e4\u00f6\u00fc\u00df]+$/, 'Ungueltige Zeichen im Suchbegriff'),

  locationQuery: z.string()
    .max(100)
    .regex(/^[a-zA-Z0-9\s,\.\-\u00e4\u00f6\u00fc\u00df]*$/, 'Ungueltige Zeichen im Standort')
    .optional(),

  maxResults: z.number()
    .min(10)
    .max(500)
    .default(50),

  includeDecisionMakers: z.boolean().default(false),
});

type SearchParams = z.infer<typeof searchParamsSchema>;
```

### 10.2 Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private cache = new LRUCache<string, number[]>({
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
  });

  isAllowed(userId: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const requests = this.cache.get(userId) || [];

    // Filter requests within window
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= config.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.cache.set(userId, recentRequests);

    return true;
  }
}

// Usage in API Route
const rateLimiter = new RateLimiter();

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!rateLimiter.isAllowed(user.id, { windowMs: 60000, maxRequests: 10 })) {
    return Response.json(
      { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' },
      { status: 429 }
    );
  }

  // Continue with search...
}
```

### 10.3 Webhook Security

```typescript
// src/app/api/webhooks/apify/route.ts

import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

export async function POST(request: Request) {
  // 1. Verify signature
  const signature = request.headers.get('x-apify-webhook-signature');
  const secret = process.env.APIFY_WEBHOOK_SECRET;

  if (secret && signature) {
    const payload = await request.text();

    if (!verifyWebhookSignature(payload, signature, secret)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload after verification
    const data = JSON.parse(payload);
  }

  // 2. Validate searchId exists in our DB
  const { searchId } = data;
  const search = await getSearchById(searchId);

  if (!search) {
    return Response.json({ error: 'Search not found' }, { status: 404 });
  }

  // 3. Process webhook...
}
```

### 10.4 Credit Protection

- **Atomare Operationen:** Credits werden mit `SELECT FOR UPDATE` gesperrt
- **Idempotenz:** Webhook-Handler prueft ob Suche bereits abgeschlossen
- **Negative Credits:** DB-Constraint verhindert negative Credits
- **Audit Trail:** Alle Credit-Operationen werden in `credit_transactions` geloggt

---

## 11. Implementation Checklist

### 11.1 Backend Developer Tasks

- [ ] Database Migration erstellen (search_history, search_results)
- [ ] POST /api/search/start implementieren
- [ ] GET /api/search/status implementieren
- [ ] POST /api/webhooks/apify implementieren
- [ ] Apify Client Wrapper erstellen
- [ ] Fallback Chain implementieren
- [ ] Mock Data Generator erstellen
- [ ] Error Handling Middleware
- [ ] Rate Limiting implementieren
- [ ] Webhook Security (Signature)

### 11.2 Frontend Developer Tasks

- [ ] SearchForm Component (mit Validation)
- [ ] CreditPreview Component
- [ ] SearchProgress Component (6 Steps)
- [ ] ProgressSteps Component
- [ ] ActiveSearchBanner Component
- [ ] useSearch Hook
- [ ] useSearchProgress Hook
- [ ] SearchProvider Context
- [ ] Realtime Subscription Setup
- [ ] Polling Fallback
- [ ] Error State UI

### 11.3 Integration Tasks

- [ ] End-to-End Test: Search → Progress → Results
- [ ] Webhook Testing mit Apify
- [ ] Fallback Chain Testing
- [ ] Credit Deduction Testing
- [ ] Cache Testing
- [ ] Rate Limit Testing
- [ ] Security Testing

---

## 12. Appendix

### 12.1 Apify Actor Links

| Actor | URL | Kosten |
|-------|-----|--------|
| compass/crawler-google-places | https://apify.com/compass/crawler-google-places | $0.004/Lead |
| vdrmota/contact-info-scraper | https://apify.com/vdrmota/contact-info-scraper | $0.002/Seite |
| scraper-mind/google-maps-email-scraper | https://apify.com/scraper-mind/google-maps-email-scraper-unlimited | $0.004/Lead |

### 12.2 Database Migration File Name

**Empfohlener Dateiname:** `20250207_lead_search_system.sql`

### 12.3 Cost Calculation Examples

| Szenario | Leads | Stage 1 | Stage 2 | Gesamt |
|----------|-------|---------|---------|--------|
| Basic (50 Leads) | 50 | $0.20 | - | $0.20 |
| Enriched (50 Leads) | 50 | $0.20 | ~$0.10 | $0.30 |
| Basic (200 Leads) | 200 | $0.80 | - | $0.80 |
| Enriched (200 Leads) | 200 | $0.80 | ~$0.40 | $1.20 |

---

**Dokument Version:** 1.0
**Autor:** Solution Architect
**Review Status:** Pending User Approval
