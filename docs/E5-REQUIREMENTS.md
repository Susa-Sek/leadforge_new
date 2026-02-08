# Epic E5: Lead Ergebnis-Anzeige & Filter - Requirements

**Status:** IN PROGRESS
**Epic ID:** E5
**Projekte:** PROJ-16, PROJ-17
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E5 deckt die Anzeige und Filterung von Lead-Suchergebnissen ab. Nachdem Epic E4 (Lead-Suche) abgeschlossen ist, können User nun die gefundenen Leads in einer übersichtlichen Tabelle betrachten und mit einem intelligenten Filter-System verfeinern.

**Kontext:**
- E4 ist COMPLETED - API `/api/search/results` ist verfügbar
- Credit-System ist vollständig implementiert (PROJ-10)
- User-Plan-Konfiguration existiert (Free, Pro, Enterprise)
- Keine Backend-Arbeiten für E5 nötig - bestehende API wird verwendet

---

## PROJ-16: Lead-Ergebnis-Tabelle

**Status:** 🔵 Planned
**Abhängigkeiten:** PROJ-13 (Backend API), PROJ-8 (User-Provider für Plan-Info)

### Beschreibung

Tabellarische Anzeige der Suchergebnisse mit plan-basiertem Feature-Gating. Die Tabelle zeigt Lead-Daten an und blendet Premium-Daten basierend auf dem User-Plan ein oder aus (mit Blur-Effekt).

---

### Feature Matrix: Sichtbare Spalten nach Plan

| Spalte | Free (30 Credits) | Pro | Enterprise |
|--------|-------------------|-----|------------|
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

**Geblurrt =** Partial blur mit "Pro"-Badge und Upgrade-CTA bei Hover

---

### User Stories

#### US-16.1: Lead-Tabelle anzeigen
**Als User möchte ich meine Suchergebnisse in einer übersichtlichen Tabelle sehen, um die gefundenen Leads schnell zu überblicken.**

**Acceptance Criteria:**
- [ ] Tabelle wird unter `/dashboard/suche` angezeigt (unter dem Suchformular/Progress)
- [ ] Tabelle zeigt mindestens 10 Zeilen ohne Scroll (Viewport-abhängig)
- [ ] Spalten: Firma, Adresse, Telefon, Bewertung (Sterne), Bewertungsanzahl
- [ ] Daten werden via `/api/search/results?searchId={id}` geladen
- [ ] Loading-State während des Ladens (Skeleton oder Spinner)
- [ ] "Keine Ergebnisse"-State wenn Suche 0 Leads zurückgibt

#### US-16.2: Plan-basiertes Feature-Gating
**Als Free-User möchte ich sehen, welche Premium-Daten mir mit einem Upgrade zur Verfügung stehen würden.**

**Acceptance Criteria:**
- [ ] Free-User sehen E-Mail und Website als geblurrt (CSS blur filter)
- [ ] Bei Hover über geblurrtes Feld: "Pro"-Badge erscheint
- [ ] Klick auf geblurrtes Feld öffnet Upgrade-Dialog oder leitet zu `/dashboard/preise`
- [ ] Entscheider/Kontaktperson ist für Free-User komplett ausgeblendet (nicht nur geblurrt)
- [ ] Social Media Icons sind für Free-User nicht sichtbar

#### US-16.3: Spalten-Konfiguration
**Als User möchte ich auswählen, welche Spalten in der Tabelle angezeigt werden.**

**Acceptance Criteria:**
- [ ] "Spalten"-Dropdown-Button oberhalb der Tabelle
- [ ] Dropdown zeigt alle verfügbaren Spalten (plan-abhängig)
- [ ] Checkbox pro Spalte zum Ein-/Ausschalten
- [ ] Mindestens 3 Spalten müssen immer sichtbar bleiben (Firma, Adresse, Telefon)
- [ ] Spalten-Konfiguration wird in `localStorage` pro User gespeichert
- [ ] Standard-Spalten für Free: Firma, Adresse, Telefon, Bewertung
- [ ] Standard-Spalten für Pro+: Alle verfügbaren Spalten

#### US-16.4: Sortierung
**Als User möchte ich die Tabelle nach verschiedenen Spalten sortieren können.**

**Acceptance Criteria:**
- [ ] Klick auf Spalten-Header sortiert nach dieser Spalte
- [ ] Erster Klick: Aufsteigend (A-Z, 0-9)
- [ ] Zweiter Klick: Absteigend (Z-A, 9-0)
- [ ] Dritter Klick: Zurück zu Original-Reihenfolge
- [ ] Sortier-Indikator (Pfeil-Icon) zeigt aktuelle Sortierung
- [ ] Sortierung funktioniert client-seitig (kein API-Call nötig)

**Sortierbare Spalten:**
- Firma (alphabetisch)
- Adresse (alphabetisch)
- Bewertung (numerisch)
- Bewertungsanzahl (numerisch)

#### US-16.5: Pagination vs Infinite Scroll
**Als User möchte ich bei vielen Ergebnissen durch die Liste navigieren können, ohne dass die Seite unübersichtlich wird.**

**Acceptance Criteria:**
- [ ] Bei <= 50 Ergebnissen: Keine Pagination (alle angezeigt)
- [ ] Bei > 50 Ergebnissen: Pagination mit 50 Einträgen pro Seite
- [ ] Pagination-Controls: "Zurück", Seitenzahlen (max 5 sichtbar), "Weiter"
- [ ] "Zeige X-Y von Z Ergebnissen"-Info über der Tabelle
- [ ] Seitenwechsel scrollt nicht (Position bleibt erhalten)
- [ ] Alternative: Infinite Scroll mit "Mehr laden"-Button (Design-Entscheidung)

**Empfohlene Implementation:** Pagination (besser für SEO, Sharing, Filter)

#### US-16.6: Zeilen-Auswahl für Bulk-Aktionen
**Als User möchte ich mehrere Leads gleichzeitig auswählen können, um sie zu exportieren oder ins CRM zu importieren.**

**Acceptance Criteria:**
- [ ] Checkbox in jeder Zeile (erste Spalte)
- [ ] Checkbox im Header wählt alle sichtbaren Zeilen aus/ ab
- [ ] "X ausgewählt"-Anzeige über der Tabelle
- [ ] Bulk-Aktionen-Toolbar erscheint bei Auswahl:
  - [ ] "Exportieren" (CSV) - nur Pro+
  - [ ] "Zur Sammlung hinzufügen" (E6)
  - [ ] "Ins CRM importieren" (E7)
  - [ ] "Auswahl aufheben"

---

### Edge Cases

| Scenario | Verhalten |
|----------|-----------|
| **0 Ergebnisse** | Leere-State mit Hinweis: "Keine Leads gefunden. Versuchen Sie einen anderen Suchbegriff oder Standort." + Link zur neuen Suche |
| **1 Ergebnis** | Tabelle zeigt ein Zeile, Pagination ausgeblendet |
| **Sehr lange Firmennamen** | Truncation mit ellipsis, Tooltip zeigt vollen Namen |
| **Fehlende Daten** | "-" oder "Nicht verfügbar" anzeigen (nicht leer lassen) |
| **Kein Telefon** | Trotzdem Zeile anzeigen (andere Daten können relevant sein) |
| **Mobile Ansicht** | Horizontaler Scroll innerhalb der Tabelle, Karten-Ansicht als Alternative |
| **500+ Ergebnisse** | Pagination bleibt, Performance durch Virtualisierung (react-window) |
| **User ohne Plan** | Fallback auf Free (sollte nicht passieren, aber defensiv programmieren) |

#### Zusätzliche Edge Cases für PROJ-16

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-16-01** | Daten | Leerer/null Firmenname | "[Unbekannte Firma]" als Placeholder |
| **EC-16-02** | Daten | Extrem lange Adressen (>200 Zeichen) | Truncation mit Tooltip |
| **EC-16-03** | Daten | Negative Bewertungen (>5 oder <0) | Clamping auf 0-5 Bereich |
| **EC-16-04** | Daten | Duplikate in Ergebnissen | Beide anzeigen, keine Deduplizierung |
| **EC-16-05** | Daten | Spezialzeichen/SQL-Injection in Namen | HTML-Escaping, Sanitization |
| **EC-16-06** | State | Session-Timeout während Betrachtung | Redirect zu Login mit Return-URL |
| **EC-16-07** | State | Sortierung während Loading | Debounced clicks |
| **EC-16-08** | Browser | LocalStorage voll | Graceful Degradation, keine Persistenz |
| **EC-16-09** | Browser | LocalStorage/Cookies blockiert | Standard-Verhalten, Hinweis bei Bedarf |
| **EC-16-10** | Network | API Timeout (>30s) | Timeout-Error, Retry-Button |
| **EC-16-11** | Network | 500/403/404 von API | Error-State mit spezifischer Message |
| **EC-16-12** | Network | Rate Limiting (429) | Exponentieller Backoff |
| **EC-16-13** | Plan | Upgrade während Session | Berechtigungen neu laden |
| **EC-16-14** | Plan | Export-Limit erreicht (Free) | Block mit Hinweis |
| **EC-16-15** | Export | 0 Zeilen ausgewählt | Alle sichtbaren exportieren oder Hinweis |
| **EC-16-16** | Export | CSV mit Semikolon/Zeilenumbrüchen | Proper CSV-Escaping |
| **EC-16-17** | Bulk | 500+ Zeilen ausgewählt | "Alle X ausgewählt" über Seiten |
| **EC-16-18** | Bulk | Race Condition bei Sammlung hinzufügen | Error wenn Sammlung gelöscht |

---

### Export-Funktionen (Teil von PROJ-16)

#### Export nach Plan

| Export-Format | Free | Pro | Enterprise |
|---------------|------|-----|------------|
| **CSV Export** | 10 Leads max | Unlimited | Unlimited |
| **Excel Export** | Nicht verfügbar | Unlimited | Unlimited |
| **PDF Export** | Nicht verfügbar | Nicht verfügbar | Unlimited |

**CSV Export Specs:**
- Encoding: UTF-8 mit BOM (für Excel-Kompatibilität)
- Separator: Semikolon (;)
- Dezimal: Komma (,) für deutsche Excel-Versionen
- Header-Zeile: Deutsche Überschriften
- Dateiname: `manyleads_[suchbegriff]_[datum]_[zeit].csv`

**Beispiel CSV:**
```csv
Firma;Adresse;Telefon;E-Mail;Website;Bewertung;Bewertungen;Kategorie
Musterfirma GmbH;Musterstraße 1, 20095 Hamburg;+49 40 123456;info@musterfirma.de;https://musterfirma.de;4,5;23;IT & Software
```

---

## PROJ-17: Smart-Filter-System

**Status:** 🔵 Planned
**Abhängigkeiten:** PROJ-16 (Lead-Tabelle), bestehende API `/api/search/results`

### Beschreibung

Erweitertes Filter-System mit Ja/Nein/Egal-Logik für Social Media, Kontaktdaten und Qualitäts-Attribute. Filter werden client-seitig auf die geladenen Ergebnisse angewendet.

---

### Filter nach Plan

| Filter-Typ | Free | Pro | Enterprise |
|------------|------|-----|------------|
| **Quick-Filter** | Verfügbar | Verfügbar | Verfügbar |
| **Smart-Filter** | Nicht verfügbar | Verfügbar | Verfügbar |
| **Bewertungs-Filter** | Basis (1-5) | Erweitert (Range) | Erweitert (Range) |

---

### User Stories

#### US-17.1: Quick-Filter für alle Pläne
**Als User möchte ich schnell nach grundlegenden Attributen filtern können.**

**Acceptance Criteria:**
- [ ] Quick-Filter-Badges oberhalb der Tabelle
- [ ] Filter: "Mit Website", "Mit E-Mail", "Mit Telefon", "Bewertung >= 4"
- [ ] Klick auf Badge aktiviert/deaktiviert Filter
- [ ] Mehrere Quick-Filter können gleichzeitig aktiv sein (UND-Verknüpfung)
- [ ] Aktive Filter werden als Badge mit X-Icon angezeigt
- [ ] "Alle Filter zurücksetzen"-Button

#### US-17.2: Smart-Filter mit Ja/Nein/Egal-Logik
**Als Pro-User möchte ich nach Social-Media-Präsenz filtern können.**

**Filter-Felder:**

| Feld | Optionen | Beschreibung |
|------|----------|--------------|
| **Instagram** | Ja / Nein / Egal | Hat Instagram-Link |
| **Facebook** | Ja / Nein / Egal | Hat Facebook-Link |
| **LinkedIn** | Ja / Nein / Egal | Hat LinkedIn-Link |
| **YouTube** | Ja / Nein / Egal | Hat YouTube-Link |
| **TikTok** | Ja / Nein / Egal | Hat TikTok-Link |
| **Twitter/X** | Ja / Nein / Egal | Hat Twitter-Link |

**Ja/Nein/Egal-Logik:**
- **Ja:** Zeige nur Leads MIT diesem Attribut
- **Nein:** Zeige nur Leads OHNE dieses Attribut
- **Egal:** Dieses Attribut ist nicht relevant (Filter nicht aktiv)

**Acceptance Criteria:**
- [ ] "Smart Filter"-Button öffnet Filter-Panel/Dialog
- [ ] Toggle- oder Radio-Buttons für Ja/Nein/Egal pro Feld
- [ ] Standard-Einstellung: "Egal" für alle Felder
- [ ] "Egal"-Option visuell deutlich weniger prominent
- [ ] Filter werden sofort angewendet (kein "Anwenden"-Button nötig)
- [ ] Anzahl der gefilterten Ergebnisse wird live aktualisiert

#### US-17.3: Bewertungs-Filter
**Als User möchte ich nach Bewertung und Bewertungsanzahl filtern können.**

**Acceptance Criteria:**
- [ ] Slider für Min-Bewertung (1.0 - 5.0)
- [ ] Slider für Max-Bewertung (1.0 - 5.0)
- [ ] Min/Max Slider für Bewertungsanzahl (0 - 1000+)
- [ ] Predefined Quick-Filters: "Top-Rated (4.5+)", "Viele Bewertungen (50+)"
- [ ] Range-Filter als Dual-Range-Slider oder zwei einzelne Slider

#### US-17.4: Filter-Status anzeigen
**Als User möchte ich immer sehen, welche Filter aktiv sind.**

**Acceptance Criteria:**
- [ ] Filter-Badge-Count in der "Filter"-Button (z.B. "Filter (3)")
- [ ] Aktive Filter als Chips oberhalb der Tabelle
- [ ] Jeder Chip zeigt: Filter-Name + Wert + X zum Entfernen
- [ ] "Alle zurücksetzen"-Link wenn Filter aktiv
- [ ] Persistenz: Filter-State in URL als Query-Params (für Sharing)

**URL-Format:**
```
/dashboard/suche?searchId=xxx&website=ja&email=ja&rating_min=4.0&instagram=ja
```

#### US-17.5: Upsell für Smart-Filter (Free/Starter)
**Als Free-User möchte ich sehen, dass Smart-Filter ein Pro-Feature sind.**

**Acceptance Criteria:**
- [ ] "Smart Filter"-Button ist für Free-User sichtbar aber deaktiviert/locked
- [ ] Bei Klick/Klick auf Locked-Filter: Upsell-Dialog oder Tooltip
- [ ] Dialog zeigt: "Smart Filter sind ein Pro-Feature"
- [ ] Button: "Jetzt upgraden" -> Link zu `/dashboard/preise`
- [ ] Vorteile auflisten: "Filter nach Social Media", "Erweiterte Bewertungs-Filter"

---

### UI/UX für Filter-Interface

#### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SUCHERGEBNISSE (125 Leads)                              [Spalten ▼]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Quick-Filter:  [Mit Website] [Mit E-Mail] [Mit Telefon] [4.5+ ★]      │
│                                                                         │
│  [Smart Filter ▼]  [Filter (3) ✕]  [25 von 125 Leads angezeigt]        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Firma │ Adresse │ Telefon │ E-Mail │ Bewertung │ ...            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ...   │ ...     │ ...     │ ...    │ ...       │ ...            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ←  1  2  3  4  5  →                              Zeige 1-25 von 125   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Smart Filter Panel (Slide-over oder Dropdown)

```
┌────────────────────────────────────────────────────────┐
│  Smart Filter                                    [X]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  SOCIAL MEDIA                                          │
│  ───────────────────────────────────────────────────── │
│  Instagram    [Egal]  [Ja ●]  [Nein]                   │
│  Facebook     [Egal]  [Ja]    [Nein ●]                 │
│  LinkedIn     [Egal ●] [Ja]    [Nein]                  │
│  YouTube      [Egal ●] [Ja]    [Nein]                  │
│  TikTok       [Egal]  [Ja ●]  [Nein]                   │
│  Twitter      [Egal ●] [Ja]    [Nein]                  │
│                                                        │
│  BEWERTUNG                                             │
│  ───────────────────────────────────────────────────── │
│  Mindestens:    [====●=========] 4.0                   │
│  Höchstens:     [=========●====] 5.0                   │
│                                                        │
│  ANZAHL BEWERTUNGEN                                    │
│  ───────────────────────────────────────────────────── │
│  Mindestens:    [●==============] 0                    │
│  Höchstens:     [===========●===] 100                  │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  25 Leads entsprechen diesen Filtern           │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [Alle zurücksetzen]              [Filter anwenden]   │
└────────────────────────────────────────────────────────┘
```

---

### Filter-Logik

#### UND vs ODER

Alle Filter werden UND-verknüpft:
- "Mit Website" UND "Mit E-Mail" = Nur Leads mit BEIDEM
- "Instagram: Ja" UND "Facebook: Egal" = Leads mit Instagram (Facebook egal)
- "Bewertung >= 4" UND "Bewertungen >= 50" = Nur sehr gute, häufig bewertete

#### Kombinations-Matrix (Beispiel Social Media)

| Instagram | Facebook | LinkedIn | Ergebnis |
|-----------|----------|----------|----------|
| Egal | Egal | Egal | Alle Leads |
| Ja | Egal | Egal | Nur mit Instagram |
| Nein | Egal | Egal | Nur ohne Instagram |
| Ja | Ja | Egal | Mit Instagram UND Facebook |
| Ja | Nein | Egal | Mit Instagram aber OHNE Facebook |

#### Edge Cases für PROJ-17

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-17-01** | Input | Ungültige URL-Parameter (`rating_min=abc`) | Invalid Parameter ignorieren, Defaults verwenden |
| **EC-17-02** | Input | Min > Max bei Ranges | Automatische Korrektur: Max = Min + 1.0 |
| **EC-17-03** | Input | Negative Werte bei Bewertungen | Clamping auf validen Bereich (0-5) |
| **EC-17-04** | Input | Schnelle Filter-Wechsel (>5x/Sek) | Debounce 300ms, Cancel vorheriger Calls |
| **EC-17-05** | Input | Leerer Multi-Select (0 Branchen) | Als "Egal" behandeln |
| **EC-17-06** | Input | Zu viele Multi-Select-Optionen (>20) | Limit auf 20, Hinweis anzeigen |
| **EC-17-07** | Input | SQL-Injection/XSS in Filter-Parametern | Sanitizen, Prepared Statements |
| **EC-17-08** | State | URL > 2000 Zeichen | Kürzung auf wichtigste Filter |
| **EC-17-09** | State | Korrupte localStorage-Daten | Validieren, bei Fehler Reset |
| **EC-17-10** | State | Filter-State von anderem User | Übernehmen, aber nur erlaubte Filter |
| **EC-17-11** | State | Veraltete Filter-Namen (Refactoring) | Unknown Filter ignorieren |
| **EC-17-12** | State | Browser-History überladen | Replace State statt Push |
| **EC-17-13** | State | Multi-Tab-Szenario | Jede Suche eigenen State (searchId-basiert) |
| **EC-17-14** | Performance | 10.000+ Leads filtern | Virtualisierung, Web Worker |
| **EC-17-15** | Performance | Filter-Berechnung > 1s | Loading-Indicator, Cancel-Option |
| **EC-17-16** | Performance | Race Condition Filter vs Daten | Filter nach Laden anwenden |
| **EC-17-17** | Plan | Free-User manipuliert URL zu Pro | Filter ignorieren, Hinweis |
| **EC-17-18** | Plan | Plan-Downgrade während Nutzung | Pro-Filter resetten |
| **EC-17-19** | Plan | Trial endet während Nutzung | Pro-Filter deaktivieren |
| **EC-17-20** | Result | Alle Filter widersprüchlich | "Keine Ergebnisse", Vorschlag lockern |
| **EC-17-21** | Result | Filter ergibt genau 1 Ergebnis | "1 Lead gefunden", keine Pagination |
| **EC-17-22** | Result | Filter auf Seite 5, zu streng | Zurück zu Seite 1 springen |
| **EC-17-23** | UI | Filter-Panel bei <320px | Full-Screen Modal mit Scroll |
| **EC-17-24** | UI | Touch-Gesten auf Mobile | Korrektes Event-Handling |
| **EC-17-25** | Sync | Daten ändern sich während Filter | "Neue Daten verfügbar"-Button |

---

## Technische Anforderungen

### Performance

- **Filter-Anwendung:** < 100ms für 500 Leads (client-seitig)
- **Initialer Load:** < 1s für erste 50 Ergebnisse
- **Pagination:** < 500ms für Seitenwechsel
- **Sortierung:** < 100ms für 500 Leads

### State Management

```typescript
// Filter State Interface
interface FilterState {
  // Quick Filters
  hasWebsite: boolean | null;  // null = nicht aktiv
  hasEmail: boolean | null;
  hasPhone: boolean | null;
  minRating: number | null;

  // Smart Filters (Pro only)
  socialMedia: {
    instagram: 'ja' | 'nein' | 'egal';
    facebook: 'ja' | 'nein' | 'egal';
    linkedin: 'ja' | 'nein' | 'egal';
    youtube: 'ja' | 'nein' | 'egal';
    tiktok: 'ja' | 'nein' | 'egal';
    twitter: 'ja' | 'nein' | 'egal';
  };

  // Rating Filter
  ratingRange: { min: number; max: number } | null;
  reviewCountRange: { min: number; max: number } | null;
}

// Column Configuration
interface ColumnConfig {
  visible: boolean;
  width?: number;
  sortDirection: 'asc' | 'desc' | null;
}
```

### URL-Sync

Filter-State wird mit URL Query-Params synchronisiert:
- `?searchId=xxx` - Aktive Suche (immer vorhanden)
- `&website=1` - Quick-Filter: Hat Website
- `&email=1` - Quick-Filter: Hat E-Mail
- `&phone=1` - Quick-Filter: Hat Telefon
- `&rating_min=4.0` - Mindest-Bewertung
- `&rating_max=5.0` - Maximale Bewertung
- `&instagram=ja` - Smart-Filter: Instagram vorhanden
- `&facebook=nein` - Smart-Filter: Kein Facebook
- `&sort=company&dir=asc` - Sortierung

---

## Abhängigkeiten zu anderen Projekten

### PROJ-16 hängt ab von:
- PROJ-8 (User-Provider) - für Plan-Information
- PROJ-13 (Backend API) - `/api/search/results`
- E4 (Lead-Suche) - muss zuerst abgeschlossen sein

### PROJ-17 hängt ab von:
- PROJ-16 (Lead-Tabelle) - Filter braucht die Tabelle
- PROJ-8 (User-Provider) - für Plan-Information

---

## Komponenten-Architektur (Vorschlag)

```
src/components/search/
├── lead-table/
│   ├── lead-table.tsx          # Haupt-Komponente
│   ├── lead-table-row.tsx      # Einzelne Zeile
│   ├── lead-table-header.tsx   # Header mit Sortierung
│   ├── lead-table-pagination.tsx # Pagination-Controls
│   ├── column-configurator.tsx # Spalten-Auswahl
│   └── lead-blur-overlay.tsx   # Blur-Effekt für Free
│
├── filters/
│   ├── quick-filters.tsx       # Quick-Filter-Badges
│   ├── smart-filter-panel.tsx  # Slide-over Panel
│   ├── filter-toggle.tsx       # Ja/Nein/Egal Toggle
│   ├── range-slider.tsx        # Dual-Range Slider
│   └── filter-upsell.tsx       # Upsell für Free
│
└── export/
    ├── export-button.tsx       # Export-Trigger
    ├── csv-export.ts           # CSV-Generierung
    └── excel-export.ts         # Excel-Generierung (Pro+)
```

---

## QA Checklist (für später)

### PROJ-16 Testfälle
- [ ] Tabelle zeigt alle Leads korrekt an
- [ ] Free-User sehen geblurrte Felder
- [ ] Pro-User sehen alle Daten
- [ ] Spalten-Konfiguration wird gespeichert
- [ ] Sortierung funktioniert für alle Spalten
- [ ] Pagination funktioniert bei >50 Ergebnissen
- [ ] CSV-Export generiert korrekte Datei
- [ ] Mobile-Ansicht ist nutzbar

### PROJ-17 Testfälle
- [ ] Quick-Filter filtern korrekt
- [ ] Smart-Filter funktionieren (Pro)
- [ ] UND-Verknüpfung aller Filter
- [ ] URL-Sync funktioniert
- [ ] Filter-State bleibt bei Page-Reload erhalten
- [ ] Upsell wird für Free angezeigt
- [ ] Keine Ergebnisse-State wenn Filter zu streng
- [ ] Performance: Filter < 100ms

---

## Design Referenzen

- **Tabelle:** shadcn/ui Table Komponente
- **Filter-Badges:** shadcn/ui Badge mit Toggle-States
- **Slider:** shadcn/ui Slider (oder @radix-ui/react-slider)
- **Toggle:** shadcn/ui ToggleGroup für Ja/Nein/Egal
- **Blur:** CSS `backdrop-filter: blur(4px)` mit Overlay
- **Icons:** Lucide React (Instagram, Facebook, Linkedin, Youtube, Twitter)

---

## Offene Design-Entscheidungen

1. **Pagination vs Infinite Scroll:**
   - Vorschlag: Pagination (besser für Filter-State in URL)
   - Alternative: "Mehr laden"-Button bei 50+ Ergebnissen

2. **Filter-Panel Position:**
   - Vorschlag: Slide-over von rechts (wie shadcn/ui Sheet)
   - Alternative: Dropdown unter Filter-Button

3. **Spalten-Konfiguration:**
   - Vorschlag: Dropdown wie bei shadcn/ui Column Visibility
   - Speicherung in localStorage

4. **Mobile Ansicht:**
   - Vorschlag: Karten-Ansicht statt Tabelle auf < 768px
   - Alternative: Horizontaler Scroll (schlechte UX)

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Pending Solution Architect Review
