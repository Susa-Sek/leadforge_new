# E5 Lead Ergebnis-Anzeige & Filter - Architecture Document

## Overview

Dieses Dokument beschreibt die Architektur fuer Epic E5 (PROJ-16 und PROJ-17) der Manyleads.io Plattform. Es deckt die Lead-Ergebnis-Tabelle mit Plan-basiertem Feature-Gating und das Smart-Filter-System ab.

**Status:** Architecture Complete - Frontend Implementation In Progress
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Solution Architect

---

## Inhaltsverzeichnis

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Feature Matrix by Plan](#2-feature-matrix-by-plan)
3. [Component Structure](#3-component-structure)
4. [Data Model](#4-data-model)
5. [Tech Decisions](#5-tech-decisions)
6. [Dependencies](#6-dependencies)
7. [Implementation Status](#7-implementation-status)
8. [Handoff Checklist](#8-handoff-checklist)

---

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Search Form    │  │  Progress UI    │  │  Results Table  │          │
│  │  (E4)           │  │  (E4)           │  │  (E5)           │          │
│  └────────┬────────┘  └─────────────────┘  └────────┬────────┘          │
└───────────┼──────────────────────────────────────────┼──────────────────┘
            │                                          │
            ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXISTING API ROUTES (E4)                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐               │
│  │  GET /api/search/results│  │  GET /api/search/status │               │
│  │  - Lead Daten          │  │  - Search Progress      │               │
│  │  - Paginiert           │  └─────────────────────────┘               │
│  │  - JSON Response       │                                            │
│  └─────────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE (E4 Schema)                       │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │ search_history   │  │ search_results   │                            │
│  │ - search params  │  │ - lead data      │                            │
│  │ - status         │  │ - contact info   │                            │
│  │ - progress       │  │ - social links   │                            │
│  └──────────────────┘  └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### E5 Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    E5 COMPONENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SearchPageClient                              │   │
│  │              (/dashboard/suche/page.tsx)                         │   │
│  └───────────────────────┬─────────────────────────────────────────┘   │
│                          │                                              │
│          ┌───────────────┼───────────────┐                              │
│          │               │               │                              │
│          ▼               ▼               ▼                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐        │
│  │ SearchForm   │ │ SearchProgress│ │ LeadResultsTable        │        │
│  │ (E4)         │ │ (E4)          │ │ (PROJ-16)               │        │
│  └──────────────┘ └──────────────┘ └───────────┬──────────────┘        │
│                                                │                        │
│                          ┌─────────────────────┼─────────────────┐     │
│                          │                     │                 │     │
│                          ▼                     ▼                 ▼     │
│              ┌─────────────────┐  ┌──────────────────┐ ┌──────────────┐│
│              │ Column Config   │  │ Pagination       │ │ Export       ││
│              │ Dropdown        │  │ Controls         │ │ Buttons      ││
│              └─────────────────┘  └──────────────────┘ └──────────────┘│
│                          │                                            │
│                          ▼                                            │
│              ┌──────────────────────────────┐                         │
│              │ Smart Filter Panel (PROJ-17) │                         │
│              │ - Quick Filters              │                         │
│              │ - Social Media Filters       │                         │
│              │ - Rating Range               │                         │
│              └──────────────────────────────┘                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Feature Matrix by Plan

### PROJ-16: Lead-Ergebnis-Tabelle

| Feature | Free (30 Credits) | Pro | Enterprise |
|---------|-------------------|-----|------------|
| **Firma/Name** | Sichtbar | Sichtbar | Sichtbar |
| **Adresse** | Sichtbar | Sichtbar | Sichtbar |
| **Email** | Sichtbar | Sichtbar | Sichtbar |
| **Website** | Sichtbar | Sichtbar | Sichtbar |
| **Kontaktperson** | Sichtbar | Sichtbar | Sichtbar |
| **Google Maps Link** | Sichtbar | Sichtbar | Sichtbar |
| **Telefon** | Geblurrt | Sichtbar | Sichtbar |
| **Branche** | Geblurrt | Sichtbar | Sichtbar |
| **Bewertung** | Geblurrt | Sichtbar | Sichtbar |
| **Social Media** | Nicht sichtbar | Geblurrt | Sichtbar |
| **Spalten-Konfiguration** | Ja | Ja | Ja |
| **Sortierung** | Ja | Ja | Ja |
| **Zeilenauswahl** | Ja | Ja | Ja |
| **Pagination** | Ja | Ja | Ja |

**Geblurrt =** Partial blur mit "Pro"-Badge und Upgrade-CTA bei Hover

### PROJ-16: Export-Funktionen

| Export-Format | Free | Pro | Enterprise |
|---------------|------|-----|------------|
| **CSV Export** | 10 Leads max | Unlimited | Unlimited |
| **Excel Export** | Nicht verfuegbar | Nicht verfuegbar | Unlimited |

**CSV Specs:**
- Encoding: UTF-8 mit BOM (Excel-Kompatibilitaet)
- Separator: Semikolon (;)
- Header: Deutsche Ueberschriften
- Dateiname: `leads_[searchId]_[datum].csv`

### PROJ-17: Smart-Filter

| Filter-Typ | Free | Pro | Enterprise |
|------------|------|-----|------------|
| **Quick-Filter** (Website, Email, Telefon) | Verfuegbar | Verfuegbar | Verfuegbar |
| **Smart-Filter** (Social Media Ja/Nein/Egal) | Locked | Verfuegbar | Verfuegbar |
| **Bewertungs-Range** | Basis (1-5) | Erweitert | Erweitert |
| **Bewertungsanzahl-Range** | Nicht verfuegbar | Verfuegbar | Verfuegbar |

---

## 3. Component Structure

### Visual Component Tree

```
Search Page (/dashboard/suche)
│
├── SearchForm (E4 - bestehend)
├── SearchProgress (E4 - bestehend)
│
└── LeadResultsTable (PROJ-16)
    ├── Card Header
    │   ├── Title + Lead Count
    │   ├── Spalten-Dropdown (Column Visibility)
    │   └── Export Button / PlanGateBadge
    │
    ├── Table (TanStack Table)
    │   ├── Header Row (mit Sortierung)
    │   │   ├── Checkbox (Alle auswaehlen)
    │   │   ├── Firma
    │   │   ├── Kontakt
    │   │   ├── Adresse
    │   │   ├── Email
    │   │   ├── Telefon (Pro+ only / Geblurrt)
    │   │   ├── Website
    │   │   ├── Branche (Pro+ only / Geblurrt)
    │   │   ├── Bewertung (Pro+ only / Geblurrt)
    │   │   ├── Social Media (Enterprise only / Geblurrt)
    │   │   └── Karte
    │   │
    │   └── Data Rows
    │       ├── Checkbox (Einzeln)
    │       └── Cell Renderers
    │           ├── PlanGate (fuer gesperrte Features)
    │           └── Standard Display
    │
    ├── Pagination Footer
    │   ├── Page Size Selector (10/25/50/100)
    │   ├── Pagination Controls
    │   └── Results Info
    │
    └── Smart Filter Panel (PROJ-17)
        ├── Quick Filters
        │   ├── Website (Ja/Nein/Egal)
        │   ├── Email (Ja/Nein/Egal)
        │   └── Telefon (Ja/Nein/Egal)
        │
        ├── Social Media Filters (Pro+)
        │   ├── Instagram (Ja/Nein/Egal)
        │   ├── Facebook (Ja/Nein/Egal)
        │   ├── LinkedIn (Ja/Nein/Egal)
        │   ├── YouTube (Ja/Nein/Egal)
        │   └── Twitter/X (Ja/Nein/Egal)
        │
        └── Rating Filters
            ├── Min/Max Bewertung (Slider)
            └── Min/Max Bewertungsanzahl (Slider)
```

### Component Inventory

| Component | Status | Pfad |
|-----------|--------|------|
| LeadResultsTable | COMPLETED | `src/components/search/lead-results-table.tsx` |
| LeadExportButton | COMPLETED | `src/components/search/lead-export-button.tsx` |
| LeadTableColumns | COMPLETED | `src/components/search/lead-table-columns.tsx` |
| FilterToggleGroup | COMPLETED | `src/components/search/filter-toggle-group.tsx` |
| ActiveFilters | COMPLETED | `src/components/search/active-filters.tsx` |
| PlanGate | COMPLETED | `src/components/search/plan-gate.tsx` |
| FilterRangeSlider | COMPLETED | `src/components/search/filter-range-slider.tsx` |
| SmartFilterPanel | PENDING | Noch zu implementieren |
| SearchPageClient | COMPLETED | `src/app/dashboard/suche/search-page-client.tsx` |

---

## 4. Data Model

### SearchResultLead (aus E4)

```typescript
interface SearchResultLead {
  id: string
  companyName: string
  address: string
  phone?: string
  email?: string
  website?: string
  googleMapsUrl: string
  rating?: number
  reviewsCount?: number
  category?: string
  contactPerson?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
    youtube?: string
  }
  openingHours?: Record<string, string>
  imageUrl?: string
}
```

### Filter State Interface

```typescript
interface FilterState {
  // Quick Filters (alle Plaene)
  hasWebsite: 'yes' | 'no' | 'any'
  hasEmail: 'yes' | 'no' | 'any'
  hasPhone: 'yes' | 'no' | 'any'

  // Smart Filters (Pro+)
  socialMedia: {
    instagram: 'yes' | 'no' | 'any'
    facebook: 'yes' | 'no' | 'any'
    linkedin: 'yes' | 'no' | 'any'
    youtube: 'yes' | 'no' | 'any'
    twitter: 'yes' | 'no' | 'any'
  }

  // Rating Filters (Pro+)
  ratingRange: {
    min: number  // 1.0 - 5.0
    max: number  // 1.0 - 5.0
  }
  reviewsCountRange: {
    min: number  // 0 - 1000+
    max: number  // 0 - 1000+
  }
}
```

### Column Visibility Config

```typescript
type PlanTier = 'free' | 'pro' | 'enterprise'

interface ColumnVisibilityConfig {
  industry: boolean      // Pro+
  employeeCount: boolean // Pro+
  rating: boolean        // Pro+
  reviewsCount: boolean  // Pro+
  socialLinks: boolean   // Enterprise
  phone: boolean         // Pro+
  export: boolean        // Pro+
}
```

---

## 5. Tech Decisions

### Warum TanStack Table?

**Entscheidung:** `@tanstack/react-table` fuer die Lead-Tabelle

**Begruendung:**
- Headless UI - volle Kontrolle ueber Styling mit shadcn/ui
- Eingebaute Features: Sortierung, Pagination, Zeilenauswahl
- Spalten-Visibility out-of-the-box
- Performant fuer grosse Datensaetze (500+ Leads)
- TypeScript-native

**Alternative:** Eigenbau mit React State
- Abgelehnt: Zu viel Boilerplate, Pagination/Sortierung komplex

### Warum Client-seitige Filter?

**Entscheidung:** Filter werden client-seitig auf geladene Ergebnisse angewendet

**Begruendung:**
- Alle Ergebnisse werden ohnehin geladen (max 500 Leads)
- Kein zusaetzlicher Backend-Code noetig
- Sofortiges Feedback (< 100ms)
- Einfache URL-Sync fuer Sharing

**Alternative:** Server-seitige Filter
- Abgelehnt: API muesste erweitert werden, kein Performance-Vorteil bei <500 Leads

### Warum Ja/Nein/Egal-Logik?

**Entscheidung:** Drei-Zustands-Filter statt einfacher Checkbox

**Begruendung:**
- "Egal" = Filter nicht aktiv (ignoriert das Feld)
- "Ja" = Nur Leads MIT diesem Attribut
- "Nein" = Nur Leads OHNE dieses Attribut
- Ermoeglicht gezielte Filterung nach fehlenden Daten

### Warum Pagination statt Infinite Scroll?

**Entscheidung:** Traditionelle Pagination mit 25/50/100 Optionen

**Begruendung:**
- Bessere UX fuer B2B-User (vergleichbar mit Excel/CRM)
- Filter-State bleibt bei Seitenwechsel erhalten
- Einfacheres Sharing von Suchergebnissen (Page in URL)
- Zeilenauswahl ueber Seiten hinweg moeglich

**Alternative:** Infinite Scroll
- Abgelehnt: Filter-UX komplexer, schwieriger zu teilen

---

## 6. Dependencies

### Bereits installiert

```json
{
  "@tanstack/react-table": "^8.20.6",
  "xlsx": "^0.18.5",
  "lucide-react": "latest",
  "@radix-ui/react-slider": "latest"
}
```

### Keine neuen Dependencies noetig

Alle fuer E5 benoetigten Libraries sind bereits installiert:
- **TanStack Table** - Tabellen-Funktionalitaet
- **xlsx** - Excel Export (Enterprise)
- **lucide-react** - Icons (Social Media, etc.)
- **@radix-ui/react-slider** - Range Slider (bereits via shadcn/ui)

---

## 7. Implementation Status

### PROJ-16: Lead-Ergebnis-Tabelle - COMPLETED

| Feature | Status | Datei |
|---------|--------|-------|
| Tabellen-Anzeige | COMPLETED | `lead-results-table.tsx` |
| Plan-basiertes Gating | COMPLETED | `plan-gate.tsx`, `lead-table-columns.tsx` |
| Spalten-Konfiguration | COMPLETED | `lead-results-table.tsx` |
| Sortierung | COMPLETED | `lead-table-columns.tsx` |
| Pagination | COMPLETED | `lead-results-table.tsx` |
| Zeilenauswahl | COMPLETED | `lead-table-columns.tsx` |
| CSV Export (Pro) | COMPLETED | `lead-export-button.tsx` |
| Excel Export (Enterprise) | COMPLETED | `lead-export-button.tsx` |

### PROJ-17: Smart-Filter - PARTIALLY COMPLETED

| Feature | Status | Datei |
|---------|--------|-------|
| FilterToggleGroup Komponente | COMPLETED | `filter-toggle-group.tsx` |
| ActiveFilters Komponente | COMPLETED | `active-filters.tsx` |
| RangeSlider Komponente | COMPLETED | `filter-range-slider.tsx` |
| Smart Filter Panel UI | PENDING | Noch zu implementieren |
| Filter-Logik (Client-seitig) | PENDING | Noch zu implementieren |
| URL-Sync fuer Filter | PENDING | Noch zu implementieren |
| Integration in LeadResultsTable | PENDING | Noch zu implementieren |

### Offene Arbeiten fuer Frontend Developer

1. **SmartFilterPanel Komponente erstellen**
   - Slide-over oder Dialog Design
   - Quick-Filter Section
   - Social Media Filter Section (Pro+ only)
   - Rating Filter Section (Pro+ only)
   - "Filter anwenden" / "Zuruecksetzen" Buttons

2. **Filter-Logik implementieren**
   - Hook: `useLeadFilters()`
   - Filter-Funktionen fuer Ja/Nein/Egal
   - UND-Verknuepfung aller aktiven Filter
   - Performance: < 100ms fuer 500 Leads

3. **URL-Sync implementieren**
   - Filter-State zu Query Params
   - Query Params zu Filter-State beim Laden
   - Beispiel: `?website=yes&rating_min=4.0`

4. **Integration in LeadResultsTable**
   - Filter-Button in Toolbar
   - ActiveFilters-Anzeige unter Toolbar
   - Gefilterte Daten an Tabelle uebergeben

---

## 8. Handoff Checklist

### Solution Architect -> Frontend Developer

- [x] Component Structure dokumentiert
- [x] Feature Matrix (Free/Pro/Enterprise) definiert
- [x] Tech Decisions begruendet
- [x] Dependencies aufgelistet
- [x] Offene Arbeiten identifiziert

### Bereits implementiert (keine Aenderung noetig)

- [x] LeadResultsTable mit TanStack Table
- [x] LeadExportButton mit CSV/Excel
- [x] PlanGate mit Blur-Effekt
- [x] LeadTableColumns mit Plan-Gating
- [x] FilterToggleGroup fuer Ja/Nein/Egal
- [x] ActiveFilters fuer Chip-Anzeige
- [x] SearchPageClient mit Integration

### Zu implementieren (Frontend Developer)

- [ ] SmartFilterPanel Komponente
- [ ] useLeadFilters Hook
- [ ] URL-Sync fuer Filter-State
- [ ] Integration Filter + Tabelle
- [ ] Upsell-UI fuer Free-User

---

## Appendix

### PlanGate Usage Example

```tsx
// In einer Tabellenzelle
{!visibility.phone ? (
  <PlanGate requiredPlan="pro" featureName="Telefonnummern">
    <span>-</span>
  </PlanGate>
) : (
  <a href={`tel:${phone}`}>{phone}</a>
)}
```

### Filter Toggle Usage Example

```tsx
<FilterToggleGroup
  label="Hat Website"
  value={filters.hasWebsite}
  onChange={(value) => setFilters({ ...filters, hasWebsite: value })}
/>
```

### Active Filters Usage Example

```tsx
<ActiveFilters
  filters={[
    { id: 'website', label: 'Website', value: 'Ja', type: 'toggle', state: 'yes' },
    { id: 'rating', label: 'Bewertung', value: '4.0-5.0', type: 'range' }
  ]}
  onRemove={(id) => removeFilter(id)}
  onReset={() => resetAllFilters()}
/>
```

---

**Dokument Version:** 1.0
**Autor:** Solution Architect
**Review Status:** Ready for Frontend Developer Handoff
