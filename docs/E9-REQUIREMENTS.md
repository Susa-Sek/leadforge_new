# Epic E9: Export-Funktionen - Requirements (PROJ-25)

**Status:** 🔵 Planned
**Epic ID:** E9
**Projekte:** PROJ-25 (Export-System)
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E9 implementiert ein umfassendes Export-System für Manyleads.io, das Benutzern ermöglicht, Kontakte, Deals und Suchergebnisse in verschiedenen Formaten zu exportieren. Das System unterstützt sowohl einfache CSV-Exporte als auch komplexe Excel-Exporte mit Formatierung, Templates und zeitgesteuerte Exporte für Enterprise-Kunden.

**Kern-Features:**
- CSV Export von Kontakten, Deals und Suchergebnissen (Pro/Enterprise)
- Excel Export (.xlsx) mit Formatierung (Enterprise)
- Konfigurierbare Spaltenauswahl und Filter
- Export-Templates für wiederkehrende Exporte
- Scheduled/Automated Exports (Enterprise)
- Export-History mit Download-Management
- Plan-basiertes Feature-Gating

**Kontext:**
- E7 (CRM-System) ist IN PROGRESS - contacts und deals Tabellen werden verfügbar
- E6 (Sammlungen) ist COMPLETED - search_results als Export-Quelle
- E3 (Credit-System) ist COMPLETED - Plan-Tier Erkennung verfügbar
- E5 Lead-Tabelle hat bereits Basis-Export (CSV/Excel) implementiert

---

## PROJ-25: Export-System

**Status:** 🔵 Planned
**Abhängigkeiten:** E7 (CRM-System für contacts/deals), E6 (Sammlungen für search_results)

### Beschreibung

Das Export-System ermöglicht Nutzern, ihre Daten aus verschiedenen Quellen (Kontakte, Deals, Suchergebnisse) in verschiedenen Formaten zu exportieren. Es unterstützt sowohl kleine, synchrone Exporte als auch große, asynchrone Exporte mit Background-Verarbeitung.

---

### Feature Matrix (Plan-Gating)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **CSV Export** | ❌ | ✅ (max 1.000 Zeilen) | ✅ (max 10.000 Zeilen) |
| **Excel Export (.xlsx)** | ❌ | ❌ | ✅ |
| **Deal-Pipeline Export** | ❌ | ✅ | ✅ |
| **Bulk Export (Suchergebnisse)** | ❌ | ❌ | ✅ |
| **Scheduled Exports** | ❌ | ❌ | ✅ |
| **Export Templates** | ❌ | 3 max | Unlimited |
| **Template Sharing (Team)** | ❌ | ❌ | ✅ |
| **Export History** | ❌ | 30 Tage | 90 Tage |
| **E-Mail Benachrichtigungen** | ❌ | ✅ | ✅ |
| **DSGVO Export (alle Daten)** | ❌ | ❌ | ✅ |

❌ = Feature nicht verfügbar, Upgrade-Prompt wird angezeigt

---

## User Stories

### US-25.1: CSV Export von Kontakten

**Als Pro/Enterprise Nutzer möchte ich meine CRM-Kontakte als CSV-Datei exportieren, damit ich die Daten in externen Tools verwenden kann.**

**Acceptance Criteria:**
- [ ] Export-Button in Kontakt-Liste (Toolbar) sichtbar für Pro/Enterprise
- [ ] Export-Button zeigt Upgrade-Prompt für Free-User
- [ ] CSV-Export mit Semikolon als Trennzeichen (deutsches Format)
- [ ] UTF-8 Encoding mit BOM für Excel-Kompatibilität
- [ ] Auswahl der zu exportierenden Spalten (Dialog vor Export)
- [ ] Aktive Filter werden auf Export angewendet
- [ ] Export von bis zu 1.000 Kontakten (Pro) oder 10.000 (Enterprise)
- [ ] Dateiname: `manyleads_kontakte_YYYY-MM-DD_HH-mm.csv`
- [ ] Download startet automatisch nach Generierung
- [ ] Export wird in Export-History protokolliert

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Exportieren | Exportieren |
| CSV Export | CSV Export |
| Spalten auswählen | Spalten auswählen |
| Alle Spalten | Alle Spalten |
| Ausgewählte Spalten | Ausgewählte Spalten |
| Export starten | Export starten |
| Export wird vorbereitet... | Export wird vorbereitet... |
| Download startet automatisch | Download startet automatisch |
| Verfügbar für | Verfügbar für Pro und Enterprise |

**Verfügbare Spalten:**

| Spalte | Beschreibung | Free | Pro | Enterprise |
|--------|--------------|------|-----|------------|
| ID | Interne UUID | ❌ | ✅ | ✅ |
| Name | Kontaktname | ❌ | ✅ | ✅ |
| Firma | Unternehmen | ❌ | ✅ | ✅ |
| E-Mail | E-Mail-Adresse | ❌ | ✅ | ✅ |
| Telefon | Telefonnummer | ❌ | ✅ | ✅ |
| Adresse | Vollständige Adresse | ❌ | ✅ | ✅ |
| Website | Website-URL | ❌ | ✅ | ✅ |
| Tags | Komma-separierte Tags | ❌ | ✅ | ✅ |
| Notizen | Kontaktnotizen | ❌ | ✅ | ✅ |
| Quelle | Import-Quelle (Sammlung) | ❌ | ✅ | ✅ |
| Erstellt am | Datum | ❌ | ✅ | ✅ |
| Zuletzt bearbeitet | Datum | ❌ | ❌ | ✅ |
| Anzahl Interaktionen | Zahl | ❌ | ❌ | ✅ |
| Zugeordnete Deals | Anzahl Deals | ❌ | ❌ | ✅ |

---

### US-25.2: Excel Export (.xlsx) von Kontakten

**Als Enterprise Nutzer möchte ich meine Kontakte als formatierte Excel-Datei exportieren, damit ich professionelle Reports erstellen kann.**

**Acceptance Criteria:**
- [ ] Excel-Export nur für Enterprise verfügbar (Upgrade-Prompt für Free/Pro)
- [ ] Export im .xlsx Format (nicht .xls)
- [ ] Formatierte Header (Hintergrundfarbe Primary Blue, Fettschrift, weiße Schrift)
- [ ] Optimierte Spaltenbreiten (Auto-fit)
- [ ] Mehrere Sheets:
  - Sheet 1: "Kontakte" - Alle Kontaktdaten
  - Sheet 2: "Interaktionen" - Interaktions-History (optional)
  - Sheet 3: "Zusammenfassung" - Statistiken
- [ ] Zusammenfassungs-Sheet enthält:
  - Gesamtanzahl Kontakte
  - Anzahl nach Tags gruppiert
  - Anzahl mit/ohne E-Mail
  - Anzahl mit/ohne Telefon
- [ ] Freeze Top Row (Header bleibt sichtbar beim Scrollen)
- [ ] Filter aktiv in Header-Zeile
- [ ] Kein Zeilen-Limit bei Enterprise (max 10.000)
- [ ] Dateiname: `manyleads_kontakte_YYYY-MM-DD_HH-mm.xlsx`

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Excel Export | Excel Export (.xlsx) |
| Mit Interaktionen | Mit Interaktionen |
| Mit Zusammenfassung | Mit Zusammenfassung |
| Formatierung | Formatierung |
| Enterprise Feature | Enterprise Feature |
| Jetzt upgraden | Jetzt upgraden |

**Excel Formatierungs-Vorgaben:**

```
Header-Zeile:
- Hintergrund: #3B82F6 (Primary Blue)
- Schrift: Fett, Weiß (#FFFFFF)
- Schriftgröße: 11pt
- Rahmen: Dünn, Dunkelblau

Daten-Zeilen:
- Abwechselnd: Weiß / Hellgrau (#F9FAFB)
- Rahmen: Dünn, Hellgrau
- Schriftgröße: 10pt

Zusammenfassung-Sheet:
- Titel: Fett, 14pt, Primary Blue
- Labels: Fett, 10pt
- Werte: 10pt
```

---

### US-25.3: Deal-Pipeline Export

**Als Pro/Enterprise Nutzer möchte ich meine Deals und Pipeline-Daten exportieren, damit ich Umsatz-Reports und Analysen erstellen kann.**

**Acceptance Criteria:**
- [ ] Export-Button in Pipeline-View (Kanban) und Deal-Liste
- [ ] Export nach Stage filterbar (Multi-Select aller 5 Stages)
- [ ] Zeitraum-basierte Exporte (erstellt zwischen Datum X und Y)
- [ ] Umsatz- und Wahrscheinlichkeitsdaten enthalten
- [ ] Deal-Status (offen/gewonnen/verloren) enthalten
- [ ] Verknüpfter Kontakt (Name, Firma) enthalten
- [ ] CSV und Excel Format verfügbar (Excel nur Enterprise)
- [ ] Optional: Stage-History exportieren (Enterprise)
- [ ] Pipeline-Summary (Werte pro Stage) als separates Sheet (Excel)

**Deal Export Spalten:**

| Spalte | Beschreibung | CSV | Excel |
|--------|--------------|-----|-------|
| Deal ID | Interne UUID | ✅ | ✅ |
| Titel | Deal-Name | ✅ | ✅ |
| Beschreibung | Deal-Beschreibung | ✅ | ✅ |
| Stage | Aktuelle Stage | ✅ | ✅ |
| Wert (€) | Deal-Wert | ✅ | ✅ |
| Wahrscheinlichkeit (%) | 0-100% | ✅ | ✅ |
| Erwartetes Closing | Datum | ✅ | ✅ |
| Tatsächliches Closing | Datum | ✅ | ✅ |
| Status | Offen/Gewonnen/Verloren | ✅ | ✅ |
| Abschlussgrund | Grund für Verlust | ✅ | ✅ |
| Kontakt Name | Verknüpfter Kontakt | ✅ | ✅ |
| Kontakt Firma | Firma des Kontakts | ✅ | ✅ |
| Kontakt E-Mail | E-Mail | ❌ | ✅ |
| Kontakt Telefon | Telefon | ❌ | ✅ |
| Erstellt am | Datum | ✅ | ✅ |
| Tage in Pipeline | Berechnet | ❌ | ✅ |
| Gewichteter Wert | Wert × Wahrscheinlichkeit | ❌ | ✅ |

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Deals exportieren | Deals exportieren |
| Stage auswählen | Stage auswählen |
| Alle Stages | Alle Stages |
| Zeitraum | Zeitraum |
| Von | Von |
| Bis | Bis |
| Mit Kontaktdetails | Mit Kontaktdetails |
| Mit History | Mit Stage-History |

---

### US-25.4: Bulk-Export aus Suchergebnissen

**Als Enterprise Nutzer möchte ich meine Suchergebnisse in großen Mengen exportieren, damit ich die gewonnenen Leads weiterverarbeiten kann.**

**Acceptance Criteria:**
- [ ] Export-Button in Suchergebnis-Tabelle (LeadResultsTable)
- [ ] Bulk Export nur für Enterprise verfügbar (Pro: max 1.000)
- [ ] Export von bis zu 10.000 Leads aus Suchergebnissen
- [ ] Übernahme der aktiven Smart-Filter in den Export
- [ ] Auswahl: Alle Ergebnisse oder nur markierte Einträge
- [ ] Asynchrone Verarbeitung für große Exporte (>1.000 Einträge)
- [ ] E-Mail-Benachrichtigung bei Fertigstellung (optional)
- [ ] Download-Link gültig für 7 Tage
- [ ] Fortschrittsanzeige für asynchrone Exporte
- [ ] Export-Quelle wird in History als "Suchergebnis" markiert

**Bulk Export Spalten (Lead-Daten):**

| Spalte | Beschreibung | Verfügbarkeit |
|--------|--------------|---------------|
| Firmenname | Name des Unternehmens | Alle Pläne |
| Adresse | Vollständige Adresse | Alle Pläne |
| Telefon | Telefonnummer | Pro+ |
| E-Mail | E-Mail-Adresse | Pro+ |
| Website | Website-URL | Pro+ |
| Branche | Geschäftskategorie | Enterprise |
| Bewertung | Google Rating (1-5) | Enterprise |
| Anzahl Bewertungen | Review Count | Enterprise |
| LinkedIn | LinkedIn URL | Enterprise |
| Xing | Xing URL | Enterprise |
| Öffnungszeiten | Opening Hours | Enterprise |
| Place ID | Google Places ID | Enterprise |
| Suchdatum | Wann gefunden | Enterprise |
| Suchquery | Original-Suchbegriffe | Enterprise |

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Leads exportieren | Leads exportieren |
| Alle X Leads | Alle {count} Leads |
| Ausgewählte Leads | Ausgewählte Leads ({count}) |
| Asynchroner Export | Großer Export - wird im Hintergrund verarbeitet |
| E-Mail Benachrichtigung | E-Mail Benachrichtigung wenn fertig |
| Geschätzte Dauer | Geschätzte Dauer: {minutes} Minuten |
| Export läuft... | Export läuft... ({percent}%) |
| Bereit zum Download | Bereit zum Download |

**Asynchrone Export-States:**

```
PENDING     -> Warteschlange
PROCESSING  -> Wird verarbeitet (Fortschritt %)
COMPLETED   -> Fertig, Download verfügbar
FAILED      -> Fehlgeschlagen, Retry möglich
EXPIRED     -> Download-Link abgelaufen (>7 Tage)
```

---

### US-25.5: Scheduled/Automated Exports (Enterprise)

**Als Enterprise Nutzer möchte ich wiederkehrende Exporte automatisch durchführen lassen, damit ich aktuelle Daten regelmäßig erhalte ohne manuelle Arbeit.**

**Acceptance Criteria:**
- [ ] Scheduled Exports nur für Enterprise verfügbar
- [ ] Einrichtung von täglichen, wöchentlichen oder monatlichen Exporten
- [ ] Zeitliche Planung (Uhrzeit, z.B. 08:00 Uhr)
- [ ] Template-basierte Konfiguration (welche Spalten, Filter)
- [ ] E-Mail-Versand der Export-Dateien als Attachment
- [ ] E-Mail-Versand mit Download-Link (für große Dateien)
- [ ] Lauf-History und Status-Tracking pro Scheduled Export
- [ ] Deaktivieren/Aktivieren von Scheduled Exports
- [ ] Maximale Anzahl: 10 Scheduled Exports pro User
- [ ] Benachrichtigung bei Fehlschlag
- [ ] Nächster Lauf wird angezeigt

**Scheduled Export Konfiguration:**

| Einstellung | Optionen | Beschreibung |
|-------------|----------|--------------|
| Name | Freitext | z.B. "Wöchentliche Kontakte" |
| Datenquelle | Kontakte / Deals / Leads | Was exportiert wird |
| Frequenz | Täglich / Wöchentlich / Monatlich | Wie oft |
| Tag | Mo-So / 1-31 | Bei wöchentlich/monatlich |
| Uhrzeit | HH:MM | Wann läuft der Export |
| Template | Vorhandene Templates | Spalten-Konfiguration |
| Filter | Quellspezifisch | z.B. Stage, Tags |
| Format | CSV / Excel | Export-Format |
| Zustellung | E-Mail Attachment / Link | Wie wird geliefert |
| Empfänger | E-Mail-Adressen | Mehrere möglich |

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Geplante Exporte | Geplante Exporte |
| Neuer geplanter Export | Neuer geplanter Export |
| Häufigkeit | Häufigkeit |
| Täglich | Täglich |
| Wöchentlich | Wöchentlich |
| Monatlich | Monatlich |
| Tag der Woche | Tag der Woche |
| Tag des Monats | Tag des Monats (1-31) |
| Uhrzeit | Uhrzeit |
| Nächster Lauf | Nächster Lauf: {datum} |
| Letzter Lauf | Letzter Lauf: {datum} |
| Aktiv | Aktiv |
| Pausiert | Pausiert |
| Als E-Mail senden | Als E-Mail senden |
| Empfänger-E-Mail | Empfänger-E-Mail |

---

### US-25.6: Export-Templates

**Als Pro/Enterprise Nutzer möchte ich Export-Konfigurationen speichern und wiederverwenden, damit ich konsistente Exporte schnell durchführen kann.**

**Acceptance Criteria:**
- [ ] Template-Verwaltung in Export-Dialog integriert
- [ ] Template erstellen mit Name und optionaler Beschreibung
- [ ] Speicherung von Spalten-Auswahl
- [ ] Speicherung von Default-Filtern
- [ ] Speicherung von Format-Optionen (CSV/Excel)
- [ ] Template-Verwaltung: Editieren, Löschen, Duplizieren
- [ ] Template-Auswahl im Export-Dialog (Dropdown)
- [ ] Limit: 3 Templates (Pro), Unlimited (Enterprise)
- [ ] Template-Sharing im Team (Enterprise): Templates als "öffentlich" markieren
- [ ] Standard-Templates vom System (für neue Nutzer)
- [ ] Template als Basis für Scheduled Exports nutzen

**Template-Attribute:**

```typescript
interface ExportTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  export_type: 'contacts' | 'deals' | 'leads';
  format: 'csv' | 'excel';
  column_selection: string[]; // Welche Spalten
  default_filters?: {
    // Typ-abhängige Filter
    stages?: string[]; // für Deals
    tags?: string[]; // für Kontakte
    has_email?: boolean;
    has_phone?: boolean;
  };
  format_options?: {
    include_summary?: boolean; // Excel
    include_interactions?: boolean; // Excel
    send_email?: boolean;
    email_recipients?: string[];
  };
  is_public?: boolean; // Enterprise: Team-Sharing
  created_at: string;
  updated_at: string;
}
```

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Templates | Templates |
| Neues Template | Neues Template |
| Template speichern | Template speichern |
| Template laden | Template laden |
| Template bearbeiten | Template bearbeiten |
| Template löschen | Template löschen |
| Template duplizieren | Template duplizieren |
| Als Vorlage speichern | Als Vorlage speichern |
| Standard-Template | Standard-Template |
| Öffentlich (Team) | Öffentlich (Team) |
| Privat | Privat |
| {count} von {max} Templates | {count} von {max} Templates verwendet |

**Standard-Templates (System):**

1. **"Kontakte Basis"** (CSV)
   - Spalten: Name, Firma, E-Mail, Telefon

2. **"Kontakte Vollständig"** (CSV)
   - Spalten: Alle verfügbaren Kontakt-Spalten

3. **"Deals Pipeline"** (Excel, Enterprise)
   - Spalten: Titel, Stage, Wert, Wahrscheinlichkeit, Kontakt
   - Mit Zusammenfassung

---

## Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-25-01** | Daten | 0 Einträge zum Exportieren | Hinweis: "Keine Daten zum Exportieren. Passen Sie Ihre Filter an." |
| **EC-25-02** | Daten | Export-Limit überschritten | Fehler: "Maximal {limit} Zeilen erlaubt. Filtern Sie Ihre Daten oder upgraden Sie." |
| **EC-25-03** | Daten | Sehr lange Texte (>1000 Zeichen) in Feldern | Abschneiden mit "..." oder in Excel: Zeilenumbruch aktivieren |
| **EC-25-04** | Daten | Sonderzeichen in Daten (Emojis, Unicode) | UTF-8 Encoding, korrekte Darstellung in Excel |
| **EC-25-05** | Daten | Datumsfelder sind null | Leere Zelle in CSV, "-" in Excel |
| **EC-25-06** | Daten | Numerische Felder sind null | Leere Zelle oder 0 (je nach Kontext) |
| **EC-25-07** | Format | Excel-Datei > 100MB | Warnung: "Datei sehr groß. Verwenden Sie CSV für bessere Performance." |
| **EC-25-08** | Format | CSV mit Zeilenumbrüchen in Feldern | Escaping mit Anführungszeichen gemäß RFC 4180 |
| **EC-25-09** | Filter | Ungültige Filter-Kombination | Validierung vor Export, Fehlermeldung |
| **EC-25-10** | Async | Export-Job läuft bereits | Hinweis: "Ein Export läuft bereits. Bitte warten Sie." |
| **EC-25-11** | Async | Export-Job schlägt fehl | E-Mail-Benachrichtigung, Retry-Button in History |
| **EC-25-12** | Async | Export-Job dauert zu lange (>30 Min) | Timeout, Fehlermeldung, Support-Link |
| **EC-25-13** | Storage | Speicherplatz voll | Fehler: "Speicherplatz nicht verfügbar. Kontaktieren Sie den Support." |
| **EC-25-14** | Download | Download-Link abgelaufen (>7 Tage) | Fehler: "Link abgelaufen. Starten Sie den Export erneut." |
| **EC-25-15** | Download | Datei wurde gelöscht | Fehler: "Datei nicht mehr verfügbar." |
| **EC-25-16** | Scheduled | Scheduled Export fällt auf Feiertag | Normal ausführen (keine Feiertagsprüfung) |
| **EC-25-17** | Scheduled | Scheduled Export mit gelöschtem Template | Fehler in Logs, Benachrichtigung an User |
| **EC-25-18** | Scheduled | User hat keine Daten mehr (z.B. alle Kontakte gelöscht) | Leerer Export wird versendet mit Hinweis |
| **EC-25-19** | Template | Template mit ungültigen Spalten (Schema geändert) | Ignorieren der ungültigen Spalten, Hinweis |
| **EC-25-20** | Template | Template-Limit erreicht (Pro: 3) | Block mit Upsell: "Upgrade für unbegrenzte Templates" |
| **EC-25-21** | Template | Letztes Template löschen | Erlaubt, keine Einschränkung |
| **EC-25-22** | Plan | Pro-User versucht Excel-Export | Upgrade-Prompt mit Feature-Vergleich |
| **EC-25-23** | Plan | Free-User klickt auf Export-Button | Upgrade-Prompt: "Export ist ein Pro-Feature" |
| **EC-25-24** | Plan | Plan wechselt während laufendem Export | Export wird normal beendet, neue Limits gelten danach |
| **EC-25-25** | E-Mail | E-Mail-Benachrichtigung bounce | Loggen, keine weitere Aktion |
| **EC-25-26** | E-Mail | Ungültige E-Mail-Adresse für Scheduled Export | Validierung, Fehlermeldung beim Speichern |
| **EC-25-27** | Security | User versucht Export anderer User-Daten | 403 Forbidden (RLS verhindert das) |
| **EC-25-28** | Security | Rate-Limit überschritten (5/Min) | 429 Too Many Requests, Retry-After Header |
| **EC-25-29** | Concurrent | Mehrere gleichzeitige Exporte vom selben User | Queue-basiert, sequentielle Verarbeitung |
| **EC-25-30** | DSGVO | User fordert kompletten Datenexport an | Alle Daten inkl. Metadata, Logs, Settings |

---

## Nicht-funktionale Anforderungen (NFRs)

### Performance

| Operation | Ziel | Bemerkung |
|-----------|------|-----------|
| Kleiner Export (<100 Zeilen) | < 2 Sekunden | Synchron, direkter Download |
| Mittlerer Export (100-1.000 Zeilen) | < 5 Sekunden | Synchron, Fortschrittsanzeige optional |
| Großer Export (1.000-10.000 Zeilen) | < 60 Sekunden | Asynchron, Background-Job |
| Sehr großer Export (>10.000 Zeilen) | < 5 Minuten | Asynchron, Chunked Processing |
| Streaming für CSV | Ja | Memory-Effizienz |
| Memory-Limit pro Export | 512 MB | Hard Limit für Worker |
| Datei-Größen-Limit | 100 MB | Pro Export-Datei |
| Chunk-Größe | 1.000 Zeilen | Für große Exporte |

### Sicherheit

| Anforderung | Implementierung |
|-------------|-----------------|
| RLS | Export nur für eigene Daten |
| Signed URLs | Download-URLs mit 1-Stunde Gültigkeit |
| Rate-Limiting | 5 Exporte pro Minute, 50 pro Stunde pro User |
| Audit-Logging | Alle Export-Aktionen werden geloggt |
| Keine sensiblen Daten in Logs | User-Daten niemals in Application Logs |
| File Permissions | Export-Dateien nur für Owner lesbar |
| Auto-Expire | Dateien nach 7/30/90 Tagen automatisch löschen |

### Datenschutz (DSGVO)

| Anforderung | Implementierung |
|-------------|-----------------|
| Datenexport auf Anfrage | Enterprise: Kompletter Export aller User-Daten |
| Export-Metadaten | Timestamp, User-ID, Export-Grund |
| Löschung nach Ablauf | Automatische Löschung nach 7/30/90 Tagen |
| Benachrichtigung | E-Mail bei Export-Fertigstellung (optional) |
| Opt-out | Scheduled Exports jederzeit deaktivierbar |
| Datenminimierung | Nur angeforderte Spalten exportieren |

### Skalierbarkeit

| Aspekt | Lösung |
|--------|--------|
| Queue-basierte Verarbeitung | Supabase Background Functions oder Edge Functions |
| Horizontal skalierbare Worker | State-less Design |
| Chunked Export | 1.000 Zeilen pro Chunk |
| Streaming | Für CSV-Dateien |
| Storage | Supabase Storage mit RLS |

---

## API Requirements

### API Endpoints

| Endpoint | Method | Beschreibung | Auth | Plan |
|----------|--------|--------------|------|------|
| `/api/export/contacts` | POST | Kontakte exportieren | JWT | Pro+ |
| `/api/export/deals` | POST | Deals exportieren | JWT | Pro+ |
| `/api/export/leads` | POST | Suchergebnisse exportieren | JWT | Enterprise |
| `/api/export/status/:id` | GET | Export-Status abfragen | JWT | Pro+ |
| `/api/export/download/:id` | GET | Export-Datei herunterladen | JWT + Signed URL | Pro+ |
| `/api/export/cancel/:id` | POST | Laufenden Export abbrechen | JWT | Pro+ |
| `/api/export/history` | GET | Export-History laden | JWT | Pro+ |
| `/api/export/history/:id` | DELETE | Export aus History löschen | JWT | Pro+ |
| `/api/export/templates` | GET | Templates auflisten | JWT | Pro+ |
| `/api/export/templates` | POST | Template erstellen | JWT | Pro+ |
| `/api/export/templates/:id` | PUT | Template aktualisieren | JWT | Pro+ |
| `/api/export/templates/:id` | DELETE | Template löschen | JWT | Pro+ |
| `/api/export/scheduled` | GET | Scheduled Exports auflisten | JWT | Enterprise |
| `/api/export/scheduled` | POST | Scheduled Export erstellen | JWT | Enterprise |
| `/api/export/scheduled/:id` | PUT | Scheduled Export aktualisieren | JWT | Enterprise |
| `/api/export/scheduled/:id` | DELETE | Scheduled Export löschen | JWT | Enterprise |
| `/api/export/scheduled/:id/toggle` | POST | Scheduled Export aktivieren/deaktivieren | JWT | Enterprise |

### Request/Response Schemas

#### POST /api/export/contacts

**Request:**
```typescript
{
  format: 'csv' | 'excel';
  columns: string[]; // z.B. ['name', 'company', 'email']
  filters?: {
    tags?: string[];
    hasEmail?: boolean;
    hasPhone?: boolean;
    dateFrom?: string;
    dateTo?: string;
  };
  templateId?: string; // Optional: Vorlage verwenden
  async?: boolean; // Für große Exporte
}
```

**Response (Sync):**
```typescript
{
  success: true;
  exportId: string;
  status: 'completed';
  downloadUrl: string; // Signed URL
  fileName: string;
  fileSize: number;
  rowCount: number;
  expiresAt: string; // ISO Date
}
```

**Response (Async):**
```typescript
{
  success: true;
  exportId: string;
  status: 'pending' | 'processing';
  estimatedSeconds: number;
  checkStatusUrl: string;
}
```

#### GET /api/export/status/:id

**Response:**
```typescript
{
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number; // 0-100
  rowCount?: number;
  processedRows?: number;
  downloadUrl?: string; // Nur bei completed
  errorMessage?: string; // Nur bei failed
  createdAt: string;
  completedAt?: string;
}
```

#### POST /api/export/templates

**Request:**
```typescript
{
  name: string;
  description?: string;
  exportType: 'contacts' | 'deals' | 'leads';
  format: 'csv' | 'excel';
  columns: string[];
  defaultFilters?: object;
  formatOptions?: object;
  isPublic?: boolean; // Enterprise only
}
```

#### POST /api/export/scheduled

**Request:**
```typescript
{
  name: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 für weekly
  dayOfMonth?: number; // 1-31 für monthly
  timeOfDay: string; // "HH:mm" Format
  emailRecipients: string[];
  deliveryMethod: 'attachment' | 'link';
}
```

### Error Responses

| Status Code | Error Code | Beschreibung |
|-------------|------------|--------------|
| 400 | INVALID_FORMAT | Ungültiges Format angegeben |
| 400 | INVALID_COLUMNS | Ungültige Spalten ausgewählt |
| 400 | INVALID_FILTERS | Filter-Validierung fehlgeschlagen |
| 401 | UNAUTHORIZED | Nicht authentifiziert |
| 403 | PLAN_REQUIRED | Feature nicht im aktuellen Plan |
| 403 | LIMIT_EXCEEDED | Export-Limit überschritten |
| 404 | TEMPLATE_NOT_FOUND | Template nicht gefunden |
| 404 | EXPORT_NOT_FOUND | Export nicht gefunden |
| 409 | EXPORT_ALREADY_RUNNING | Ein Export läuft bereits |
| 429 | RATE_LIMIT_EXCEEDED | Zu viele Export-Anfragen |
| 500 | EXPORT_FAILED | Export-Verarbeitung fehlgeschlagen |
| 500 | STORAGE_ERROR | Speicherfehler |

---

## Database Schema Requirements

### export_logs Tabelle

```sql
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),
  file_path TEXT, -- Supabase Storage Path
  file_size_bytes INTEGER,
  file_name TEXT,
  row_count INTEGER,
  processed_rows INTEGER DEFAULT 0,
  column_selection JSONB, -- Array der exportierten Spalten
  filters_applied JSONB, -- Angewendete Filter
  template_id UUID REFERENCES export_templates(id),
  source_type TEXT, -- 'contacts', 'deals', 'search_results'
  source_query TEXT, -- Für Leads: Original-Suchquery
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Auto-delete nach 7/30/90 Tagen
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX idx_export_logs_status ON export_logs(status);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at);
CREATE INDEX idx_export_logs_expires_at ON export_logs(expires_at);

-- RLS
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own exports"
  ON export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own exports"
  ON export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own exports"
  ON export_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own exports"
  ON export_logs FOR DELETE
  USING (auth.uid() = user_id);
```

### export_templates Tabelle

```sql
CREATE TABLE export_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  export_type TEXT NOT NULL CHECK (export_type IN ('contacts', 'deals', 'leads')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel')),
  column_selection JSONB NOT NULL, -- Array der Spalten
  default_filters JSONB, -- Default Filter
  format_options JSONB, -- Format-spezifische Optionen
  is_public BOOLEAN DEFAULT FALSE, -- Enterprise: Team-Sharing
  organization_id UUID, -- Für zukünftige Team-Features
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX idx_export_templates_is_public ON export_templates(is_public) WHERE is_public = TRUE;

-- RLS
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates and public templates"
  ON export_templates FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = TRUE
    OR (is_public = TRUE AND organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can only manage their own templates"
  ON export_templates FOR ALL
  USING (auth.uid() = user_id);
```

### scheduled_exports Tabelle (Enterprise)

```sql
CREATE TABLE scheduled_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_id UUID REFERENCES export_templates(id) NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, für weekly
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- Für monthly
  time_of_day TIME NOT NULL, -- z.B. '08:00'
  timezone TEXT DEFAULT 'Europe/Berlin',
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  email_recipients JSONB NOT NULL, -- Array von E-Mail-Adressen
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('attachment', 'link')),
  last_export_id UUID REFERENCES export_logs(id),
  last_error_message TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scheduled_exports_user_id ON scheduled_exports(user_id);
CREATE INDEX idx_scheduled_exports_is_active ON scheduled_exports(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = TRUE;

-- RLS
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own scheduled exports"
  ON scheduled_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own scheduled exports"
  ON scheduled_exports FOR ALL
  USING (auth.uid() = user_id);
```

### Database Functions

```sql
-- Auto-cleanup Funktion für abgelaufene Exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired exports
  UPDATE export_logs
  SET status = 'expired'
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND status != 'expired';

  -- Lösche sehr alte expired exports (nach 30 Tagen)
  DELETE FROM export_logs
  WHERE status = 'expired'
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Function um nächsten Lauf zu berechnen
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_time_of_day TIME,
  p_timezone TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_next TIMESTAMPTZ;
BEGIN
  v_now := NOW() AT TIME ZONE p_timezone;

  IF p_frequency = 'daily' THEN
    v_next := (CURRENT_DATE + p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '1 day';
    END IF;
  ELSIF p_frequency = 'weekly' THEN
    -- Berechne nächsten Wochentag
    v_next := (CURRENT_DATE + (p_day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7 + p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '7 days';
    END IF;
  ELSIF p_frequency = 'monthly' THEN
    -- Berechne nächsten Monatstag
    v_next := (DATE_TRUNC('month', CURRENT_DATE) + (p_day_of_month - 1) + p_time_of_day) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '1 month';
    END IF;
  END IF;

  RETURN v_next;
END;
$$;
```

---

## UI/UX Spezifikationen

### Export-Button Komponenten

**Kontakte Export Button:**
- Platzierung: Toolbar in /dashboard/kontakte
- Icon: Download (ArrowDownTray)
- Label: "Exportieren"
- Dropdown mit Optionen: "CSV", "Excel" (wenn Enterprise)

**Deals Export Button:**
- Platzierung: Toolbar in /dashboard/deals
- Icon: Download
- Label: "Exportieren"

**Leads Export Button:**
- Platzierung: Toolbar in LeadResultsTable
- Icon: Download
- Label: "Leads exportieren"
- Bulk-Auswahl berücksichtigen

### Export-Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  Kontakte exportieren                                    [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Template: [Basis-Export ▼]  [Speichern als Template]           │
│                                                                  │
│  Format:  (•) CSV    ( ) Excel (Enterprise)                     │
│                                                                  │
│  Spalten auswählen:                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ ☑ Name                  │  │ ☑ E-Mail                │       │
│  │ ☑ Firma                 │  │ ☑ Telefon               │       │
│  │ ☑ Adresse               │  │ ☑ Website               │       │
│  │ ☑ Tags                  │  │ ☑ Notizen               │       │
│  │ ☑ Erstellt am           │  │ ☐ Interaktionen (Excel) │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                  │
│  Geschätzte Dateigröße: ~245 KB (1.250 Zeilen)                  │
│                                                                  │
│  [Abbrechen]                              [Export starten]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Export-Fortschritt (Async)

```
┌─────────────────────────────────────────────────────────────────┐
│  Export wird vorbereitet...                              [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 75%                              │
│                                                                  │
│  750 von 1.000 Kontakten verarbeitet                            │
│                                                                  │
│  Geschätzte Restzeit: ~10 Sekunden                              │
│                                                                  │
│  [Abbrechen]                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Export-History Seite

**Route:** `/dashboard/einstellungen/exporte`

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPORT-HISTORY                                          [Zurück]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter: [Alle Typen ▼] [Alle Status ▼]        [Aktualisieren]  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Datum     │ Typ      │ Format │ Zeilen │ Status  │ Aktion │  │
│  ├───────────┼──────────┼────────┼────────┼─────────┼────────┤  │
│  │ 08.02.26  │ Kontakte │ CSV    │ 1.250  │ ✓ Fertig│ [DL]   │  │
│  │ 07.02.26  │ Deals    │ Excel  │ 45     │ ✓ Fertig│ [DL]   │  │
│  │ 06.02.26  │ Leads    │ CSV    │ 5.000  │ ✗ Fehl.│ [Wdh]  │  │
│  │ ...       │ ...      │ ...    │ ...    │ ...     │ ...    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ← Seite 1 von 3 →                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Template-Verwaltung

**Route:** `/dashboard/einstellungen/exporte/templates`

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPORT-TEMPLATES                                        [Zurück]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2 von 3 Templates verwendet                              [+ Neu]│
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Basis-Export                           [Bearb.] [Löschen] │  │
│  │ CSV • Kontakte • 5 Spalten                                │  │
│  │ Zuletzt verwendet: 08.02.2026                             │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Wöchentliche Reports                   [Bearb.] [Löschen] │  │
│  │ Excel • Deals • 10 Spalten • Mit Zusammenfassung          │  │
│  │ Zuletzt verwendet: 01.02.2026                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### E7 CRM-System Integration

**Kontakte Export:**
- Export-Button in `/dashboard/kontakte` Toolbar
- Zugriff auf `contacts` Tabelle
- Filter-Integration mit Kontakt-Filtern (Tags, Suche)

**Deals Export:**
- Export-Button in `/dashboard/deals` Toolbar
- Zugriff auf `deals` + `deal_stages` Tabellen
- Pipeline-Filter-Integration

### E6 Sammlungen Integration

**Leads Export:**
- Export-Button in `LeadResultsTable` (bereits vorhanden in E5)
- Zugriff auf `search_results` Tabelle
- Übernahme von Smart-Filtern (E5)

### E3 Credit/Plan System Integration

**Plan-Gating:**
- `usePlan()` Hook für Plan-Tier Erkennung
- Feature-Limit Prüfung vor Export
- Upgrade-Prompt für gesperrte Features

---

## Handoff Checklist

### Für Solution Architect

**Zu designen:**

- [ ] **Architecture Document:** `docs/architecture-e9-export-system.md`
  - [ ] Component Structure (ExportButton, ExportDialog, ExportProgress)
  - [ ] State Management für Export-Status
  - [ ] Background Job Architecture (Edge Functions vs Supabase Background)
  - [ ] Storage Strategy (Supabase Storage Buckets, RLS)
  - [ ] Queue Implementation für Async Exports
  - [ ] Scheduled Export Trigger (pg_cron vs Edge Function Scheduler)

- [ ] **API Contracts:**
  - [ ] Detaillierte Zod Schemas für alle Endpoints
  - [ ] Request/Response Beispiele
  - [ ] Error Handling Strategy

- [ ] **Database Design:**
  - [ ] Vollständige SQL Migrations
  - [ ] Index-Optimierung für große Exporte
  - [ ] RLS Policies
  - [ ] Auto-Cleanup Functions

- [ ] **Storage Design:**
  - [ ] Bucket Structure: `exports/{user_id}/{export_id}.{ext}`
  - [ ] Lifecycle Policies (Auto-delete nach 7/30/90 Tagen)
  - [ ] Signed URL Generation

- [ ] **Plan-Gating Matrix:**
  - [ ] Feature-Flags für Export-Typen
  - [ ] Limit-Checking Logic
  - [ ] Upgrade-Flow Integration

- [ ] **Tech Stack Decisions:**
  - [ ] CSV Library (csv-writer vs papaparse vs custom)
  - [ ] Excel Library (xlsx vs exceljs vs sheetjs)
  - [ ] Background Processing (Edge Functions vs pg_cron vs Queue)
  - [ ] Email Service (Supabase Auth Email vs SendGrid vs AWS SES)

- [ ] **Security Considerations:**
  - [ ] Rate Limiting Strategy
  - [ ] File Access Control
  - [ ] Data Sanitization

- [ ] **Performance Optimizations:**
  - [ ] Streaming für große CSVs
  - [ ] Chunking Strategy
  - [ ] Memory Management

---

### Für Backend Developer

**Zu implementieren:**

- [ ] **Database Migrations:**
  - [ ] `export_logs` Tabelle
  - [ ] `export_templates` Tabelle
  - [ ] `scheduled_exports` Tabelle
  - [ ] Indexes und RLS Policies
  - [ ] Cleanup Functions

- [ ] **API Routes:**
  - [ ] `POST /api/export/contacts` - Kontakte exportieren
  - [ ] `POST /api/export/deals` - Deals exportieren
  - [ ] `POST /api/export/leads` - Leads exportieren
  - [ ] `GET /api/export/status/:id` - Status abfragen
  - [ ] `GET /api/export/download/:id` - Download (mit Signed URL)
  - [ ] `POST /api/export/cancel/:id` - Export abbrechen
  - [ ] `GET /api/export/history` - History laden
  - [ ] `DELETE /api/export/history/:id` - History-Eintrag löschen

- [ ] **Template API Routes:**
  - [ ] `GET /api/export/templates` - Templates auflisten
  - [ ] `POST /api/export/templates` - Template erstellen
  - [ ] `PUT /api/export/templates/:id` - Template aktualisieren
  - [ ] `DELETE /api/export/templates/:id` - Template löschen

- [ ] **Scheduled Export API Routes (Enterprise):**
  - [ ] `GET /api/export/scheduled` - Scheduled Exports auflisten
  - [ ] `POST /api/export/scheduled` - Scheduled Export erstellen
  - [ ] `PUT /api/export/scheduled/:id` - Aktualisieren
  - [ ] `DELETE /api/export/scheduled/:id` - Löschen
  - [ ] `POST /api/export/scheduled/:id/toggle` - Aktivieren/Deaktivieren

- [ ] **Export Engine:**
  - [ ] CSV Generator (UTF-8 BOM, Semikolon, Escaping)
  - [ ] Excel Generator (.xlsx mit Formatierung)
  - [ ] Streaming für große Dateien
  - [ ] Chunked Processing

- [ ] **Background Jobs:**
  - [ ] Async Export Worker
  - [ ] Scheduled Export Trigger
  - [ ] Email Notification Worker

- [ ] **Storage Integration:**
  - [ ] Supabase Storage Upload
  - [ ] Signed URL Generation
  - [ ] File Lifecycle Management

- [ ] **Validation:**
  - [ ] Zod Schemas für alle Inputs
  - [ ] Plan-Limit Validierung
  - [ ] Column-Validation gegen Schema

- [ ] **Error Handling:**
  - [ ] Export Error Recovery
  - [ ] Retry-Logic für Failed Jobs
  - [ ] User Notification bei Fehlern

---

### Für Frontend Developer

**Zu implementieren:**

- [ ] **Components:**
  - [ ] `ExportButton` - Button mit Dropdown (CSV/Excel)
  - [ ] `ExportDialog` - Hauptexport-Dialog
  - [ ] `ColumnSelector` - Spalten-Auswahl mit Checkboxes
  - [ ] `ExportProgress` - Fortschrittsanzeige für Async
  - [ ] `ExportHistoryTable` - History-Liste
  - [ ] `TemplateManager` - Template-Verwaltung
  - [ ] `ScheduledExportForm` - Formular für Scheduled Exports
  - [ ] `ScheduledExportList` - Liste der Scheduled Exports

- [ ] **Hooks:**
  - [ ] `useExport()` - Export-Status Management
  - [ ] `useExportHistory()` - History laden
  - [ ] `useExportTemplates()` - Templates verwalten
  - [ ] `useScheduledExports()` - Scheduled Exports verwalten

- [ ] **Pages:**
  - [ ] `/dashboard/einstellungen/exporte` - Export History
  - [ ] `/dashboard/einstellungen/exporte/templates` - Template Manager
  - [ ] Integration in `/dashboard/kontakte`
  - [ ] Integration in `/dashboard/deals`
  - [ ] Integration in `/dashboard/suche` (LeadResultsTable)

- [ ] **Plan-Gating:**
  - [ ] Upgrade-Prompt für CSV (Free)
  - [ ] Upgrade-Prompt für Excel (Free/Pro)
  - [ ] Upgrade-Prompt für Scheduled (Free/Pro)
  - [ ] Limit-Anzeige (X von Y Templates)

- [ ] **Download Handling:**
  - [ ] Automatischer Download bei Sync-Export
  - [ ] Polling für Async-Export Status
  - [ ] Download-Button in History

- [ ] **UI States:**
  - [ ] Loading States
  - [ ] Error States
  - [ ] Empty States
  - [ ] Success Toasts

- [ ] **German Localization:**
  - [ ] Alle Labels auf Deutsch
  - [ ] Datumsformate (DD.MM.YYYY)
  - [ ] Zahlenformate (Deutsch: Komma für Dezimal)

---

### Für QA Engineer

**Zu testen:**

- [ ] **Functional Tests:**
  - [ ] CSV Export mit verschiedenen Datensätzen
  - [ ] Excel Export mit Formatierung
  - [ ] Spalten-Auswahl funktioniert korrekt
  - [ ] Filter werden auf Export angewendet
  - [ ] Templates erstellen/laden/löschen
  - [ ] Scheduled Exports (Simulation)
  - [ ] Export-History anzeigen
  - [ ] Download nach Export

- [ ] **Plan-Gating Tests:**
  - [ ] Free-User sieht Upgrade-Prompt
  - [ ] Pro-User kann nicht Excel exportieren
  - [ ] Enterprise hat alle Features
  - [ ] Limit-Checks (1.000 vs 10.000 Zeilen)
  - [ ] Template-Limits (3 vs Unlimited)

- [ ] **Edge Case Tests:**
  - [ ] 0 Einträge zum Export
  - [ ] Export-Limit Überschreitung
  - [ ] Sehr große Exporte (>10.000)
  - [ ] Sonderzeichen in Daten
  - [ ] Abgebrochene Exporte
  - [ ] Abgelaufene Download-Links

- [ ] **Performance Tests:**
  - [ ] Export 100 Zeilen < 2s
  - [ ] Export 1.000 Zeilen < 10s
  - [ ] Export 10.000 Zeilen < 60s
  - [ ] Memory-Usage check

- [ ] **Security Tests:**
  - [ ] RLS Policies (kein Zugriff auf fremde Daten)
  - [ ] Rate Limiting (5/Min)
  - [ ] Signed URLs (1h Gültigkeit)
  - [ ] Input Validation

- [ ] **Integration Tests:**
  - [ ] Export aus Kontakt-Liste
  - [ ] Export aus Deal-Pipeline
  - [ ] Export aus Suchergebnissen
  - [ ] E-Mail Benachrichtigungen

- [ ] **DSGVO Tests:**
  - [ ] Auto-Löschung nach 7/30/90 Tagen
  - [ ] Vollständiger Datenexport
  - [ ] Export-Metadaten korrekt

- [ ] **UI/UX Tests:**
  - [ ] Responsive Design
  - [ ] German Labels korrekt
  - [ ] Loading States
  - [ ] Error Messages verständlich

---

## Abhängigkeiten

### Von anderen Epics:

| Epic | Benötigt für | Status |
|------|--------------|--------|
| E7 | contacts, deals Tabellen | IN PROGRESS |
| E6 | search_results Tabelle | COMPLETED |
| E3 | Plan-Tier Erkennung | COMPLETED |
| E5 | LeadResultsTable Integration | COMPLETED |

### Externe Dependencies:

| Dependency | Zweck | Installation |
|------------|-------|--------------|
| `xlsx` | Excel-Datei Generierung | `npm install xlsx` |
| `csv-writer` | CSV Generierung | `npm install csv-writer` |
| Supabase Storage | Datei-Speicherung | Inkludiert |
| pg_cron | Scheduled Export Trigger | Supabase Extension |

---

## Open Questions

1. **Soll es ein tägliches Limit für Exporte geben (unabhängig vom Plan)?**
   - Vorschlag: 20 Exporte pro Tag für Pro, 100 für Enterprise

2. **Sollen Exporte Credits kosten (zusätzlich zum Plan)?**
   - Vorschlag: Nein, Exporte sind im Plan inkludiert

3. **Sollen Free-User einen einmaligen Test-Export erhalten?**
   - Vorschlag: Ja, 1 Test-Export (max 50 Zeilen)

4. **Welche zusätzlichen Spalten sollen für Enterprise verfügbar sein?**
   - Vorschlag: Interne IDs, Timestamps, Metadaten

5. **Soll es eine API für Drittsysteme geben (zukünftig)?**
   - Vorschlag: Ja, aber separater Epic (E12)

---

## Changelog

| Datum | Änderung | Autor |
|-------|----------|-------|
| 2026-02-08 | Initial erstellt mit vollständigen User Stories, API Specs, DB Schema | Requirements Engineer |
| 2026-02-08 | Feature Matrix definiert (Free/Pro/Enterprise) | Requirements Engineer |
| 2026-02-08 | Edge Cases dokumentiert (30 Szenarien) | Requirements Engineer |
| 2026-02-08 | Handoff Checklist für alle Teams hinzugefügt | Requirements Engineer |

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Ready for Solution Architect Review
**Nächster Schritt:** Task #2 (Solution Architect) kann beginnen
