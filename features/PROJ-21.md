# PROJ-21: Deal-Pipeline

**Epic:** E7 - CRM-System
**Status:** 🔵 Planned
**Priority:** High
**Assigned To:** Backend Developer, Frontend Developer

---

## Overview

Deal-Pipeline ermöglicht Nutzern, Verkaufschancen zu verfolgen und durch definierte Stages zu führen. Visueller Kanban-Board für Pro/Enterprise Nutzer mit Drag-and-Drop Funktionalität und umfassenden Statistiken.

---

## User Stories

### US-21.1: Deal erstellen
**Story:** Als User möchte ich einen neuen Deal erstellen.

**Acceptance Criteria:**
- Pflichtfelder: Titel, Stage
- Optionale Felder: Wert, Wahrscheinlichkeit, Erwartetes Closing
- Kontakt-Verknüpfung via Dropdown (meine Kontakte)
- Beschreibung: Textarea
- Stage-Default: "Lead"
- Wahrscheinlichkeit: Slider 0-100% (Default je nach Stage)

**UI:** /dashboard/deals/neu oder Modal aus Pipeline

---

### US-21.2: Deal bearbeiten
**Story:** Als User möchte ich Deal-Daten bearbeiten.

**Acceptance Criteria:**
- Bearbeiten-Button auf Deal-Detail
- Formular mit aktuellen Werten
- Alle Felder editierbar
- Stage-Change via Dropdown
- Speichern mit Loading-State
- Cancel-Button

---

### US-21.3: Deal löschen
**Story:** Als User möchte ich einen Deal löschen.

**Acceptance Criteria:**
- Löschen-Button auf Detail und Pipeline (auf Card)
- Bestätigungsdialog
- Erfolgsmeldung
- Zurück zur Pipeline

---

### US-21.4: Stage-Change via Dropdown
**Story:** Als User möchte ich die Stage eines Deals ändern.

**Acceptance Criteria:**
- Stage-Dropdown auf Deal-Detail
- Alle 5 Stages verfügbar
- Änderung sofort gespeichert
- Bei "Geschlossen": Won/Lost Dialog

**Pipeline Stages (Deutsch):**
| Stage | Farbe | Default Wahrscheinlichkeit |
|-------|-------|---------------------------|
| Lead | Grau (#9CA3AF) | 10% |
| Kontaktiert | Blau (#3B82F6) | 25% |
| Qualifiziert | Gelb (#F59E0B) | 50% |
| Angebot | Orange (#F97316) | 75% |
| Geschlossen (Gewonnen) | Grün (#10B981) | 100% |
| Geschlossen (Verloren) | Rot (#EF4444) | 0% |

---

### US-21.5: Pipeline-Kanban anzeigen (Pro+)
**Story:** Als Pro-User möchte ich eine Kanban-Ansicht meiner Deals sehen.

**Acceptance Criteria:**
- 5 Spalten für die Stages (horizontal)
- Jede Spalte zeigt: Anzahl Deals, Summe Deal-Werte
- Deal-Cards mit: Titel, Wert, Wahrscheinlichkeit, Kontakt
- Cards sortierbar (nach Wert, Wahrscheinlichkeit, Datum)
- "Neuer Deal" Button pro Spalte (vorausgewählte Stage)
- Responsive: Horizontal Scroll auf Mobile
- Empty States für leere Spalten

**UI:** /dashboard/deals

---

### US-21.6: Drag-and-Drop Stage-Change (Pro+)
**Story:** Als Pro-User möchte ich Deals per Drag-and-Drop verschieben.

**Acceptance Criteria:**
- Drag-and-Drop auf Desktop (@dnd-kit empfohlen)
- Visuelles Feedback während Drag
- Drop-Zone Highlight
- Stage wird nach Drop aktualisiert
- Animation bei erfolgreichem Drop
- Touch-Alternative für Mobile: Dropdown auf Card
- Bei Drop auf "Geschlossen": Won/Lost Dialog

---

### US-21.7: Deal-Assignment zu Kontakt
**Story:** Als User möchte ich einen Deal einem Kontakt zuweisen.

**Acceptance Criteria:**
- Kontakt-Dropdown beim Erstellen/Bearbeiten
- Kontakt-Name auf Deal-Card klickbar → Kontakt-Detail
- Deal auf Kontakt-Detail aufgelistet
- Deal kann ohne Kontakt existieren (optional)
- Filter "Ohne Kontakt" in Pipeline

---

### US-21.8: Deal-Filter und Sortierung
**Story:** Als User möchte ich Deals filtern und sortieren.

**Acceptance Criteria:**
- Filter nach Stage (Multi-Select)
- Filter nach Kontakt (Dropdown)
- Filter nach Wert-Bereich (Min/Max Slider)
- Filter nach Wahrscheinlichkeit (Min/Max Slider)
- Filter nach Closing-Datum (Zeitraum)
- Sortierung: Wert, Wahrscheinlichkeit, Closing-Datum, Erstellungsdatum
- Aktive Filter als Chips
- Filter-State in URL

---

### US-21.9: Deal-Statistiken (Dashboard)
**Story:** Als User möchte ich Statistiken über meine Pipeline sehen.

**Acceptance Criteria:**
- Statistik-Cards über Pipeline oder separater Tab (Free)
- Metriken:
  - Gesamtpipeline-Wert (offene Deals)
  - Gewichteter Pipeline-Wert (Wert × Wahrscheinlichkeit)
  - Anzahl offene Deals
  - Durchschnittliche Wahrscheinlichkeit
  - Win Rate (Gewonnen / (Gewonnen + Verloren))
  - Durchschnittliche Deal-Größe
  - Deals geschlossen diesen Monat
- Zeit-Filter: Dieser Monat, Letzte 30 Tage, Quartal, Jahr
- Prognose: Geschätzter Umsatz basierend auf Pipeline

---

### US-21.10: Deal-Export (CSV)
**Story:** Als Pro-User möchte ich meine Deals exportieren.

**Acceptance Criteria:**
- Export-Button in Pipeline (Pro+)
- CSV-Format: UTF-8 BOM, Semikolon separator
- Spalten: Titel, Stage, Wert, Wahrscheinlichkeit, Kontakt, Erwartetes Closing, Tatsächliches Closing, Status
- Dateiname: `manyleads_deals_[datum]_[zeit].csv`

---

## Won/Lost Dialog

Wenn ein Deal in Stage "Geschlossen" verschoben wird:

**Dialog Inhalt:**
- Titel: "Deal abschließen"
- Auswahl: "Gewonnen" oder "Verloren" (Radio/Toggle)
- Bei Gewonnen:
  - Tatsächliches Closing-Datum (Datepicker, Default: heute)
  - Optional: Tatsächlicher Wert (falls abweichend)
- Bei Verloren:
  - Grund (Dropdown): Zu teuer, Timing, Konkurrenz, Budget, Sonstiges
  - Optional: Notizen

---

## Technical Requirements

### Database Schema

```sql
-- deal_stages table (system defaults + custom)
CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- NULL for system defaults
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6B7280',
  is_system BOOLEAN DEFAULT FALSE,
  is_won_stage BOOLEAN DEFAULT FALSE,
  is_lost_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stages
INSERT INTO deal_stages (name, order_index, color, is_system, is_won_stage, is_lost_stage) VALUES
  ('Lead', 1, '#9CA3AF', TRUE, FALSE, FALSE),
  ('Kontaktiert', 2, '#3B82F6', TRUE, FALSE, FALSE),
  ('Qualifiziert', 3, '#F59E0B', TRUE, FALSE, FALSE),
  ('Angebot', 4, '#F97316', TRUE, FALSE, FALSE),
  ('Geschlossen (Gewonnen)', 5, '#10B981', TRUE, TRUE, FALSE),
  ('Geschlossen (Verloren)', 6, '#EF4444', TRUE, FALSE, TRUE);

-- deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES deal_stages(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(12,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  is_won BOOLEAN, -- NULL = not closed, TRUE = won, FALSE = lost
  close_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/deals | GET | List with filter/pagination |
| /api/deals | POST | Create deal |
| /api/deals/[id] | GET | Get deal details |
| /api/deals/[id] | PUT | Update deal |
| /api/deals/[id] | DELETE | Delete deal |
| /api/deals/[id]/stage | PATCH | Stage update (for DnD) |
| /api/deals/pipeline | GET | Kanban data by stages |
| /api/deals/stats | GET | Statistics |
| /api/deals/export | POST | CSV Export |

### Components

**Pages:**
- PipelinePage (`/dashboard/deals`)
- DealDetailPage (`/dashboard/deals/[id]`)
- NewDealPage (`/dashboard/deals/neu`)
- EditDealPage (`/dashboard/deals/[id]/bearbeiten`)

**Components:**
- DealPipeline (Container)
- DealKanban (Kanban Board)
- DealCard (für Kanban)
- DealList (für Free - Tabellenansicht)
- DealForm (Create/Edit)
- DealDetail (Ansicht)
- DealFilters (Filter Panel)
- StageColumn (Kanban Spalte)
- StatsDashboard (Statistiken)
- WonLostDialog (Abschluss-Dialog)

---

## Plan-Based Feature Gating

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Deals | 10 max | 100 max | unbegrenzt |
| Stage-Change | Dropdown | Dropdown + Drag | Dropdown + Drag |
| Pipeline Kanban | ❌ (Liste stattdessen) | ✅ | ✅ |
| Drag-and-Drop | ❌ | ✅ | ✅ |
| Deal-Filter | Basic | Advanced | Advanced |
| Deal-Statistiken | Basic | Advanced | Advanced |
| Deal-Export | ❌ | CSV | CSV |

**Free User View:**
- Liste statt Kanban (Tabelle mit allen Deals)
- Stage-Change via Dropdown in Detail-Ansicht
- Basic Statistiken (nur Anzahl, Gesamtwert)

---

## UI Specifications (German)

### Route Names
- /dashboard/deals - Pipeline (Pro) oder Liste (Free)
- /dashboard/deals/[id] - Deal-Detail
- /dashboard/deals/neu - Neuer Deal
- /dashboard/deals/[id]/bearbeiten - Deal bearbeiten

### Labels
| English | German |
|---------|--------|
| Pipeline | Pipeline |
| Deal | Deal |
| Deals | Deals |
| New Deal | Neuer Deal |
| Edit Deal | Deal bearbeiten |
| Delete Deal | Deal löschen |
| Stage | Stage |
| Value | Wert |
| Probability | Wahrscheinlichkeit |
| Expected Close | Erwartetes Closing |
| Actual Close | Tatsächliches Closing |
| Won | Gewonnen |
| Lost | Verloren |
| Close Deal | Deal abschließen |
| Close Reason | Abschlussgrund |
| Pipeline Value | Pipeline-Wert |
| Weighted Value | Gewichteter Wert |
| Win Rate | Win Rate |
| Open Deals | Offene Deals |

---

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-21-01 | Leerer Deal-Titel | Validierungsfehler |
| EC-21-02 | Negativer Deal-Wert | Validierungsfehler oder 0 |
| EC-21-03 | Wahrscheinlichkeit > 100% | Clamping auf 100 |
| EC-21-04 | Closing in Vergangenheit | Warnung, aber erlaubt |
| EC-21-05 | Kontakt gelöscht | Deal bleibt, Hinweis "Kontakt nicht verfügbar" |
| EC-21-06 | Stage-Change zu Geschlossen ohne Won/Lost | Dialog erzwingt Auswahl |
| EC-21-07 | 0 Deals in Pipeline | Empty State mit CTA |
| EC-21-08 | Sehr viele Deals (>50) in Spalte | Virtualisierung oder "Mehr laden" |
| EC-21-09 | Drag-Drop auf gleiche Stage | Keine Aktion |
| EC-21-10 | Drag-Drop während API-Call | Disable weiterer Drags |
| EC-21-11 | Filter ergibt 0 Deals | "Keine Deals gefunden", Vorschlag |
| EC-21-12 | 0 geschlossene Deals | Win Rate: "N/A" |
| EC-21-13 | Deal-Limit erreicht | Upsell-Dialog |
| EC-21-14 | Free-User versucht Kanban | Upsell: "Kanban ist Pro-Feature" |
| EC-21-15 | Timeout bei Stage-Change | Rollback, Error-Toast |

---

## Dependencies

**Blocks:**
- E7 Architecture (Task #6)

**Blocked By:**
- PROJ-20 (Contacts für Assignment)
- PROJ-8 (User-Provider für Plan-Info)

---

## Success Criteria

- [ ] Alle 10 User Stories implementiert
- [ ] Deal-CRUD funktioniert
- [ ] Stage-Change via Dropdown funktioniert
- [ ] Pipeline Kanban funktioniert (Pro)
- [ ] Drag-and-Drop funktioniert (Pro)
- [ ] Deal-Filter funktionieren
- [ ] Statistiken werden korrekt berechnet
- [ ] Won/Lost Dialog erscheint bei Closing
- [ ] Plan-Gating korrekt (Free sieht Liste statt Kanban)
- [ ] Deutsche UI überall

---

## Estimated Effort

- Backend: 1-2 Tage
- Frontend: 3-4 Tage (Kanban + DnD komplex)
- QA: 1-2 Tage

**Total:** 5-8 Tage (parallel: 4-5 Tage)
