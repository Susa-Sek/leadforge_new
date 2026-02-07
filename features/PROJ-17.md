# PROJ-17: Smart-Filter-System mit Ja/Nein/Egal-Logik

## User Story
**Als** Pro+ Nutzer möchte ich **fortschrittliche Filter** für meine Lead-Ergebnisse nutzen, **damit** ich gezielt nach Firmen mit/ohne bestimmte Eigenschaften suchen kann.

## Acceptance Criteria

### AC-1: Ja/Nein/Egal-Filter-Logik
- [ ] Jeder Filter hat 3 Zustände: Ja (include), Nein (exclude), Egal (ignore)
- [ ] Beispiel "Hat Website": Ja = nur mit Website, Nein = nur ohne Website, Egal = alle
- [ ] Filter werden als ToggleGroup mit Icons dargestellt
- [ ] Zustand visuell klar erkennbar (Ja=grün, Nein=rot, Egal=neutral)

### AC-2: Basis-Filter (Alle Pläne)
- [ ] Hat Website (Ja/Nein/Egal)
- [ ] Hat Email (Ja/Nein/Egal)
- [ ] Hat Telefon (Ja/Nein/Egal)

### AC-3: Pro+ Filter
- [ ] Hat LinkedIn (Ja/Nein/Egal)
- [ ] Hat Xing (Ja/Nein/Egal)
- [ ] Branche (Multi-Select Dropdown)
- [ ] Mitarbeiterzahl (Dual-Range-Slider: Min/Max)

### AC-4: Enterprise Filter
- [ ] Umsatz (Dual-Range-Slider)
- [ ] Standort (Radius-Suche mit km-Angabe)

### AC-5: Filter-UI
- [ ] Filter-Sidebar auf Desktop (>768px)
- [ ] Filter-Drawer auf Mobile (<768px)
- [ ] Klare Gruppierung nach Plan-Tier
- [ ] Aktive Filter als Chips/Tags anzeigen
- [ ] "Filter zurücksetzen" Button
- [ ] Filter-Anzahl Badge zeigt aktive Filter an

### AC-6: State Management
- [ ] Filter-State in URL als Query-Params speichern
- [ ] Shareable URLs mit Filter-Konfiguration
- [ ] Filter-State persistiert bei Page-Reload
- [ ] Filter werden an API übergeben (query params)

### AC-7: Plan-Gating
- [ ] Pro+ Filter sind für Free/Starter mit Upgrade-Badge gesperrt
- [ ] Enterprise Filter sind für Free/Starter/Pro gesperrt
- [ ] Klick auf gesperrten Filter öffnet Upgrade-Prompt

## Filter-Logik

### Ja/Nein/Egal Zustände
```typescript
type FilterState = 'yes' | 'no' | 'any' // Ja, Nein, Egal

// Filter Anwendung:
// - 'yes': Nur Leads MIT dieser Eigenschaft anzeigen
// - 'no':  Nur Leads OHNE diese Eigenschaft anzeigen
// - 'any': Alle Leads (Filter ignorieren)
```

### Kombinatorische Logik
Mehrere Filter werden mit AND verknüpft:
- "Hat Website=Ja" AND "Hat Email=Ja" = nur Firmen mit Website UND Email
- "Hat Telefon=Nein" AND "Hat LinkedIn=Ja" = Firmen ohne Telefon aber mit LinkedIn

## Technical Requirements

### Dependencies
- `@radix-ui/react-toggle-group` - Für Ja/Nein/Egal Toggles
- `@radix-ui/react-slider` - Für Dual-Range-Slider (bereits vorhanden)

### Components
```
src/components/search/
  smart-filter.tsx            # Hauptfilter-Komponente
  filter-toggle-group.tsx     # Ja/Nein/Egal Toggle
  filter-range-slider.tsx     # Dual-Range Slider
  active-filters.tsx          # Aktive Filter Chips
  filter-provider.tsx         # Filter Context/Provider
```

### URL Query Params Schema
```
?f_web=yes|no|any           # Website Filter
?f_email=yes|no|any         # Email Filter
?f_phone=yes|no|any         # Telefon Filter
?f_linkedin=yes|no|any      # LinkedIn Filter (Pro+)
?f_xing=yes|no|any          # Xing Filter (Pro+)
?f_industry=it,marketing    # Branchen Multi-Select
?f_employees_min=10         # Mitarbeiter Min
?f_employees_max=100        # Mitarbeiter Max
?f_radius=50                # Radius in km
```

### Types
```typescript
interface SmartFilterState {
  hasWebsite: 'yes' | 'no' | 'any'
  hasEmail: 'yes' | 'no' | 'any'
  hasPhone: 'yes' | 'no' | 'any'
  hasLinkedIn: 'yes' | 'no' | 'any'
  hasXing: 'yes' | 'no' | 'any'
  industries: string[]
  employeeCount: { min: number; max: number }
  revenue: { min: number; max: number }
  radius: number
}
```

## Definition of Done
- [ ] Alle Filter-Typen implementiert
- [ ] Ja/Nein/Egal-Logik funktioniert korrekt
- [ ] URL-Sync funktioniert
- [ ] Plan-Gating korrekt implementiert
- [ ] Responsive Design (Sidebar/Drawer)
- [ ] Dokumentation erstellt
- [ ] Tests für Filter-Logik

## Dependencies
- PROJ-16 (Lead Results Table) - Muss zuerst fertig sein
- Plan-Gating System (bereits vorhanden)

## Estimated Effort
**Frontend:** 6-8 hours

## Notes
- Filter-State sollte mit `nuqs` oder nativem URL-API gemanagt werden
- Für Mobile: Filter als Sheet/Drawer von unten oder seitlich
- Performance: Filter-Anwendung sollte unter 100ms dauern (Client-Side)
