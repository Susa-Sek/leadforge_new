# Epic E6 - QA Testplan: Sammlungen & Suchverlauf

**Epic:** E6 - Sammlungen & Suchverlauf
**Projekte:** PROJ-18 (Sammlungen), PROJ-19 (Suchverlauf)
**Datum erstellt:** 2026-02-08
**Tester:** QA Engineer
**Status:** TESTPLAN READY (Wartet auf Implementation)

---

## Executive Summary

Dieser Testplan deckt alle Testfälle für Epic E6 ab:
- **Backend API Tests:** 5 Endpoints, 35+ Testfälle
- **Frontend UI Tests:** 3 Pages, 40+ Testfälle
- **Integration Tests:** 15+ Testfälle
- **Plan-Gating Tests:** 20+ Testfälle
- **Edge Cases:** 25+ Testfälle
- **Regression Tests:** E4/E5 Features

**Gesamt:** 135+ Testfälle

---

## Testumgebung

### URLs
- **App:** http://localhost:3000
- **Backend API:** http://localhost:3000/api
- **Supabase Dashboard:** https://supabase.com/dashboard/project/mffvbluqnfgnthwlavlj

### Test Accounts
| Plan | Email | Expected Credits |
|------|-------|------------------|
| Free | `test-free@example.com` | 30 |
| Pro | `test-pro@example.com` | 500 |
| Enterprise | `test-enterprise@example.com` | 2000 |

### Test Daten
- Mindestens 3 abgeschlossene Suchen pro Account
- Mindestens 1 fehlgeschlagene Suche pro Account
- Mindestens 1 laufende Suche (optional)

---

## 1. Backend API Tests

### 1.1 GET /api/collections (List)

#### TC-1.1.1: Basis Abfrage (Authentifiziert)
**Steps:**
1. POST /api/auth/signin mit validen Credentials
2. GET /api/collections ohne Query-Parameter

**Expected:**
- Status: 200 OK
- Response enthält `collections` Array
- Response enthält `pagination` Objekt
- Alle Sammlungen gehören zum authentifizierten User
- Status nur 'completed' oder 'failed' (keine 'pending'/'running')

---

#### TC-1.1.2: Pagination
**Steps:**
1. GET /api/collections?page=1&limit=5
2. GET /api/collections?page=2&limit=5

**Expected:**
- Seite 1: Erste 5 Sammlungen
- Seite 2: Nächste 5 Sammlungen
- pagination.total_pages korrekt berechnet
- pagination.total = Gesamtanzahl Sammlungen

---

#### TC-1.1.3: Sortierung - Datum DESC (Default)
**Steps:**
1. GET /api/collections?sort_by=date&sort_order=desc

**Expected:**
- Sammlungen sortiert nach created_at (neueste zuerst)

---

#### TC-1.1.4: Sortierung - Datum ASC
**Steps:**
1. GET /api/collections?sort_by=date&sort_order=asc

**Expected:**
- Sammlungen sortiert nach created_at (älteste zuerst)

---

#### TC-1.1.5: Sortierung - Anzahl
**Steps:**
1. GET /api/collections?sort_by=count&sort_order=desc

**Expected:**
- Sammlungen sortiert nach result_count (meiste zuerst)

---

#### TC-1.1.6: Sortierung - Name
**Steps:**
1. GET /api/collections?sort_by=name&sort_order=asc

**Expected:**
- Sammlungen alphabetisch sortiert (generierter Name: "{industry} in {location}")

---

#### TC-1.1.7: Suche - Industry Filter
**Steps:**
1. GET /api/collections?search=Software

**Expected:**
- Nur Sammlungen mit "Software" in query_params.industry
- Case-insensitive Suche

---

#### TC-1.1.8: Suche - Location Filter
**Steps:**
1. GET /api/collections?search=Berlin

**Expected:**
- Nur Sammlungen mit "Berlin" in query_params.location
- Case-insensitive Suche

---

#### TC-1.1.9: Unautorisiert (Kein Token)
**Steps:**
1. GET /api/collections ohne Auth-Header/Cookie

**Expected:**
- Status: 401 Unauthorized
- Error: "Nicht authentifiziert"

---

#### TC-1.1.10: Ungültige Query-Parameter
**Steps:**
1. GET /api/collections?page=-1
2. GET /api/collections?limit=999
3. GET /api/collections?sort_by=invalid

**Expected:**
- Status: 400 Bad Request
- Error mit Details zu ungültigen Parametern

---

#### TC-1.1.11: Leere Sammlungen
**Steps:**
1. User mit 0 Sammlungen
2. GET /api/collections

**Expected:**
- Status: 200 OK
- collections: []
- pagination.total: 0

---

### 1.2 GET /api/collections/[id] (Detail)

#### TC-1.2.1: Existierende Sammlung
**Steps:**
1. GET /api/collections/{valid_id}

**Expected:**
- Status: 200 OK
- Response enthält `collection` Objekt
- Response enthält `leads` Array
- Response enthält `pagination` Objekt
- collection.id == requested id

---

#### TC-1.2.2: Sammlung mit Leads
**Steps:**
1. GET /api/collections/{id_with_results}

**Expected:**
- leads Array enthält Lead-Objekte
- Jedes Lead hat: id, place_id, name, address
- Optional fields: phone, email, website, rating, etc.
- Social Media URLs korrekt strukturiert

---

#### TC-1.2.3: Leere Sammlung (0 Ergebnisse)
**Steps:**
1. GET /api/collections/{id_with_zero_results}

**Expected:**
- Status: 200 OK
- leads: []
- result_count: 0

---

#### TC-1.2.4: Nicht existierende Sammlung
**Steps:**
1. GET /api/collections/00000000-0000-0000-0000-000000000000

**Expected:**
- Status: 404 Not Found
- Error: "Sammlung nicht gefunden"

---

#### TC-1.2.5: Falsche User (Nicht autorisiert)
**Steps:**
1. User A: GET /api/collections/{id_von_user_b}

**Expected:**
- Status: 403 Forbidden ODER 404 Not Found
- Error: "Keine Berechtigung" oder "Sammlung nicht gefunden"
- Security: User A sieht keine Daten von User B

---

#### TC-1.2.6: Ungültige ID Format
**Steps:**
1. GET /api/collections/invalid-id-123

**Expected:**
- Status: 400 Bad Request
- Error: "Ungültige Sammlungs-ID"

---

#### TC-1.2.7: Lead Pagination
**Steps:**
1. GET /api/collections/{id}?page=1&limit=10
2. GET /api/collections/{id}?page=2&limit=10

**Expected:**
- Leads korrekt paginiert
- pagination.total = Gesamtanzahl Leads

---

#### TC-1.2.8: Unautorisiert
**Steps:**
1. GET /api/collections/{valid_id} ohne Auth

**Expected:**
- Status: 401 Unauthorized

---

### 1.3 DELETE /api/collections/[id]

#### TC-1.3.1: Erfolgreiche Löschung
**Steps:**
1. DELETE /api/collections/{own_collection_id}

**Expected:**
- Status: 200 OK
- Response: { success: true }
- Sammlung aus DB gelöscht
- Zugehörige search_results CASCADE gelöscht

---

#### TC-1.3.2: Löschung - Verifizierung
**Steps:**
1. DELETE /api/collections/{id}
2. GET /api/collections/{id} (danach)

**Expected:**
- Schritt 1: 200 OK
- Schritt 2: 404 Not Found

---

#### TC-1.3.3: Nicht existierende Sammlung löschen
**Steps:**
1. DELETE /api/collections/00000000-0000-0000-0000-000000000000

**Expected:**
- Status: 404 Not Found
- Error: "Sammlung nicht gefunden"

---

#### TC-1.3.4: Fremde Sammlung löschen (Security)
**Steps:**
1. User A: DELETE /api/collections/{id_von_user_b}

**Expected:**
- Status: 403 Forbidden ODER 404
- Keine Löschung in DB
- Sammlung von User B bleibt erhalten

---

#### TC-1.3.5: Unautorisiert
**Steps:**
1. DELETE /api/collections/{valid_id} ohne Auth

**Expected:**
- Status: 401 Unauthorized
- Keine Löschung in DB

---

#### TC-1.3.6: Ungültige ID
**Steps:**
1. DELETE /api/collections/invalid-id

**Expected:**
- Status: 400 Bad Request

---

### 1.4 GET /api/search/history

#### TC-1.4.1: Basis Abfrage
**Steps:**
1. GET /api/search/history

**Expected:**
- Status: 200 OK
- Response: searches Array mit allen Status (pending, running, completed, failed)
- Response: pagination Objekt
- Response: summary Objekt (total_searches, total_credits_used, total_leads_found)
- Sortierung: created_at DESC (neueste zuerst)

---

#### TC-1.4.2: Status Filter - Completed
**Steps:**
1. GET /api/search/history?status=completed

**Expected:**
- Nur Suchen mit status='completed'
- Keine pending/running/failed

---

#### TC-1.4.3: Status Filter - Failed
**Steps:**
1. GET /api/search/history?status=failed

**Expected:**
- Nur Suchen mit status='failed'
- error_message vorhanden bei failed Suchen

---

#### TC-1.4.4: Status Filter - Running
**Steps:**
1. GET /api/search/history?status=running

**Expected:**
- Nur Suchen mit status='running'
- progress Feld vorhanden (0-100)

---

#### TC-1.4.5: Status Filter - Pending
**Steps:**
1. GET /api/search/history?status=pending

**Expected:**
- Nur Suchen mit status='pending'

---

#### TC-1.4.6: Datum Filter - From
**Steps:**
1. GET /api/search/history?date_from=2026-01-01

**Expected:**
- Nur Suchen ab 2026-01-00:00:00
- Ältere Suchen nicht enthalten

---

#### TC-1.4.7: Datum Filter - To
**Steps:**
1. GET /api/search/history?date_to=2026-01-31

**Expected:**
- Nur Suchen bis 2026-01-31 23:59:59
- Neuere Suchen nicht enthalten

---

#### TC-1.4.8: Datum Filter - Range
**Steps:**
1. GET /api/search/history?date_from=2026-01-01&date_to=2026-01-31

**Expected:**
- Nur Suchen im Januar 2026
- Kombination beider Filter

---

#### TC-1.4.9: Kombinierte Filter
**Steps:**
1. GET /api/search/history?status=completed&date_from=2026-01-01

**Expected:**
- Nur completed Suchen ab 2026-01-01
- Beide Filter angewendet

---

#### TC-1.4.10: Summary Stats
**Steps:**
1. GET /api/search/history
2. Prüfe summary Objekt

**Expected:**
- summary.total_searches: Gesamtanzahl (unabhängig von Pagination)
- summary.total_credits_used: Summe aller credits_used
- summary.total_leads_found: Summe aller result_count

---

#### TC-1.4.11: Duration Calculation
**Steps:**
1. GET /api/search/history
2. Prüfe duration_seconds bei completed Suchen

**Expected:**
- duration_seconds = updated_at - created_at (in Sekunden)
- Nur bei completed/failed vorhanden
- NULL bei pending/running

---

#### TC-1.4.12: Collection ID Link
**Steps:**
1. GET /api/search/history
2. Prüfe collection_id bei completed Suchen

**Expected:**
- collection_id = search_history.id (bei completed)
- NULL bei failed/pending/running
- Link zur Sammlung funktioniert

---

#### TC-1.4.13: Pagination
**Steps:**
1. GET /api/search/history?page=1&limit=10

**Expected:**
- Korrekte Pagination
- Max limit: 50 (wenn mehr requested, clamp auf 50)

---

#### TC-1.4.14: Unautorisiert
**Steps:**
1. GET /api/search/history ohne Auth

**Expected:**
- Status: 401 Unauthorized

---

#### TC-1.4.15: Ungültige Filter
**Steps:**
1. GET /api/search/history?status=invalid
2. GET /api/search/history?date_from=not-a-date

**Expected:**
- Status: 400 Bad Request
- Error mit validen Optionen

---

### 1.5 POST /api/search/retry

#### TC-1.5.1: Erfolgreicher Retry
**Steps:**
1. POST /api/search/retry mit { search_id: valid_completed_id }

**Expected:**
- Status: 200 OK
- Response: new_search_id, status: 'pending', estimated_cost
- Neue Suche in search_history erstellt
- Gleiche query_params wie Original

---

#### TC-1.5.2: Retry - Failed Suche
**Steps:**
1. POST /api/search/retry mit { search_id: valid_failed_id }

**Expected:**
- Status: 200 OK
- Neue Suche wird gestartet
- Kein Fehler wegen vorherigem Fail

---

#### TC-1.5.3: Retry - Insufficient Credits
**Steps:**
1. User mit wenig Credits
2. POST /api/search/retry mit { search_id: id }

**Expected:**
- Status: 402 Payment Required
- Error: "Nicht genügend Credits für Retry"
- Keine neue Suche erstellt

---

#### TC-1.5.4: Retry - Nicht existierende Suche
**Steps:**
1. POST /api/search/retry mit { search_id: invalid_id }

**Expected:**
- Status: 404 Not Found
- Error: "Original-Suche nicht gefunden"

---

#### TC-1.5.5: Retry - Laufende Suche
**Steps:**
1. POST /api/search/retry mit { search_id: running_id }

**Expected:**
- Status: 400 Bad Request
- Error: "Original-Suche läuft noch"
- Keine neue Suche erstellt

---

#### TC-1.5.6: Retry - Fremde Suche (Security)
**Steps:**
1. User A: POST /api/search/retry mit { search_id: id_von_user_b }

**Expected:**
- Status: 403 Forbidden ODER 404
- Keine neue Suche erstellt

---

#### TC-1.5.7: Rate Limiting
**Steps:**
1. POST /api/search/retry 6x in 1 Minute

**Expected:**
- Erste 5: 200 OK
- 6te: 429 Too Many Requests
- Error: "Zu viele Versuche. Bitte warte 1 Minute."

---

#### TC-1.5.8: Unautorisiert
**Steps:**
1. POST /api/search/retry ohne Auth

**Expected:**
- Status: 401 Unauthorized

---

#### TC-1.5.9: Ungültiger Request Body
**Steps:**
1. POST /api/search/retry mit {} (kein search_id)
2. POST /api/search/retry mit { search_id: "invalid" }

**Expected:**
- Status: 400 Bad Request
- Zod validation error

---

## 2. Frontend UI Tests

### 2.1 /dashboard/sammlungen (Collections List)

#### TC-2.1.1: Seite rendern
**Steps:**
1. Navigation zu /dashboard/sammlungen

**Expected:**
- Seite lädt ohne Fehler
- Titel "Meine Sammlungen" sichtbar
- Layout korrekt (Sidebar + Content)
- Keine 404 oder 500 Fehler

---

#### TC-2.1.2: Sammlungen anzeigen - Grid View
**Steps:**
1. Seite mit existierenden Sammlungen laden

**Expected:**
- CollectionCards werden angezeigt
- Grid Layout (3-4 Spalten auf Desktop)
- Jede Karte zeigt: Name, Datum, Ergebnisanzahl, Status

---

#### TC-2.1.3: Sammlungen anzeigen - List View
**Steps:**
1. View Toggle auf "List" klicken

**Expected:**
- Tabellen-Ansicht statt Grid
- Zeilen mit allen Metadaten
- Sortierbare Spalten

---

#### TC-2.1.4: Leerer Zustand
**Steps:**
1. User ohne Sammlungen
2. Seite laden

**Expected:**
- Empty State Component sichtbar
- Icon + Text "Noch keine Sammlungen"
- CTA zu /dashboard/suche

---

#### TC-2.1.5: Search Filter
**Steps:**
1. Text in SearchInput eingeben ("Software")

**Expected:**
- API Call mit ?search=Software
- Nur passende Sammlungen angezeigt
- Keine Full-Page-Reload (Client-Side Filter)

---

#### TC-2.1.6: Sortierung - Datum
**Steps:**
1. Sort-Dropdown: "Neueste zuerst"
2. Sort-Dropdown: "Älteste zuerst"

**Expected:**
- Sammlungen neu sortiert
- URL updated (?sort=date&order=desc)

---

#### TC-2.1.7: Sortierung - Name
**Steps:**
1. Sort-Dropdown: "Name A-Z"

**Expected:**
- Alphabetische Sortierung
- URL updated (?sort=name&order=asc)

---

#### TC-2.1.8: Sortierung - Anzahl
**Steps:**
1. Sort-Dropdown: "Meiste Ergebnisse"

**Expected:**
- Sortierung nach result_count
- URL updated (?sort=count&order=desc)

---

#### TC-2.1.9: Pagination
**Steps:**
1. Mehr als 20 Sammlungen
2. Auf Seite 2 klicken

**Expected:**
- Pagination Component sichtbar
- Seite 2 zeigt nächste Sammlungen
- URL updated (?page=2)

---

#### TC-2.1.10: Löschen - Bestätigungsdialog
**Steps:**
1. Auf "Löschen" Icon klicken

**Expected:**
- Confirmation Dialog erscheint
- Text: "Möchtest du diese Sammlung wirklich löschen?"
- Buttons: "Abbrechen", "Löschen"

---

#### TC-2.1.11: Löschen - Bestätigen
**Steps:**
1. "Löschen" im Dialog klicken

**Expected:**
- DELETE API Call
- Sammlung verschwindet aus UI
- Success Toast: "Sammlung gelöscht"

---

#### TC-2.1.12: Löschen - Abbrechen
**Steps:**
1. "Abbrechen" im Dialog klicken

**Expected:**
- Dialog schließt
- Kein API Call
- Sammlung bleibt sichtbar

---

#### TC-2.1.13: Öffnen - Navigation
**Steps:**
1. Auf CollectionCard klicken

**Expected:**
- Navigation zu /dashboard/sammlungen/{id}
- Detail-Seite lädt

---

#### TC-2.1.14: Loading State
**Steps:**
1. Seite laden (mit langsamer Verbindung simulieren)

**Expected:**
- Skeleton-Loader während API Call
- Kein "Noch keine Sammlungen" während Loading
- Smooth Transition zu Content

---

#### TC-2.1.15: Error State
**Steps:**
1. API Error simulieren (z.B. Netzwerk aus)

**Expected:**
- Error Message angezeigt
- Retry-Button verfügbar
- Kein Crash

---

### 2.2 /dashboard/sammlungen/[id] (Collection Detail)

#### TC-2.2.1: Seite rendern
**Steps:**
1. Navigation zu /dashboard/sammlungen/{valid_id}

**Expected:**
- Seite lädt ohne Fehler
- Back Link zu /dashboard/sammlungen
- CollectionHeader mit Titel, Meta, Actions

---

#### TC-2.2.2: Header Informationen
**Steps:**
1. Detail-Seite laden

**Expected:**
- Titel: "{industry} in {location}"
- Meta: Ort, Datum, Credits used
- Actions: Export, Löschen

---

#### TC-2.2.3: CollectionStats
**Steps:**
1. Detail-Seite laden

**Expected:**
- Ergebnisanzahl
- Durchschnittliche Bewertung
- Kontakt-Statistiken (mit/ohne Email/Telefon)

---

#### TC-2.2.4: Lead-Tabelle anzeigen
**Steps:**
1. Detail-Seite mit Leads laden

**Expected:**
- LeadResultsTable Component (wiederverwendet aus E5)
- Alle Lead-Daten korrekt angezeigt
- Plan-Gating funktioniert (Blur für Free)

---

#### TC-2.2.5: SmartFilter Integration
**Steps:**
1. "Filter" Button klicken

**Expected:**
- SmartFilter Panel öffnet sich
- Filter funktionieren wie in E5
- URL State Sync

---

#### TC-2.2.6: Export Button
**Steps:**
1. "Export" Button klicken

**Expected:**
- Dropdown: CSV (Pro), Excel (Enterprise)
- Free: Upgrade-Prompt

---

#### TC-2.2.7: Löschen aus Detail
**Steps:**
1. "Löschen" Button klicken
2. Bestätigen

**Expected:**
- DELETE API Call
- Redirect zu /dashboard/sammlungen
- Success Toast

---

#### TC-2.2.8: Nicht existierende Sammlung
**Steps:**
1. Navigation zu /dashboard/sammlungen/invalid-id

**Expected:**
- 404 Page angezeigt
- ODER Error State mit "Sammlung nicht gefunden"

---

#### TC-2.2.9: Fremde Sammlung (Security)
**Steps:**
1. URL mit ID von anderem User

**Expected:**
- 404 oder "Keine Berechtigung"
- Keine Daten angezeigt

---

#### TC-2.2.10: Lead Pagination
**Steps:**
1. Sammlung mit > 50 Leads
2. Pagination benutzen

**Expected:**
- Leads paginiert
- Smooth Scroll nach oben bei Seitenwechsel

---

#### TC-2.2.11: Back Navigation
**Steps:**
1. "Zurück" Link klicken

**Expected:**
- Navigation zu /dashboard/sammlungen
- Filter/Sort State erhalten (wenn möglich)

---

### 2.3 /dashboard/verlauf (Search History)

#### TC-2.3.1: Seite rendern
**Steps:**
1. Navigation zu /dashboard/verlauf

**Expected:**
- Seite lädt ohne Fehler
- Titel "Suchverlauf"
- Summary Stats sichtbar

---

#### TC-2.3.2: Verlauf anzeigen
**Steps:**
1. Seite mit existierenden Suchen laden

**Expected:**
- Chronologische Liste (neueste zuerst)
- HistoryItems mit: Branche, Ort, Ergebnisse, Credits, Status

---

#### TC-2.3.3: Status Filter Tabs
**Steps:**
1. Tab "Abgeschlossen" klicken
2. Tab "Fehlgeschlagen" klicken
3. Tab "Alle" klicken

**Expected:**
- Filter angewendet
- URL updated (?status=completed)
- Nur passende Suchen angezeigt

---

#### TC-2.3.4: Datums-Filter
**Steps:**
1. Date Range Picker öffnen
2. Zeitraum auswählen
3. Anwenden

**Expected:**
- Nur Suchen im Zeitraum
- URL updated (?date_from=...&date_to=...)

---

#### TC-2.3.5: "Erneut suchen" Button
**Steps:**
1. Bei completed/failed Suche: "Erneut suchen" klicken

**Expected:**
- POST /api/search/retry
- Redirect zu /dashboard/suche mit neuer search_id
- Success Toast: "Suche gestartet"

---

#### TC-2.3.6: "Erneut suchen" - Insufficient Credits
**Steps:**
1. Free User mit 0 Credits
2. "Erneut suchen" klicken

**Expected:**
- Error Toast: "Nicht genügend Credits"
- Kein Redirect
- Link zu Credits-Page

---

#### TC-2.3.7: "Zur Sammlung" Link
**Steps:**
1. Bei completed Suche: "Zur Sammlung" klicken

**Expected:**
- Navigation zu /dashboard/sammlungen/{id}

---

#### TC-2.3.8: "Details" bei laufender Suche
**Steps:**
1. Bei running/pending Suche: "Details" klicken

**Expected:**
- Navigation zu /dashboard/suche?searchId={id}
- Progress View wird angezeigt

---

#### TC-2.3.9: Leerer Zustand
**Steps:**
1. User ohne Suchverlauf

**Expected:**
- Empty State: "Noch keine Suchen"
- CTA zu /dashboard/suche

---

#### TC-2.3.10: Summary Stats
**Steps:**
1. Seite laden

**Expected:**
- Gesamtanzahl Suchen
- Summe Credits verbraucht
- Summe Leads gefunden

---

#### TC-2.3.11: Status Badges
**Steps:**
1. Seite mit verschiedenen Status laden

**Expected:**
- Farbcodierung: Green (completed), Red (failed), Blue (running), Gray (pending)
- Icons je nach Status

---

#### TC-2.3.12: Pagination
**Steps:**
1. Mehr als 20 Suchen

**Expected:**
- Pagination Component
- Funktioniert wie in Sammlungen

---

#### TC-2.3.13: Loading State
**Steps:**
1. Seite laden (langsam)

**Expected:**
- Skeleton-Loader
- Keine "Keine Suchen" Message

---

#### TC-2.3.14: Error State
**Steps:**
1. API Error simulieren

**Expected:**
- Error Message
- Retry-Button

---

### 2.4 Navigation & Layout

#### TC-2.4.1: Sidebar Navigation - Sammlungen
**Steps:**
1. Auf "Sammlungen" in Sidebar klicken

**Expected:**
- Navigation zu /dashboard/sammlungen
- Active State in Sidebar

---

#### TC-2.4.2: Sidebar Navigation - Verlauf
**Steps:**
1. Auf "Verlauf" in Sidebar klicken

**Expected:**
- Navigation zu /dashboard/verlauf
- Active State in Sidebar

---

#### TC-2.4.3: Mobile Navigation
**Steps:**
1. Mobile View (375px)
2. Menu öffnen
3. Sammlungen/Verlauf klicken

**Expected:**
- Mobile Menu schließt
- Navigation funktioniert
- Responsive Layout

---

#### TC-2.4.4: Breadcrumb (optional)
**Steps:**
1. /dashboard/sammlungen/{id} öffnen

**Expected:**
- Breadcrumb: Dashboard > Sammlungen > Name
- ODER: Back Link funktioniert

---

## 3. Integration Tests

### 3.1 Backend + Frontend Zusammenspiel

#### TC-3.1.1: API → UI Data Flow
**Steps:**
1. /dashboard/sammlungen laden
2. API Response prüfen
3. UI Rendering prüfen

**Expected:**
- API liefert korrekte Daten
- UI zeigt alle Daten an
- Keine Datenverlust zwischen API und UI

---

#### TC-3.1.2: Löschen → UI Update
**Steps:**
1. Sammlung löschen
2. Liste neu laden

**Expected:**
- DELETE erfolgreich
- Liste zeigt gelöschte Sammlung nicht mehr
- Pagination updated

---

#### TC-3.1.3: Retry → Neue Suche
**Steps:**
1. "Erneut suchen" klicken
2. Auf /dashboard/suche warten

**Expected:**
- Retry API erfolgreich
- Neue search_id in URL
- Progress View startet

---

#### TC-3.1.4: Filter → URL → API
**Steps:**
1. Filter in Verlauf anwenden
2. URL prüfen
3. API Call prüfen

**Expected:**
- Filter ändert URL
- API Call mit Query-Parametern
- Response gefiltert

---

#### TC-3.1.5: Sort → URL → API
**Steps:**
1. Sortierung ändern
2. URL prüfen
3. API Call prüfen

**Expected:**
- Sortierung in URL
- API Call mit sort_by/sort_order
- Response sortiert

---

### 3.2 Datenkonsistenz

#### TC-3.2.1: Sammlung Anzahl stimmt
**Steps:**
1. /dashboard/sammlungen: Anzahl notieren
2. /dashboard/verlauf: Anzahl completed Suchen notieren

**Expected:**
- Anzahl Sammlungen = Anzahl completed Suchen
- Konsistenz zwischen beiden Views

---

#### TC-3.2.2: Lead Anzahl stimmt
**Steps:**
1. Sammlung öffnen
2. result_count in Header notieren
3. Leads in Tabelle zählen

**Expected:**
- result_count = Anzahl Leads in Tabelle
- Konsistenz zwischen Header und Daten

---

#### TC-3.2.3: Suchverlauf Credits Summe
**Steps:**
1. /dashboard/verlauf laden
2. Summary total_credits_used notieren
3. Einzelne credits_used summieren

**Expected:**
- summary.total_credits_used = Summe aller credits_used

---

#### TC-3.2.4: Suche abgeschlossen → Sammlung verfügbar
**Steps:**
1. Neue Suche starten
2. Warten auf completion
3. /dashboard/sammlungen prüfen

**Expected:**
- Neue Sammlung erscheint automatisch
- Daten korrekt

---

### 3.3 Error Handling

#### TC-3.3.1: API 500 → UI Error
**Steps:**
1. Server Error simulieren
2. Seite laden

**Expected:**
- UI zeigt Error State
- Retry-Button verfügbar
- Kein Crash

---

#### TC-3.3.2: API Timeout → UI Error
**Steps:**
1. Langsame API simulieren (> 30s)

**Expected:**
- Timeout Error angezeigt
- Retry-Button

---

#### TC-3.3.3: Netzwerkfehler → UI Error
**Steps:**
1. Offline gehen
2. Aktion ausführen

**Expected:**
- Netzwerk Error angezeigt
- Offline State erkannt

---

## 4. Plan-Gating Tests

### 4.1 Free User (50 Sammlungen Limit)

#### TC-4.1.1: Sammlungen Limit - Unter 50
**Steps:**
1. Free User mit 45 Sammlungen
2. /dashboard/sammlungen laden

**Expected:**
- Alle 45 Sammlungen angezeigt
- Kein Limit-Hinweis

---

#### TC-4.1.2: Sammlungen Limit - Bei 50
**Steps:**
1. Free User mit 50 Sammlungen
2. /dashboard/sammlungen laden

**Expected:**
- Alle 50 Sammlungen angezeigt
- Hinweis: "Limit erreicht (50/50)"

---

#### TC-4.1.3: Sammlungen Limit - Über 50
**Steps:**
1. Free User mit 55 Sammlungen (manuell in DB)
2. /dashboard/sammlungen laden

**Expected:**
- Nur 50 angezeigt
- Hinweis: "Upgrade für mehr Sammlungen"
- ODER: Alle angezeigt mit Upgrade-Prompt

---

#### TC-4.1.4: Verlauf Limit - 30 Tage
**Steps:**
1. Free User mit Suchen älter 30 Tage
2. /dashboard/verlauf laden

**Expected:**
- Nur Suchen der letzten 30 Tage
- Hinweis: "Upgrade für unbegrenzten Verlauf"

---

#### TC-4.1.5: Export - Free (Gesperrt)
**Steps:**
1. Free User in Sammlung Detail
2. Export Button klicken

**Expected:**
- Upgrade-Prompt
- Kein Export möglich

---

#### TC-4.1.6: Datum Filter - Free (Gesperrt)
**Steps:**
1. Free User in /dashboard/verlauf
2. Date Range Picker suchen

**Expected:**
- Date Filter nicht verfügbar ODER
- Upgrade-Prompt bei Nutzung

---

### 4.2 Pro User (Unbegrenzt)

#### TC-4.2.1: Sammlungen - Unbegrenzt
**Steps:**
1. Pro User mit 100+ Sammlungen

**Expected:**
- Alle Sammlungen angezeigt
- Kein Limit

---

#### TC-4.2.2: Verlauf - Unbegrenzt
**Steps:**
1. Pro User mit Suchen älter 1 Jahr

**Expected:**
- Alle Suchen angezeigt
- Kein Zeitlimit

---

#### TC-4.2.3: Export CSV - Pro
**Steps:**
1. Pro User in Sammlung Detail
2. Export CSV

**Expected:**
- CSV Download funktioniert
- Kein Upgrade-Prompt

---

#### TC-4.2.4: Datum Filter - Pro
**Steps:**
1. Pro User in /dashboard/verlauf
2. Date Range Filter nutzen

**Expected:**
- Filter funktioniert
- Kein Upgrade-Prompt

---

### 4.3 Enterprise User

#### TC-4.3.1: Export Excel - Enterprise
**Steps:**
1. Enterprise User in Sammlung Detail
2. Export Excel

**Expected:**
- Excel Download funktioniert
- CSV auch verfügbar

---

#### TC-4.3.2: Alle Features verfügbar
**Steps:**
1. Enterprise User: Alle Seiten testen

**Expected:**
- Keine Upgrade-Prompts
- Alle Features funktionieren

---

## 5. Edge Cases

### 5.1 Leere Sammlungen

#### TC-5.1.1: Sammlung mit 0 Ergebnissen
**Steps:**
1. Sammlung mit result_count=0 öffnen

**Expected:**
- Seite lädt
- "Keine Leads" Message
- Keine Tabelle oder leere Tabelle

---

#### TC-5.1.2: Verlauf mit 0 Suchen
**Steps:**
1. Neuer User
2. /dashboard/verlauf öffnen

**Expected:**
- Empty State
- Keine Fehler

---

### 5.2 Große Datenmengen

#### TC-5.2.1: Sehr viele Leads (> 1000)
**Steps:**
1. Sammlung mit 1500 Leads öffnen

**Expected:**
- Seite lädt
- Pagination korrekt
- Keine Performance-Probleme

---

#### TC-5.2.2: Sehr viele Sammlungen (> 500)
**Steps:**
1. Pro User mit 500 Sammlungen
2. /dashboard/sammlungen laden

**Expected:**
- Pagination funktioniert
- Keine Memory-Probleme

---

#### TC-5.2.3: Langer Suchverlauf (> 1000 Suchen)
**Steps:**
1. Enterprise User mit 1000+ Suchen

**Expected:**
- Pagination funktioniert
- Summary Stats korrekt

---

### 5.3 Gleichzeitige Operationen

#### TC-5.3.1: Gleichzeitige Löschung
**Steps:**
1. Tab 1: Sammlungen laden
2. Tab 2: Gleiche Sammlung löschen
3. Tab 1: Löschen versuchen

**Expected:**
- Tab 1: Error "Sammlung nicht gefunden"
- Kein Crash

---

#### TC-5.3.2: Löschen während Laden
**Steps:**
1. Sammlungen laden (langsam)
2. Während Loading: Löschen klicken

**Expected:**
- UI reagiert korrekt
- Keine Race Condition

---

#### TC-5.3.3: Retry während laufender Suche
**Steps:**
1. Suche starten
2. Während running: Retry auf alte Suche

**Expected:**
- Retry funktioniert (neue Suche)
- ODER: Hinweis dass bereits Suche läuft

---

### 5.4 Netzwerkfehler

#### TC-5.4.1: Timeout bei großer Sammlung
**Steps:**
1. Große Sammlung öffnen
2. Netzwerk langsamer machen

**Expected:**
- Timeout Error
- Retry-Button

---

#### TC-5.4.2: Unterbrechung während Laden
**Steps:**
1. Sammlungen laden
2. Netzwerk trennen
3. Wiederherstellen

**Expected:**
- Error State
- Retry funktioniert nach Reconnect

---

#### TC-5.4.3: Intermittierende Verbindung
**Steps:**
1. Netzwerk mehrmals trennen/wiederherstellen
2. Verschiedene Aktionen ausführen

**Expected:**
- App bleibt stabil
- Keine undefinierten Zustände

---

### 5.5 Sonderzeichen & Unicode

#### TC-5.5.1: Umlaute in Sammlungsnamen
**Steps:**
1. Suche nach "München"
2. Sammlung öffnen

**Expected:**
- Name korrekt: "Software in München"
- Keine Encoding-Probleme

---

#### TC-5.5.2: Sonderzeichen in Suchbegriffen
**Steps:**
1. Suche mit "Café & Restaurant"
2. Verlauf prüfen

**Expected:**
- Sonderzeichen korrekt angezeigt
- Keine HTML Entities

---

#### TC-5.5.3: Lange Namen
**Steps:**
1. Suche mit sehr langem Industrie/Ort Namen
2. UI prüfen

**Expected:**
- Text ellipsis (…) bei Überlänge
- Kein Layout-Bruch

---

### 5.6 Browser-spezifisch

#### TC-5.6.1: Mobile Safari (iOS)
**Steps:**
1. iOS Safari: Alle Seiten testen

**Expected:**
- Kein 300ms Tap Delay
- Smooth Scrolling
- Keine Layout-Probleme

---

#### TC-5.6.2: Chrome Android
**Steps:**
1. Chrome Android: Alle Seiten testen

**Expected:**
- Pull-to-Refresh funktioniert
- Touch Events korrekt

---

#### TC-5.6.3: Firefox
**Steps:**
1. Firefox Desktop: Alle Seiten testen

**Expected:**
- Alle Features funktionieren
- Keine CSS-Inkompatibilitäten

---

### 5.7 Security Edge Cases

#### TC-5.7.1: SQL Injection Versuch
**Steps:**
1. Search Input: "'; DROP TABLE search_history; --"
2. Filter anwenden

**Expected:**
- Kein SQL Injection
- Suche nach dem String (oder keine Ergebnisse)

---

#### TC-5.7.2: XSS im Sammlungsnamen
**Steps:**
1. Suche mit <script>alert('xss')</script> in Ort (wenn möglich)
2. Sammlung anzeigen

**Expected:**
- Script wird nicht ausgeführt
- Text escaped angezeigt

---

#### TC-5.7.3: ID Enumeration
**Steps:**
1. Systematisch IDs probieren: /api/collections/00000001, 00000002...

**Expected:**
- 404 für nicht existierende IDs
- Keine Information über existierende IDs

---

## 6. Regression Tests (E4/E5)

### 6.1 E4: Suche funktioniert noch

#### TC-6.1.1: Neue Suche starten
**Steps:**
1. /dashboard/suche öffnen
2. Suche starten

**Expected:**
- Form funktioniert
- Progress angezeigt
- Ergebnisse kommen

---

#### TC-6.1.2: Webhook Ergebnisse
**Steps:**
1. Suche laufen lassen
2. Ergebnisse prüfen

**Expected:**
- Suche completed
- Ergebnisse in Tabelle

---

#### TC-6.1.3: Credit Deduction
**Steps:**
1. Credits notieren
2. Suche starten
3. Credits prüfen

**Expected:**
- Credits korrekt abgezogen

---

### 6.2 E5: Lead Table funktioniert noch

#### TC-6.2.1: Lead Results Table in Suche
**Steps:**
1. Suche abschließen
2. Ergebnis-Tabelle prüfen

**Expected:**
- Tabelle funktioniert
- Sortierung, Filter, Pagination OK

---

#### TC-6.2.2: SmartFilter in Suche
**Steps:**
1. SmartFilter nutzen

**Expected:**
- Filter funktionieren
- URL Sync OK

---

#### TC-6.2.3: Export in Suche
**Steps:**
1. Export aus Suchergebnissen

**Expected:**
- CSV/Excel Export funktioniert

---

### 6.3 E3: Credits funktionieren noch

#### TC-6.3.1: Credit Anzeige
**Steps:**
1. Sidebar Credits prüfen

**Expected:**
- CreditProgress angezeigt
- Korrekter Wert

---

#### TC-6.3.2: Low Credit Warning
**Steps:**
1. User mit wenig Credits

**Expected:**
- Warning Banner angezeigt

---

### 6.4 E2: Auth funktioniert noch

#### TC-6.4.1: Login/Logout
**Steps:**
1. Logout
2. Login

**Expected:**
- Auth funktioniert
- Redirect korrekt

---

#### TC-6.4.2: Geschützte Routen
**Steps:**
1. Ohne Auth /dashboard/sammlungen aufrufen

**Expected:**
- Redirect zu Login

---

## 7. Performance Tests

### 7.1 Ladezeiten

#### TC-7.1.1: Sammlungen Ladezeit
**Steps:**
1. /dashboard/sammlungen laden
2. Zeit messen

**Expected:**
- < 1 Sekunde für 20 Sammlungen
- < 2 Sekunden für 100 Sammlungen

---

#### TC-7.1.2: Detail-Seite Ladezeit
**Steps:**
1. Sammlung Detail laden
2. Zeit messen

**Expected:**
- < 1 Sekunde für Metadaten
- < 2 Sekunden für 50 Leads

---

#### TC-7.1.3: Verlauf Ladezeit
**Steps:**
1. /dashboard/verlauf laden
2. Zeit messen

**Expected:**
- < 1 Sekunde für 20 Einträge

---

### 7.2 Interaktion

#### TC-7.2.1: Filter Reaktionszeit
**Steps:**
1. Filter anwenden
2. Zeit bis Update messen

**Expected:**
- < 500ms für Client-Side
- < 1 Sekunde für Server-Side

---

#### TC-7.2.2: Sortierung Reaktionszeit
**Steps:**
1. Sortierung ändern
2. Zeit messen

**Expected:**
- < 300ms

---

## 8. Accessibility Tests

### 8.1 Tastatur-Navigation

#### TC-8.1.1: Tab Navigation
**Steps:**
1. Tab-Taste durch alle interaktiven Elemente

**Expected:**
- Alle Buttons/Links fokussierbar
- Fokus-Indikator sichtbar

---

#### TC-8.1.2: Enter/Space Aktivierung
**Steps:**
1. Fokus auf Button
2. Enter oder Space

**Expected:**
- Button aktiviert

---

#### TC-8.1.3: Escape für Dialogs
**Steps:**
1. Lösch-Dialog öffnen
2. Escape drücken

**Expected:**
- Dialog schließt

---

### 8.2 Screen Reader

#### TC-8.2.1: ARIA Labels
**Steps:**
1. Screen Reader aktivieren
2. Seite navigieren

**Expected:**
- Alle Buttons haben Labels
- Status-Updates angekündigt

---

#### TC-8.2.2: Tabellen-Struktur
**Steps:**
1. Lead-Tabelle mit Screen Reader

**Expected:**
- Korrekte Header-Zuordnung
- Reihen korrekt vorgelesen

---

## 9. Checklisten

### Pre-Test Checklist
- [ ] Test Accounts erstellt (Free, Pro, Enterprise)
- [ ] Test Daten in Datenbank
- [ ] API Endpoints deployed
- [ ] Frontend deployed
- [ ] Browser DevTools geöffnet

### Post-Test Checklist
- [ ] Alle Testfälle ausgeführt
- [ ] Bugs dokumentiert
- [ ] Screenshots/Videos bei visuellen Bugs
- [ ] Test Report erstellt
- [ ] Sign-off durchgeführt

### Bug Report Template
```markdown
### BUG-XX: [Titel]
- **Severity:** [Critical/High/Medium/Low]
- **Test Case:** TC-X.X.X
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected:** ...
- **Actual:** ...
- **Screenshot:** [Link]
- **Priority:** [Fix Now/Fix Before Release/Fix Later]
```

---

## 10. Test Ausführungs-Log

**Wird während der QA-Phase ausgefüllt:**

| Datum | Tester | TCs Executed | Passed | Failed | Bugs Found |
|-------|--------|--------------|--------|--------|------------|
| | | | | | |

---

## 11. Zusammenfassung

**Wird nach QA-Phase ausgefüllt:**

### Ergebnisübersicht

| Kategorie | Total | Passed | Failed | Pass Rate |
|-----------|-------|--------|--------|-----------|
| Backend API | 35 | | | |
| Frontend UI | 40 | | | |
| Integration | 15 | | | |
| Plan-Gating | 20 | | | |
| Edge Cases | 25 | | | |
| Regression | 10 | | | |
| **Gesamt** | **135** | | | |

### Bugs Found

| Bug ID | Severity | Status | Ticket |
|--------|----------|--------|--------|
| | | | |

### Recommendation

- [ ] READY FOR PRODUCTION
- [ ] FIX REQUIRED (siehe Bugs)
- [ ] NOT READY (kritische Issues)

---

**Testplan erstellt:** 2026-02-08
**Bereit für QA Execution:** [ ]
**QA Lead Sign-off:** _______________
