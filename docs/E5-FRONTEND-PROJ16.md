# E5 Frontend: PROJ-16 - Lead-Ergebnis-Tabelle

**Datum:** 2026-02-08
**Assignee:** Frontend Developer
**Status:** COMPLETED

---

## Zusammenfassung

Implementation der Lead-Ergebnis-Tabelle mit plan-basiertem Feature-Gating für Manyleads.io. Die Komponente zeigt Suchergebnisse in einer interaktiven Data Table mit Sortierung, Pagination und Export-Funktionen.

---

## Implementierte Features

### 1. LeadResultsTable Component

**Location:** `src/components/search/lead-results-table.tsx`

**Features:**
- TanStack Table Integration für professionelle Tabellen-Funktionalität
- Pagination mit wählbaren Seitengrößen (10, 25, 50, 100)
- Spalten-Sortierung per Klick auf Header
- Zeilenauswahl mit Checkboxen (einzeln + alle auf Seite)
- Spalten-Visibility Toggle via Dropdown
- Responsive Design mit horizontal Scroll
- Loading Skeleton während Daten laden
- Empty State wenn keine Leads gefunden

**shadcn/ui Komponenten:**
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`, `Badge`, `Select`
- `Pagination`, `PaginationContent`, `PaginationItem`, etc.
- `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuLabel`

### 2. LeadExportButton Component

**Location:** `src/components/search/lead-export-button.tsx`

**Features:**
- CSV Export für Pro/Enterprise (mit UTF-8 BOM für Excel-Kompatibilität)
- Excel Export (.xlsx) für Enterprise mit xlsx Library
- Plan-gated: Free-User sehen Upgrade-Prompt
- Export nur ausgewählter Zeilen oder alle Ergebnisse
- Loading-States während Export
- Erfolgs-Animation nach Download

**Export-Spalten je nach Plan:**
- Free: Firma, Kontakt, Adresse, Email, Website
- Pro: + Telefon, Branche, Bewertung, Reviews
- Enterprise: + LinkedIn, Facebook, Instagram

**shadcn/ui Komponenten:**
- `Button`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`

### 3. Plan-basiertes Gating

**Location:** `src/components/search/plan-gate.tsx` (bestehend)

**Features:**
- `PlanGate` - Wrapper mit Blur-Effekt für gesperrte Inhalte
- `PlanGateBadge` - Upgrade-Badge mit Icon
- `UpgradePrompt` - Vollständige Upgrade-Karte mit CTA
- Drei Varianten: inline (default), badge, card

**Plan-Konfiguration:**
```typescript
const PLAN_CONFIG = {
  free: { name: 'Free', color: 'bg-slate-100 text-slate-700', icon: Lock },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-700', icon: Sparkles },
  enterprise: { name: 'Enterprise', color: 'bg-purple-100 text-purple-700', icon: Crown },
}
```

### 4. Spalten-Definitionen

**Location:** `src/components/search/lead-table-columns.tsx` (bestehend, genutzt)

**Plan-Sichtbarkeit:**
| Spalte | Free | Pro | Enterprise |
|--------|------|-----|------------|
| Firma | ✅ | ✅ | ✅ |
| Kontakt | ✅ | ✅ | ✅ |
| Adresse | ✅ | ✅ | ✅ |
| Email | ✅ | ✅ | ✅ |
| Telefon | 🔒 | ✅ | ✅ |
| Website | ✅ | ✅ | ✅ |
| Branche | 🔒 | ✅ | ✅ |
| Bewertung | 🔒 | ✅ | ✅ |
| Social Media | 🔒 | 🔒 | ✅ |
| Karte | ✅ | ✅ | ✅ |

🔒 = PlanGate mit Blur + Upgrade-Badge

---

## Technische Details

### Dependencies

```json
{
  "@tanstack/react-table": "^latest",
  "xlsx": "^latest"
}
```

**Installation:**
```bash
npm install @tanstack/react-table xlsx
```

### Datenfluss

```
SuchePage (Server)
  ├─ getUserPlanTier() → 'free' | 'pro' | 'enterprise'
  └─ SearchPageClient (Client)
       ├─ useSearch() Hook
       │   └─ isComplete ? results : null
       └─ LeadResultsTable
            ├─ TanStack Table State (sorting, pagination, selection)
            ├─ createColumns(planTier) → plan-gated columns
            └─ LeadExportButton
                 ├─ CSV (Pro+)
                 └─ Excel (Enterprise)
```

### TypeScript Interfaces

```typescript
interface LeadResultsTableProps {
  leads: SearchResultLead[]
  planTier: PlanTier
  searchId?: string
  totalCount?: number
  isLoading?: boolean
}

interface LeadExportButtonProps {
  leads: SearchResultLead[]
  planTier: PlanTier
  searchId?: string
  variant?: 'dropdown' | 'buttons' | 'minimal'
}

type PlanTier = 'free' | 'pro' | 'enterprise'
```

---

## UI/UX Entscheidungen

### 1. Tabellen-Layout
- Card-basiertes Design für visuelle Trennung
- Header mit Titel + Description + Toolbar
- Pagination unten mit Seitengrößen-Selector
- Horizontal Scroll auf kleinen Screens

### 2. Plan-Gating UX
- Blur-Effekt mit 40% Opacity für gesperrte Spalten
- Upgrade-Badge über dem geblurten Inhalt
- Hover-Effekt auf Badge zeigt Tooltip
- Klick auf Badge navigiert zu /dashboard/einstellungen/abonnement

### 3. Export UX
- Dropdown-Menü für Export-Format
- CSV als Standard (universell kompatibel)
- Excel als Premium-Feature (Enterprise)
- Loading-Spinner während Generierung
- Checkmark-Animation nach erfolgreichem Download

### 4. Auswahl-UX
- Checkboxen in erster Spalte
- "Alle auswählen" Checkbox im Header
- Anzahl ausgewählter Zeilen in Description angezeigt
- Export verwendet nur ausgewählte Zeilen wenn > 0

---

## Responsive Design

| Breakpoint | Verhalten |
|------------|-----------|
| Desktop (>1024px) | Volle Tabelle, alle Spalten sichtbar |
| Tablet (768-1024px) | Horizontales Scroll, kompakte Pagination |
| Mobile (<768px) | Horizontales Scroll, Stacked Toolbar |

---

## Accessibility

- Semantische HTML-Struktur mit `<table>`
- ARIA-Labels für Checkboxen ("Alle auswählen", "Zeile auswählen")
- Keyboard-Navigation durch TanStack Table
- Focus-States auf interaktiven Elementen
- Alt-Text für Social Media Icons

---

## Performance

- TanStack Table virtualisiert große Datenmengen
- Pagination reduziert DOM-Elemente
- Lazy loading von Excel-Library (dynamic import)
- useMemo für columns und selectedLeads
- Debounced Spalten-Resizing

---

## Testing Checklist

- [ ] Tabelle rendert mit Mock-Daten
- [ ] Pagination funktioniert (Seitenwechsel)
- [ ] Sortierung funktioniert (alle Spalten)
- [ ] Zeilenauswahl funktioniert (einzeln + alle)
- [ ] Spalten-Visibility Toggle funktioniert
- [ ] CSV Export erzeugt korrekte Datei (Pro/Enterprise)
- [ ] Excel Export erzeugt korrekte Datei (Enterprise)
- [ ] Plan-Gating zeigt Blur + Badge für Free-User
- [ ] Upgrade-Badge navigiert zu Abonnement-Seite
- [ ] Responsive Design funktioniert (Mobile/Tablet/Desktop)
- [ ] Empty State wird angezeigt bei leeren Ergebnissen
- [ ] Loading State zeigt Skeleton

### Edge Cases für Testing

| ID | Scenario | Test-Schritt | Erwartetes Ergebnis |
|----|----------|--------------|---------------------|
| **EC-01** | Leerer/null Firmenname | API liefert `name: null` | Anzeige als "[Unbekannte Firma]" |
| **EC-02** | Sehr lange Firmennamen | Name mit 200+ Zeichen | Truncation mit "...", Tooltip zeigt vollständig |
| **EC-03** | Negative Bewertungen | Rating: -2 oder 8 | Clamping auf 0-5, korrekte Sterne-Anzeige |
| **EC-04** | API Timeout | Netzwerk drosseln auf 3G | Timeout nach 30s, Retry-Button |
| **EC-05** | API 500 Error | Server Fehler simulieren | Error-State, keine leere Tabelle |
| **EC-06** | LocalStorage voll | Speicher füllen vor Test | Tabelle funktioniert, Config nicht persistiert |
| **EC-07** | Session Timeout | Cookie löschen während Nutzung | Redirect zu Login, Return-URL erhalten |
| **EC-08** | Sortierung während Loading | Schnell mehrmals klicken | Nur letzter Klick verarbeitet (Debounced) |
| **EC-09** | Export mit 0 Auswahl | Export ohne Zeilen-Auswahl | Alle sichtbaren Leads exportiert |
| **EC-10** | CSV mit Sonderzeichen | Firmenname: `Muster;GmbH\n"Test"` | Korrektes CSV-Escaping |
| **EC-11** | Alle Zeilen auswählen | Checkbox im Header klicken | Alle sichtbaren Zeilen ausgewählt |
| **EC-12** | Multi-Tab Auswahl | Tab 2 öffnen, Auswahl in Tab 1 | Tab 2 zeigt keine Auswahl (isoliert) |
| **EC-13** | Mobile Scroll | iOS Safari, Seite wechseln | Scroll-Position bleibt erhalten |
| **EC-14** | Plan Upgrade während Session | Upgrade durchführen, Tab offen lassen | Neue Berechtigungen sofort aktiv |
| **EC-15** | Print Mode | Ctrl+P auf Ergebnisseite | Print-optimierte Darstellung |
| **EC-16** | Keyboard Navigation | Tab-Taste durch Tabelle | Alle Interaktiven Elemente erreichbar |
| **EC-17** | Screen Reader | NVDA/VoiceOver testen | Korrekte Ankündigungen für Änderungen |
| **EC-18** | Resize Window | Fenstergröße ändern | Responsive Breakpoints funktionieren |

---

## Bekannte Limitationen

1. **Plan-Tier Source:** Aktuell wird plan_tier aus profiles-Tabelle gelesen. Später via Subscription-Service.
2. **Excel Library:** xlsx ist ~500KB, wird aber nur bei Excel-Export geladen (dynamic import).
3. **Pagination:** Client-side pagination, da Ergebnisse komplett im useSearch Hook gehalten werden.

---

## Next Steps (PROJ-17)

- Smart Filter System implementieren
- Filter-State in URL persistieren
- Filter-UI in LeadResultsTable Toolbar integrieren
- Quick-Filter (Website, Email, Telefon - Ja/Nein/Egal)
- Pro-Filter (Rating, Reviews, Social Media)

---

## Files

**Created:**
- `src/components/search/lead-results-table.tsx` (329 lines)
- `src/components/search/lead-export-button.tsx` (374 lines)

**Modified:**
- `src/components/search/index.ts` - Barrel exports
- `src/app/dashboard/suche/page.tsx` - Plan tier support
- `src/app/dashboard/suche/search-page-client.tsx` - Integration
- `docs/DEVELOPMENT-STATUS.md` - Status update

---

## References

- [TanStack Table Docs](https://tanstack.com/table/latest)
- [xlsx Library Docs](https://github.com/SheetJS/sheetjs)
- [shadcn/ui Table](https://ui.shadcn.com/docs/components/table)
