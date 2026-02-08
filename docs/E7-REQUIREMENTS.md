# Epic E7: CRM-System - Requirements

**Status:** IN PROGRESS
**Epic ID:** E7
**Projekte:** PROJ-20, PROJ-21
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E7 implementiert ein vollständiges CRM-System (Customer Relationship Management) für Manyleads.io. Nutzer können Leads aus Suchergebnissen als Kontakte importieren, diese verwalten, mit Tags/Notizen versehen und durch eine Deal-Pipeline führen.

**Kern-Features:**
- Kontaktverwaltung mit Details, Tags, Interaktions-History und Export
- Deal-Pipeline mit 5 Stages (Lead → Kontaktiert → Qualifiziert → Angebot → Geschlossen)
- Kanban-View mit Drag-and-Drop für Pro/Enterprise
- Import aus E6-Sammlungen
- Plan-basierte Limits und Feature-Gating

**Kontext:**
- E6 (Sammlungen) ist COMPLETED - Import-Quelle verfügbar
- Credit-System ist vollständig implementiert (PROJ-10)
- User-Plan-Konfiguration existiert (Free, Pro, Enterprise)

---

## PROJ-20: Kontaktverwaltung

**Status:** 🔵 Planned
**Abhängigkeiten:** E6 (Sammlungen für Import)

### Beschreibung

Kontaktverwaltung ermöglicht Nutzern, Leads als dauerhafte Kontakte zu speichern und zu organisieren. Kontakte können manuell erstellt oder aus Suchergebnissen (Sammlungen) importiert werden. Features: CRUD, Tags, Notizen, Interaktions-History, Export.

---

### Feature Matrix: Kontaktverwaltung nach Plan

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Kontakte anlegen** | 50 max | 500 max | unbegrenzt |
| **Kontakte bearbeiten** | ✅ | ✅ | ✅ |
| **Kontakte löschen** | ✅ | ✅ | ✅ |
| **Tags** | 5 max | 20 max | unbegrenzt |
| **Notizen** | 5.000 Zeichen | 10.000 Zeichen | unbegrenzt |
| **Import aus Sammlungen** | ❌ | ✅ | ✅ |
| **Bulk-Aktionen** | ❌ | ✅ | ✅ |
| **Kontakt-Export (CSV)** | ❌ | ✅ | ✅ |
| **Interaktions-History** | Letzte 10 | Letzte 50 | unbegrenzt |

---

### User Stories

#### US-20.1: Kontakt erstellen
**Als User möchte ich einen neuen Kontakt manuell erstellen, damit ich Geschäftspartner erfassen kann, die nicht aus Suchergebnissen stammen.**

**Acceptance Criteria:**
- [ ] Formular mit Pflichtfeldern: Name, Firma
- [ ] Optionale Felder: Email, Telefon, Adresse, Website
- [ ] Validierung: Email-Format prüfen (zod email validation)
- [ ] Telefon: Deutsche Formatierung (+49 optional)
- [ ] Adresse: Freitext (Straße, PLZ, Stadt in einem Feld)
- [ ] Erfolgsmeldung nach Erstellung (Toast)
- [ ] Weiterleitung zu Kontakt-Detail nach Erstellung
- [ ] "Neuer Kontakt"-Button auch in Kontakt-Liste

**UI Labels (Deutsch):**
| Label | German |
|-------|--------|
| Title | Neuer Kontakt |
| Name * | Name * |
| Company * | Firma * |
| Email | E-Mail |
| Phone | Telefon |
| Address | Adresse |
| Website | Website |
| Create | Kontakt erstellen |
| Cancel | Abbrechen |

---

#### US-20.2: Kontakt bearbeiten
**Als User möchte ich Kontaktdaten bearbeiten, damit ich Informationen aktualisieren kann.**

**Acceptance Criteria:**
- [ ] Bearbeiten-Button auf Kontakt-Detail (Pencil-Icon)
- [ ] Formular mit aktuellen Werten vorausgefüllt
- [ ] Alle Felder editierbar (außer ID, created_at, source_collection_id)
- [ ] Speichern-Button mit Loading-State
- [ ] Cancel-Button für Abbruch (zurück zu Detail)
- [ ] Änderungen sofort sichtbar nach Speichern
- [ ] Erfolgsmeldung nach Speichern

---

#### US-20.3: Kontakt löschen
**Als User möchte ich einen Kontakt löschen, damit ich veraltete Einträge entfernen kann.**

**Acceptance Criteria:**
- [ ] Löschen-Button auf Kontakt-Detail (Trash-Icon)
- [ ] Löschen-Option im Bulk-Actions Dropdown (Pro+)
- [ ] Bestätigungsdialog: "Möchten Sie [Name] von [Firma] wirklich löschen?"
- [ ] Info im Dialog: "Dies kann nicht rückgängig gemacht werden. Verknüpfte Deals bleiben erhalten."
- [ ] Löschung entfernt auch: Tags-Verknüpfungen, Interaktionen
- [ ] Deals bleiben erhalten (contact_id → NULL)
- [ ] Erfolgsmeldung nach Löschung
- [ ] Zurück zur Kontakt-Liste nach Löschung

---

#### US-20.4: Kontakt-Details anzeigen
**Als User möchte ich alle Details eines Kontakts sehen, damit ich vollständige Informationen habe.**

**Acceptance Criteria:**
- [ ] Detail-Seite unter `/dashboard/kontakte/[id]`
- [ ] Kontakt-Info Card: Name, Firma, alle Kontaktdaten
- [ ] Klick auf Email öffnet Mail-Client (`mailto:`)
- [ ] Klick auf Telefon öffnet Tel-Client (`tel:`)
- [ ] Klick auf Website öffnet in neuem Tab (mit https:// falls fehlend)
- [ ] Tags-Anzeige als farbige Chips
- [ ] Notizen-Bereich (sichtbar, editierbar inline)
- [ ] Interaktionen/History Liste (chronologisch, neueste zuerst)
- [ ] Verknüpfte Deals anzeigen (Liste mit Links)
- [ ] Bearbeiten- und Löschen-Buttons
- [ ] "Zurück zur Liste" Link

---

#### US-20.5: Kontakt-Liste mit Filter und Suche
**Als User möchte ich alle meine Kontakte in einer Liste sehen, damit ich den Überblick behalte.**

**Acceptance Criteria:**
- [ ] Tabelle mit Spalten: Name, Firma, Email, Telefon, Tags, Aktionen
- [ ] Pagination: 10/25/50 pro Seite wählbar
- [ ] Sortierung per Klick auf Header (Name, Firma, Erstellungsdatum)
- [ ] Suche nach Name oder Firma (Echtzeit-Suche, debounced)
- [ ] Filter nach Tags (Multi-Select)
- [ ] "Filter zurücksetzen"-Button
- [ ] Bulk-Aktionen (Pro+): Checkbox pro Zeile, Bulk-Delete, Bulk-Tag
- [ ] "Neuer Kontakt" Button
- [ ] "Import aus Sammlung" Button (Pro+, disabled mit Upsell für Free)
- [ ] Empty State wenn keine Kontakte: "Noch keine Kontakte. Erstellen Sie Ihren ersten Kontakt oder importieren Sie aus Sammlungen."

---

#### US-20.6: Tags verwalten
**Als User möchte ich Tags zu Kontakten hinzufügen, damit ich Kontakte kategorisieren kann.**

**Acceptance Criteria:**
- [ ] Tag-Input mit Autocomplete (bestehende Tags des Users)
- [ ] Enter oder Komma erstellt neuen Tag
- [ ] Tags als farbige Chips anzeigen (zufällige Farbe aus Palette)
- [ ] Tag entfernen via X-Button auf Chip
- [ ] Max 5 Tags pro Kontakt (Free), 20 (Pro), unbegrenzt (Enterprise)
- [ ] Tag-Filter in Kontakt-Liste (Dropdown mit Checkboxes)
- [ ] Tag-Manager Seite (Pro+): Tags umbenennen, Farbe ändern, löschen

**Tag-Farben (Default Palette):**
| Tag | Farbe |
|-----|-------|
| Kunde | Blue (#3B82F6) |
| Interessent | Green (#10B981) |
| Partner | Purple (#8B5CF6) |
| Lieferant | Orange (#F97316) |
| Wichtig | Red (#EF4444) |
| Cold | Gray (#6B7280) |
| Warm | Yellow (#F59E0B) |
| Hot | Red (#DC2626) |

---

#### US-20.7: Import aus Sammlungen (E6 Integration)
**Als Pro-User möchte ich Leads aus meinen Sammlungen als Kontakte importieren, damit ich Suchergebnisse im CRM weiterverarbeiten kann.**

**Acceptance Criteria:**
- [ ] Import-Button auf Sammlungs-Detail-Seite (nur Pro+, Upsell für Free)
- [ ] Dialog öffnet mit Liste aller Leads der Sammlung
- [ ] Checkbox pro Lead (Default: alle ausgewählt)
- [ ] Header-Checkbox wählt alle ab/aus
- [ ] Info: "X Leads ausgewählt"
- [ ] Duplikat-Erkennung: "Y Leads bereits als Kontakte vorhanden" (via Email oder Place_ID)
- [ ] Duplikate sind ausgegraut/nicht wählbar
- [ ] Import-Button erstellt Kontakte für ausgewählte Leads
- [ ] Erfolgsmeldung: "Z Kontakte importiert"
- [ ] Weiterleitung zu Kontakt-Liste mit Filter "Zuletzt importiert"

**Mapping Lead → Kontakt:**
| Lead Feld | Kontakt Feld |
|-----------|--------------|
| lead_data.name | contact.name |
| lead_data.company | contact.company |
| lead_data.address | contact.address |
| lead_data.phone | contact.phone |
| lead_data.email | contact.email |
| lead_data.website | contact.website |
| search_history_id | contact.source_collection_id |

---

#### US-20.8: Notizen verwalten
**Als User möchte ich Notizen zu einem Kontakt speichern, damit ich wichtige Informationen festhalten kann.**

**Acceptance Criteria:**
- [ ] Notizen-Textarea auf Kontakt-Detail
- [ ] Autosave nach 2 Sekunden Inaktivität (debounced)
- [ ] Max 5.000 Zeichen (Free), 10.000 (Pro), unbegrenzt (Enterprise)
- [ ] Zeichenzähler anzeigen: "X / Y Zeichen"
- [ ] Formatierung: Plain Text (kein Rich Text für MVP)
- [ ] Speicher-Indikator: "Gespeichert" / "Speichern..." / "Nicht gespeichert"
- [ ] Letzte Bearbeitung Zeitstempel anzeigen

---

#### US-20.9: Interaktions-History (Kontakt-History)
**Als User möchte ich alle Interaktionen mit einem Kontakt protokollieren, damit ich die Kommunikationshistorie nachvollziehen kann.**

**Acceptance Criteria:**
- [ ] Interaktionen-Liste auf Kontakt-Detail (Timeline-View)
- [ ] Interaktion-Typen: Email, Anruf, Meeting, Notiz, Task
- [ ] Formular zum Hinzufügen: Typ (Dropdown), Datum, Notizen
- [ ] Chronologische Sortierung (neueste zuerst)
- [ ] Interaktion editieren/löschen
- [ ] Limit: Letzte 10 (Free), 50 (Pro), unbegrenzt (Enterprise)
- [ ] Filter nach Typ

**Interaktion-Formular:**
- Typ: Email | Anruf | Meeting | Notiz | Task
- Datum: Datepicker (Default: heute)
- Notizen: Textarea
- Kontakt-ID wird automatisch gesetzt

---

#### US-20.10: Kontakt-Export (CSV)
**Als Pro-User möchte ich meine Kontakte exportieren, damit ich sie in anderen Systemen verwenden kann.**

**Acceptance Criteria:**
- [ ] Export-Button in Kontakt-Liste (Pro+, Upsell für Free)
- [ ] Export-Optionen: Alle Kontakte oder Ausgewählte (Bulk)
- [ ] CSV-Format: UTF-8 mit BOM, Semikolon separator
- [ ] Spalten: Name, Firma, Email, Telefon, Adresse, Website, Tags, Notizen, Erstellt am
- [ ] Tags als komma-separierte Liste in einer Spalte
- [ ] Dateiname: `manyleads_kontakte_[datum]_[zeit].csv`
- [ ] Download startet automatisch

**CSV Format:**
```csv
Name;Firma;E-Mail;Telefon;Adresse;Website;Tags;Notizen;Erstellt am
Max Mustermann;Musterfirma GmbH;max@example.com;+49 40 123456;Musterstraße 1, 20095 Hamburg;https://example.com;Kunde,Warm;Wichtiger Kontakt;2026-02-08
```

---

### Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-20-01** | Daten | Leerer/null Firmenname | Validierungsfehler: "Firma ist erforderlich" |
| **EC-20-02** | Daten | Duplikat-Email (bereits vorhanden) | Warnung: "Kontakt mit dieser E-Mail existiert bereits. Trotzdem erstellen?" |
| **EC-20-03** | Daten | Ungültige Email-Format | Validierungsfehler vor Submit |
| **EC-20-04** | Daten | Sehr lange Eingaben (>255 Zeichen) | Max-Length Validierung, Zeichenzähler |
| **EC-20-05** | Daten | Telefon mit Buchstaben | Bereinigen oder Warnung, keine harte Blockade |
| **EC-20-06** | Daten | Website ohne http/https | Automatisch https:// voranstellen |
| **EC-20-07** | Daten | Spezialzeichen in Namen | HTML-Escaping, korrekte Anzeige |
| **EC-20-08** | Tags | Tag-Limit erreicht | Hinweis: "Max X Tags erlaubt. Upgrade für mehr." |
| **EC-20-09** | Tags | Leerer Tag-Name | Ignorieren, kein leerer Tag erstellen |
| **EC-20-10** | Tags | Tag-Löschung während Verwendung | Tag wird entfernt, Kontakte behalten andere Tags |
| **EC-20-11** | Notizen | Zeichenlimit erreicht | Blockierung weiterer Eingabe, Hinweis |
| **EC-20-12** | Notizen | Autosave-Fail | Indikator "Nicht gespeichert", Retry-Button |
| **EC-20-13** | Import | 0 Leads in Sammlung | Button disabled mit Tooltip "Sammlung ist leer" |
| **EC-20-14** | Import | Alle Leads sind Duplikate | Hinweis: "Alle Leads bereits als Kontakte vorhanden" |
| **EC-20-15** | Import | Teilweise erfolgreich | Erfolgsmeldung: "X importiert, Y Duplikate übersprungen" |
| **EC-20-16** | Import | Sammlung gelöscht während Import | Fehler: "Sammlung nicht gefunden" |
| **EC-20-17** | List | 0 Kontakte | Empty State mit CTA |
| **EC-20-18** | List | 1000+ Kontakte | Pagination, Performance-Optimierung |
| **EC-20-19** | List | Suche ergibt 0 Treffer | "Keine Kontakte gefunden. Filter zurücksetzen?" |
| **EC-20-20** | Bulk | 0 Kontakte ausgewählt für Bulk | Bulk-Actions disabled |
| **EC-20-21** | Bulk | 500+ Kontakte ausgewählt | "Alle X Kontakte ausgewählt", progressives Laden |
| **EC-20-22** | Plan | Kontakt-Limit erreicht | Block mit Upsell: "Limit erreicht. Upgraden für mehr Kontakte." |
| **EC-20-23** | Plan | Upgrade während Nutzung | Limits sofort angehoben, keine Neuladung nötig |
| **EC-20-24** | Security | Kontakt anderer Users aufrufen | 403 Forbidden, Redirect zu eigener Liste |
| **EC-20-25** | Export | 0 Kontakte für Export | Hinweis: "Keine Kontakte zum Exportieren" |
| **EC-20-26** | History | 0 Interaktionen | Empty State: "Noch keine Interaktionen. Erste hinzufügen?" |
| **EC-20-27** | API | Timeout bei Import | Progress-Indicator, Retry-Mechanismus |
| **EC-20-28** | Session | Timeout während Bearbeiten | Warnung vor Datenverlust, Login-Redirect |

---

## PROJ-21: Deal-Pipeline

**Status:** 🔵 Planned
**Abhängigkeiten:** PROJ-20 (Kontakte für Assignment)

### Beschreibung

Deal-Pipeline ermöglicht Nutzern, Verkaufschancen zu verfolgen und durch definierte Stages zu führen. Features: CRUD, 5-Stage Pipeline, Kanban-View (Pro+), Drag-and-Drop (Pro+), Deal-Statistiken.

---

### Feature Matrix: Deal-Pipeline nach Plan

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Deals anlegen** | 10 max | 100 max | unbegrenzt |
| **Deals bearbeiten** | ✅ | ✅ | ✅ |
| **Deals löschen** | ✅ | ✅ | ✅ |
| **Stage-Change** | Dropdown | Dropdown + Drag | Dropdown + Drag |
| **Pipeline Kanban** | ❌ | ✅ | ✅ |
| **Drag-and-Drop** | ❌ | ✅ | ✅ |
| **Deal-Filter** | Basic | Advanced | Advanced |
| **Deal-Statistiken** | Basic | Advanced | Advanced |
| **Deal-Export** | ❌ | CSV | CSV + Excel |

---

### Pipeline Stages

| Stage | German Label | Farbe | Beschreibung |
|-------|-------------|-------|--------------|
| 1 | Lead | Grau (#9CA3AF) | Initialer Kontakt |
| 2 | Kontaktiert | Blau (#3B82F6) | Erste Interaktion |
| 3 | Qualifiziert | Gelb (#F59E0B) | Bedarf bestätigt |
| 4 | Angebot | Orange (#F97316) | Angebot unterbreitet |
| 5 | Geschlossen | Grün/Rot (#10B981 / #EF4444) | Gewonnen oder Verloren |

---

### User Stories

#### US-21.1: Deal erstellen
**Als User möchte ich einen neuen Deal erstellen, damit ich Verkaufschancen erfassen kann.**

**Acceptance Criteria:**
- [ ] Formular mit Pflichtfeldern: Titel, Stage
- [ ] Optionale Felder: Wert (€), Wahrscheinlichkeit (%), Erwartetes Closing (Datum), Beschreibung
- [ ] Kontakt-Verknüpfung: Dropdown mit meinen Kontakten (optional)
- [ ] Stage-Default: "Lead"
- [ ] Wahrscheinlichkeit: Slider 0-100%, Default je nach Stage
- [ ] Erfolgsmeldung nach Erstellung
- [ ] Weiterleitung zu Deal-Detail oder Pipeline

**UI Labels (Deutsch):**
| Label | German |
|-------|--------|
| Title | Neuer Deal |
| Title * | Titel * |
| Stage * | Stage * |
| Value | Wert (€) |
| Probability | Wahrscheinlichkeit (%) |
| Expected Close | Erwartetes Closing |
| Contact | Kontakt |
| Description | Beschreibung |
| Create | Deal erstellen |

**Default Wahrscheinlichkeiten:**
| Stage | Default Probability |
|-------|-------------------|
| Lead | 10% |
| Kontaktiert | 25% |
| Qualifiziert | 50% |
| Angebot | 75% |
| Geschlossen | 100% (gewonnen) / 0% (verloren) |

---

#### US-21.2: Deal bearbeiten
**Als User möchte ich Deal-Daten bearbeiten, damit ich Informationen aktualisieren kann.**

**Acceptance Criteria:**
- [ ] Bearbeiten-Button auf Deal-Detail
- [ ] Formular mit aktuellen Werten vorausgefüllt
- [ ] Alle Felder editierbar
- [ ] Stage-Change via Dropdown möglich
- [ ] Speichern mit Loading-State
- [ ] Cancel-Button
- [ ] Erfolgsmeldung nach Speichern

---

#### US-21.3: Deal löschen
**Als User möchte ich einen Deal löschen, damit ich abgebrochene Chancen entfernen kann.**

**Acceptance Criteria:**
- [ ] Löschen-Button auf Deal-Detail und in Pipeline (auf Card)
- [ ] Bestätigungsdialog: "Möchten Sie den Deal '[Titel]' wirklich löschen?"
- [ ] Erfolgsmeldung
- [ ] Zurück zur Pipeline nach Löschung

---

#### US-21.4: Stage-Change via Dropdown
**Als User möchte ich die Stage eines Deals ändern, damit ich den Verkaufsfortschritt dokumentiere.**

**Acceptance Criteria:**
- [ ] Stage-Dropdown auf Deal-Detail
- [ ] Alle 5 Stages verfügbar
- [ ] Änderung sofort gespeichert (Auto-save)
- [ ] Bei "Geschlossen": Extra Dialog für Won/Lost
- [ ] Wahrscheinlichkeit wird bei Stage-Change vorgeschlagen
- [ ] Historie der Stage-Changes (optional für MVP)

**Geschlossen-Dialog:**
- Option: "Gewonnen" oder "Verloren"
- Bei Gewonnen: Tatsächliches Closing-Datum (Default: heute)
- Bei Verloren: Grund (optional Dropdown: Zu teuer, Timing, Konkurrenz, Sonstiges)

---

#### US-21.5: Pipeline-Kanban anzeigen (Pro+)
**Als Pro-User möchte ich eine Kanban-Ansicht meiner Deals sehen, damit ich den Überblick über alle Verkaufschancen habe.**

**Acceptance Criteria:**
- [ ] 5 Spalten für die Stages (horizontal nebeneinander)
- [ ] Jede Spalte zeigt: Anzahl Deals, Summe der Deal-Werte
- [ ] Deal-Cards mit: Titel, Wert (€), Wahrscheinlichkeit (%), Kontakt-Name (verknüpft)
- [ ] Cards sind sortierbar (nach Wert, Wahrscheinlichkeit, Datum)
- [ ] "Neuer Deal" Button pro Spalte (mit vorausgewählter Stage)
- [ ] Responsive: Horizontal Scroll auf Mobile, Collapse auf Tablet
- [ ] Empty States für leere Spalten
- [ ] Klick auf Card öffnet Deal-Detail

**UI:** `/dashboard/deals`

---

#### US-21.6: Drag-and-Drop Stage-Change (Pro+)
**Als Pro-User möchte ich Deals per Drag-and-Drop zwischen Stages verschieben, damit ich schnell den Status aktualisieren kann.**

**Acceptance Criteria:**
- [ ] Drag-and-Drop funktioniert auf Desktop (React DnD oder @dnd-kit)
- [ ] Visuelles Feedback während Drag (Card leicht transparent, Cursor ändert sich)
- [ ] Drop-Zone Highlight (Spalte färbt sich bei Hover)
- [ ] Stage wird nach Drop sofort aktualisiert
- [ ] Animation bei erfolgreichem Drop (kurze Fade-Animation)
- [ ] Touch-Alternative für Mobile: Stage-Dropdown auf Card
- [ ] Bei Drop auf "Geschlossen": Won/Lost Dialog erscheint

---

#### US-21.7: Deal-Assignment zu Kontakt
**Als User möchte ich einen Deal einem Kontakt zuweisen, damit ich weiß, zu welchem Kunden die Chance gehört.**

**Acceptance Criteria:**
- [ ] Kontakt-Dropdown beim Erstellen/Bearbeiten (meine Kontakte)
- [ ] Kontakt-Name auf Deal-Card klickbar → Kontakt-Detail
- [ ] Deal wird auf Kontakt-Detail aufgelistet
- [ ] Deal kann auch ohne Kontakt existieren (optional/null erlaubt)
- [ ] Filter "Ohne Kontakt" in Pipeline-View

---

#### US-21.8: Deal-Filter und Sortierung
**Als User möchte ich Deals filtern und sortieren, damit ich relevante Chancen schnell finde.**

**Acceptance Criteria:**
- [ ] Filter nach Stage (Multi-Select, alle 5 Stages)
- [ ] Filter nach Kontakt (Dropdown)
- [ ] Filter nach Wert-Bereich (Min/Max Slider)
- [ ] Filter nach Wahrscheinlichkeit (Min/Max Slider)
- [ ] Filter nach Closing-Datum (Zeitraum: Diese Woche, Dieser Monat, Nächster Monat, Benutzerdefiniert)
- [ ] Sortierung: Wert (auf/ab), Wahrscheinlichkeit, Closing-Datum, Erstellungsdatum
- [ ] Aktive Filter als Chips anzeigen (mit X zum Entfernen)
- [ ] "Alle Filter zurücksetzen"-Button
- [ ] Filter-State in URL (für Sharing)

---

#### US-21.9: Deal-Statistiken (Dashboard)
**Als User möchte ich Statistiken über meine Pipeline sehen, damit ich meine Verkaufsperformance analysieren kann.**

**Acceptance Criteria:**
- [ ] Statistik-Cards über der Pipeline (Pro+) oder separater Tab (Free)
- [ ] Metriken:
  - Gesamtpipeline-Wert (alle offenen Deals)
  - Gewichteter Pipeline-Wert (Wert × Wahrscheinlichkeit)
  - Anzahl offene Deals
  - Durchschnittliche Wahrscheinlichkeit
  - Win Rate (Gewonnen / (Gewonnen + Verloren))
  - Durchschnittliche Deal-Größe
  - Deals geschlossen diesen Monat
- [ ] Zeit-Filter: Dieser Monat, Letzte 30 Tage, Dieses Quartal, Dieses Jahr
- [ ] Visualisierung: Einfache Balken oder KPI-Cards (keine Charts für MVP)
- [ ] Prognose: Geschätzter Umsatz basierend auf Pipeline

---

### Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-21-01** | Daten | Leerer Deal-Titel | Validierungsfehler |
| **EC-21-02** | Daten | Negativer Deal-Wert | Validierungsfehler oder 0 |
| **EC-21-03** | Daten | Wahrscheinlichkeit > 100% | Clamping auf 100 |
| **EC-21-04** | Daten | Wahrscheinlichkeit < 0% | Clamping auf 0 |
| **EC-21-05** | Daten | Closing-Datum in Vergangenheit | Warnung, aber erlaubt |
| **EC-21-06** | Daten | Closing-Datum > 1 Jahr in Zukunft | Warnung: "Lange Pipeline?" |
| **EC-21-07** | Daten | Kontakt gelöscht nach Deal-Erstellung | Deal bleibt, contact_id → NULL, Hinweis: "Kontakt nicht mehr verfügbar" |
| **EC-21-08** | Stage | Stage-Change zu Geschlossen ohne Won/Lost | Dialog erzwingt Auswahl |
| **EC-21-09** | Stage | Won/Lost ändern nach Closing | Erlaubt, Historie wird aktualisiert |
| **EC-21-10** | Kanban | 0 Deals in Pipeline | Empty State mit CTA |
| **EC-21-11** | Kanban | Sehr viele Deals (>50) in einer Spalte | Virtualisierung oder "Mehr laden" |
| **EC-21-12** | Kanban | Drag-Drop auf gleiche Stage | Keine Aktion, kein API-Call |
| **EC-21-13** | Kanban | Drag-Drop während API-Call | Disable weiterer Drags, Loading-Indicator |
| **EC-21-14** | Filter | Filter ergibt 0 Deals | "Keine Deals gefunden", Vorschlag Filter lockern |
| **EC-21-15** | Filter | Inkonsistente Filter (z.B. Stage=Lead AND Stage=Closed) | UND-Logik ergibt 0, Hinweis |
| **EC-21-16** | Sort | Sortierung während Drag-Operation | Deaktivieren oder Queue |
| **EC-21-17** | Stats | 0 geschlossene Deals | Win Rate: "N/A", andere Metriken normal |
| **EC-21-18** | Stats | Alle Deals haben Wert=0/null | Pipeline-Wert: 0, Hinweis: "Werte hinzufügen für Statistiken" |
| **EC-21-19** | Plan | Deal-Limit erreicht | Block mit Upsell |
| **EC-21-20** | Plan | Free-User versucht Kanban | Upsell-Dialog: "Kanban ist ein Pro-Feature" |
| **EC-21-21** | Plan | Trial endet während Nutzung | Redirect zu Free-View (Liste statt Kanban) |
| **EC-21-22** | Security | Deal anderer Users aufrufen | 403 Forbidden |
| **EC-21-23** | API | Timeout bei Stage-Change | Rollback auf vorherige Stage, Error-Toast |
| **EC-21-24** | Mobile | Touch-Drag auf Mobile | Alternative: Stage-Dropdown auf Card |
| **EC-21-25** | Mobile | Horizontales Scrollen | Smooth Scroll, Snap zu Spalten |
| **EC-21-26** | Export | 0 Deals für Export | Hinweis: "Keine Deals zum Exportieren" |

---

## Technische Anforderungen

### Performance

| Operation | Ziel |
|-----------|------|
| Kontakt-Liste laden | < 500ms für 100 Einträge |
| Kontakt-Suche | < 100ms (client-seitig, debounced) |
| Deal-Pipeline laden | < 1s für alle Stages |
| Drag-and-Drop Update | < 300ms API-Response |
| Autosave Notizen | < 500ms |
| Import | < 2s für 50 Leads |

### State Management

```typescript
// Kontakt Filter State
interface ContactFilterState {
  search: string;
  tags: string[];
  sortBy: 'name' | 'company' | 'created_at';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: 10 | 25 | 50;
}

// Deal Filter State
interface DealFilterState {
  stages: string[];  // Multi-select
  contactId: string | null;
  valueRange: { min: number | null; max: number | null };
  probabilityRange: { min: number | null; max: number | null };
  closeDateRange: { from: Date | null; to: Date | null };
  sortBy: 'value' | 'probability' | 'closeDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
```

### URL-Sync

**Kontakte:**
- `/dashboard/kontakte?search=abc&tags=Kunde,Warm&sort=name&order=asc&page=1`

**Deals:**
- `/dashboard/deals?stages=Lead,Contacted&contact=uuid&value_min=1000&value_max=5000&sort=value`

---

## UI Spezifikationen

### Kontakt-Liste Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  KONTAKTE (42)                                    [+ Neuer Kontakt]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Suche...              ]  [Tags ▼]  [Sort: Name ▼]  [⚙️]               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ □ │ Name          │ Firma           │ E-Mail       │ Tags      │   │
│  │───│───────────────│─────────────────│──────────────│───────────│   │
│  │ □ │ Max Mustermann│ Musterfirma GmbH│ max@mail.de  │ Kunde,Warm│   │
│  │ □ │ Anna Schmidt  │ Schmidt IT      │ anna@mail.de │ Interess. │   │
│  │ □ │ ...           │ ...             │ ...          │ ...       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ← 1 2 3 4 5 →                           Zeige 1-10 von 42              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Kontakt-Detail Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Zurück zur Liste                                              ⚙️ 🗑️ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │  Max Mustermann                 │  │ INTERAKTIONEN               │  │
│  │  Musterfirma GmbH               │  │ ─────────────────────────── │  │
│  │                                 │  │ • 08.02.2026 - Email        │  │
│  │  📧 max@mail.de                 │  │   "Angebot gesendet"        │  │
│  │  📞 +49 40 123456               │  │                             │  │
│  │  📍 Musterstraße 1, Hamburg     │  │ • 01.02.2026 - Anruf        │  │
│  │  🌐 https://example.com         │  │   "Erstgespräch"            │  │
│  │                                 │  │                             │  │
│  │  Tags: [Kunde] [Warm]           │  │ [+ Interaktion hinzufügen]  │  │
│  │                                 │  └─────────────────────────────┘  │
│  │  NOTIZEN                        │  ┌─────────────────────────────┐  │
│  │  ─────────────────────────      │  │ VERKNÜPFTE DEALS            │  │
│  │  Wichtiger Kontakt, im          │  │ ─────────────────────────── │  │
│  │  Januar 2026 hinzugefügt.       │  │ • Website-Relaunch - €5.000 │  │
│  │                                 │  │   Stage: Angebot            │  │
│  │  Gespeichert vor 2 Minuten      │  │ • Beratung - €2.500         │  │
│  │                                 │  │   Stage: Qualifiziert       │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Kanban Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PIPELINE                                    [+ Neuer Deal]    [Filter]  [Statistik]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐      │
│  │ LEAD         │ KONTAKTIERT  │ QUALIFIZIERT │ ANGEBOT      │ GESCHLOSSEN  │      │
│  │ ───────────  │ ───────────  │ ───────────  │ ───────────  │ ───────────  │      │
│  │ 5 Deals      │ 3 Deals      │ 2 Deals      │ 1 Deal       │ 8 Deals      │      │
│  │ €25.000      │ €15.000      │ €50.000      │ €10.000      │ €80.000      │      │
│  │ [+ Hinzuf.]  │ [+ Hinzuf.]  │ [+ Hinzuf.]  │ [+ Hinzuf.]  │ [+ Hinzuf.]  │      │
│  │              │              │              │              │              │      │
│  │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │      │
│  │ │Website   │ │ │Beratung  │ │ │SEO       │ │ │Relaunch  │ │ │Project A │ │      │
│  │ │Relaunch  │ │ │Q1        │ │ │Package   │ │ │2026      │ │ │✓ €30.000 │ │      │
│  │ │          │ │ │          │ │ │          │ │ │          │ │ │Project B │ │      │
│  │ │€5.000    │ │ │€5.000    │ │ │€25.000   │ │ │€10.000   │ │ │✗ €10.000 │ │      │
│  │ │25%       │ │ │50%       │ │ │75%       │ │ │80%       │ │ │...       │ │      │
│  │ │Musterfir.│ │ │Schmidt IT│ │ │Beiersdorf│ │ │Musterfir.│ │ │          │ │      │
│  │ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │      │
│  │              │              │              │              │              │      │
│  │ ┌──────────┐ │              │              │              │              │      │
│  │ │App Dev   │ │              │              │              │              │      │
│  │ │...       │ │              │              │              │              │      │
│  │ └──────────┘ │              │              │              │              │      │
│  └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘      │
│                                                                                     │
│  ← Scroll →                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Deal-Statistiken Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PIPELINE STATISTIKEN                                          [Dieser Monat ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PIPELINE    │  │ GEWICHTET   │  │ OFFENE      │  │ WIN RATE    │    │
│  │ WERT        │  │ WERT        │  │ DEALS       │  │             │    │
│  │             │  │             │  │             │  │             │    │
│  │ €100.000    │  │ €65.000     │  │ 11          │  │ 67%         │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Ø DEAL      │  │ GESCHLOSSEN │  │ GEWONNEN    │  │ VERLOREN    │    │
│  │ GRÖßE       │  │ DIESEN      │  │ DIESEN      │  │ DIESEN      │    │
│  │             │  │ MONAT       │  │ MONAT       │  │ MONAT       │    │
│  │ €9.091      │  │ 3           │  │ 2           │  │ 1           │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  PROGNOSE: Basierend auf Ihrer Pipeline erwarten Sie €65.000 Umsatz   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Kontakte

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/contacts` | GET | Liste mit Filter/Pagination |
| `/api/contacts` | POST | Kontakt erstellen |
| `/api/contacts/[id]` | GET | Kontakt-Details |
| `/api/contacts/[id]` | PUT | Kontakt aktualisieren |
| `/api/contacts/[id]` | DELETE | Kontakt löschen |
| `/api/contacts/[id]/notes` | PATCH | Notizen speichern |
| `/api/contacts/[id]/interactions` | GET | Interaktionen laden |
| `/api/contacts/[id]/interactions` | POST | Interaktion hinzufügen |
| `/api/contacts/import` | POST | Import aus Sammlung |
| `/api/contacts/export` | POST | CSV Export |

### Deals

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/deals` | GET | Liste mit Filter |
| `/api/deals` | POST | Deal erstellen |
| `/api/deals/[id]` | GET | Deal-Details |
| `/api/deals/[id]` | PUT | Deal aktualisieren |
| `/api/deals/[id]` | DELETE | Deal löschen |
| `/api/deals/[id]/stage` | PATCH | Stage-Update (für DnD) |
| `/api/deals/pipeline` | GET | Kanban-Daten |
| `/api/deals/stats` | GET | Statistiken |
| `/api/deals/export` | POST | CSV Export |

---

## Datenbank Schema

### Contacts Table

```sql
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

-- RLS: User sieht nur eigene Kontakte
```

### Contact Tags

```sql
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_tag_assignments (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);
```

### Interactions

```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'task')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deal Stages

```sql
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
```

### Deals Table

```sql
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

-- Indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
```

---

## Abhängigkeiten

### PROJ-20 hängt ab von:
- E6 (Sammlungen) - für Import-Feature
- PROJ-8 (User-Provider) - für Plan-Information

### PROJ-21 hängt ab von:
- PROJ-20 (Kontakte) - für Deal-Assignment
- PROJ-8 (User-Provider) - für Plan-Information

---

## Komponenten-Architektur (Vorschlag)

```
src/components/crm/
├── contacts/
│   ├── contact-list.tsx
│   ├── contact-card.tsx
│   ├── contact-form.tsx
│   ├── contact-detail.tsx
│   ├── contact-notes.tsx
│   ├── tag-input.tsx
│   ├── tag-manager.tsx
│   ├── interaction-timeline.tsx
│   ├── interaction-form.tsx
│   └── import-dialog.tsx
│
├── deals/
│   ├── deal-pipeline.tsx
│   ├── deal-kanban.tsx
│   ├── deal-card.tsx
│   ├── deal-form.tsx
│   ├── deal-detail.tsx
│   ├── deal-filters.tsx
│   ├── stage-column.tsx
│   ├── stats-dashboard.tsx
│   └── won-lost-dialog.tsx
│
└── shared/
    ├── export-button.tsx
    ├── bulk-actions.tsx
    └── empty-state.tsx
```

---

## Design Referenzen

- **Tabelle:** shadcn/ui Table Komponente
- **Karten:** shadcn/ui Card
- **Dialoge:** shadcn/ui Dialog
- **Dropdown:** shadcn/ui Select
- **Badges:** shadcn/ui Badge
- **Drag-and-Drop:** @dnd-kit/core (empfohlen für React)
- **Slider:** shadcn/ui Slider
- **Datepicker:** shadcn/ui Calendar (react-day-picker)
- **Toast:** shadcn/ui Sonner

---

## QA Checklist (für später)

### PROJ-20 Testfälle
- [ ] Kontakt erstellen funktioniert
- [ ] Kontakt bearbeiten funktioniert
- [ ] Kontakt löschen funktioniert
- [ ] Tags hinzufügen/entfernen funktioniert
- [ ] Notizen Autosave funktioniert
- [ ] Import aus Sammlungen funktioniert (Pro)
- [ ] Export generiert korrekte CSV
- [ ] Interaktionen hinzufügen/löschen funktioniert
- [ ] Plan-Gating korrekt (Limits, Upsell)
- [ ] Mobile-Ansicht nutzbar

### PROJ-21 Testfälle
- [ ] Deal erstellen/bearbeiten/löschen funktioniert
- [ ] Stage-Change via Dropdown funktioniert
- [ ] Pipeline Kanban funktioniert (Pro)
- [ ] Drag-and-Drop funktioniert (Pro)
- [ ] Deal-Filter funktionieren
- [ ] Statistiken werden korrekt berechnet
- [ ] Won/Lost Dialog erscheint bei Closing
- [ ] Plan-Gating korrekt
- [ ] Mobile-Ansicht nutzbar (Touch-Alternative)

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Pending Solution Architect Review
