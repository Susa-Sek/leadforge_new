# PROJ-16: Lead-Ergebnis-Tabelle

**Status:** 🔵 Planned
**Epic:** E5 - Lead Ergebnis-Anzeige & Filter
**Abhängigkeiten:** PROJ-8 (User-Provider), PROJ-13 (Backend API)
**Letztes Update:** 2026-02-08

---

## User Stories

### US-16.1: Lead-Tabelle anzeigen
**Als User möchte ich meine Suchergebnisse in einer übersichtlichen Tabelle sehen, um die gefundenen Leads schnell zu überblicken.**

### US-16.2: Plan-basiertes Feature-Gating
**Als Free-User möchte ich sehen, welche Premium-Daten mir mit einem Upgrade zur Verfügung stehen würden.**

### US-16.3: Spalten-Konfiguration
**Als User möchte ich auswählen, welche Spalten in der Tabelle angezeigt werden.**

### US-16.4: Sortierung
**Als User möchte ich die Tabelle nach verschiedenen Spalten sortieren können.**

### US-16.5: Pagination
**Als User möchte ich bei vielen Ergebnissen durch die Liste navigieren können, ohne dass die Seite unübersichtlich wird.**

### US-16.6: Zeilen-Auswahl für Bulk-Aktionen
**Als User möchte ich mehrere Leads gleichzeitig auswählen können, um sie zu exportieren oder ins CRM zu importieren.**

---

## Acceptance Criteria

### Lead-Tabelle (US-16.1)
- [ ] Tabelle wird unter `/dashboard/suche` angezeigt (unter dem Suchformular/Progress)
- [ ] Tabelle zeigt mindestens 10 Zeilen ohne Scroll (Viewport-abhängig)
- [ ] Spalten: Firma, Adresse, Telefon, Bewertung (Sterne), Bewertungsanzahl
- [ ] Daten werden via `/api/search/results?searchId={id}` geladen
- [ ] Loading-State während des Ladens (Skeleton oder Spinner)
- [ ] "Keine Ergebnisse"-State wenn Suche 0 Leads zurückgibt

### Plan-basiertes Gating (US-16.2)
- [ ] Free-User sehen E-Mail und Website als geblurrt (CSS blur filter)
- [ ] Bei Hover über geblurrtes Feld: "Pro"-Badge erscheint
- [ ] Klick auf geblurrtes Feld öffnet Upgrade-Dialog oder leitet zu `/dashboard/preise`
- [ ] Entscheider/Kontaktperson ist für Free-User komplett ausgeblendet (nicht nur geblurrt)
- [ ] Social Media Icons sind für Free-User nicht sichtbar

### Spalten-Konfiguration (US-16.3)
- [ ] "Spalten"-Dropdown-Button oberhalb der Tabelle
- [ ] Dropdown zeigt alle verfügbaren Spalten (plan-abhängig)
- [ ] Checkbox pro Spalte zum Ein-/Ausschalten
- [ ] Mindestens 3 Spalten müssen immer sichtbar bleiben (Firma, Adresse, Telefon)
- [ ] Spalten-Konfiguration wird in `localStorage` pro User gespeichert
- [ ] Standard-Spalten für Free: Firma, Adresse, Telefon, Bewertung
- [ ] Standard-Spalten für Pro+: Alle verfügbaren Spalten

### Sortierung (US-16.4)
- [ ] Klick auf Spalten-Header sortiert nach dieser Spalte
- [ ] Erster Klick: Aufsteigend (A-Z, 0-9)
- [ ] Zweiter Klick: Absteigend (Z-A, 9-0)
- [ ] Dritter Klick: Zurück zu Original-Reihenfolge
- [ ] Sortier-Indikator (Pfeil-Icon) zeigt aktuelle Sortierung
- [ ] Sortierung funktioniert client-seitig (kein API-Call nötig)

**Sortierbare Spalten:** Firma, Adresse, Bewertung, Bewertungsanzahl

### Pagination (US-16.5)
- [ ] Bei <= 50 Ergebnissen: Keine Pagination (alle angezeigt)
- [ ] Bei > 50 Ergebnissen: Pagination mit 50 Einträgen pro Seite
- [ ] Pagination-Controls: "Zurück", Seitenzahlen (max 5 sichtbar), "Weiter"
- [ ] "Zeige X-Y von Z Ergebnissen"-Info über der Tabelle
- [ ] Seitenwechsel scrollt nicht (Position bleibt erhalten)

### Bulk-Aktionen (US-16.6)
- [ ] Checkbox in jeder Zeile (erste Spalte)
- [ ] Checkbox im Header wählt alle sichtbaren Zeilen aus/ab
- [ ] "X ausgewählt"-Anzeige über der Tabelle
- [ ] Bulk-Aktionen-Toolbar erscheint bei Auswahl:
  - [ ] "Exportieren" (CSV) - nur Pro+
  - [ ] "Zur Sammlung hinzufügen" (E6)
  - [ ] "Ins CRM importieren" (E7)
  - [ ] "Auswahl aufheben"

---

## Feature Matrix: Sichtbare Spalten

| Spalte | Free | Pro | Enterprise |
|--------|------|-----|------------|
| **Firma/Name** | Sichtbar | Sichtbar | Sichtbar |
| **Adresse** | Sichtbar | Sichtbar | Sichtbar |
| **Telefon** | Sichtbar | Sichtbar | Sichtbar |
| **Bewertung** | Sichtbar | Sichtbar | Sichtbar |
| **Bewertungsanzahl** | Sichtbar | Sichtbar | Sichtbar |
| **Kategorie** | Sichtbar | Sichtbar | Sichtbar |
| **Google Maps Link** | Sichtbar | Sichtbar | Sichtbar |
| **E-Mail** | Geblurrt | Sichtbar | Sichtbar |
| **Website** | Geblurrt | Sichtbar | Sichtbar |
| **Entscheider/Kontakt** | Geblurrt | Sichtbar | Sichtbar |
| **Social Media** | Nicht sichtbar | Sichtbar | Sichtbar |
| **Öffnungszeiten** | Nicht sichtbar | Sichtbar | Sichtbar |
| **Bild** | Nicht sichtbar | Sichtbar | Sichtbar |

---

## Edge Cases

| Scenario | Verhalten |
|----------|-----------|
| **0 Ergebnisse** | Leere-State mit Hinweis: "Keine Leads gefunden. Versuchen Sie einen anderen Suchbegriff oder Standort." + Link zur neuen Suche |
| **1 Ergebnis** | Tabelle zeigt ein Zeile, Pagination ausgeblendet |
| **Sehr lange Firmennamen** | Truncation mit ellipsis, Tooltip zeigt vollen Namen |
| **Fehlende Daten** | "-" oder "Nicht verfügbar" anzeigen (nicht leer lassen) |
| **Kein Telefon** | Trotzdem Zeile anzeigen (andere Daten können relevant sein) |
| **Mobile Ansicht** | Horizontaler Scroll innerhalb der Tabelle, Karten-Ansicht als Alternative |
| **500+ Ergebnisse** | Pagination bleibt, Performance durch Virtualisierung |
| **User ohne Plan** | Fallback auf Free (sollte nicht passieren, aber defensiv programmieren) |

---

## Export-Funktionen

### Export nach Plan

| Export-Format | Free | Pro | Enterprise |
|---------------|------|-----|------------|
| **CSV Export** | 10 Leads max | Unlimited | Unlimited |
| **Excel Export** | Nicht verfügbar | Unlimited | Unlimited |
| **PDF Export** | Nicht verfügbar | Nicht verfügbar | Unlimited |

### CSV Export Specs
- Encoding: UTF-8 mit BOM (für Excel-Kompatibilität)
- Separator: Semikolon (;)
- Dezimal: Komma (,) für deutsche Excel-Versionen
- Header-Zeile: Deutsche Überschriften
- Dateiname: `manyleads_[suchbegriff]_[datum]_[zeit].csv`

---

## Technische Anforderungen

### Performance
- **Initialer Load:** < 1s für erste 50 Ergebnisse
- **Pagination:** < 500ms für Seitenwechsel
- **Sortierung:** < 100ms für 500 Leads

### State Management
```typescript
interface ColumnConfig {
  visible: boolean;
  width?: number;
  sortDirection: 'asc' | 'desc' | null;
}

interface TableState {
  page: number;
  limit: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  selectedRows: string[]; // Lead IDs
  columnConfig: Record<string, ColumnConfig>;
}
```

---

## UI/UX Design

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  SUCHERGEBNISSE (125 Leads)                              [Spalten ▼]   │
├─────────────────────────────────────────────────────────────────────────┤
│  [ ]  Firma      Adresse      Telefon      E-Mail      Bewertung       │
│  ─────────────────────────────────────────────────────────────────────  │
│  [ ]  Muster...  Musterstr..  +49...       [BLURRED]   ★★★★☆ (23)      │
│  [ ]  Beispiel.. Beispiel..   +49...       [BLURRED]   ★★★★★ (45)      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
- Karten-Ansicht statt Tabelle
- Jede Karte zeigt: Firma, Adresse, Telefon, Bewertung
- "Mehr"-Button für zusätzliche Details (Pro)

---

## Abhängigkeiten

### Benötigt von:
- PROJ-8 (User-Provider) - für Plan-Information
- PROJ-13 (Backend API) - `/api/search/results`
- E4 (Lead-Suche) - COMPLETED

### Blockt:
- PROJ-17 (Smart-Filter)
- PROJ-18 (Sammlungen)
- PROJ-25 (CSV Export)
- PROJ-20 (CRM)

---

## Komponenten-Struktur

```
src/components/search/lead-table/
├── lead-table.tsx              # Haupt-Komponente
├── lead-table-row.tsx          # Einzelne Zeile
├── lead-table-header.tsx       # Header mit Sortierung
├── lead-table-pagination.tsx   # Pagination-Controls
├── column-configurator.tsx     # Spalten-Auswahl
├── lead-blur-overlay.tsx       # Blur-Effekt für Free
├── bulk-actions-toolbar.tsx    # Bulk-Aktionen
└── export-dropdown.tsx         # Export-Optionen
```

---

## QA Test Results

**Tested:** 2026-02-07
**Tester:** QA Engineer
**Status:** ⚠️ PARTIAL - Needs Fixes

### Acceptance Criteria Status

#### US-16.1: Lead-Tabelle anzeigen
- [x] Tabelle wird unter `/dashboard/suche` angezeigt
- [x] Daten werden via `/api/search/results` geladen
- [x] Loading-State (Skeleton) implementiert
- [x] "Keine Ergebnisse"-State vorhanden
- [~] Tabelle zeigt mindestens 10 Zeilen ohne Scroll (Default ist 25)
- [~] Spalten: Firma, Adresse sind sichtbar (Telefon, Bewertung sind Pro-Features)

#### US-16.2: Plan-basiertes Feature-Gating
- [x] "Pro"-Badge bei Hover über geblurrtes Feld
- [x] Klick auf geblurrtes Feld öffnet Upgrade-Dialog
- [~] Social Media Icons nicht sichtbar für Free (Spalte fehlt komplett)
- [~] **ABWEICHUNG:** E-Mail und Website sind für Free SICHTBAR (sollten geblurrt sein)
- [~] **ABWEICHUNG:** Entscheider/Kontakt ist sichtbar (sollte ausgeblendet sein)
- [~] **ABWEICHUNG:** Öffnungszeiten und Bild sind nicht in der Tabelle

#### US-16.3: Spalten-Konfiguration
- [x] "Spalten" Dropdown-Button oberhalb der Tabelle
- [x] Dropdown zeigt alle verfügbaren Spalten
- [x] Checkbox pro Spalte zum Ein-/Ausschalten
- [ ] ❌ Spalten-Konfiguration wird NICHT in localStorage gespeichert
- [~] Mindestens 3 Spalten sichtbar (nicht enforced)

#### US-16.4: Sortierung
- [x] Klick auf Spalten-Header sortiert
- [x] Aufsteigend/Absteigend Toggle
- [x] Sortier-Indikator (Pfeil-Icon) vorhanden
- [x] Client-seitige Sortierung
- [ ] ❌ Dritter Klick auf Original-Reihenfolge fehlt

#### US-16.5: Pagination
- [x] Pagination mit wählbaren Seitengrößen (10, 25, 50, 100)
- [x] Pagination-Controls: "Zurück", Seitenzahlen, "Weiter"
- [x] "Zeige X-Y von Z Ergebnissen"-Info
- [x] Seitenwechsel ohne Scroll
- [ ] ❌ Pagination wird IMMER angezeigt (sollte bei <= 50 ausgeblendet sein)

#### US-16.6: Zeilen-Auswahl für Bulk-Aktionen
- [x] Checkbox in jeder Zeile
- [x] Checkbox im Header wählt alle aus/ab
- [x] "X ausgewählt"-Anzeige über der Tabelle
- [ ] ❌ Bulk-Aktionen-Toolbar fehlt komplett
- [~] "Exportieren" ist verfügbar (aber nicht in Toolbar)
- [ ] ❌ "Zur Sammlung hinzufügen" (E6) fehlt
- [ ] ❌ "Ins CRM importieren" (E7) fehlt

### Bugs Found

#### BUG-1: Plan-Gating Abweichung
- **Severity:** 🔴 Critical
- **Beschreibung:** E-Mail und Website sind für Free-User vollständig sichtbar, sollten aber geblurrt sein
- **Impact:** Free-User sehen Premium-Daten ohne Upgrade

#### BUG-2: Spalten-Konfiguration nicht persistent
- **Severity:** 🟠 High
- **Beschreibung:** Spalten-Einstellungen gehen beim Reload verloren
- **Expected:** localStorage Speicherung
- **Actual:** Keine Persistenz

#### BUG-3: CSV Format falsch
- **Severity:** 🟠 High
- **Beschreibung:** CSV verwendet Komma statt Semikolon
- **Expected:** `Firma;Adresse;Telefon` (Semikolon)
- **Actual:** `Firma,Adresse,Telefon` (Komma)

#### BUG-4: Bulk-Aktionen-Toolbar fehlt
- **Severity:** 🟠 High
- **Beschreibung:** Keine Toolbar für Massen-Aktionen
- **Missing:** Export, Sammlung, CRM Import

#### BUG-5: Fehlende Spalten
- **Severity:** 🟡 Medium
- **Beschreibung:** Öffnungszeiten und Bild-Spalte fehlen komplett

### Test Summary
- ✅ 12 von 22 Acceptance Criteria passed
- ⚠️ 5 teilweise erfüllt
- ❌ 5 nicht erfüllt
- **Recommendation:** Fixes vor Deployment erforderlich

### Report Link
Vollständiger Report: `/docs/E5-QA-REPORT.md`

---

## Deployment

*To be filled by DevOps Engineer after deployment*
