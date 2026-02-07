# PROJ-17: Smart-Filter-System

**Status:** 🔵 Planned
**Epic:** E5 - Lead Ergebnis-Anzeige & Filter
**Abhängigkeiten:** PROJ-16 (Lead-Tabelle), PROJ-8 (User-Provider)
**Letztes Update:** 2026-02-08

---

## User Stories

### US-17.1: Quick-Filter für alle Pläne
**Als User möchte ich schnell nach grundlegenden Attributen filtern können.**

### US-17.2: Smart-Filter mit Ja/Nein/Egal-Logik
**Als Pro-User möchte ich nach Social-Media-Präsenz filtern können.**

### US-17.3: Bewertungs-Filter
**Als User möchte ich nach Bewertung und Bewertungsanzahl filtern können.**

### US-17.4: Filter-Status anzeigen
**Als User möchte ich immer sehen, welche Filter aktiv sind.**

### US-17.5: Upsell für Smart-Filter (Free/Starter)
**Als Free-User möchte ich sehen, dass Smart-Filter ein Pro-Feature sind.**

---

## Acceptance Criteria

### Quick-Filter (US-17.1)
- [ ] Quick-Filter-Badges oberhalb der Tabelle
- [ ] Filter: "Mit Website", "Mit E-Mail", "Mit Telefon", "Bewertung >= 4"
- [ ] Klick auf Badge aktiviert/deaktiviert Filter
- [ ] Mehrere Quick-Filter können gleichzeitig aktiv sein (UND-Verknüpfung)
- [ ] Aktive Filter werden als Badge mit X-Icon angezeigt
- [ ] "Alle Filter zurücksetzen"-Button

### Smart-Filter (US-17.2)
- [ ] "Smart Filter"-Button öffnet Filter-Panel/Dialog
- [ ] Ja/Nein/Egal-Optionen für jedes Social-Media-Feld
- [ ] Standard-Einstellung: "Egal" für alle Felder
- [ ] "Egal"-Option visuell deutlich weniger prominent
- [ ] Filter werden sofort angewendet (kein "Anwenden"-Button nötig)
- [ ] Anzahl der gefilterten Ergebnisse wird live aktualisiert

**Filter-Felder:**
| Feld | Optionen |
|------|----------|
| Instagram | Ja / Nein / Egal |
| Facebook | Ja / Nein / Egal |
| LinkedIn | Ja / Nein / Egal |
| YouTube | Ja / Nein / Egal |
| TikTok | Ja / Nein / Egal |
| Twitter/X | Ja / Nein / Egal |

### Bewertungs-Filter (US-17.3)
- [ ] Slider für Min-Bewertung (1.0 - 5.0)
- [ ] Slider für Max-Bewertung (1.0 - 5.0)
- [ ] Min/Max Slider für Bewertungsanzahl (0 - 1000+)
- [ ] Predefined Quick-Filters: "Top-Rated (4.5+)", "Viele Bewertungen (50+)"
- [ ] Range-Filter als Dual-Range-Slider oder zwei einzelne Slider

### Filter-Status (US-17.4)
- [ ] Filter-Badge-Count in der "Filter"-Button (z.B. "Filter (3)")
- [ ] Aktive Filter als Chips oberhalb der Tabelle
- [ ] Jeder Chip zeigt: Filter-Name + Wert + X zum Entfernen
- [ ] "Alle zurücksetzen"-Link wenn Filter aktiv
- [ ] Persistenz: Filter-State in URL als Query-Params (für Sharing)

**URL-Format:**
```
/dashboard/suche?searchId=xxx&website=ja&email=ja&rating_min=4.0&instagram=ja
```

### Upsell (US-17.5)
- [ ] "Smart Filter"-Button ist für Free-User sichtbar aber deaktiviert/locked
- [ ] Bei Klick auf Locked-Filter: Upsell-Dialog oder Tooltip
- [ ] Dialog zeigt: "Smart Filter sind ein Pro-Feature"
- [ ] Button: "Jetzt upgraden" -> Link zu `/dashboard/preise`
- [ ] Vorteile auflisten: "Filter nach Social Media", "Erweiterte Bewertungs-Filter"

---

## Feature Matrix

| Filter-Typ | Free | Pro | Enterprise |
|------------|------|-----|------------|
| **Quick-Filter** | Verfügbar | Verfügbar | Verfügbar |
| **Smart-Filter** | Nicht verfügbar | Verfügbar | Verfügbar |
| **Bewertungs-Filter** | Basis (1-5) | Erweitert (Range) | Erweitert (Range) |

---

## Filter-Logik

### UND-Verknüpfung
Alle Filter werden UND-verknüpft:
- "Mit Website" UND "Mit E-Mail" = Nur Leads mit BEIDEM
- "Instagram: Ja" UND "Facebook: Egal" = Leads mit Instagram (Facebook egal)
- "Bewertung >= 4" UND "Bewertungen >= 50" = Nur sehr gute, häufig bewertete

### Kombinations-Matrix (Beispiel)

| Instagram | Facebook | LinkedIn | Ergebnis |
|-----------|----------|----------|----------|
| Egal | Egal | Egal | Alle Leads |
| Ja | Egal | Egal | Nur mit Instagram |
| Nein | Egal | Egal | Nur ohne Instagram |
| Ja | Ja | Egal | Mit Instagram UND Facebook |
| Ja | Nein | Egal | Mit Instagram aber OHNE Facebook |

---

## Edge Cases

| Scenario | Verhalten |
|----------|-----------|
| **Alle Ergebnisse weggefiltert** | "Keine Ergebnisse mit diesen Filtern" + Hinweis Filter zu lockern |
| **Widersprüchliche Filter** | Alle Filter UND-verknüpft (kann 0 Ergebnisse geben) |
| **Filter-State zu lang für URL** | Kürzen oder LocalStorage als Fallback |
| **Page-Reload mit Filter-URL** | Filter-State wird aus URL wiederhergestellt |
| **Plan-Downgrade mit aktiven Smart-Filtern** | Filter werden zurückgesetzt, Hinweis anzeigen |
| **Mobile: Filter-Panel** | Full-Screen Modal statt Slide-over |

---

## Technische Anforderungen

### Performance
- **Filter-Anwendung:** < 100ms für 500 Leads (client-seitig)
- **URL-Sync:** < 50ms beim Ändern von Filtern

### State Management
```typescript
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
```

### URL Query-Params Mapping
- `searchId` - Aktive Suche (immer vorhanden)
- `website=1` - Quick-Filter: Hat Website
- `email=1` - Quick-Filter: Hat E-Mail
- `phone=1` - Quick-Filter: Hat Telefon
- `rating_min=4.0` - Mindest-Bewertung
- `rating_max=5.0` - Maximale Bewertung
- `reviews_min=50` - Mindestanzahl Bewertungen
- `instagram=ja` - Smart-Filter: Instagram vorhanden
- `facebook=nein` - Smart-Filter: Kein Facebook
- `sort=company&dir=asc` - Sortierung

---

## UI/UX Design

### Desktop Layout
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
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Smart Filter Panel (Slide-over)
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

## Abhängigkeiten

### Benötigt von:
- PROJ-16 (Lead-Tabelle) - Filter braucht die Tabelle
- PROJ-8 (User-Provider) - für Plan-Information

### Blockt:
- Keine (letztes Feature in E5)

---

## Komponenten-Struktur

```
src/components/search/filters/
├── quick-filters.tsx           # Quick-Filter-Badges
├── smart-filter-panel.tsx      # Slide-over Panel
├── filter-toggle.tsx           # Ja/Nein/Egal Toggle
├── range-slider.tsx            # Dual-Range Slider
├── filter-upsell.tsx           # Upsell für Free
├── active-filter-chips.tsx     # Aktive Filter-Anzeige
└── use-filters.ts              # Hook für Filter-Logik
```

---

## QA Test Results

**Tested:** 2026-02-07
**Tester:** QA Engineer
**Status:** ⚠️ PARTIAL - Needs Fixes

### Acceptance Criteria Status

#### US-17.1: Quick-Filter für alle Pläne
- [~] Quick-Filter sind im Smart-Filter Panel (nicht als Badge-Leiste)
- [x] Filter: "Mit Website", "Mit E-Mail", "Mit Telefon" verfügbar
- [x] Klick auf Filter aktiviert/deaktiviert
- [x] Mehrere Filter können gleichzeitig aktiv sein (UND)
- [x] Aktive Filter werden als Chips mit X angezeigt
- [x] "Alle Filter zurücksetzen"-Button
- [ ] ❌ Quick-Filter-Badges oberhalb der Tabelle fehlen

#### US-17.2: Smart-Filter mit Ja/Nein/Egal-Logik
- [x] "Smart Filter"-Button öffnet Panel
- [x] Ja/Nein/Egal-Optionen für jedes Feld
- [x] Standard-Einstellung: "Egal"
- [x] "Egal" visuell weniger prominent (grau)
- [x] Filter werden sofort angewendet
- [~] **ABWEICHUNG:** LinkedIn/Xing statt Instagram/Facebook/YouTube/TikTok/Twitter
- [ ] ❌ Live Ergebnis-Anzahl "X Leads entsprechen diesen Filtern" fehlt

#### US-17.3: Bewertungs-Filter
- [ ] ❌ Slider für Min-Bewertung fehlt
- [ ] ❌ Slider für Max-Bewertung fehlt
- [ ] ❌ Slider für Bewertungsanzahl fehlt
- [ ] ❌ Quick-Filter "Top-Rated (4.5+)" fehlt
- [ ] ❌ Quick-Filter "Viele Bewertungen (50+)" fehlt

#### US-17.4: Filter-Status anzeigen
- [x] Filter-Badge-Count im Button
- [x] Aktive Filter als Chips oberhalb der Tabelle
- [x] Jeder Chip zeigt: Name + Wert + X
- [x] "Alle zurücksetzen" Link
- [x] URL-Sync für Sharing funktioniert
- [x] Filter-State bleibt bei Reload erhalten (via URL)

#### US-17.5: Upsell für Smart-Filter
- [x] Button für Free-User sichtbar aber deaktiviert
- [x] Upsell-Dialog bei Interaktion
- [x] "Pro Feature" Text vorhanden
- [x] "Jetzt upgraden" Button mit Link
- [x] Vorteile werden aufgelistet

### Bugs Found

#### BUG-1: SmartFilter nicht integriert
- **Severity:** 🔴 Critical
- **Beschreibung:** Der SmartFilter ist implementiert aber nicht in die SearchPage eingebunden
- **Impact:** User können die Filter nicht verwenden
- **Fix:** Integration in `search-page-client.tsx` erforderlich

#### BUG-2: Bewertungs-Filter komplett fehlend
- **Severity:** 🔴 Critical
- **Beschreibung:** Keine Filter für Rating oder Review Count
- **Impact:** AC von US-17.3 nicht erfüllt

#### BUG-3: Abweichung bei Social Media Filtern
- **Severity:** 🟡 Medium
- **Beschreibung:** LinkedIn/Xing implementiert statt Instagram/Facebook/YouTube/TikTok/Twitter
- **Expected:** Instagram, Facebook, LinkedIn, YouTube, TikTok, Twitter
- **Actual:** LinkedIn, Xing

#### BUG-4: Quick-Filter Badge-Leiste fehlt
- **Severity:** 🟠 High
- **Beschreibung:** Keine separate Quick-Filter Leiste oberhalb der Tabelle
- **Expected:** Badges: "Mit Website", "Mit E-Mail", "Mit Telefon", "4.5+"

#### BUG-5: Keine Live Ergebnis-Anzahl
- **Severity:** 🟡 Medium
- **Beschreibung:** Anzeige "X Leads entsprechen diesen Filtern" fehlt

### Test Summary
- ✅ 13 von 23 Acceptance Criteria passed
- ⚠️ 2 teilweise erfüllt
- ❌ 8 nicht erfüllt
- **Recommendation:** Critical Bugs müssen vor Deployment gefixt werden

### Report Link
Vollständiger Report: `/docs/E5-QA-REPORT.md`

---

## Deployment

*To be filled by DevOps Engineer after deployment*
