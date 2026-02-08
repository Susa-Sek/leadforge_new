# PROJ-20: Kontaktverwaltung

**Epic:** E7 - CRM-System
**Status:** 🔵 Planned
**Priority:** High
**Assigned To:** Backend Developer, Frontend Developer

---

## Overview

Kontaktverwaltung ermöglicht Nutzern, Leads als dauerhafte Kontakte zu speichern und zu organisieren. Kernfunktionen sind CRUD-Operationen, Tags, Notizen, Interaktions-History und der Import aus Suchergebnissen (E6-Sammlungen).

---

## User Stories

### US-20.1: Kontakt erstellen
**Story:** Als User möchte ich einen neuen Kontakt manuell erstellen.

**Acceptance Criteria:**
- Formular mit Pflichtfeldern: Name, Firma
- Optionale Felder: Email, Telefon, Adresse, Website
- Validierung: Email-Format prüfen (zod)
- Erfolgsmeldung nach Erstellung
- Weiterleitung zu Kontakt-Detail

**UI:** /dashboard/kontakte/neu

---

### US-20.2: Kontakt bearbeiten
**Story:** Als User möchte ich Kontaktdaten bearbeiten.

**Acceptance Criteria:**
- Bearbeiten-Button auf Kontakt-Detail
- Formular mit aktuellen Werten vorausgefüllt
- Alle Felder editierbar
- Speichern mit Loading-State
- Cancel-Button

---

### US-20.3: Kontakt löschen
**Story:** Als User möchte ich einen Kontakt löschen.

**Acceptance Criteria:**
- Löschen-Button auf Detail und Liste
- Bestätigungsdialog
- Deals bleiben erhalten (contact_id → NULL)
- Interaktionen werden gelöscht
- Erfolgsmeldung

---

### US-20.4: Kontakt-Details anzeigen
**Story:** Als User möchte ich alle Details eines Kontakts sehen.

**Acceptance Criteria:**
- Detail-Seite mit allen Feldern
- Tags-Anzeige mit Farben
- Notizen-Bereich (editierbar inline)
- Interaktionen-Liste (Timeline-View)
- Verknüpfte Deals anzeigen

**UI:** /dashboard/kontakte/[id]

---

### US-20.5: Kontakt-Liste mit Filter
**Story:** Als User möchte ich alle Kontakte in einer Liste sehen.

**Acceptance Criteria:**
- Tabelle: Name, Firma, Email, Telefon, Tags
- Pagination (10/25/50 pro Seite)
- Sortierung per Klick auf Header
- Suche nach Name oder Firma (Echtzeit, debounced)
- Filter nach Tags (Multi-Select)
- Bulk-Aktionen (Pro+): Löschen, Tags zuweisen
- Import-Button (Pro+)

**UI:** /dashboard/kontakte

---

### US-20.6: Tags verwalten
**Story:** Als User möchte ich Tags zu Kontakten hinzufügen.

**Acceptance Criteria:**
- Tag-Input mit Autocomplete
- Tags als farbige Chips
- Max 5/20/unbegrenzt Tags (Free/Pro/Enterprise)
- Tag-Filter in Liste
- Tag-Manager (Pro+): umbenennen, Farbe ändern, löschen

---

### US-20.7: Import aus Sammlungen (E6 Integration)
**Story:** Als Pro-User möchte ich Leads aus Sammlungen importieren.

**Acceptance Criteria:**
- Import-Button auf Sammlungs-Detail (Pro+)
- Dialog mit Lead-Auswahl (Checkboxen)
- Duplikat-Erkennung via Email oder Place_ID
- Erfolgsmeldung mit Import-Zahl
- Weiterleitung zu Kontakt-Liste

---

### US-20.8: Notizen verwalten
**Story:** Als User möchte ich Notizen zu einem Kontakt speichern.

**Acceptance Criteria:**
- Notizen-Textarea auf Kontakt-Detail
- Autosave nach 2 Sekunden Inaktivität
- Max 5000/10000/unbegrenzt Zeichen
- Zeichenzähler anzeigen
- Speicher-Indikator: "Gespeichert" / "Speichern..."

---

### US-20.9: Interaktions-History
**Story:** Als User möchte ich alle Interaktionen mit einem Kontakt protokollieren.

**Acceptance Criteria:**
- Interaktionen-Liste auf Kontakt-Detail (Timeline)
- Typen: Email, Anruf, Meeting, Notiz, Task
- Formular: Typ, Datum, Notizen
- Chronologische Sortierung
- Editieren/Löschen
- Limit: 10/50/unbegrenzt (Free/Pro/Enterprise)

---

### US-20.10: Kontakt-Export (CSV)
**Story:** Als Pro-User möchte ich meine Kontakte exportieren.

**Acceptance Criteria:**
- Export-Button in Kontakt-Liste (Pro+)
- Optionen: Alle oder Ausgewählte (Bulk)
- CSV-Format: UTF-8 BOM, Semikolon separator
- Spalten: Name, Firma, Email, Telefon, Adresse, Website, Tags, Notizen, Erstellt am
- Dateiname: `manyleads_kontakte_[datum]_[zeit].csv`

---

## Technical Requirements

### Database Schema

```sql
-- contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  source_collection_id UUID REFERENCES search_history(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact_tags table
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact_tag_assignments table
CREATE TABLE contact_tag_assignments (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

-- interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'task')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/contacts | GET | List with filter/pagination/search |
| /api/contacts | POST | Create contact |
| /api/contacts/[id] | GET | Get contact details |
| /api/contacts/[id] | PUT | Update contact |
| /api/contacts/[id] | DELETE | Delete contact |
| /api/contacts/[id]/notes | PATCH | Update notes (autosave) |
| /api/contacts/[id]/interactions | GET | List interactions |
| /api/contacts/[id]/interactions | POST | Create interaction |
| /api/contacts/[id]/interactions/[id] | DELETE | Delete interaction |
| /api/contacts/import | POST | Import from collection |
| /api/contacts/export | POST | CSV Export |
| /api/contact-tags | GET | List user's tags |
| /api/contact-tags | POST | Create tag |
| /api/contact-tags/[id] | PUT | Update tag |
| /api/contact-tags/[id] | DELETE | Delete tag |

### Components

**Pages:**
- ContactListPage (`/dashboard/kontakte`)
- ContactDetailPage (`/dashboard/kontakte/[id]`)
- NewContactPage (`/dashboard/kontakte/neu`)
- EditContactPage (`/dashboard/kontakte/[id]/bearbeiten`)

**Components:**
- ContactList (Tabelle mit Pagination)
- ContactCard (für Mobile)
- ContactForm (Create/Edit)
- ContactDetail (Ansicht)
- ContactNotes (Autosave Textarea)
- TagInput (mit Autocomplete)
- TagManager (für Pro)
- InteractionTimeline (Chronologische Liste)
- InteractionForm (Hinzufügen)
- ImportFromCollectionDialog
- ContactFilters (Search, Tags)
- BulkActionsToolbar

---

## Plan-Based Feature Gating

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Kontakte | 50 | 500 | unbegrenzt |
| Tags pro Kontakt | 5 | 20 | unbegrenzt |
| Notizen | 5.000 chars | 10.000 chars | unbegrenzt |
| Interaktionen | 10 | 50 | unbegrenzt |
| Import | ❌ | ✅ | ✅ |
| Bulk-Aktionen | ❌ | ✅ | ✅ |
| Export | ❌ | CSV | CSV |
| Tag-Manager | ❌ | ✅ | ✅ |

---

## UI Specifications (German)

### Route Names
- /dashboard/kontakte - Kontakt-Liste
- /dashboard/kontakte/[id] - Kontakt-Detail
- /dashboard/kontakte/neu - Neuer Kontakt
- /dashboard/kontakte/[id]/bearbeiten - Kontakt bearbeiten

### Labels
| English | German |
|---------|--------|
| Contacts | Kontakte |
| Contact | Kontakt |
| New Contact | Neuer Kontakt |
| Edit Contact | Kontakt bearbeiten |
| Delete Contact | Kontakt löschen |
| Name | Name |
| Company | Firma |
| Email | E-Mail |
| Phone | Telefon |
| Address | Adresse |
| Website | Website |
| Notes | Notizen |
| Tags | Tags |
| Interactions | Interaktionen |
| Add Interaction | Interaktion hinzufügen |
| Import | Importieren |
| Export | Exportieren |
| Save | Speichern |
| Cancel | Abbrechen |
| Search | Suchen |
| Filter | Filtern |
| Sort by | Sortieren nach |

---

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-20-01 | Leerer Firmenname | Validierungsfehler |
| EC-20-02 | Duplikat-Email | Warnung, Bestätigung nötig |
| EC-20-03 | Ungültige Email | Validierungsfehler |
| EC-20-04 | Tag-Limit erreicht | Upsell-Hinweis |
| EC-20-05 | 0 Leads in Sammlung | Button disabled |
| EC-20-06 | Import: Alle Duplikate | Hinweis: "Alle bereits vorhanden" |
| EC-20-07 | Notizen-Autosave fail | Retry-Button, Indikator |
| EC-20-08 | Kontakt-Limit erreicht | Upsell-Dialog |
| EC-20-09 | 0 Kontakte | Empty State mit CTA |
| EC-20-10 | Kontakt anderer User | 403 Forbidden |

---

## Dependencies

**Blocks:**
- PROJ-21 (Deals) - Kontakte werden in Deals referenziert

**Blocked By:**
- E6 COMPLETED (Sammlungen für Import)
- PROJ-8 (User-Provider für Plan-Info)

---

## Success Criteria

- [ ] Alle 10 User Stories implementiert
- [ ] Kontakt-CRUD funktioniert
- [ ] Tags verwalten funktioniert
- [ ] Notizen Autosave funktioniert
- [ ] Interaktionen verwalten funktioniert
- [ ] Import aus Sammlungen funktioniert (Pro)
- [ ] Export funktioniert (Pro)
- [ ] Plan-Gating korrekt
- [ ] Deutsche UI überall

---

## Estimated Effort

- Backend: 2-3 Tage (inkl. Tests)
- Frontend: 3-4 Tage (komplex: Tags, Autosave, Import)
- QA: 1-2 Tage

**Total:** 6-9 Tage (parallel: 4-5 Tage)
