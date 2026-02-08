# Epic E9: Export-System - High-Level Architecture

**Status:** ARCHITECTURE DESIGN COMPLETE
**Epic ID:** E9
**Projekt:** PROJ-25 (Export-Funktionen)
**Framework:** Next.js 16 + Supabase
**Zuletzt aktualisiert:** 2026-02-08

---

## 1. Executive Summary

### Epic Übersicht

Epic E9 implementiert ein umfassendes Export-System für Manyleads.io, das Nutzern ermöglicht, Kontakte, Deals und Suchergebnisse in verschiedenen Formaten zu exportieren. Das System unterstützt sowohl kleine, synchrone Exporte als auch große, asynchrone Exporte mit Background-Verarbeitung.

### Scope

**Kern-Features:**
- CSV Export von Kontakten, Deals und Suchergebnissen (Pro/Enterprise)
- Excel Export (.xlsx) mit Formatierung (Enterprise)
- Konfigurierbare Spaltenauswahl und Filter
- Export-Templates für wiederkehrende Exporte
- Scheduled/Automated Exports (Enterprise)
- Export-History mit Download-Management
- Plan-basiertes Feature-Gating

**Architektur-Ansatz:**
- **Synchrone Exporte** (< 1.000 Zeilen): Direkte Verarbeitung im API-Request
- **Asynchrone Exporte** (> 1.000 Zeilen): Queue-basierte Background-Verarbeitung
- **Storage:** Supabase Storage mit Signed URLs für sichere Downloads
- **Progress Tracking:** Polling-basiert für Async-Exporte
- **Plan-Gating:** Server-seitige Validierung + Client-seitige UI-Blockierung

### Abhängigkeiten

| Epic | Status | Benötigt für |
|------|--------|--------------|
| E7 (CRM-System) | IN PROGRESS | contacts, deals Tabellen |
| E6 (Sammlungen) | COMPLETED | search_results Tabelle |
| E3 (Credit-System) | COMPLETED | Plan-Tier Erkennung |
| E5 (Lead-Tabelle) | COMPLETED | Basis-Export existiert |

---

## 2. Component Structure

### 2.1 Frontend Components

```
src/components/export/
├── export-button.tsx           # Haupt-Export-Button mit Dropdown
├── export-dialog.tsx           # Export-Konfiguration Dialog
├── export-progress.tsx         # Fortschrittsanzeige für Async
├── column-selector.tsx         # Spalten-Auswahl Komponente
├── filter-preview.tsx          # Filter-Zusammenfassung
├── export-history-table.tsx    # History-Liste
├── export-template-manager.tsx # Template-Verwaltung
├── scheduled-export-form.tsx   # Formular für Scheduled Exports
├── scheduled-export-list.tsx   # Liste der Scheduled Exports
└── plan-gate-export.tsx        # Export-spezifische Plan-Gates
```

**Component Details:**

#### ExportButton
- **Location:** Toolbar in Kontakt-Liste, Deal-Pipeline, Lead-Results
- **Props:** `source: 'contacts' | 'deals' | 'leads'`, `planTier`, `rowCount`, `filters`
- **Features:** Dropdown mit CSV/Excel Optionen, Plan-Gating, Count-Badge
- **German Labels:** "Exportieren", "CSV Export", "Excel Export (.xlsx)"

#### ExportDialog
- **Content:** Template-Auswahl, Format-Auswahl, ColumnSelector, Filter-Preview
- **Actions:** "Als Template speichern", "Export starten", "Abbrechen"
- **Validation:** Max-Zeilen-Check, Spalten-Validierung
- **German Labels:** "Spalten auswählen", "Alle Spalten", "Geschätzte Dateigröße"

#### ExportProgress
- **States:** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **Visual:** Progress Bar (0-100%), Zeilen-Counter, ETA
- **Actions:** Abbrechen-Button (nur während PROCESSING)
- **German Labels:** "Export wird vorbereitet...", "Bereit zum Download"

#### ColumnSelector
- **Layout:** Two-Column Grid mit Checkboxes
- **Grouping:** Basis-Spalten / Pro-Spalten / Enterprise-Spalten
- **Features:** "Alle auswählen", "Standard zurücksetzen"
- **Plan-Gating:** Gesperrte Spalten mit Upgrade-Badge

### 2.2 React Hooks

```typescript
// src/hooks/use-export.ts
export function useExport() {
  // Startet Export (sync oder async)
  // Returns: { exportId, status, progress, downloadUrl, error }
}

// src/hooks/use-export-status.ts
export function useExportStatus(exportId: string) {
  // Polling für Async-Export Status
  // Auto-refresh alle 2 Sekunden während PROCESSING
}

// src/hooks/use-export-history.ts
export function useExportHistory(options?: { limit?: number; type?: string }) {
  // Lädt Export-History mit Pagination
}

// src/hooks/use-export-templates.ts
export function useExportTemplates() {
  // CRUD für Templates
  // Limit-Check: 3 für Pro, Unlimited für Enterprise
}

// src/hooks/use-scheduled-exports.ts
export function useScheduledExports() {
  // CRUD für Scheduled Exports (Enterprise only)
  // Next-Run Berechnung
}
```

### 2.3 Pages Integration

```
dashboard/
├── kontakte/
│   └── page.tsx              # Export-Button in Toolbar (Pro+)
├── deals/
│   └── page.tsx              # Export-Button in Toolbar (Pro+)
├── suche/
│   └── search-page-client.tsx # Bulk-Export Button (Enterprise)
├── exporte/
│   ├── page.tsx              # Export-History (Pro+)
│   └── templates/
│       └── page.tsx          # Template Manager (Pro+)
└── einstellungen/
    └── exporte/
        ├── page.tsx          # Redirect zu /dashboard/exporte
        └── scheduled/
            └── page.tsx      # Scheduled Exports (Enterprise)
```

---

## 3. Database Schema

### 3.1 export_logs Tabelle

```sql
-- Haupttabelle für alle Export-Aktionen
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Export-Definition
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),

  -- Datei-Information
  file_path TEXT,                              -- Supabase Storage Path: exports/{user_id}/{export_id}.{ext}
  file_size_bytes INTEGER,
  file_name TEXT NOT NULL,                     -- manyleads_{type}_YYYY-MM-DD_HH-mm.{ext}

  -- Export-Details
  row_count INTEGER,
  processed_rows INTEGER DEFAULT 0,
  column_selection JSONB NOT NULL,             -- ['name', 'company', 'email', ...]
  filters_applied JSONB,                       -- { tags: [], stages: [], dateFrom: '' }

  -- Quellen-Tracking
  template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
  source_type TEXT,                            -- 'contacts', 'deals', 'search_results'
  source_query TEXT,                           -- Für Leads: Original-Suchquery
  source_collection_id UUID,                   -- Für Sammlungs-Export

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

-- Indexes für Performance
CREATE INDEX idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX idx_export_logs_status ON export_logs(status);
CREATE INDEX idx_export_logs_user_status ON export_logs(user_id, status);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);
CREATE INDEX idx_export_logs_expires_at ON export_logs(expires_at) WHERE status = 'completed';
CREATE INDEX idx_export_logs_template ON export_logs(template_id);

-- RLS Policies
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
```

### 3.2 export_templates Tabelle

```sql
-- Templates für wiederkehrende Exporte
CREATE TABLE export_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Template-Definition
  name TEXT NOT NULL,
  description TEXT,
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),

  -- Konfiguration
  column_selection JSONB NOT NULL,             -- Welche Spalten exportieren
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

-- Indexes
CREATE INDEX idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX idx_export_templates_is_public ON export_templates(is_public, organization_id) WHERE is_public = TRUE;
CREATE INDEX idx_export_templates_usage ON export_templates(user_id, usage_count DESC);

-- RLS Policies
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
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can only manage their own templates"
  ON export_templates FOR ALL
  USING (auth.uid() = user_id);

-- Trigger: Usage Count Update
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE export_templates
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON export_logs
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION increment_template_usage();
```

### 3.3 scheduled_exports Tabelle (Enterprise)

```sql
-- Zeitgesteuerte Exporte (nur Enterprise)
CREATE TABLE scheduled_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id UUID REFERENCES export_templates(id) ON DELETE CASCADE NOT NULL,

  -- Konfiguration
  name TEXT NOT NULL,                          -- z.B. "Wöchentliche Kontakte"
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, für weekly
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- Für monthly
  time_of_day TIME NOT NULL,                   -- z.B. '08:00'
  timezone TEXT DEFAULT 'Europe/Berlin',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Lauf-Tracking
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_export_id UUID REFERENCES export_logs(id),
  last_error_message TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,

  -- E-Mail Versand
  email_recipients JSONB NOT NULL,             -- ['user@example.com', ...]
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('attachment', 'link')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scheduled_exports_user_id ON scheduled_exports(user_id);
CREATE INDEX idx_scheduled_exports_active ON scheduled_exports(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own scheduled exports"
  ON scheduled_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own scheduled exports"
  ON scheduled_exports FOR ALL
  USING (auth.uid() = user_id);
```

### 3.4 Database Functions

```sql
-- Auto-cleanup für abgelaufene Exports
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

-- Nächsten Lauf für Scheduled Export berechnen
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
    -- Berechne nächsten Wochentag
    v_next := (v_current_date +
      (p_day_of_week - EXTRACT(DOW FROM v_current_date)::INTEGER + 7) % 7 +
      p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '7 days';
    END IF;

  ELSIF p_frequency = 'monthly' THEN
    -- Berechne nächsten Monatstag
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

-- Update next_run für alle aktiven Scheduled Exports
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

-- Trigger: Auto-update next_run bei INSERT/UPDATE
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

CREATE TRIGGER trigger_scheduled_export_next_run
  BEFORE INSERT OR UPDATE ON scheduled_exports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_next_run();
```

---

## 4. API Contracts

### 4.1 Zod Schemas

```typescript
// src/lib/export/validation.ts

import { z } from 'zod';

// Enums
export const ExportTypeSchema = z.enum(['contacts', 'deals', 'leads']);
export const ExportFormatSchema = z.enum(['csv', 'excel']);
export const ExportStatusSchema = z.enum([
  'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
]);
export const ScheduledFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
export const DeliveryMethodSchema = z.enum(['attachment', 'link']);

// Column Definitions
export const ContactColumnSchema = z.enum([
  'id', 'name', 'company', 'email', 'phone', 'address',
  'website', 'tags', 'notes', 'source', 'created_at',
  'updated_at', 'interaction_count', 'deal_count'
]);

export const DealColumnSchema = z.enum([
  'id', 'title', 'description', 'stage', 'value', 'probability',
  'expected_close', 'actual_close', 'status', 'close_reason',
  'contact_name', 'contact_company', 'contact_email', 'contact_phone',
  'created_at', 'days_in_pipeline', 'weighted_value'
]);

export const LeadColumnSchema = z.enum([
  'company_name', 'address', 'phone', 'email', 'website',
  'category', 'rating', 'reviews_count', 'linkedin', 'xing',
  'opening_hours', 'place_id', 'search_date', 'search_query'
]);

// Request Schemas
export const ExportContactsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(ContactColumnSchema).min(1),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportDealsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(DealColumnSchema).min(1),
  filters: z.object({
    stages: z.array(z.string()).optional(),
    status: z.array(z.enum(['open', 'won', 'lost'])).optional(),
    valueMin: z.number().optional(),
    valueMax: z.number().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportLeadsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(LeadColumnSchema).min(1),
  filters: z.object({
    searchHistoryId: z.string().uuid().optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    hasWebsite: z.boolean().optional(),
  }).optional(),
  selectedIds: z.array(z.string()).optional(), // Für "Nur ausgewählte"
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional(),
});

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  exportType: ExportTypeSchema,
  format: ExportFormatSchema,
  columns: z.array(z.string()).min(1),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: z.object({
    includeSummary: z.boolean().optional(),
    includeInteractions: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
    emailRecipients: z.array(z.string().email()).optional(),
  }).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const CreateScheduledExportRequestSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.string().uuid(),
  frequency: ScheduledFrequencySchema,
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timezone: z.string().default('Europe/Berlin'),
  emailRecipients: z.array(z.string().email()).min(1),
  deliveryMethod: DeliveryMethodSchema,
});

// Response Schemas
export const ExportResponseSchema = z.union([
  // Synchron
  z.object({
    success: z.literal(true),
    exportId: z.string().uuid(),
    status: z.literal('completed'),
    downloadUrl: z.string().url(),
    fileName: z.string(),
    fileSize: z.number(),
    rowCount: z.number(),
    expiresAt: z.string().datetime(),
  }),
  // Asynchron
  z.object({
    success: z.literal(true),
    exportId: z.string().uuid(),
    status: z.enum(['pending', 'processing']),
    estimatedSeconds: z.number(),
    checkStatusUrl: z.string().url(),
  }),
]);

export const ExportStatusResponseSchema = z.object({
  exportId: z.string().uuid(),
  status: ExportStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  rowCount: z.number().optional(),
  processedRows: z.number().optional(),
  downloadUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export const ExportHistoryItemSchema = z.object({
  id: z.string().uuid(),
  exportType: ExportTypeSchema,
  status: ExportStatusSchema,
  format: ExportFormatSchema,
  fileName: z.string(),
  fileSize: z.number(),
  rowCount: z.number(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  templateName: z.string().optional(),
});

export const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  exportType: ExportTypeSchema,
  format: ExportFormatSchema,
  columns: z.array(z.string()),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: z.record(z.any()).optional(),
  isPublic: z.boolean(),
  usageCount: z.number(),
  lastUsedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const ScheduledExportResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  templateId: z.string().uuid(),
  templateName: z.string(),
  frequency: ScheduledFrequencySchema,
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  timeOfDay: z.string(),
  timezone: z.string(),
  isActive: z.boolean(),
  lastRunAt: z.string().datetime().optional(),
  nextRunAt: z.string().datetime().optional(),
  runCount: z.number(),
  successCount: z.number(),
  failCount: z.number(),
  emailRecipients: z.array(z.string()),
  deliveryMethod: DeliveryMethodSchema,
});

// Error Schemas
export const ExportErrorCodeSchema = z.enum([
  'INVALID_FORMAT',
  'INVALID_COLUMNS',
  'INVALID_FILTERS',
  'UNAUTHORIZED',
  'PLAN_REQUIRED',
  'LIMIT_EXCEEDED',
  'TEMPLATE_NOT_FOUND',
  'EXPORT_NOT_FOUND',
  'EXPORT_ALREADY_RUNNING',
  'RATE_LIMIT_EXCEEDED',
  'EXPORT_FAILED',
  'STORAGE_ERROR',
]);

// Type Exports
export type ExportType = z.infer<typeof ExportTypeSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportStatus = z.infer<typeof ExportStatusSchema>;
export type ExportContactsRequest = z.infer<typeof ExportContactsRequestSchema>;
export type ExportDealsRequest = z.infer<typeof ExportDealsRequestSchema>;
export type ExportLeadsRequest = z.infer<typeof ExportLeadsRequestSchema>;
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;
export type CreateScheduledExportRequest = z.infer<typeof CreateScheduledExportRequestSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ExportStatusResponse = z.infer<typeof ExportStatusResponseSchema>;
export type ExportHistoryItem = z.infer<typeof ExportHistoryItemSchema>;
export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type ScheduledExportResponse = z.infer<typeof ScheduledExportResponseSchema>;
export type ExportErrorCode = z.infer<typeof ExportErrorCodeSchema>;
```

### 4.2 API Endpoints

| Endpoint | Method | Beschreibung | Auth | Plan |
|----------|--------|--------------|------|------|
| `/api/export/contacts` | POST | Kontakte exportieren | JWT | Pro+ |
| `/api/export/deals` | POST | Deals exportieren | JWT | Pro+ |
| `/api/export/leads` | POST | Suchergebnisse exportieren | JWT | Enterprise |
| `/api/export/status/[id]` | GET | Export-Status abfragen | JWT | Pro+ |
| `/api/export/download/[id]` | GET | Export-Datei herunterladen | JWT + Signed URL | Pro+ |
| `/api/export/cancel/[id]` | POST | Laufenden Export abbrechen | JWT | Pro+ |
| `/api/export/history` | GET | Export-History laden | JWT | Pro+ |
| `/api/export/history/[id]` | DELETE | Export aus History löschen | JWT | Pro+ |
| `/api/export/templates` | GET | Templates auflisten | JWT | Pro+ |
| `/api/export/templates` | POST | Template erstellen | JWT | Pro+ |
| `/api/export/templates/[id]` | PUT | Template aktualisieren | JWT | Pro+ |
| `/api/export/templates/[id]` | DELETE | Template löschen | JWT | Pro+ |
| `/api/export/scheduled` | GET | Scheduled Exports auflisten | JWT | Enterprise |
| `/api/export/scheduled` | POST | Scheduled Export erstellen | JWT | Enterprise |
| `/api/export/scheduled/[id]` | PUT | Scheduled Export aktualisieren | JWT | Enterprise |
| `/api/export/scheduled/[id]` | DELETE | Scheduled Export löschen | JWT | Enterprise |
| `/api/export/scheduled/[id]/toggle` | POST | Scheduled Export aktivieren/deaktivieren | JWT | Enterprise |

---

## 5. Background Job Architecture

### 5.1 Async Export Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  API Route   │────▶│  export_logs │
│  (Browser)   │     │  (Edge/Node) │     │  (DB Insert) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │   Status:    │
                                         │   PENDING    │
                                         └──────┬───────┘
                                                │
                    ┌───────────────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Queue Trigger  │  (pg_cron oder Edge Function)
           │  (1-Min Takt)   │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Export Worker  │  (Edge Function)
           │                 │
           │ 1. Status:      │
           │    PROCESSING   │
           │ 2. Fetch Data   │
           │ 3. Generate     │
           │    File         │
           │ 4. Upload to    │
           │    Storage      │
           │ 5. Status:      │
           │    COMPLETED    │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Email Service  │  (Optional)
           │  (Notification) │
           └─────────────────┘
```

### 5.2 Queue Implementation

**Option A: Supabase pg_cron (Empfohlen)**

```sql
-- pg_cron Extension aktivieren
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron Job: Alle 1 Minute prüfen
SELECT cron.schedule(
  'process-export-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/export-worker',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.edge_function_key') || '"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

**Option B: Edge Function Scheduler**
```typescript
// supabase/functions/export-scheduler/index.ts
// Self-scheduling via fetch to self with delay
// Weniger zuverlässig, aber einfacher zu debuggen
```

### 5.3 Export Worker (Edge Function)

```typescript
// supabase/functions/export-worker/index.ts

import { createClient } from '@supabase/supabase-js';
import { processExport } from './processors';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Hole nächsten PENDING Export
  const { data: exportJob } = await supabase
    .from('export_logs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!exportJob) {
    return new Response('No pending exports', { status: 200 });
  }

  // 2. Status auf PROCESSING setzen
  await supabase
    .from('export_logs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', exportJob.id);

  try {
    // 3. Verarbeite Export
    await processExport(supabase, exportJob);

    // 4. Status auf COMPLETED setzen
    await supabase
      .from('export_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', exportJob.id);

    // 5. Optional: Sende E-Mail Benachrichtigung
    if (exportJob.send_email) {
      await sendExportNotification(supabase, exportJob);
    }

  } catch (error) {
    // Error Handling mit Retry-Logik
    await handleExportError(supabase, exportJob, error);
  }

  return new Response('Export processed', { status: 200 });
});
```

### 5.4 Progress Tracking

```typescript
// Chunked Processing mit Progress-Updates
async function processExport(supabase, exportJob) {
  const CHUNK_SIZE = 1000;
  let processedRows = 0;

  // Streaming CSV Generator
  const csvStream = createCSVStream();

  while (processedRows < exportJob.row_count) {
    // Fetch next chunk
    const { data: rows } = await supabase
      .rpc('get_export_chunk', {
        p_export_id: exportJob.id,
        p_offset: processedRows,
        p_limit: CHUNK_SIZE
      });

    // Process chunk
    for (const row of rows) {
      csvStream.write(formatRow(row, exportJob.column_selection));
    }

    processedRows += rows.length;

    // Update progress every chunk
    if (processedRows % CHUNK_SIZE === 0) {
      await supabase
        .from('export_logs')
        .update({
          processed_rows: processedRows,
          progress: Math.round((processedRows / exportJob.row_count) * 100)
        })
        .eq('id', exportJob.id);
    }
  }

  // Upload to Storage
  csvStream.end();
  const fileBuffer = csvStream.getBuffer();
  await uploadToStorage(supabase, exportJob.file_path, fileBuffer);
}
```

### 5.5 Error Handling & Retry Logic

```typescript
async function handleExportError(supabase, exportJob, error) {
  const MAX_RETRIES = 3;

  if (exportJob.retry_count < MAX_RETRIES) {
    // Retry: Setze zurück auf PENDING
    await supabase
      .from('export_logs')
      .update({
        status: 'pending',
        retry_count: exportJob.retry_count + 1,
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', exportJob.id);
  } else {
    // Max retries reached: FAILED
    await supabase
      .from('export_logs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportJob.id);

    // Benachrichtige User über Fehler
    await sendExportFailureNotification(supabase, exportJob);
  }
}
```

---

## 6. Storage Strategy

### 6.1 Supabase Storage Bucket

```sql
-- Storage Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- Storage Policies
CREATE POLICY "Users can only access their own exports"
  ON storage.objects FOR ALL
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 6.2 File Naming Convention

```
Bucket: exports
Path: {user_id}/{export_id}.{format}

Beispiele:
- exports/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890.csv
- exports/550e8400-e29b-41d4-a716-446655440000/b2c3d4e5-f6a7-8901-bcde-f23456789012.xlsx
```

**Display Filename (für User):**
```typescript
function generateDisplayFilename(
  exportType: 'contacts' | 'deals' | 'leads',
  format: 'csv' | 'excel'
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss

  const typeMap = {
    contacts: 'kontakte',
    deals: 'deals',
    leads: 'leads'
  };

  const ext = format === 'csv' ? 'csv' : 'xlsx';

  return `manyleads_${typeMap[exportType]}_${dateStr}_${timeStr}.${ext}`;
}
// Result: manyleads_kontakte_2026-02-08_14-30-00.csv
```

### 6.3 Lifecycle Policy (Auto-Cleanup)

```sql
-- Storage Lifecycle Policy (7 Tage für alle Exporte)
-- Zusätzlich zu DB-cleanup

-- Edge Function für Storage Cleanup (täglich)
SELECT cron.schedule(
  'cleanup-export-storage',
  '0 3 * * *',  -- Jeden Tag um 3 Uhr
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/cleanup-storage',
    headers:='{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### 6.4 Signed URL Generation

```typescript
// src/lib/export/storage.ts

export async function generateDownloadUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresInSeconds: number = 3600 // 1 Stunde
): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from('exports')
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

// In API Route
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  // 1. Prüfe Export gehört zu User
  const { data: exportLog } = await supabase
    .from('export_logs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single();

  if (!exportLog) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  // 2. Prüfe ob nicht expired
  if (new Date(exportLog.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Export expired' }, { status: 410 });
  }

  // 3. Generiere Signed URL
  const downloadUrl = await generateDownloadUrl(supabase, exportLog.file_path);

  return NextResponse.json({ downloadUrl });
}
```

---

## 7. CSV/Excel Generation

### 7.1 Tech Decision: CSV Generation

**Entscheidung:** Native Generation (keine Library)

**Begründung:**
- CSV ist einfaches Format, keine externe Dependency nötig
- Volle Kontrolle über Encoding, Delimiter, Escaping
- Deutsche Excel-Kompatibilität (UTF-8 BOM, Semikolon)
- Streaming-fähig für große Dateien

**Implementation:**
```typescript
// src/lib/export/csv-generator.ts

export interface CSVColumn {
  key: string;
  label: string;
  format?: 'string' | 'number' | 'date' | 'boolean';
}

export class CSVGenerator {
  private BOM = '\uFEFF';
  private SEPARATOR = ';';
  private LINE_END = '\n';

  generateHeader(columns: CSVColumn[]): string {
    return columns.map(col => this.escapeValue(col.label)).join(this.SEPARATOR);
  }

  generateRow(data: Record<string, any>, columns: CSVColumn[]): string {
    return columns.map(col => {
      const value = data[col.key];
      return this.escapeValue(this.formatValue(value, col.format));
    }).join(this.SEPARATOR);
  }

  private escapeValue(value: string): string {
    if (value.includes(this.SEPARATOR) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('de-DE');
      case 'number':
        // Deutsche Dezimal-Komma
        return String(value).replace('.', ',');
      case 'boolean':
        return value ? 'Ja' : 'Nein';
      default:
        return String(value);
    }
  }

  generate(columns: CSVColumn[], data: Record<string, any>[]): string {
    const header = this.generateHeader(columns);
    const rows = data.map(row => this.generateRow(row, columns));
    return this.BOM + [header, ...rows].join(this.LINE_END);
  }

  // Streaming für große Dateien
  *generateStream(columns: CSVColumn[], data: Record<string, any>[]): Generator<string> {
    yield this.BOM;
    yield this.generateHeader(columns);
    yield this.LINE_END;

    for (const row of data) {
      yield this.generateRow(row, columns);
      yield this.LINE_END;
    }
  }
}
```

### 7.2 Tech Decision: Excel Generation

**Entscheidung:** `xlsx` Library (bereits im Projekt)

**Begründung:**
- Bereits in E5 verwendet (LeadResultsTable)
- Unterstützt Formatierung, mehrere Sheets, Formeln
- Enterprise-Feature, Performance weniger kritisch

**Implementation:**
```typescript
// src/lib/export/excel-generator.ts

import * as XLSX from 'xlsx';

export interface ExcelOptions {
  includeSummary?: boolean;
  includeInteractions?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
}

export async function generateExcel(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  options: ExcelOptions = {}
): Promise<Buffer> {
  // 1. Transform data
  const worksheetData = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      obj[col.label] = row[col.key];
    });
    return obj;
  });

  // 2. Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // 3. Formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Header styling (Primary Blue)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[cellRef]) continue;

    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: '1E40AF' } }
      }
    };
  }

  // 4. Auto-size columns
  worksheet['!cols'] = columns.map(col => ({
    wch: Math.max(col.label.length, 15)
  }));

  // 5. Freeze header row
  if (options.freezeHeader) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  }

  // 6. Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kontakte');

  // 7. Optional: Summary Sheet
  if (options.includeSummary) {
    const summarySheet = createSummarySheet(data);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Zusammenfassung');
  }

  // 8. Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function createSummarySheet(data: Record<string, any>[]): XLSX.WorkSheet {
  const stats = calculateStats(data);

  const summaryData = [
    ['Export Zusammenfassung'],
    [],
    ['Gesamtanzahl Kontakte:', stats.total],
    ['Mit E-Mail:', stats.withEmail],
    ['Mit Telefon:', stats.withPhone],
    ['Mit Website:', stats.withWebsite],
    [],
    ['Nach Tags gruppiert:'],
    ...Object.entries(stats.byTag).map(([tag, count]) => [tag, count])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Title styling
  worksheet['A1'].s = {
    font: { bold: true, sz: 14, color: { rgb: '3B82F6' } }
  };

  return worksheet;
}
```

### 7.3 Memory Management

```typescript
// Für sehr große Exporte (> 10.000 Zeilen)
// Verwende Streaming und Chunk-Verarbeitung

async function generateLargeCSV(
  supabase: SupabaseClient,
  exportJob: ExportJob
): Promise<void> {
  const CHUNK_SIZE = 1000;
  let offset = 0;
  let isFirstChunk = true;

  // Temporärer File-Stream (für Edge Functions: Memory-Stream)
  const chunks: Buffer[] = [];

  while (true) {
    const { data: rows } = await fetchChunk(supabase, exportJob, offset, CHUNK_SIZE);
    if (!rows || rows.length === 0) break;

    // Generate CSV chunk
    const csvChunk = generateCSVChunk(rows, exportJob.columns, isFirstChunk);
    chunks.push(Buffer.from(csvChunk, 'utf-8'));

    isFirstChunk = false;
    offset += rows.length;

    // Update progress
    await updateExportProgress(supabase, exportJob.id, offset);

    // Memory-Pause
    if (offset % 5000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Combine and upload
  const finalBuffer = Buffer.concat(chunks);
  await uploadToStorage(supabase, exportJob.file_path, finalBuffer);
}
```

---

## 8. Security Considerations

### 8.1 RLS Policies

**Alle Export-Tabellen haben RLS enabled:**
- Users können nur ihre eigenen Exports sehen
- Kein Zugriff auf fremde Daten möglich
- Service Role Key nur für Background Workers

### 8.2 File Access Control

```typescript
// Storage-Richtlinien
// 1. Bucket ist PRIVATE (public = false)
// 2. Signed URLs mit 1-Stunde Gültigkeit
// 3. Download nur für Owner möglich

// Validierung vor Download
async function validateDownload(
  supabase: SupabaseClient,
  exportId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('export_logs')
    .select('id')
    .eq('id', exportId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())
    .single();

  return !!data;
}
```

### 8.3 Rate Limiting

```typescript
// src/lib/export/rate-limit.ts

const RATE_LIMITS = {
  exportsPerMinute: 5,
  exportsPerHour: 50,
  maxConcurrent: 1, // Nur ein laufender Export pro User
};

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // 1. Prüfe laufende Exports
  const { data: running } = await supabase
    .from('export_logs')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (running && running.length > 0) {
    return { allowed: false, retryAfter: 60 };
  }

  // 2. Prüfe Minuten-Limit
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: minuteCount } = await supabase
    .from('export_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo);

  if (minuteCount && minuteCount >= RATE_LIMITS.exportsPerMinute) {
    return { allowed: false, retryAfter: 60 };
  }

  return { allowed: true };
}
```

### 8.4 Data Privacy (DSGVO)

```typescript
// DSGVO-konformer Export

export async function generateGDPRExport(
  supabase: SupabaseClient,
  userId: string
): Promise<GDPRExportData> {
  // 1. Alle User-Daten sammeln
  const [profile, contacts, deals, searchHistory, creditTransactions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('contacts').select('*').eq('user_id', userId),
    supabase.from('deals').select('*').eq('user_id', userId),
    supabase.from('search_history').select('*').eq('user_id', userId),
    supabase.from('credit_transactions').select('*').eq('user_id', userId),
  ]);

  // 2. Metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    userId,
    dataCategories: ['profile', 'contacts', 'deals', 'search_history', 'credit_transactions'],
  };

  // 3. Verschlüsselter ZIP-Download
  return {
    metadata,
    data: {
      profile: profile.data,
      contacts: contacts.data,
      deals: deals.data,
      searchHistory: searchHistory.data,
      creditTransactions: creditTransactions.data,
    }
  };
}
```

---

## 9. Plan-Gating Matrix Implementation

### 9.1 Feature Matrix

| Feature | Free | Pro | Enterprise | Validation |
|---------|------|-----|------------|------------|
| CSV Export | ❌ | ✅ (max 1.000) | ✅ (max 10.000) | Server + Client |
| Excel Export (.xlsx) | ❌ | ❌ | ✅ | Server + Client |
| Deal-Pipeline Export | ❌ | ✅ | ✅ | Server + Client |
| Bulk Export (Leads) | ❌ | ❌ | ✅ | Server + Client |
| Scheduled Exports | ❌ | ❌ | ✅ | Server + Client |
| Export Templates | ❌ | 3 max | Unlimited | Server + Client |
| Template Sharing | ❌ | ❌ | ✅ | Server + Client |
| Export History | ❌ | 30 Tage | 90 Tage | Auto-Cleanup |
| E-Mail Benachrichtigungen | ❌ | ✅ | ✅ | Server |
| DSGVO Export | ❌ | ❌ | ✅ | Server + Client |

### 9.2 Server-Side Validation

```typescript
// src/lib/export/plan-gating.ts

import { PlanTier } from '@/lib/plans/types';

const EXPORT_LIMITS: Record<PlanTier, { maxRows: number; maxTemplates: number; maxScheduled: number; retentionDays: number }> = {
  free: { maxRows: 0, maxTemplates: 0, maxScheduled: 0, retentionDays: 0 },
  pro: { maxRows: 1000, maxTemplates: 3, maxScheduled: 0, retentionDays: 30 },
  enterprise: { maxRows: 10000, maxTemplates: Infinity, maxScheduled: 10, retentionDays: 90 },
};

const FEATURE_ACCESS: Record<PlanTier, Record<string, boolean>> = {
  free: {
    csv: false,
    excel: false,
    dealExport: false,
    bulkExport: false,
    scheduledExports: false,
    gdprExport: false,
  },
  pro: {
    csv: true,
    excel: false,
    dealExport: true,
    bulkExport: false,
    scheduledExports: false,
    gdprExport: false,
  },
  enterprise: {
    csv: true,
    excel: true,
    dealExport: true,
    bulkExport: true,
    scheduledExports: true,
    gdprExport: true,
  },
};

export function validateExportRequest(
  planTier: PlanTier,
  format: 'csv' | 'excel',
  exportType: 'contacts' | 'deals' | 'leads',
  rowCount: number
): { valid: boolean; error?: string; code?: string } {
  // 1. Format-Check
  if (format === 'excel' && !FEATURE_ACCESS[planTier].excel) {
    return {
      valid: false,
      error: 'Excel Export ist ein Enterprise Feature',
      code: 'PLAN_REQUIRED'
    };
  }

  // 2. Export-Type Check
  if (exportType === 'deals' && !FEATURE_ACCESS[planTier].dealExport) {
    return {
      valid: false,
      error: 'Deal Export ist nicht verfügbar',
      code: 'PLAN_REQUIRED'
    };
  }

  if (exportType === 'leads' && !FEATURE_ACCESS[planTier].bulkExport) {
    return {
      valid: false,
      error: 'Bulk Export ist ein Enterprise Feature',
      code: 'PLAN_REQUIRED'
    };
  }

  // 3. Row-Limit Check
  const limits = EXPORT_LIMITS[planTier];
  if (rowCount > limits.maxRows) {
    return {
      valid: false,
      error: `Maximal ${limits.maxRows} Zeilen erlaubt`,
      code: 'LIMIT_EXCEEDED'
    };
  }

  return { valid: true };
}

export async function validateTemplateLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: PlanTier
): Promise<{ valid: boolean; currentCount?: number; maxCount?: number }> {
  const limits = EXPORT_LIMITS[planTier];

  if (limits.maxTemplates === 0) {
    return { valid: false, maxCount: 0 };
  }

  const { count } = await supabase
    .from('export_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const currentCount = count || 0;

  if (currentCount >= limits.maxTemplates) {
    return {
      valid: false,
      currentCount,
      maxCount: limits.maxTemplates
    };
  }

  return {
    valid: true,
    currentCount,
    maxCount: limits.maxTemplates
  };
}
```

### 9.3 Client-Side UI Blocking

```typescript
// src/components/export/plan-gate-export.tsx

import { PlanGate, UpgradePrompt } from '@/components/plan-gate';

interface ExportPlanGateProps {
  planTier: PlanTier;
  requiredFeature: 'csv' | 'excel' | 'deals' | 'leads' | 'scheduled';
  children: React.ReactNode;
}

export function ExportPlanGate({ planTier, requiredFeature, children }: ExportPlanGateProps) {
  const featureAccess = {
    csv: planTier !== 'free',
    excel: planTier === 'enterprise',
    deals: planTier !== 'free',
    leads: planTier === 'enterprise',
    scheduled: planTier === 'enterprise',
  };

  if (!featureAccess[requiredFeature]) {
    return (
      <PlanGate
        requiredPlan={requiredFeature === 'excel' || requiredFeature === 'leads' || requiredFeature === 'scheduled' ? 'enterprise' : 'pro'}
        featureName={getFeatureName(requiredFeature)}
      >
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
      </PlanGate>
    );
  }

  return <>{children}</>;
}

// Template Limit Indicator
export function TemplateLimitIndicator({
  currentCount,
  maxCount
}: {
  currentCount: number;
  maxCount: number
}) {
  const isNearLimit = currentCount >= maxCount - 1;

  return (
    <div className={`text-sm ${isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
      {currentCount} von {maxCount === Infinity ? 'unbegrenzt' : maxCount} Templates verwendet
    </div>
  );
}
```

### 9.4 Expiration Based on Plan

```typescript
// Berechne Expiration-Date basierend auf Plan
function calculateExpirationDate(planTier: PlanTier): Date {
  const retentionDays = EXPORT_LIMITS[planTier].retentionDays;
  return new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
}

// In API Route
const expiresAt = calculateExpirationDate(userPlanTier);

await supabase
  .from('export_logs')
  .insert({
    ...exportData,
    expires_at: expiresAt.toISOString(),
  });
```

---

## 10. Handoff Checklists

### 10.1 For Backend Developer

**Database Migrations:**
- [ ] `export_logs` Tabelle erstellen
- [ ] `export_templates` Tabelle erstellen
- [ ] `scheduled_exports` Tabelle erstellen (Enterprise)
- [ ] Alle Indexes erstellen
- [ ] RLS Policies für alle Tabellen
- [ ] Auto-cleanup Funktion
- [ ] calculate_next_run Funktion
- [ ] Template usage trigger

**API Routes:**
- [ ] `POST /api/export/contacts` - mit Plan-Validierung
- [ ] `POST /api/export/deals` - mit Plan-Validierung
- [ ] `POST /api/export/leads` - mit Plan-Validierung
- [ ] `GET /api/export/status/[id]` - Status Polling
- [ ] `GET /api/export/download/[id]` - Signed URL Generation
- [ ] `POST /api/export/cancel/[id]` - Export abbrechen
- [ ] `GET /api/export/history` - History mit Pagination
- [ ] `DELETE /api/export/history/[id]` - Löschen

**Template API Routes:**
- [ ] `GET /api/export/templates` - Liste laden
- [ ] `POST /api/export/templates` - Erstellen (mit Limit-Check)
- [ ] `PUT /api/export/templates/[id]` - Aktualisieren
- [ ] `DELETE /api/export/templates/[id]` - Löschen

**Scheduled Export API Routes (Enterprise):**
- [ ] `GET /api/export/scheduled` - Liste laden
- [ ] `POST /api/export/scheduled` - Erstellen
- [ ] `PUT /api/export/scheduled/[id]` - Aktualisieren
- [ ] `DELETE /api/export/scheduled/[id]` - Löschen
- [ ] `POST /api/export/scheduled/[id]/toggle` - Aktivieren/Deaktivieren

**Export Engine:**
- [ ] CSV Generator (UTF-8 BOM, Semikolon, Escaping)
- [ ] Excel Generator (xlsx Library, Formatierung)
- [ ] Streaming für große Dateien
- [ ] Chunked Processing (1.000 Zeilen pro Chunk)

**Background Jobs:**
- [ ] Export Worker Edge Function
- [ ] Queue Trigger (pg_cron)
- [ ] Progress Update während Verarbeitung
- [ ] Error Handling mit Retry-Logik

**Storage Integration:**
- [ ] Supabase Storage Bucket 'exports'
- [ ] Storage Policies (RLS)
- [ ] File Upload
- [ ] Signed URL Generation

**Validation:**
- [ ] Zod Schemas für alle Inputs
- [ ] Plan-Limit Validierung (Server-seitig)
- [ ] Column-Validierung gegen Schema
- [ ] Rate-Limiting (5/Min, 50/Stunde)

**Email Notifications:**
- [ ] E-Mail Versand bei Export-Fertigstellung
- [ ] E-Mail Versand bei Export-Fehler
- [ ] Scheduled Export E-Mails

### 10.2 For Frontend Developer

**Components:**
- [ ] `ExportButton` - Button mit Dropdown (CSV/Excel)
- [ ] `ExportDialog` - Hauptexport-Dialog
- [ ] `ColumnSelector` - Spalten-Auswahl mit Checkboxes
- [ ] `FilterPreview` - Angewendete Filter anzeigen
- [ ] `ExportProgress` - Fortschrittsanzeige für Async
- [ ] `ExportHistoryTable` - History-Liste mit Download
- [ ] `TemplateManager` - Template-Verwaltung
- [ ] `TemplateCard` - Einzelnes Template (Edit, Delete, Duplicate)
- [ ] `ScheduledExportForm` - Formular für Scheduled Exports
- [ ] `ScheduledExportList` - Liste der Scheduled Exports
- [ ] `ExportPlanGate` - Plan-spezifisches Gating

**Hooks:**
- [ ] `useExport()` - Export starten und Status tracken
- [ ] `useExportStatus()` - Polling für Async-Status
- [ ] `useExportHistory()` - History laden mit Pagination
- [ ] `useExportTemplates()` - Templates CRUD
- [ ] `useScheduledExports()` - Scheduled Exports CRUD

**Pages:**
- [ ] `/dashboard/kontakte` - Export-Button Integration
- [ ] `/dashboard/deals` - Export-Button Integration
- [ ] `/dashboard/suche` - Bulk-Export Button
- [ ] `/dashboard/exporte` - Export History
- [ ] `/dashboard/exporte/templates` - Template Manager
- [ ] `/dashboard/einstellungen/exporte/scheduled` - Scheduled Exports

**Plan-Gating UI:**
- [ ] Upgrade-Prompt für CSV (Free)
- [ ] Upgrade-Prompt für Excel (Pro)
- [ ] Upgrade-Prompt für Scheduled (Free/Pro)
- [ ] Template-Limit Anzeige ("2 von 3 verwendet")
- [ ] Row-Limit Warnung ("Max 1.000 Zeilen für Pro")

**Download Handling:**
- [ ] Automatischer Download bei Sync-Export
- [ ] Polling für Async-Export Status (2-Sekunden Takt)
- [ ] Download-Button in History
- [ ] Expired-State Handling

**UI States:**
- [ ] Loading States (Spinner während Export)
- [ ] Error States (Fehlermeldungen)
- [ ] Empty States ("Noch keine Exporte")
- [ ] Success Toasts ("Export erfolgreich")

**German Localization:**
- [ ] Alle Labels auf Deutsch
- [ ] Datumsformate (DD.MM.YYYY)
- [ ] Zahlenformate (Komma für Dezimal)

### 10.3 For QA Engineer

**Functional Tests:**
- [ ] CSV Export mit verschiedenen Datensätzen (10, 100, 1.000 Zeilen)
- [ ] Excel Export mit Formatierung (Header-Farbe, Sheets)
- [ ] Spalten-Auswahl funktioniert korrekt
- [ ] Filter werden auf Export angewendet
- [ ] Templates erstellen/laden/bearbeiten/löschen
- [ ] Template-Duplizieren
- [ ] Scheduled Exports (Simulation via DB-Update)
- [ ] Export-History anzeigen
- [ ] Download nach Export
- [ ] Export abbrechen

**Plan-Gating Tests:**
- [ ] Free-User sieht Upgrade-Prompt bei CSV
- [ ] Pro-User kann nicht Excel exportieren
- [ ] Enterprise hat alle Features
- [ ] Limit-Checks (1.000 vs 10.000 Zeilen)
- [ ] Template-Limits (3 vs Unlimited)
- [ ] Scheduled Exports nur Enterprise

**Edge Case Tests:**
- [ ] 0 Einträge zum Export
- [ ] Export-Limit Überschreitung
- [ ] Sehr große Exporte (> 5.000 Zeilen)
- [ ] Sonderzeichen in Daten (Umlaute, Emojis)
- [ ] Abgebrochene Exporte
- [ ] Abgelaufene Download-Links (> 7 Tage)
- [ ] Gleichzeitige Exporte vom selben User

**Performance Tests:**
- [ ] Export 100 Zeilen < 2s
- [ ] Export 1.000 Zeilen < 10s
- [ ] Export 5.000 Zeilen < 60s
- [ ] Memory-Usage check (keine Leaks)

**Security Tests:**
- [ ] RLS Policies (kein Zugriff auf fremde Exporte)
- [ ] Rate Limiting (5/Min)
- [ ] Signed URLs (1h Gültigkeit)
- [ ] Input Validation (XSS-Schutz)

**Integration Tests:**
- [ ] Export aus Kontakt-Liste
- [ ] Export aus Deal-Pipeline
- [ ] Export aus Suchergebnissen
- [ ] Template-basierter Export
- [ ] E-Mail Benachrichtigungen

**DSGVO Tests:**
- [ ] Auto-Löschung nach 7/30/90 Tagen
- [ ] Vollständiger Datenexport (Enterprise)
- [ ] Export-Metadaten korrekt

**UI/UX Tests:**
- [ ] Responsive Design
- [ ] German Labels korrekt
- [ ] Loading States
- [ ] Error Messages verständlich

---

## 11. Dependencies & Integration Points

### 11.1 Dependencies

**Existing (bereits im Projekt):**
```json
{
  "xlsx": "^0.18.5"  // Excel Generation
}
```

**Neue Dependencies (Backend):**
```bash
# Keine neuen Packages nötig
# Nutze bestehenden Supabase Client
```

**Neue Dependencies (Frontend):**
```bash
# Keine neuen Packages nötig
# Nutze bestehende shadcn/ui Components
```

**Supabase Extensions:**
```sql
-- pg_cron für Scheduled Exports
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net für HTTP Calls (Edge Function Trigger)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 11.2 Integration Points

#### E6 (Sammlungen) Integration
- **Source:** `search_results` Tabelle
- **Feature:** Bulk Export aus Suchergebnissen
- **Button Location:** LeadResultsTable Toolbar
- **Filter Integration:** Smart-Filter (E5) übernehmen

#### E7 (CRM) Integration
- **Sources:** `contacts`, `deals` Tabellen
- **Features:** Kontakt-Export, Deal-Pipeline-Export
- **Button Locations:**
  - `/dashboard/kontakte` Toolbar
  - `/dashboard/deals` Toolbar
- **Filter Integration:** Kontakt-Filter (Tags), Deal-Filter (Stages)

#### E3 (Credit/Plan) Integration
- **Hook:** `usePlan()` für Plan-Tier Erkennung
- **Server:** Plan-Validierung vor jedem Export
- **Features:** Alle Export-Typen sind Plan-gated

#### E5 (Lead-Tabelle) Integration
- **Existing:** `LeadExportButton` Komponente
- **Enhancement:** Async-Export für große Datensätze
- **Template Integration:** Templates auch für Leads nutzbar

---

## 12. Open Questions / Decisions

### 12.1 Architectural Decisions

| Frage | Option A | Option B | Empfehlung | Status |
|-------|----------|----------|------------|--------|
| **Background Queue** | pg_cron + Edge Function | In-Memory Queue | **Option A** | ✅ Entschieden |
| **CSV Library** | Native | papaparse/csv-writer | **Native** | ✅ Entschieden |
| **Excel Library** | xlsx (bestehend) | exceljs | **xlsx** | ✅ Entschieden |
| **Email Service** | Supabase Auth Mail | SendGrid Integration | **Supabase** | ⏳ Offen |
| **Scheduled Trigger** | pg_cron | Edge Function Scheduler | **pg_cron** | ✅ Entschieden |
| **Progress Polling** | HTTP Polling | WebSocket | **HTTP Polling** | ✅ Entschieden |
| **Storage Lifecycle** | DB Cleanup + Storage Cleanup | Nur DB Cleanup | **Beides** | ✅ Entschieden |

### 12.2 Open Questions for Stakeholder

1. **Email Service:**
   - Soll Supabase Auth E-Mails verwendet werden (Limit: 3/Std) oder SendGrid Integration?
   - Empfehlung: Supabase für MVP, SendGrid für Skalierung

2. **Tägliches Export-Limit:**
   - Soll es ein tägliches Limit geben (unabhängig vom Plan)?
   - Vorschlag: 20 Exporte/Tag für Pro, 100 für Enterprise

3. **Free-User Test-Export:**
   - Sollen Free-User einen einmaligen Test-Export erhalten (max 50 Zeilen)?
   - Empfehlung: Ja, für Conversion-Optimierung

4. **Max File Size:**
   - Maximale Dateigröße für Exporte (aktuell: 100 MB)?
   - Bei Überschreitung: Warnung oder automatische Aufteilung?

5. **Team-Sharing Details:**
   - Wie funktioniert Template-Sharing im Team (Enterprise)?
   - Option A: Alle öffentlichen Templates der Organisation
   - Option B: Explizite Freigabe pro Template

### 12.3 Technical Debt Considerations

| Item | Impact | Mitigation |
|------|--------|------------|
| **Large Exports Memory** | Hoch | Streaming + Chunking implementieren |
| **Concurrent Exports** | Mittel | Queue mit User-Isolierung |
| **Email Deliverability** | Mittel | Retry-Logik + Bounce-Handling |
| **Storage Costs** | Niedrig | Auto-Cleanup nach 7/30/90 Tagen |

---

## Zusammenfassung für Product Manager

### Was wird gebaut?

| Modul | Features | Verfügbarkeit |
|-------|----------|---------------|
| **CSV Export** | Kontakte, Deals, Leads | Pro+ (1.000 Zeilen), Enterprise (10.000) |
| **Excel Export** | Formatierung, Multi-Sheet | Enterprise only |
| **Templates** | Speichern & Wiederverwenden | Pro (3), Enterprise (unbegrenzt) |
| **Scheduled** | Automatische Exporte | Enterprise only |
| **History** | Download-Management | Pro (30 Tage), Enterprise (90 Tage) |

### Wichtige Entscheidungen

1. **Async Processing:** Große Exporte (> 1.000 Zeilen) werden im Hintergrund verarbeitet
2. **Plan-Gating:** Server-seitige Validierung verhindert Abuse
3. **Storage:** Supabase Storage mit 7/30/90 Tage Aufbewahrung
4. **German Format:** CSV mit Semikolon, deutsche Datumsformate
5. **Progress Tracking:** Echtzeit-Fortschritt für Async-Exporte

### Abhängigkeiten

**Blocks auf:**
- E7 CRM-System (contacts, deals Tabellen)
- E6 Sammlungen (search_results Tabelle)

**Wird blockiert von:**
- Backend Implementation (APIs, Database)
- Frontend Implementation (UI Components)

---

## Next Steps

1. **Backend Developer:** Datenbank-Migrationen + API Routes
2. **Frontend Developer:** Export UI Components + Hooks
3. **QA Engineer:** Testplan vorbereiten
4. **Stakeholder:** Offene Fragen (Email Service, Daily Limits) klären

**Geschätzte Zeit:** 8-10 Tage (parallel: 5-6 Tage)

---

**Dokument erstellt:** Solution Architect
**Letzte Änderung:** 2026-02-08
**Review-Status:** PENDING USER APPROVAL
**Nächster Schritt:** Tasks #3 (Backend) und #4 (Frontend) können parallel beginnen nach Approval
