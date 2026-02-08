# Epic E6 - Sammlungen & Suchverlauf: Architecture

**Epic:** E6 - Sammlungen & Suchverlauf
**Projekte:** PROJ-18 (Sammlungen), PROJ-19 (Suchverlauf)
**Datum:** 2026-02-08
**Status:** ARCHITECTURE APPROVED

---

## Executive Summary

Epic E6 implementiert die Verwaltung von Suchergebnissen über Zeit (Suchverlauf) und die Organisation in Sammlungen. Dies ermöglicht Nutzern, vergangene Suchen zu durchsuchen, wiederzuholen und Ergebnisse dauerhaft zu speichern.

---

## System Overview

### Core Functionality

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Suchverlauf    │     │   Sammlungen    │     │    Suche        │
│   (PROJ-19)     │◄────│   (PROJ-18)     │◄────│  (Aus E4/E5)    │
│                 │     │                 │     │                 │
│ • Chronologie   │     │ • Speicherung   │     │ • Neue Suche    │
│ • Retry         │     │ • Detail-Ansicht│     │ • Webhook       │
│ • Status-Filter │     │ • Löschung      │     │ • Ergebnisse    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Integration mit E4/E5

- **E4 Search System:** Liefert `search_history` und `search_results` Daten
- **E5 Lead Table:** Wiederverwendung für Sammlungs-Detail-Ansicht
- **E5 SmartFilter:** Wiederverwendung für Sammlungs-Filterung

---

## PROJ-18: Sammlungen (Collections)

### User Stories

**US-18.1: Automatische Sammlung**
- Als User möchte ich, dass meine Suchergebnisse automatisch als Sammlung gespeichert werden
- Acceptance: Bei jeder abgeschlossenen Suche wird eine Sammlung erstellt

**US-18.2: Sammlungen anzeigen**
- Als User möchte ich alle meine Sammlungen in einer Liste sehen
- Acceptance: Übersicht mit Name, Datum, Ergebnisanzahl, Status

**US-18.3: Sammlungs-Details**
- Als User möchte ich eine einzelne Sammlung öffnen und alle Leads sehen
- Acceptance: Detail-Ansicht mit vollständiger Lead-Tabelle

**US-18.4: Sammlung löschen**
- Als User möchte ich eine Sammlung löschen können
- Acceptance: Löschung mit Bestätigungsdialog, keine Wiederherstellung

### Datenbank

**Bestehende Tabellen (aus E4):**

```sql
-- search_history: Enthält bereits alle notwendigen Metadaten
CREATE TABLE search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query_params JSONB, -- {industry, location, max_results}
  status TEXT, -- 'pending' | 'running' | 'completed' | 'failed'
  result_count INTEGER,
  credits_used INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- search_results: Enthält die Lead-Daten
CREATE TABLE search_results (
  id UUID PRIMARY KEY,
  search_history_id UUID REFERENCES search_history(id),
  user_id UUID REFERENCES auth.users(id),
  lead_data JSONB, -- Alle Lead-Informationen
  place_id TEXT -- Google Maps Place ID für Deduplizierung
);
```

**Keine neuen Tabellen nötig** - Sammlungen sind eine virtuelle View auf `search_history` mit `status = 'completed'`.

### API Design

#### GET /api/collections

**Zweck:** Liste aller Sammlungen des authentifizierten Users

**Query Parameters:**
```typescript
{
  page?: number;      // default: 1
  limit?: number;     // default: 20, max: 100
  sort_by?: 'date' | 'name' | 'count';  // default: 'date'
  sort_order?: 'asc' | 'desc';          // default: 'desc'
  search?: string;    // Filter nach Suchbegriff/Standort
}
```

**Response:**
```typescript
{
  collections: Array<{
    id: string;                    // search_history.id
    name: string;                  // "{industry} in {location}"
    query_params: {
      industry: string;
      location: string;
      max_results: number;
    };
    result_count: number;
    status: 'completed' | 'failed';
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

**Implementation Notes:**
- Abfrage: `search_history` wo `user_id = auth.uid()` AND `status IN ('completed', 'failed')`
- Name wird dynamisch generiert: "{industry} in {location}"
- Pagination via `limit`/`offset`

#### GET /api/collections/[id]

**Zweck:** Detail einer Sammlung mit allen Leads

**Response:**
```typescript
{
  collection: {
    id: string;
    name: string;
    query_params: object;
    result_count: number;
    status: string;
    created_at: string;
    updated_at: string;
  };
  leads: Array<{
    id: string;                    // search_results.id
    place_id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    rating?: number;
    review_count?: number;
    opening_hours?: string[];
    image_url?: string;
    social_media?: {
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
      twitter?: string;
    };
    latitude?: number;
    longitude?: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**Implementation Notes:**
- Validate: Collection gehört zum authentifizierten User (RLS)
- Join: `search_history` + `search_results`
- Pagination für Leads (default: 50, max: 100)

#### DELETE /api/collections/[id]

**Zweck:** Sammlung löschen

**Implementation:**
- Löscht Eintrag aus `search_history`
- CASCADE löscht zugehörige `search_results` (Foreign Key)
- RLS sichert: Nur eigene Sammlungen löschbar

**Response:**
```typescript
{ success: true }
```

**Error Cases:**
- 404: Sammlung nicht gefunden
- 403: Nicht autorisiert (gehört anderem User)

### Frontend Architecture

#### Page: /dashboard/sammlungen

**Components:**
```
CollectionsPage
├── CollectionsHeader
│   ├── Title "Meine Sammlungen"
│   ├── SearchInput (Filter nach Name)
│   └── ViewToggle (Grid/List)
├── CollectionsList
│   ├── CollectionsGrid (Grid-Ansicht)
│   │   └── CollectionCard × N
│   └── CollectionsTable (List-Ansicht)
│       └── CollectionRow × N
├── CollectionsEmptyState
└── Pagination

CollectionCard:
├── Preview Map/Icon
├── Title ("{industry} in {location}")
├── Meta: Ergebnisanzahl + Datum
├── Status Badge
└── Actions: Öffnen, Löschen
```

#### Page: /dashboard/sammlungen/[id]

**Components:**
```
CollectionDetailPage
├── CollectionHeader
│   ├── Back Link
│   ├── Title
│   ├── Meta: Ort, Datum, Credits
│   └── Actions: Export, Löschen
├── CollectionStats
│   ├── Ergebnisanzahl
│   ├── Durchschnittliche Bewertung
│   └── Kontakt-Statistiken
├── CollectionFilter
│   └── SmartFilter (wiederverwendet aus E5)
└── CollectionLeads
    └── LeadResultsTable (wiederverwendet aus E5)
```

#### State Management

```typescript
// URL State für Filter/Pagination
?sort=date&order=desc&page=1&view=grid

// Local State
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [searchQuery, setSearchQuery] = useState('');
```

---

## PROJ-19: Suchverlauf (Search History)

### User Stories

**US-19.1: Verlauf anzeigen**
- Als User möchte ich alle meine vergangenen Suchen chronologisch sehen
- Acceptance: Liste mit Suchbegriff, Standort, Ergebnissen, Credits, Status

**US-19.2: Suche wiederholen**
- Als User möchte ich eine alte Suche mit denselben Parametern erneut starten
- Acceptance: "Erneut suchen" Button startet neue Suche

**US-19.3: Verlauf filtern**
- Als User möchte ich den Verlauf nach Status filtern
- Acceptance: Filter: Alle, Abgeschlossen, Fehlgeschlagen, Laufend

### Datenbank

**Keine Änderungen nötig** - Nutzt bestehende `search_history` Tabelle.

### API Design

#### GET /api/search/history

**Zweck:** Chronologische Liste aller Suchen

**Query Parameters:**
```typescript
{
  page?: number;           // default: 1
  limit?: number;          // default: 20, max: 50
  status?: 'all' | 'pending' | 'running' | 'completed' | 'failed';
  date_from?: string;      // ISO Date
  date_to?: string;        // ISO Date
}
```

**Response:**
```typescript
{
  searches: Array<{
    id: string;
    query_params: {
      industry: string;
      location: string;
      max_results: number;
    };
    result_count: number;
    credits_used: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;       // 0-100 für laufende Suchen
    duration_seconds?: number;  // Berechnet aus created/updated
    collection_id?: string;  // Link zu Sammlung (wenn completed)
    error_message?: string;  // Nur bei failed
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  summary: {
    total_searches: number;
    total_credits_used: number;
    total_leads_found: number;
  };
}
```

**Implementation Notes:**
- Sortierung: `created_at DESC` (neueste zuerst)
- Status-Filter: WHERE status = $1 (außer 'all')
- Date-Filter: WHERE created_at BETWEEN $1 AND $2

#### POST /api/search/retry

**Zweck:** Suche mit denselben Parametern erneut starten

**Request:**
```typescript
{
  search_id: string;  // ID der zu wiederholenden Suche
}
```

**Response:**
```typescript
{
  new_search_id: string;
  status: 'pending';
  estimated_cost: number;
  message: "Suche wurde gestartet";
}
```

**Implementation:**
1. Lade originale `query_params` aus `search_history`
2. Validiere: User hat genügend Credits
3. Starte neue Suche via `POST /api/search/start` (E4 API)
4. Return neue search_id

**Error Cases:**
- 404: Original-Suche nicht gefunden
- 402: Unzureichende Credits
- 400: Original-Suche noch läuft (running)

### Frontend Architecture

#### Page: /dashboard/verlauf

**Components:**
```
SearchHistoryPage
├── HistoryHeader
│   ├── Title "Suchverlauf"
│   └── Summary Stats
├── HistoryFilterBar
│   ├── Status Filter (Tabs: Alle | Abgeschlossen | Fehlgeschlagen)
│   └── Date Range Picker
├── HistoryList
│   └── HistoryItem × N
│       ├── SearchIcon (variiert nach Status)
       ├── Query Info (Branche, Ort)
│       ├── Meta (Ergebnisse, Credits, Datum)
│       ├── StatusBadge
│       └── Actions
│           ├── [Erneut suchen] (bei completed/failed)
│           ├── [Zur Sammlung] (bei completed)
│           └── [Details] (bei running/pending)
├── HistoryEmptyState
└── Pagination
```

#### State Management

```typescript
// URL State
?status=completed&date_from=2026-01-01&page=1

// Filter State
interface HistoryFilter {
  status: 'all' | 'completed' | 'failed' | 'running';
  dateRange: { from?: Date; to?: Date };
}
```

---

## Component Structure

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| CollectionsList | `app/dashboard/sammlungen/` | Hauptliste der Sammlungen |
| CollectionCard | `components/collections/` | Einzelne Sammlung in Grid |
| CollectionDetail | `app/dashboard/sammlungen/[id]/` | Detail-Ansicht |
| CollectionHeader | `components/collections/` | Header für Detail-Seite |
| SearchHistoryList | `app/dashboard/verlauf/` | Chronologische Liste |
| HistoryItem | `components/search/` | Einzelner Verlaufseintrag |
| RetrySearchButton | `components/search/` | "Erneut suchen" Action |

### Reused Components (E5)

| Component | Source | Usage |
|-----------|--------|-------|
| LeadResultsTable | `components/search/` | Sammlungs-Detail-Ansicht |
| SmartFilter | `components/search/` | Filter in Sammlung |
| Pagination | `components/ui/` | Listen-Pagination |
| StatusBadge | `components/ui/` | Status-Anzeige |

---

## Plan-Based Feature Gating

### Sammlungen (PROJ-18)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Sammlungen anzeigen | 50 max | unbegrenzt | unbegrenzt |
| Detail-Ansicht | ✅ | ✅ | ✅ |
| Export | ❌ | CSV | CSV + Excel |
| Löschen | ✅ | ✅ | ✅ |

### Suchverlauf (PROJ-19)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Verlauf anzeigen | 30 Tage | unbegrenzt | unbegrenzt |
| "Erneut suchen" | ✅ | ✅ | ✅ |
| Status-Filter | ✅ | ✅ | ✅ |
| Datums-Filter | ❌ | ✅ | ✅ |

---

## API Route Structure

```
src/app/api/
├── collections/
│   ├── route.ts           # GET /api/collections
│   └── [id]/
│       ├── route.ts       # GET /api/collections/[id]
│       └── route.ts       # DELETE /api/collections/[id]
└── search/
    ├── history/
    │   └── route.ts       # GET /api/search/history
    └── retry/
        └── route.ts       # POST /api/search/retry
```

---

## Database Queries

### Collections List

```sql
SELECT
  id,
  query_params,
  result_count,
  status,
  created_at,
  updated_at
FROM search_history
WHERE user_id = auth.uid()
  AND status IN ('completed', 'failed')
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
```

### Collection Detail with Leads

```sql
-- Collection metadata
SELECT * FROM search_history
WHERE id = $1 AND user_id = auth.uid();

-- Leads (paginated)
SELECT
  id,
  lead_data,
  place_id
FROM search_results
WHERE search_history_id = $1
  AND user_id = auth.uid()
LIMIT $2 OFFSET $3;
```

### Search History

```sql
SELECT
  id,
  query_params,
  result_count,
  credits_used,
  status,
  progress,
  error_message,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds
FROM search_history
WHERE user_id = auth.uid()
  AND ($1::text IS NULL OR status = $1)
  AND ($2::timestamptz IS NULL OR created_at >= $2)
  AND ($3::timestamptz IS NULL OR created_at <= $3)
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;
```

---

## Error Handling

### API Errors

| Error | Code | Message |
|-------|------|---------|
| Not Found | 404 | "Sammlung nicht gefunden" |
| Unauthorized | 403 | "Keine Berechtigung" |
| Invalid Filter | 400 | "Ungültiger Filter-Parameter" |
| Insufficient Credits | 402 | "Nicht genügend Credits für Retry" |

### Frontend Error States

- **Empty State:** "Noch keine Sammlungen" / "Noch keine Suchen"
- **Error State:** Retry-Button bei API-Fehler
- **Loading State:** Skeleton-Loader für Karten/Tabellen

---

## Security Considerations

1. **RLS Policies:** Alle Abfragen filtern nach `user_id = auth.uid()`
2. **Input Validation:** Zod Schemas für alle Query-Parameter
3. **Rate Limiting:** Retry-Endpoint mit Rate-Limit (max 5/min)
4. **Authorization:** DELETE nur für eigene Sammlungen

---

## Performance Optimizations

1. **Pagination:** Alle Listen mit LIMIT/OFFSET
2. **Indexing:** `search_history(user_id, created_at)`
3. **JSONB Queries:** Lead-Daten als JSONB (keine Joins nötig)
4. **Caching:** Client-side SWR für Listen (stale-while-revalidate)

---

## Handoff Checklists

### Solution Architect → Backend Developer

- [x] API contracts defined (GET, DELETE, POST)
- [x] Database queries documented
- [x] Zod schemas specified
- [x] Error handling strategy documented
- [x] RLS policies confirmed

### Solution Architect → Frontend Developer

- [x] Page structure defined (/sammlungen, /sammlungen/[id], /verlauf)
- [x] Component inventory complete
- [x] Plan-gating matrix documented
- [x] Reused components identified (LeadResultsTable, SmartFilter)
- [x] URL state schema defined

### Backend → Frontend Handoff

Backend liefert:
- API Routes deployed
- Zod schemas exported
- Postman/HTTP Test-Dateien

Frontend erwartet:
- GET /api/collections - Liste
- GET /api/collections/[id] - Detail
- DELETE /api/collections/[id] - Löschen
- GET /api/search/history - Verlauf
- POST /api/search/retry - Retry

---

## Implementation Phases

### Phase 1: Backend (2 Tage)
1. GET /api/collections
2. GET /api/collections/[id]
3. DELETE /api/collections/[id]
4. GET /api/search/history
5. POST /api/search/retry

### Phase 2: Frontend - Sammlungen (2 Tage)
1. /dashboard/sammlungen Seite
2. CollectionCard/List Components
3. /dashboard/sammlungen/[id] Detail-Seite
4. Integration mit LeadResultsTable

### Phase 3: Frontend - Verlauf (1 Tag)
1. /dashboard/verlauf Seite
2. HistoryItem Component
3. Retry-Funktionalität
4. Filter-Integration

### Phase 4: QA (1 Tag)
1. API Tests
2. UI Tests
3. Integration Tests
4. Plan-Gating Tests

**Gesamtdauer:** ~6 Tage (parallel: 4 Tage)

---

## Dependencies

### Von E4/E5
- `search_history` Tabelle existiert
- `search_results` Tabelle existiert
- POST /api/search/start existiert (für Retry)
- LeadResultsTable Component existiert
- SmartFilter Component existiert

### Neue Dependencies
- Keine - alles mit bestehendem Stack realisierbar

---

## Open Questions

1. **Manuelle Sammlungen:** Soll User manuell Sammlungen erstellen können (nicht nur automatisch)?
   - **Decision:** Nein, nur automatische Sammlungen für E6.

2. **Sammlungs-Namen:** Editierbar oder statisch aus Suchparametern?
   - **Decision:** Statisch generiert: "{industry} in {location}"

3. **Löschung:** Soft-Delete oder Hard-Delete?
   - **Decision:** Hard-Delete (CASCADE auf search_results).

---

## Sign-off

**Architecture Review:** COMPLETED
**Next Steps:** Backend Developer startet mit Task #6

