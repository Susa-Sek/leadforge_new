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

| Scenario | Verhalten | Fehlermeldung |
|----------|-----------|---------------|
| **0 Ergebnisse** | Leere-State mit Hinweis: "Keine Leads gefunden. Versuchen Sie einen anderen Suchbegriff oder Standort." + Link zur neuen Suche | - |
| **1 Ergebnis** | Tabelle zeigt ein Zeile, Pagination ausgeblendet | - |
| **Sehr lange Firmennamen** | Truncation mit ellipsis, Tooltip zeigt vollen Namen | - |
| **Fehlende Daten** | "-" oder "Nicht verfügbar" anzeigen (nicht leer lassen) | - |
| **Kein Telefon** | Trotzdem Zeile anzeigen (andere Daten können relevant sein) | - |
| **Mobile Ansicht** | Horizontaler Scroll innerhalb der Tabelle, Karten-Ansicht als Alternative | - |
| **500+ Ergebnisse** | Pagination bleibt, Performance durch Virtualisierung | - |
| **User ohne Plan** | Fallback auf Free (sollte nicht passieren, aber defensiv programmieren) | - |

### Additional Edge Cases - Data & Input Bounds

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-DATA-01** | Leerer Firmenname | Lead hat leeren String als Firmennamen | Zeile anzeigen mit "[Unbekannte Firma]" als Placeholder | - |
| **EC-DATA-02** | Null-Werte in Pflichtfeldern | Datenbank liefert null für required fields (Firma, Adresse) | Defensive Anzeige mit "Nicht verfügbar", keine Crash | - |
| **EC-DATA-03** | Extrem lange Adressen (>200 Zeichen) | Straße + PLZ + Ort + Zusatz überschreitet 200 Zeichen | Truncation mit "...", Tooltip zeigt vollständige Adresse | - |
| **EC-DATA-04** | Ungültige Telefonnummern | Datenbank enthält nicht-numerische Zeichen oder leeren String | Anzeige wie gespeichert, keine Validierung nötig | - |
| **EC-DATA-05** | Negative Bewertungen | Datenbank enthält negative Werte oder > 5.0 | Clamping auf 0-5 Bereich, Anzeige mit validem Rating | - |
| **EC-DATA-06** | Falsche Daten-Typen | API liefert unerwartete Typen (String statt Number für Rating) | Graceful Fallback, Type-Checking vor Anzeige | - |
| **EC-DATA-07** | Duplikate in Ergebnissen | Zwei Leads mit identischer Firma und Adresse | Beide anzeigen (keine Deduplizierung), User entscheidet | - |
| **EC-DATA-08** | Spezialzeichen in Firmennamen | Emoji, HTML-Tags, SQL-Injection-versuche in Namen | HTML-Escaping, Sanitization vor Anzeige | - |

### Additional Edge Cases - State & Navigation

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-STATE-01** | Browser-Back nach Seitenwechsel | User navigiert zu Seite 3, klickt Back-Button | Filter/Sortierung/Pagination bleiben erhalten via URL | - |
| **EC-STATE-02** | Session-Timeout während Betrachtung | User lässt Tab offen, Session läuft ab | Beim nächsten Klick: Redirect zu Anmeldung mit Return-URL | "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an." |
| **EC-STATE-03** | Multi-Tab-Szenario | Gleiche Suche in 2 Tabs geöffnet, User ändert Filter in Tab 1 | Tab 2 zeigt eigenen State (keine Synchronisation erwartet) | - |
| **EC-STATE-04** | Page-Reload während Loading | User drückt F5 während Daten geladen werden | Loading-State neu starten, kein hängender Zustand | - |
| **EC-STATE-05** | Sortierung ändern während Loading | User klickt schnell mehrmals auf Header während Loading | Debounced clicks, nur letzter Klick verarbeiten | - |

### Additional Edge Cases - Browser & Storage

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-BROWSER-01** | LocalStorage voll (Column Config) | QuotaExceededError beim Speichern der Spaltenkonfiguration | Graceful Degradation: Config nicht speichern, trotzdem funktioniert Tabelle | - |
| **EC-BROWSER-02** | LocalStorage deaktiviert | User hat Storage-API blockiert | Config wird nicht persistiert, Standard-Spalten bei jedem Reload | - |
| **EC-BROWSER-03** | Cookies blockiert | Session-Cookies werden blockiert | Keine Authentifizierung möglich, Redirect zu Login | "Cookies sind erforderlich. Bitte aktivieren Sie Cookies." |
| **EC-BROWSER-04** | Incognito/Private Mode | Browser im Private Mode | LocalStorage temporär, funktioniert aber für Session | - |
| **EC-BROWSER-05** | Mobile Safari iOS Scroll-Bug | iOS Safari springt bei Pagination | Scroll-Position explizit speichern und wiederherstellen | - |
| **EC-BROWSER-06** | Zoom > 200% | User zoomt stark rein | Horizontaler Scroll ermöglicht Zugriff auf alle Spalten | - |
| **EC-BROWSER-07** | Print-Mode | User drückt Ctrl+P auf Ergebnisseiten | Print-optimierte CSS-Styles, Pagination-Controls ausblenden | - |

### Additional Edge Cases - Network & API

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-NET-01** | API Timeout beim Laden | `/api/search/results` antwortet nicht nach 30s | Timeout-Error anzeigen, Retry-Button anbieten | "Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut." |
| **EC-NET-02** | API liefert 500 Error | Server-Error beim Abrufen der Ergebnisse | Error-State mit Retry-Option, keine leere Tabelle | "Ein Server-Fehler ist aufgetreten. Bitte laden Sie die Seite neu." |
| **EC-NET-03** | API liefert 403 Forbidden | User hat keine Berechtigung für diese Suche | Redirect zu Dashboard mit Hinweis | "Sie haben keine Berechtigung für diese Daten." |
| **EC-NET-04** | API liefert 404 Not Found | searchId existiert nicht (gelöscht/expired) | Redirect zur Suche mit Hinweis | "Diese Suche wurde nicht gefunden. Möglicherweise ist sie abgelaufen." |
| **EC-NET-05** | Langsame Verbindung (>5s Load) | Netzwerk ist langsam, Daten brauchen lange | Progressive Loading, Skeleton bleibt sichtbar | - |
| **EC-NET-06** | Abrupte Verbindungstrennung | User verliert Internet während Tabelle lädt | Netzwerk-Error, Offline-Indikator | "Verbindung unterbrochen. Bitte prüfen Sie Ihre Internet-Verbindung." |
| **EC-NET-07** | Rate Limiting (429) | Zu viele Requests an API | Exponentieller Backoff, Retry nach Delay | "Zu viele Anfragen. Bitte warten Sie einen Moment." |

### Additional Edge Cases - Plan & Permissions

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-PLAN-01** | Plan-Upgrade während Session | User upgraded von Free zu Pro, Tab bleibt offen | Berechtigungen neu laden, Spalten automatisch entsperren | - |
| **EC-PLAN-02** | Plan-Downgrade während Session | Subscription läuft ab während Nutzung | Bei nächstem Action: Upgrade-Prompt, aktuelle Daten bleiben sichtbar | "Ihr Abonnement ist abgelaufen. Bitte erneuern Sie es." |
| **EC-PLAN-03** | Gleichzeitiger Zugriff mit verschiedenen Plänen | User hat 2 Tabs: einer vor, einer nach Upgrade | Jeder Tab zeigt eigenen Plan-Status (keine Synchronisation) | - |
| **EC-PLAN-04** | Export-Limit erreicht | Free-User versucht 11. Lead zu exportieren | Block mit Hinweis auf Limit | "Maximal 10 Leads im Free-Plan. Upgrade für unbegrenzte Exports." |
| **EC-PLAN-05** | Abgelaufene Suche anzeigen | Suche ist älter als 30 Tage (Retention-Policy) | Daten anzeigen aber mit Hinweis, dass sie veraltet sind | "Diese Daten sind älter als 30 Tage. Führen Sie eine neue Suche durch." |

### Additional Edge Cases - Export & CSV

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-EXPORT-01** | 0 Zeilen ausgewählt für Export | User klickt Export ohne Auswahl | Export aller sichtbaren Leads (Fallback) oder Hinweis | "Keine Zeilen ausgewählt. Möchten Sie alle Leads exportieren?" |
| **EC-EXPORT-02** | Export mit sehr langem Dateinamen | Suchbegriff > 50 Zeichen | Dateiname auf 50 Zeichen kürzen + Timestamp | - |
| **EC-EXPORT-03** | CSV enthält Semikolon in Daten | Firmenname enthält ";" | Proper CSV-Escaping mit Anführungszeichen | - |
| **EC-EXPORT-04** | CSV enthält Zeilenumbrüche | Adresse hat mehrere Zeilen | CSV-Escaping, Zeilenumbrüche in Zellen erlaubt | - |
| **EC-EXPORT-05** | Export bei blockierten Popups | Browser blockiert Download | Hinweis auf Popup-Blocker, manueller Download-Button | "Bitte erlauben Sie Popups für Downloads." |
| **EC-EXPORT-06** | Excel-Export mit >1M Zeilen | Enterprise-User will zu viele Daten exportieren | Limit auf 100k Zeilen, Hinweis auf CSV für große Daten | "Excel-Export auf 100.000 Zeilen limitiert. Verwenden Sie CSV für mehr Daten." |

### Additional Edge Cases - Bulk Actions

| ID | Scenario | Beschreibung | Erwartetes Verhalten | Fehlermeldung |
|----|----------|--------------|---------------------|---------------|
| **EC-BULK-01** | 500+ Zeilen ausgewählt | User wählt alle auf mehreren Seiten | "Alle X ausgewählt" anzeigen, Pagination-Info beibehalten | - |
| **EC-BULK-02** | Auswahl über Seitenwechsel hinweg | User wählt auf Seite 1, wechselt zu Seite 2, wählt mehr | Auswahl persistiert über Seiten, Counter zeigt Gesamtanzahl | - |
| **EC-BULK-03** | Deselect einzelner Zeilen nach "Alle auswählen" | User wählt alle, deselektiert dann einzelne | "Fast alle ausgewählt"-State, Checkbox im Header als Indeterminate | - |
| **EC-BULK-04** | CRM-Import mit unvollständigen Daten | Ausgewählte Leads haben keinen Namen/E-Mail | Leads trotzdem importieren, CRM entscheidet über Validierung | - |
| **EC-BULK-05** | Sammlung hinzufügen während Sammlung gelöscht wird | Race Condition: User fügt hinzu, andere Session löscht Sammlung | Error mit Hinweis, dass Sammlung nicht existiert | "Die Sammlung existiert nicht mehr. Bitte wählen Sie eine andere." |

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
