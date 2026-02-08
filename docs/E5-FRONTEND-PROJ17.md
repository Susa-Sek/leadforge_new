# E5 Frontend: PROJ-17 Smart-Filter-System

## Feature Spec
**PROJ-17:** Smart-Filter-System mit Ja/Nein/Egal-Logik

## Implementation Report

### Components Created

#### 1. FilterToggleGroup (`src/components/search/filter-toggle-group.tsx`)
**Purpose:** Three-state toggle for Yes/No/Any filter logic

**Features:**
- `FilterToggleGroup` - Full-size toggle with labels and descriptions
- `CompactFilterToggle` - Inline version for tighter spaces
- Visual states: Green (Ja), Red (Nein), Gray (Egal)
- Accessible with ARIA labels and keyboard navigation

**API:**
```typescript
interface FilterToggleGroupProps {
  value: 'yes' | 'no' | 'any'
  onChange: (value: FilterState) => void
  label: string
  description?: string
  disabled?: boolean
}
```

#### 2. FilterRangeSlider (`src/components/search/filter-range-slider.tsx`)
**Purpose:** Dual-range slider for numeric filtering

**Features:**
- `FilterRangeSlider` - Min/Max range with inputs
- `FilterSlider` - Single value slider
- `RadiusFilter` - Preset radius buttons (5-250km)
- Visual feedback with real-time updates
- Keyboard-accessible input fields

**API:**
```typescript
interface FilterRangeSliderProps {
  value: { min: number; max: number }
  onChange: (value: RangeValue) => void
  label: string
  min: number
  max: number
  step?: number
  unit?: string
  formatValue?: (value: number) => string
}
```

#### 3. ActiveFilters (`src/components/search/active-filters.tsx`)
**Purpose:** Display and manage active filter chips

**Features:**
- Color-coded chips (Green=Yes, Red=No, Gray=Any)
- Individual filter removal
- "Reset all" functionality
- Hidden count for many filters ("+X more")

**API:**
```typescript
interface ActiveFilter {
  id: string
  label: string
  value: string
  type: 'toggle' | 'range' | 'multi' | 'radius'
  state?: FilterState
}
```

#### 4. SmartFilter (`src/components/search/smart-filter.tsx`)
**Purpose:** Main filter panel with all features

**Features:**
- URL state persistence (shareable filters)
- Plan-based feature gating
- Responsive design (Sheet on mobile, Sidebar on desktop)
- Real-time filter count badge
- Grouped by plan tier (Basic, Pro, Enterprise)

**URL Query Schema:**
```
?f_web=yes|no|any           # Website Filter
?f_email=yes|no|any         # Email Filter
?f_phone=yes|no|any         # Phone Filter
?f_linkedin=yes|no|any      # LinkedIn (Pro+)
?f_xing=yes|no|any          # Xing (Pro+)
?f_industry=it,marketing    # Industries (Pro+)
?f_emp_min=10&f_emp_max=100 # Employee count (Pro+)
?f_rev_min=1&f_rev_max=100  # Revenue (Enterprise)
?f_radius=50                # Radius (Enterprise)
```

### Filter Logic

#### Ja/Nein/Egal States
| State | Behavior | Color |
|-------|----------|-------|
| Ja (yes) | Only show leads WITH this property | Green |
| Nein (no) | Only show leads WITHOUT this property | Red |
| Egal (any) | Show all leads (ignore this filter) | Gray |

#### Combinatorial Logic
Multiple filters are combined with AND:
- `Website=Ja AND Email=Ja` = Only firms with BOTH website AND email
- `Phone=Nein AND LinkedIn=Ja` = Firms without phone but with LinkedIn

### Plan-Based Feature Gating

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Website Filter | Yes | Yes | Yes | Yes |
| Email Filter | Yes | Yes | Yes | Yes |
| Phone Filter | Yes | Yes | Yes | Yes |
| LinkedIn Filter | Upgrade | Upgrade | Yes | Yes |
| Xing Filter | Upgrade | Upgrade | Yes | Yes |
| Industry Multi-Select | Upgrade | Upgrade | Yes | Yes |
| Employee Count | Upgrade | Upgrade | Yes | Yes |
| Revenue Filter | Upgrade | Upgrade | Upgrade | Yes |
| Radius Filter | Upgrade | Upgrade | Upgrade | Yes |

### Usage Example

```tsx
import { SmartFilter, SmartFilterState } from '@/components/search'

function LeadResultsPage() {
  const [filters, setFilters] = useState<SmartFilterState>(DEFAULT_FILTER_STATE)

  // Apply filters to your data
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Apply boolean filters
      if (filters.hasWebsite === 'yes' && !lead.website) return false
      if (filters.hasWebsite === 'no' && lead.website) return false
      // ... apply other filters
      return true
    })
  }, [leads, filters])

  return (
    <div className="flex">
      <SmartFilter
        userPlan="pro"
        onFilterChange={setFilters}
        variant="sidebar"
      />
      <LeadTable data={filteredLeads} />
    </div>
  )
}
```

### Technical Decisions

#### 1. URL State vs Context State
**Decision:** Use URL query parameters for filter state
**Rationale:**
- Shareable URLs with filter configuration
- Survives page reloads
- Browser back/forward button support
- SEO-friendly for filtered results

#### 2. Sheet vs Sidebar
**Decision:** Sheet on mobile, Sidebar on desktop
**Rationale:**
- Mobile: Screen real estate is limited, overlay is better
- Desktop: Persistent sidebar allows quick filter adjustments
- Auto-detected based on viewport or explicit variant prop

#### 3. Dual-Range-Slider Implementation
**Decision:** Use Radix Slider with two thumbs
**Rationale:**
- Native support for range selection
- Better UX than two separate sliders
- Consistent with shadcn/ui design system

#### 4. Plan Gating Strategy
**Decision:** Show disabled filters with blur/upgrade prompt
**Rationale:**
- Users see what they're missing (upsell opportunity)
- Consistent UI across all plans
- Clear upgrade path indicated

### Accessibility

- All filters have ARIA labels
- Keyboard navigation support
- Focus indicators on all interactive elements
- Screen reader friendly state announcements
- High contrast mode support

### Performance

- URL updates are debounced
- Filter calculations are memoized
- No unnecessary re-renders
- Lazy loading of filter UI on mobile (Sheet)

### Integration with PROJ-16

The SmartFilter integrates with the LeadResultsTable:
```tsx
// Filtered data flows to the table
const filteredData = useFilteredLeads(leads, filters)

// Plan gating is consistent between filters and columns
// Pro user sees Pro filters and Pro columns
// Free user sees upgrade prompts for both
```

### Testing Checklist

- [ ] All toggle states work correctly
- [ ] Range sliders update values properly
- [ ] URL sync works on filter change
- [ ] URL params restore filter state on reload
- [ ] Plan gating blocks Pro/Enterprise filters correctly
- [ ] Reset button clears all filters
- [ ] Individual filter removal works
- [ ] Active filter chips display correctly
- [ ] Mobile drawer opens/closes smoothly
- [ ] Desktop sidebar stays visible

### Edge Cases für Testing

| ID | Scenario | Test-Schritt | Erwartetes Ergebnis |
|----|----------|--------------|---------------------|
| **EC-01** | Ungültige URL-Parameter | URL: `?rating_min=abc&rating_max=999` | Invalid Werte ignorieren, URL korrigieren |
| **EC-02** | Min > Max bei Ranges | Min=4.0, Max=2.0 setzen | Automatische Korrektur auf Min=4.0, Max=5.0 |
| **EC-03** | Negative Werte | URL: `?rating_min=-5` | Clamping auf 0-5 Bereich |
| **EC-04** | Schnelle Filter-Wechsel | 10x Filter toggeln in 2 Sekunden | Debounced, nur letzter Zustand in URL |
| **EC-05** | URL > 2000 Zeichen | 50+ Filter in URL | Kürzung, Hinweis "Zu viele Filter" |
| **EC-06** | Free-User URL-Manipulation | `?linkedin=ja` als Free-User | Filter ignorieren, "Pro-Filter nicht verfügbar" |
| **EC-07** | Plan-Downgrade | Pro-Filter aktiv, Subscription endet | Pro-Filter resetten, Standard behalten |
| **EC-08** | Korrupte localStorage | localStorage manuell manipulieren | Validieren, bei Fehler Reset auf Defaults |
| **EC-09** | 10.000+ Leads filtern | Große Datenmenge testen | Virtualisierung, kein UI-Blocking |
| **EC-10** | Alle Filter widersprüchlich | Kombination ergibt 0 Ergebnisse | "Keine Ergebnisse", Vorschlag lockern |
| **EC-11** | Multi-Tab Szenario | Gleiche Suche in 2 Tabs, verschiedene Filter | Jeder Tab hat eigenen State |
| **EC-12** | Browser Back/Forward | Filter ändern, dann Back/Forward | Filter-State korrekt wiederherstellen |
| **EC-13** | Filter während Loading | Filter setzen bevor Daten fertig | Filter nach Laden anwenden |
| **EC-14** | Mobile Filter-Panel | Viewport < 320px | Full-Screen Modal, scrollbar |
| **EC-15** | Touch-Gesten | Slider horizontal, Page vertical scroll | Keine Konflikte, korrektes Handling |
| **EC-16** | Tastatur-Navigation | Tab durch alle Filter-Elemente | Alle erreichbar, Fokus-Indikatoren |
| **EC-17** | Screen Reader | Toggle-Änderungen | ARIA-Live Ankündigungen |
| **EC-18** | Veraltete Daten | Cache veraltet während Filter | "Neue Daten verfügbar"-Button |
| **EC-19** | SQL Injection | `?industry='; DROP TABLE--` | Sanitisiert, keine Ausführung |
| **EC-20** | XSS Versuch | `?website=<script>alert(1)</script>` | Escaped, kein Script-Ausführung |

### Files Created/Modified

**New Files:**
- `src/components/search/filter-toggle-group.tsx`
- `src/components/search/filter-range-slider.tsx`
- `src/components/search/active-filters.tsx`
- `src/components/search/smart-filter.tsx`
- `features/PROJ-17.md`
- `docs/E5-FRONTEND-PROJ17.md`

**Modified Files:**
- `src/components/search/index.ts` - Added exports
- `docs/DEVELOPMENT-STATUS.md` - Updated status

### Dependencies

No new dependencies required. Uses existing:
- `@radix-ui/react-slider` (already installed)
- shadcn/ui components (Sheet, Button, Badge, etc.)

### Status

**Status:** COMPLETED
**Date:** 2026-02-08
**Ready for:** QA Testing

### Next Steps

1. QA Engineer tests all filter combinations
2. Verify URL persistence works correctly
3. Test plan gating on different subscription tiers
4. Performance testing with large datasets
5. Integration with backend filter API (when available)
