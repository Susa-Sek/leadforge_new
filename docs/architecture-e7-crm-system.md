# Epic E7: CRM-System - High-Level Architecture

**Status:** ARCHITECTURE DESIGN COMPLETE
**Projekt:** Manyleads.io
**Framework:** Next.js 16 + Supabase
**Epic:** E7 - CRM-System
**Projekte:** PROJ-20 (Kontaktverwaltung), PROJ-21 (Deal-Pipeline)

---

## Zusammenfassung

Das CRM-System ermöglicht Nutzern, Leads aus Sammlungen (E6) als dauerhafte Kontakte zu speichern, zu organisieren und durch eine Verkaufspipeline zu führen. Es besteht aus zwei Hauptmodulen:

1. **Kontaktverwaltung (PROJ-20):** CRUD-Operationen, Tags, Notizen, Interaktions-History
2. **Deal-Pipeline (PROJ-21):** 5-Stage Verkaufsprozess mit Kanban-Board (Pro+)

---

## 1. Datenbank-Schema (Supabase)

### 1.1 Tabellen-Übersicht

#### contacts (Kontakte)
Speichert alle Kontaktdaten eines Users:
- **Basis-Info:** Name, Firma, Email, Telefon, Adresse, Website
- **Meta:** Notizen, Herkunft (Sammlung), Erstellungsdatum
- **Verknüpfung:** Jeder Kontakt gehört zu einem User

#### contact_tags (Tags)
Benutzerdefinierte Tags mit Farben:
- **Name:** z.B. "VIP", "Hot Lead", "Follow-up"
- **Farbe:** Hex-Code für UI-Visualisierung
- **Limit:** Pro-User begrenzt (Free: 5, Pro: 20)

#### contact_tag_assignments (Tag-Verknüpfungen)
Verbindet Kontakte mit Tags (Many-to-Many):
- Ein Kontakt kann mehrere Tags haben
- Ein Tag kann mehrere Kontakte haben

#### interactions (Interaktionen)
Chronologische History aller Kontakt-Aktivitäten:
- **Typen:** Email, Anruf, Meeting, Notiz
- **Inhalt:** Freitext-Notizen
- **Zeitstempel:** Automatisch gesetzt

#### deal_stages (Pipeline-Stages)
Die 5 Stufen des Verkaufsprozesses:
1. **Lead** (Grau) - Neuer Interessent
2. **Kontaktiert** (Blau) - Erste Kontaktaufnahme
3. **Qualifiziert** (Gelb) - Bedürfnisse geklärt
4. **Angebot** (Orange) - Angebot unterbreitet
5. **Geschlossen** (Grün/Rot) - Gewonnen oder Verloren

#### deals (Verkaufschancen)
Speichert alle Deal-Informationen:
- **Basis:** Titel, Beschreibung, verknüpfter Kontakt
- **Finanzen:** Wert, Wahrscheinlichkeit, erwartetes Closing
- **Status:** Stage, Gewonnen/Verloren, tatsächliches Closing

### 1.2 Datenschutz & Sicherheit

**Row-Level Security (RLS):**
- Jeder User sieht nur seine eigenen Kontakte/Deals
- API-Layer validiert alle Zugriffe über Session-Cookies
- Fremdschlüssel-Constraints verhindern Daten-Inkonsistenz

---

## 2. API Design

### 2.1 Kontakt-APIs

| Endpoint | Funktion |
|----------|----------|
| `/api/contacts` (GET) | Liste aller Kontakte mit Filter, Sortierung, Pagination |
| `/api/contacts` (POST) | Neuen Kontakt erstellen |
| `/api/contacts/[id]` (GET) | Einzelnen Kontakt mit Details laden |
| `/api/contacts/[id]` (PUT) | Kontakt bearbeiten |
| `/api/contacts/[id]` (DELETE) | Kontakt löschen (Deals bleiben erhalten) |
| `/api/contacts/import` (POST) | Leads aus Sammlung importieren (Pro+) |

### 2.2 Interaktions-APIs

| Endpoint | Funktion |
|----------|----------|
| `/api/contacts/[id]/interactions` (GET) | Interaktions-History laden |
| `/api/contacts/[id]/interactions` (POST) | Neue Interaktion hinzufügen |

### 2.3 Deal-APIs

| Endpoint | Funktion |
|----------|----------|
| `/api/deals` (GET) | Deals mit Filter (Stage, Kontakt, Wert) |
| `/api/deals` (POST) | Neuen Deal erstellen |
| `/api/deals/[id]` (GET) | Deal-Details laden |
| `/api/deals/[id]` (PUT) | Deal bearbeiten (inkl. Stage-Change) |
| `/api/deals/[id]` (DELETE) | Deal löschen |
| `/api/deals/pipeline` (GET) | Pipeline-Daten für Kanban (gruppiert nach Stage) |

---

## 3. Frontend Architecture

### 3.1 Route-Struktur

```
dashboard/
├── crm/
│   └── page.tsx                    # CRM-Übersicht (Redirect oder Dashboard)
├── kontakte/
│   ├── page.tsx                    # Kontakt-Liste (Tabelle)
│   ├── neu/
│   │   └── page.tsx                # Neuer Kontakt Formular
│   └── [id]/
│       └── page.tsx                # Kontakt-Detail (Info + Timeline)
└── deals/
    ├── page.tsx                    # Deal-Pipeline (Kanban für Pro)
    └── [id]/
        └── page.tsx                # Deal-Detail
```

**Anmerkung:** Deutsche Route-Namen gemäß Projekt-Standards (`/kontakte`, `/deals`)

### 3.2 Component-Struktur

#### Kontakt-Module

```
ContactListPage (/dashboard/kontakte)
├── PageHeader (Titel + "Neuer Kontakt" Button)
├── ContactFilters
│   ├── Suchfeld
│   ├── Tag-Filter (Multi-Select)
│   └── Sortierung
├── ContactTable
│   ├── TableHeader (Name, Firma, Email, Telefon, Tags)
│   └── ContactTableRow
│       ├── Avatar + Name
│       ├── Firmen-Info
│       ├── Kontaktdaten
│       └── TagChips (farbige Badges)
├── Pagination
└── EmptyState (wenn keine Kontakte)

ContactDetailPage (/dashboard/kontakte/[id])
├── ContactHeader
│   ├── Name + Firma
│   ├── Tags (mit Farben)
│   └── Actions (Bearbeiten, Löschen)
├── ContactInfoCard
│   ├── Email (klickbar)
│   ├── Telefon (klickbar)
│   ├── Adresse
│   └── Website (Link)
├── NotesSection
│   ├── Textarea (Autosave)
│   └── Character Counter
├── InteractionTimeline
│   └── InteractionItem
│       ├── Icon (Email/Call/Meeting/Note)
│       ├── Typ + Datum
│       └── Notizen
└── LinkedDealsSection
    └── MiniDealCards

NewContactPage (/dashboard/kontakte/neu)
└── ContactForm
    ├── Name* (Pflichtfeld)
    ├── Firma* (Pflichtfeld)
    ├── Email (mit Validierung)
    ├── Telefon
    ├── Adresse
    ├── Website
    └── TagSelector (autocomplete, max Limit)
```

#### Deal-Pipeline-Module

```
DealPipelinePage (/dashboard/deals)
├── PageHeader (Titel + "Neuer Deal" Button)
├── DealFilters (Pro+)
│   ├── Stage-Filter (Multi-Select)
│   ├── Kontakt-Filter
│   ├── Wert-Bereich
│   └── Datum-Filter
└── KanbanBoard (Pro+) ODER DealList (Free)
    ├── StageColumn (5 Stück)
    │   ├── StageHeader
    │   │   ├── Name + Farbe
    │   │   ├── Anzahl Deals
    │   │   └── Summe (Wert)
    │   └── DealCardList
    │       └── DealCard (Draggable in Pro)
    │           ├── Titel
    │           ├── Wert (€)
    │           ├── Wahrscheinlichkeit (%)
    │           └── Kontakt-Name (Link)
    └── DragOverlay (nur Pro)

DealDetailPage (/dashboard/deals/[id])
├── DealHeader
│   ├── Titel
│   ├── Stage-Badge (Farbe)
│   └── Actions
├── DealForm (alle Felder)
│   ├── Kontakt-Dropdown
│   ├── Stage-Dropdown
│   ├── Wert (EUR Input)
│   ├── Wahrscheinlichkeit (Slider)
│   ├── Erwartetes Closing (DatePicker)
│   └── Beschreibung (Textarea)
└── DealStatusSection
    └── Gewonnen/Verloren Toggle (nur Stage "Geschlossen")
```

### 3.3 Shared Components (Wiederverwendung)

```
src/components/crm/
├── contact-card.tsx          # Kompakte Kontakt-Anzeige
├── contact-form.tsx          # Formular (New + Edit)
├── contact-list.tsx          # Tabelle mit Sort/Filter
├── tag-manager.tsx           # Tag CRUD + Color-Picker
├── tag-input.tsx             # Autocomplete Tag Input
├── interaction-timeline.tsx  # Chronologische Liste
├── interaction-form.tsx      # Neue Interaktion
├── deal-card.tsx             # Kanban Card
├── deal-form.tsx             # Deal Formular
├── deal-pipeline.tsx         # Kanban Board Container
├── stage-column.tsx          # Einzelne Pipeline-Spalte
├── deal-filters.tsx          # Filter-Panel
└── import-dialog.tsx         # Sammlung-Import Modal
```

---

## 4. Integration mit Epic E6 (Sammlungen)

### 4.1 Import-Workflow

**Szenario:** User hat eine Sammlung mit 50 Leads und möchte 10 davon als CRM-Kontakte speichern.

**Flow:**
1. User öffnet Sammlungs-Detail (`/dashboard/sammlungen/[id]`)
2. Klickt "Zu CRM hinzufügen" (nur sichtbar für Pro+)
3. Dialog öffnet sich mit Lead-Liste (Checkbox-Auswahl)
4. Duplikat-Erkennung prüft bereits existierende Kontakte (via Email)
5. User wählt Tags für Import
6. System erstellt Kontakte + verknüpft mit `source_collection_id`
7. Erfolgsmeldung zeigt Anzahl importierter Kontakte

### 4.2 Datenfluss

```
Sammlung (E6)
    │
    ├──► Import Dialog (Lead-Auswahl)
    │        │
    │        ▼
    ├──► Duplikat-Check (Email-Vergleich)
    │        │
    │        ▼
    └──► Kontakt-Erstellung (E7)
             │
             ├──► contacts Tabelle
             ├──► Optional: Tag-Zuweisung
             └──► Interaktion: "Importiert aus Sammlung"
```

### 4.3 UI-Integration

**Erweiterung Sammlungs-Detail-Seite:**
- "Zu Kontakten hinzufügen" Button (nur Pro+)
- Badge zeigt bereits importierte Leads an
- Tooltip bei Free-User: "Upgrade zu Pro für CRM-Import"

---

## 5. Plan-Based Feature Gating

### 5.1 Kontaktverwaltung (PROJ-20)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Kontakte** | 50 | 500 | Unbegrenzt |
| **Tags** | 5 Tags | 20 Tags | Unbegrenzt |
| **Notizen** | 5.000 Zeichen | 10.000 Zeichen | Unbegrenzt |
| **Import** | - | Ja | Ja |
| **Bulk-Aktionen** | - | Ja | Ja |
| **Export** | - | CSV | CSV + Excel |

### 5.2 Deal-Pipeline (PROJ-21)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Deals** | 10 | 100 | Unbegrenzt |
| **Stage-Change** | Dropdown | Dropdown | Dropdown |
| **Pipeline Kanban** | - | Ja | Ja |
| **Drag-and-Drop** | - | Ja | Ja |
| **Deal-Filter** | Basic | Advanced | Advanced |
| **Export** | - | CSV | CSV + Excel |

### 5.3 Gating-Implementation

**Frontend:**
- UI-Elemente werden basierend auf Subscription-Plan ein-/ausgeblendet
- Upgrade-CTAs bei nicht verfügbaren Features
- Client-seitige Validierung der Limits

**Backend:**
- API prüft Limits vor Erstellung (z.B. max 50 Kontakte für Free)
- Rückgabe von 403 Forbidden mit Error-Code "PLAN_LIMIT_REACHED"
- Import-Endpoint blockiert für Free-Users

---

## 6. Tech-Entscheidungen

### 6.1 Drag-and-Drop Library: @dnd-kit

**Warum @dnd-kit?**
- Modern, aktiv maintained
- Native Keyboard-Accessibility
- TypeScript Support
- Gut dokumentiert
- Performance-optimiert für viele Items

**Alternativen verworfen:**
- react-beautiful-dnd: Deprecated, keine Updates
- react-dnd: Komplexer, mehr Boilerplate

### 6.2 State Management: React Server Components + SWR

**Architektur:**
- Server Components für initiales Daten-Fetching
- SWR (Stale-While-Revalidate) für Client-side Updates
- Optimistic UI für schnelle Feedback (Drag-and-Drop)

**Warum kein Redux/Zustand?**
- CRM-Daten sind primär serverseitig
- SWR bietet Caching + Revalidation out-of-the-box
- Weniger Komplexität für diesen Use-Case

### 6.3 Form Handling: React Hook Form + Zod

**Konsistent mit bestehendem Stack:**
- Bereits in Auth-System verwendet
- Zod v4 für Schema-Validierung
- Performance-optimiert (minimale Re-Renders)

### 6.4 Tag-Color Picker: Eigene Komponente

**Warum nicht externe Library?**
- Einfacher Color-Picker mit 10 Preset-Farben ausreichend
- Weniger Bundle-Size
- Konsistent mit shadcn/ui Design

### 6.5 DatePicker: shadcn/ui Calendar + Popover

**Bereits vorhanden:**
- shadcn/ui bietet Calendar-Komponente
- Popover für Overlay
- Deutsche Lokalisierung via date-fns

---

## 7. Dependencies

### Neue Packages (Frontend)

```
@dnd-kit/core          # Drag-and-Drop Basis
@dnd-kit/sortable      # Sortierbare Listen
@dnd-kit/utilities     # Helper-Funktionen
```

### Neue Packages (Backend)

```
# Keine neuen Packages nötig
# Bestehende Supabase-Client reicht
```

### Shadcn/ui Components (zu installieren)

```
npx shadcn add calendar      # Datum-Auswahl
npx shadcn add popover       # Dropdown-Overlays
npx shadcn add textarea      # Notizen-Felder
npx shadcn add select        # Dropdowns (teilweise vorhanden)
npx shadcn add slider        # Wahrscheinlichkeit-Slider
npx shadcn add badge         # Tags (teilweise vorhanden)
npx shadcn add tooltip       # Hilfe-Texte
npx shadcn add separator     # Trennlinien
npx shadcn add scroll-area   # Scrollbare Bereiche
npx shadcn add skeleton      # Loading States
```

---

## 8. Daten-Model (Konzeptionell)

### 8.1 Kontakt-Entity

```
Contact
├── Identität: Eindeutige ID, User-Zugehörigkeit
├── Person: Name (Pflicht), Firma (Pflicht)
├── Kommunikation: Email, Telefon, Adresse, Website
├── Organisation: Tags (0-N), Notizen (Text)
├── Herkunft: Import aus Sammlung (optional)
├── Meta: Erstellt, Zuletzt bearbeitet
└── Verknüpfungen: Interaktionen (1-N), Deals (0-N)
```

### 8.2 Deal-Entity

```
Deal
├── Identität: Eindeutige ID, User-Zugehörigkeit
├── Beschreibung: Titel (Pflicht), Beschreibung
├── Pipeline: Stage (Pflicht), Position in Stage
├── Finanzen: Wert (EUR), Wahrscheinlichkeit (%)
├── Zeitplan: Erwartetes Closing, Tatsächliches Closing
├── Status: Gewonnen/Verloren (nur bei Geschlossen)
├── Verknüpfung: Kontakt (optional)
└── Meta: Erstellt, Zuletzt bearbeitet
```

### 8.3 Interaktions-Entity

```
Interaction
├── Identität: Eindeutige ID
├── Zugehörigkeit: Kontakt (Pflicht), User (Pflicht)
├── Inhalt: Typ (Email/Call/Meeting/Note), Notizen (Text)
└── Meta: Erstellt (Zeitstempel)
```

---

## 9. User Flows

### 9.1 Neuer Kontakt (Manuell)

```
1. User klickt "Neuer Kontakt"
   └──► /dashboard/kontakte/neu

2. Formular-Eingabe
   ├── Name* eingeben
   ├── Firma* eingeben
   ├── Optional: Email, Telefon, etc.
   └── Tags hinzufügen (max Plan-Limit)

3. Speichern
   └── API-Call POST /api/contacts
       ├── Erfolg: Redirect zu Kontakt-Detail
       └── Error: Validation-Meldungen
```

### 9.2 Import aus Sammlung

```
1. User öffnet Sammlung
   └──► /dashboard/sammlungen/[id]

2. "Zu Kontakten hinzufügen" (Pro+)
   └──► Import-Dialog öffnet sich

3. Lead-Auswahl
   ├── Checkboxen für gewünschte Leads
   ├── Duplikat-Warnung (Email bereits vorhanden)
   └── Tags für Import auswählen

4. Import bestätigen
   └── API-Call POST /api/contacts/import
       ├── Erfolg: "X Kontakte importiert"
       └── Redirect zu Kontakt-Liste
```

### 9.3 Deal durch Pipeline bewegen

**Free-User:**
```
1. Deal-Detail öffnen
2. Stage-Dropdown wählen
3. Neue Stage auswählen
4. Auto-Save
```

**Pro-User:**
```
1. Pipeline öffnen (/dashboard/deals)
2. Deal-Card greifen (Drag start)
3. In neue Spalte ziehen (Drop)
4. Animation: Card "snappt" in neue Spalte
5. API-Call: Stage-Update im Hintergrund
6. Spalten-Summen aktualisieren
```

---

## 10. Error Handling & Edge Cases

### 10.1 Plan-Limits erreicht

**Szenario:** Free-User hat 50 Kontakte, versucht 51. zu erstellen.

**UX:**
- Formular zeigt Warnung: "Kontakt-Limit erreicht (50/50)"
- "Upgrade zu Pro" Button
- Speichern-Button disabled

### 10.2 Duplikat-Import

**Szenario:** User versucht Lead zu importieren, Email existiert bereits.

**UX:**
- Checkbox disabled mit Tooltip: "Bereits in Kontakten"
- Oder: Warnung "Diese Email existiert bereits. Trotzdem importieren?"

### 10.3 Deal ohne Kontakt

**Szenario:** Deal mit `contact_id = NULL` (Kontakt wurde gelöscht).

**UX:**
- Deal-Card zeigt: "Kein Kontakt verknüpft"
- Dropdown: "Kontakt zuweisen" ermöglicht nachträgliche Verknüpfung

### 10.4 Drag-and-Drop Fehler

**Szenario:** API-Call bei Stage-Change failed.

**UX:**
- Optimistic UI: Card bleibt in neuer Spalte
- Background-Sync: Retry nach 3 Sekunden
- Bei dauerhaftem Fehler: Card springt zurück + Toast-Fehlermeldung

---

## 11. Performance-Überlegungen

### 11.1 Kontakt-Liste (Pagination)

- Server-side Pagination (20 Items pro Seite)
- Cursor-basiert für stabile Sortierung
- Debounced Search (300ms)

### 11.2 Pipeline-Kanban (Pro)

- Virtualisierung bei >50 Deals pro Spalte
- Lazy-Loading von Deal-Details
- Optimistic Updates für Drag-and-Drop

### 11.3 Interaktions-Timeline

- Infinite Scroll (10 Items pro Ladung)
- Kollapsible Jahres-Gruppen

---

## 12. Zusammenfassung für Product Manager

### Was wird gebaut?

| Modul | Haupt-Features | Ziel-User |
|-------|---------------|-----------|
| **Kontakte** | Liste, Details, Tags, Notizen, Interaktionen | Alle Plans |
| **Deals** | Pipeline, Kanban (Pro), Drag-and-Drop (Pro) | Alle Plans |
| **Import** | Sammlung → Kontakte | Pro+ |

### Wichtige Entscheidungen

1. **Deutsche UI:** Alle Labels auf Deutsch ("Kontaktiert", "Angebot", etc.)
2. **Plan-Gating:** Free-User haben eingeschränkte Funktion (kein Kanban, Limits)
3. **Integration:** Nahtloser Import aus bestehenden Sammlungen (E6)
4. **Mobile:** Kanban ist horizontal scrollbar auf Mobile
5. **Accessibility:** Drag-and-Drop hat Keyboard-Alternative (Dropdown)

### Abhängigkeiten

**Blocks auf:**
- E6 Sammlungen (für Import-Feature)
- User Subscription System (für Plan-Gating)

**Wird blockiert von:**
- PROJ-20 Implementation
- PROJ-21 Implementation

---

## 13. Next Steps

1. **Backend Developer:** Datenbank-Schema erstellen + RLS Policies
2. **Frontend Developer:** Kontakt-Module bauen (PROJ-20)
3. **Frontend Developer:** Deal-Pipeline bauen (PROJ-21)
4. **QA:** End-to-End Tests für Import-Workflow

**Geschätzte Zeit:** 6-9 Tage (parallel: 4-5 Tage)

---

**Dokument erstellt:** Solution Architect
**Letzte Änderung:** 2026-02-08
**Review-Status:** PENDING USER APPROVAL
