# Scraping-Architektur: Apify Direct Integration

## Status: Aktiv | Datum: 2026-02-06

## Zusammenfassung

Dieses Dokument beschreibt die neue Scraping-Architektur fuer Manyleads.io. Die urspruenglich geplante n8n-Middleware wird vollstaendig gestrichen. Stattdessen wird Apify direkt ueber die REST API aus Next.js API Routes angesprochen. Dadurch entfallen:

- n8n-Server-Hosting und -Wartung
- Supabase Edge Functions als n8n-Proxy
- Die gesamte n8n-Webhook-Infrastruktur

---

## 1. Architektur-Uebersicht

### Bisherige Architektur (gestrichen)

```
User -> Next.js -> Supabase Edge Function (n8n-proxy) -> n8n Workflow -> Webhook -> Edge Function -> Supabase
```

### Neue Architektur

```
User -> Next.js API Route -> Apify REST API (Actor starten)
                                      |
                              Actor laeuft (async, 30s - 5min)
                                      |
                    +------------------+------------------+
                    |                                     |
            Option A: Webhook                    Option B: Polling
                    |                                     |
    Apify -> Next.js API Route              Next.js API Route -> Apify API
            /api/webhooks/apify              (GET Run Status alle 5s)
                    |                                     |
                    +------------------+------------------+
                                       |
                               Ergebnisse aus Apify Dataset abrufen
                                       |
                               Supabase (search_results aktualisieren)
                               Credits abziehen
                               Sammlung erstellen
                               Benachrichtigung senden
```

### Kernprinzipien

1. **Kein Middleware-Layer** - Next.js API Routes kommunizieren direkt mit der Apify API
2. **Asynchrone Verarbeitung** - Suche wird gestartet, Ergebnisse kommen spaeter
3. **Webhook-primaer, Polling-Fallback** - Webhook fuer Produktionsbetrieb, Polling fuer Entwicklung und als Fallback
4. **Keine Edge Functions noetig** - Standard Next.js API Routes reichen fuer Apify-Calls aus (kein 10s-Timeout-Problem, da nur der Start-Call synchron ist)

---

## 2. Empfohlene Scraping-Strategie

### Primaerer Ansatz: 2-Stufen-Modell

#### Stufe 1: Google Maps Basis-Daten

**Actor:** `compass/crawler-google-places`
- **Kosten:** $0.004 pro Lead (~0,0037 EUR)
- **Zuverlaessigkeit:** Meistgenutzter Google Maps Actor auf Apify, 2x schneller seit Anfang 2026
- **Output:** Firmenname, Adresse, Telefon, Website-URL, Google-Bewertung, Oeffnungszeiten, Kategorie, Place-ID
- **Geeignet fuer:** Alle Plaene (Starter, Professional, Enterprise)

#### Stufe 2 (optional): Email- und Entscheider-Anreicherung

**Actor:** `vdrmota/contact-info-scraper`
- **Kosten:** $0.002 pro gescrapte Seite (~0,0018 EUR)
- **Output:** Email-Adressen, Social-Media-Links, Kontaktnamen (aus Impressum/About-Seiten)
- **Geeignet fuer:** Professional- und Enterprise-Plaene (Feature-Flag `showEmail`, `showContactName`)
- **Voraussetzung:** Lead muss eine Website-URL haben (aus Stufe 1)

#### Kostenrechnung

| Szenario | Kosten/Lead (USD) | Kosten/Lead (EUR) | Budget-Ziel |
|----------|-------------------|--------------------| ------------|
| Nur Basis-Daten (Stufe 1) | $0.004 | ~0,0037 EUR | Unter 1 Cent |
| Mit Entscheider (Stufe 1+2) | $0.006 | ~0,0055 EUR | Unter 2 Cent |

Beide Szenarien liegen deutlich unter den definierten Budget-Zielen.

### Alternativer Ansatz: All-in-One

**Actor:** `scraper-mind/google-maps-email-scraper-unlimited`
- **Kosten:** $0.004 pro Lead (inklusive Email-Extraktion)
- **Vorteil:** Ein einzelner Actor-Run fuer alles, einfachere Implementierung
- **Nachteil:** Weniger Kontrolle ueber die Anreicherungstiefe, kein gezieltes Impressum-Parsing fuer Entscheider-Namen
- **Einsatz:** Als Fallback wenn der 2-Stufen-Ansatz Probleme macht

### Empfehlung

Der **2-Stufen-Ansatz** wird empfohlen weil:
1. Kosten fuer Starter-Plan-User minimiert werden (keine unnoetige Email-Anreicherung)
2. Die Anreicherungstiefe pro Plan steuerbar ist
3. Jede Stufe unabhaengig getestet und ausgetauscht werden kann
4. compass/crawler als zuverlaessigster Google Maps Actor gilt

---

## 3. API-Integration Flow

### 3.1 Suche starten

```
POST /api/search/start
  |
  +--> Validierung (Credits pruefen, Rate Limit, Eingabe-Validierung)
  |
  +--> search_results Eintrag erstellen (Status: "processing", progress: 0)
  |
  +--> Apify API Call: Actor Run starten
  |     POST https://api.apify.com/v2/acts/compass~crawler-google-places/runs
  |     Body: { searchStringsArray, locationQuery, maxCrawledPlacesPerSearch, language, ... }
  |     Query: ?token=APIFY_API_TOKEN&webhooks=[webhook-config]
  |
  +--> run_id und dataset_id in search_results speichern
  |
  +--> Response an Client: { searchId, status: "processing" }
```

### 3.2 Ergebnisse empfangen (Webhook)

```
POST /api/webhooks/apify
  |
  +--> Webhook-Signatur validieren (eventData.actorRunId pruefen)
  |
  +--> Dataset-Items abrufen
  |     GET https://api.apify.com/v2/datasets/{datasetId}/items?format=json
  |
  +--> Daten mappen (Apify Output -> LeadData Interface)
  |
  +--> [Optional] Stufe 2: Entscheider-Anreicherung starten
  |     POST https://api.apify.com/v2/acts/vdrmota~contact-info-scraper/runs
  |
  +--> search_results aktualisieren (Status: "completed", results: [...])
  |
  +--> Credits abziehen (atomare Operation auf user_credits)
  |
  +--> search_collections Eintrag erstellen
  |
  +--> Benachrichtigung erstellen ("Suche abgeschlossen")
```

### 3.3 Ergebnisse empfangen (Polling-Fallback)

```
GET /api/search/status?searchId=xyz
  |
  +--> run_id aus search_results lesen
  |
  +--> Apify API Call: Run-Status pruefen
  |     GET https://api.apify.com/v2/actor-runs/{runId}
  |
  +--> Wenn status == "SUCCEEDED":
  |     -> Dataset-Items abrufen und verarbeiten (wie Webhook-Flow)
  |
  +--> Wenn status == "RUNNING":
  |     -> progress aktualisieren basierend auf Apify-Statistik
  |     -> Response: { status: "processing", progress: X }
  |
  +--> Wenn status == "FAILED" / "TIMED-OUT" / "ABORTED":
  |     -> search_results auf "failed" setzen
  |     -> Response: { status: "failed", error: "..." }
```

### 3.4 Entscheider-Anreicherung (Stufe 2)

```
Nach Stufe 1 abgeschlossen:
  |
  +--> Leads mit Website-URL filtern
  |
  +--> vdrmota/contact-info-scraper starten
  |     Input: URLs der Lead-Websites (nur /impressum, /about, /kontakt Seiten)
  |
  +--> Ergebnisse mappen: Email, Social Links, Kontaktperson
  |
  +--> search_results aktualisieren mit angereicherten Daten
  |
  +--> Status: "completed"
```

---

## 4. Apify API Endpoints

### Verwendete Endpoints

| Methode | Endpoint | Zweck |
|---------|----------|-------|
| POST | `/v2/acts/{actorId}/runs` | Actor-Run starten |
| GET | `/v2/actor-runs/{runId}` | Run-Status abfragen |
| GET | `/v2/datasets/{datasetId}/items` | Ergebnis-Datensaetze abrufen |
| POST | `/v2/acts/{actorId}/runs` (mit webhooks Query) | Actor mit Webhook starten |
| DELETE | `/v2/actor-runs/{runId}/abort` | Laufenden Run abbrechen |

### Authentifizierung

Alle Calls nutzen den Query-Parameter `?token=APIFY_API_TOKEN`.

**Environment Variables:**
```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx
APIFY_WEBHOOK_SECRET=webhook_secret_xxxxx  # Fuer Webhook-Signatur-Validierung
```

### Webhook-Konfiguration beim Actor-Start

```json
{
  "webhooks": [
    {
      "eventTypes": ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.TIMED_OUT", "ACTOR.RUN.ABORTED"],
      "requestUrl": "https://manyleads.io/api/webhooks/apify",
      "payloadTemplate": "{\"runId\": {{runId}}, \"datasetId\": {{defaultDatasetId}}, \"status\": {{status}}, \"searchId\": \"{{customData.searchId}}\"}"
    }
  ]
}
```

Die `searchId` wird als `customData` im Actor-Run mitgegeben, damit der Webhook die Ergebnisse dem richtigen Suchvorgang zuordnen kann.

---

## 5. Datenfluss und Mapping

### 5.1 compass/crawler-google-places Output -> LeadData

| Apify-Feld | LeadData-Feld | Typ | Fallback |
|-------------|---------------|-----|----------|
| `title` | `name` | string | "Unbekannt" |
| `address` | `address` | string | "" |
| `phone` | `phone` | string | null |
| `website` | `website` | string | null |
| `totalScore` | `rating` | number | null |
| `reviewsCount` | `reviews_count` | number | 0 |
| `categoryName` | `category` | string | "" |
| `url` | `google_maps_url` | string | "" |
| `placeId` | `place_id` | string | "" |
| `location.lat` | `latitude` | number | null |
| `location.lng` | `longitude` | number | null |
| `openingHours` | `opening_hours` | object | null |
| `imageUrls[0]` | `image_url` | string | null |

### 5.2 vdrmota/contact-info-scraper Output -> Anreicherung

| Apify-Feld | LeadData-Feld | Typ | Fallback |
|-------------|---------------|-----|----------|
| `emails[0]` | `email` | string | null |
| `phones[0]` | `phone_from_website` | string | null |
| `socialLinks.facebook` | `facebook_url` | string | null |
| `socialLinks.instagram` | `instagram_url` | string | null |
| `socialLinks.linkedin` | `linkedin_url` | string | null |
| `socialLinks.twitter` | `twitter_url` | string | null |
| `contactName` (Impressum-Parse) | `contact_person` | string | null |

### 5.3 Zusammenfuehrung

Die Daten aus Stufe 1 und Stufe 2 werden ueber die Website-URL zusammengefuehrt. Der Merge-Algorithmus:

1. Basis-Daten aus Stufe 1 laden (compass/crawler)
2. Fuer jeden Lead mit Website-URL: Anreicherungsdaten aus Stufe 2 matchen
3. Felder aus Stufe 2 ergaenzen (nur wenn nicht null)
4. Telefonnummer: Stufe-1-Wert (Google Maps) bevorzugen, Stufe-2-Wert als `phone_from_website` separat speichern

---

## 6. Kostenoptimierung

### 6.1 Ergebnislimit pro Plan

| Plan | Max. Leads pro Suche | Max. Suchen pro Monat | Entscheider-Anreicherung |
|------|----------------------|-----------------------|--------------------------|
| Free | 10 (30 Credits gesamt) | 3 | Nein |
| Starter | 50 | 20 | Nein |
| Professional | 200 | Unbegrenzt | Ja |
| Enterprise | 500 | Unbegrenzt | Ja |

Der `maxCrawledPlacesPerSearch`-Parameter im Apify-Actor wird entsprechend gesetzt, um unnoetige Kosten zu vermeiden.

### 6.2 Ergebnis-Caching

**Regel:** Identische Suchanfragen (gleicher Query-String + gleiche Location) innerhalb von 24 Stunden loesen keinen neuen Apify-Run aus.

**Implementierung:**
1. Vor jedem Suchstart: Hash aus `query + location + date` berechnen
2. In `search_results` pruefen ob ein Eintrag mit gleichem Hash und Status "completed" existiert
3. Wenn ja und juenger als 24h: Cached Ergebnisse zurueckgeben (0 Credits)
4. Wenn nein: Neuen Apify-Run starten

**Cache-Invalidierung:**
- Automatisch nach 24 Stunden
- Manuell durch User moeglich ("Neue Suche erzwingen" Option)

### 6.3 Batch-Processing fuer Entscheider-Anreicherung

Stufe 2 (Entscheider-Scraping) wird optimiert durch:

1. **Nur Leads mit Website-URL** - Leads ohne Website werden uebersprungen (spart ~20-30% der Kosten)
2. **Gezieltes URL-Targeting** - Nur `/impressum`, `/about`, `/kontakt`, `/team`, `/ueber-uns` Seiten werden gescrapt (nicht die gesamte Website)
3. **Batch-Verarbeitung** - Alle Website-URLs werden in einem einzelnen Actor-Run an `vdrmota/contact-info-scraper` uebergeben (statt einzelne Runs pro Lead)
4. **Deduplizierung** - Gleiche Domains werden nur einmal gescrapt

### 6.4 Kosten-Monitoring

In der Datenbank wird pro Suchvorgang gespeichert:
- `apify_cost_usd` - Tatsaechliche Apify-Kosten des Runs (aus Run-Statistik)
- `leads_found` - Anzahl gefundener Leads
- `cost_per_lead` - Berechneter Preis pro Lead

Dies ermoeglicht Kosten-Tracking und fruehzeitige Erkennung von Preis-Anomalien.

---

## 7. Fallback-Strategie

### Fallback-Kette

```
Primaer: compass/crawler-google-places
    |
    +--> Bei Fehler (Actor nicht verfuegbar, Timeout, Rate Limit)
    |
Fallback 1: scraper-mind/google-maps-email-scraper-unlimited
    |
    +--> Bei Fehler (ebenfalls nicht verfuegbar)
    |
Fallback 2: Mock-Daten (nur Entwicklung / Demo-Modus)
```

### Error Handling pro Stufe

#### Primaer: compass/crawler-google-places

| Fehler | Erkennung | Reaktion |
|--------|-----------|----------|
| Actor nicht verfuegbar | HTTP 404 beim Run-Start | Sofort zu Fallback 1 wechseln |
| Rate Limit | HTTP 429 | 60s warten, dann Retry (max. 2x), dann Fallback 1 |
| Run fehlgeschlagen | Webhook/Polling: status "FAILED" | Error-Details loggen, Fallback 1 versuchen |
| Timeout | Webhook/Polling: status "TIMED-OUT" (>5min) | Fallback 1 versuchen |
| 0 Ergebnisse | Dataset leer | Kein Fehler - "Keine Ergebnisse fuer diese Suche" melden |
| Apify API komplett down | HTTP 5xx / Connection Timeout | Fehlermeldung an User, kein Fallback moeglich |

#### Fallback 1: scraper-mind/google-maps-email-scraper-unlimited

| Fehler | Erkennung | Reaktion |
|--------|-----------|----------|
| Actor nicht verfuegbar | HTTP 404 | Fallback 2 (Mock-Daten) wenn Entwicklung, sonst Fehlermeldung |
| Alle anderen Fehler | Wie oben | Fehlermeldung "Service voruebergehend nicht verfuegbar" |

#### Fallback 2: Mock-Daten

- Nur aktiv wenn `NODE_ENV === "development"` oder `ENABLE_MOCK_DATA === "true"`
- Generiert realistische deutsche Geschaeftsdaten
- 200ms kuenstliche Verzoegerung fuer realistisches UI-Verhalten
- Festes Dataset mit 50 vordefinierten Mock-Leads

### Fallback-Konfiguration

```
# Environment Variables
APIFY_PRIMARY_ACTOR=compass/crawler-google-places
APIFY_FALLBACK_ACTOR=scraper-mind/google-maps-email-scraper-unlimited
APIFY_ENRICHMENT_ACTOR=vdrmota/contact-info-scraper
ENABLE_MOCK_DATA=false  # true nur fuer Entwicklung
```

---

## 8. Zuverlaessigkeit fuer kleine Nischen

### compass/crawler-google-places Staerken

- **Meistgenutzter Google Maps Actor** auf Apify mit tausenden monatlichen Runs
- **Speziell optimiert fuer lokale Suchen** - ideal fuer deutsche Staedte und Nischen
- **Seit 2026 doppelt so schnell** - reduziert Wartezeiten fuer User

### Suchparameter fuer Deutschland

```json
{
  "searchStringsArray": ["Steuerberater"],
  "locationQuery": "Buxtehude, Deutschland",
  "maxCrawledPlacesPerSearch": 50,
  "language": "de",
  "countryCode": "DE",
  "skipClosedPlaces": false,
  "includeWebResults": false
}
```

### Such-Moeglichkeiten

| Suchtyp | Beispiel-Input | Verhalten |
|----------|---------------|-----------|
| Stadt + Branche | "Steuerberater Buxtehude" | Suche in spezifischer Stadt |
| PLZ + Branche | "Zahnarzt 21614" | Suche im PLZ-Gebiet |
| Region + Branche | "Handwerker Landkreis Stade" | Breitere regionale Suche |
| Nischen-Branche | "Osteopath Hamburg" | Auch fuer kleine Nischen zuverlaessig |
| Keyword-Varianten | "Restaurant italienisch Muenchen" | Unterstuetzt zusammengesetzte Suchbegriffe |

### Ergebnis-Erwartungen fuer kleine Nischen

- **Grosse Stadt + breite Branche** (z.B. "Restaurant Hamburg"): 200+ Ergebnisse
- **Mittlere Stadt + Branche** (z.B. "Zahnarzt Lueneburg"): 20-50 Ergebnisse
- **Kleine Stadt + Nische** (z.B. "Osteopath Buxtehude"): 1-10 Ergebnisse
- **Sehr spezifische Nische** (z.B. "ayurvedische Massage Cuxhaven"): 0-3 Ergebnisse

Bei weniger als 3 Ergebnissen wird dem User empfohlen, den Suchradius zu erweitern oder einen breiteren Suchbegriff zu verwenden.

---

## 9. Aenderungen an bestehenden Feature-Specs

Die Umstellung von n8n auf Apify Direct Integration betrifft folgende PROJ-Items aus der FEATURE-SPEC.md:

### PROJ-13: n8n-Integration -> Apify Direct Integration

**Bisherig:** "n8n-Integration & Scraping-Workflow" - Supabase Edge Function als n8n-Proxy, n8n-Webhook-URL, n8n-Workflow-Management

**Neu:**
- Titel: "Apify Direct Integration & Scraping-Workflow"
- Keine Edge Functions mehr noetig - Standard Next.js API Routes
- n8n-Webhook-URL entfaellt, wird ersetzt durch Apify API Token
- Actor-Run-Management statt n8n-Workflow-Management
- Webhook-Empfaenger `/api/webhooks/apify` statt `n8n-results-webhook` Edge Function
- Acceptance Criteria anpassen:
  - ~~Edge Function `n8n-proxy` leitet Suchanfrage an n8n weiter~~ -> API Route `/api/search/start` startet Apify Actor
  - ~~n8n-Webhook-URL als Environment Variable~~ -> `APIFY_API_TOKEN` als Environment Variable
  - ~~Edge Function `n8n-results-webhook`~~ -> API Route `/api/webhooks/apify` empfaengt Ergebnisse
  - Alles andere (Credits abziehen, Sammlung erstellen, Benachrichtigung) bleibt gleich

### PROJ-14: Fortschrittsanzeige -> Apify Run Status Polling

**Bisherig:** Fortschrittsanzeige basierend auf n8n-Status-Updates ueber Supabase Realtime

**Neu:**
- Abhaengigkeit aendern: "Benoetigt PROJ-13 (Apify Integration)" statt n8n
- Fortschritts-Datenquelle: Apify Run Status API (`/v2/actor-runs/{runId}`) statt n8n-Status
- Polling-Intervall: Alle 5 Sekunden den Apify-Run-Status abfragen
- Run-Statistiken (Items gefunden, Seiten gescrapt) koennen fuer granulareren Fortschritt genutzt werden
- Die 6 Such-Schritte bleiben konzeptionell gleich, werden aber auf Apify-Status gemappt:
  - Validieren -> Vor dem API-Call (Client-seitig)
  - Verbinden -> Actor-Run wird gestartet (HTTP Response erhalten)
  - Suchen -> Apify Run Status: "RUNNING"
  - Extrahieren -> Apify Run Status: "RUNNING" (Items > 0 in Statistik)
  - Anreichern -> Stufe-2-Actor laeuft (optional)
  - Speichern -> Daten werden in Supabase geschrieben

### PROJ-15: Outscraper-Fallback -> scraper-mind als Fallback

**Bisherig:** "Outscraper-Fallback / Alternative Scraping-APIs" - Outscraper als primaerer Fallback zu n8n

**Neu:**
- Titel: "Apify-Fallback & Mock-Daten"
- ~~Outscraper API als Fallback~~ -> `scraper-mind/google-maps-email-scraper-unlimited` als Fallback
- Outscraper entfaellt komplett (nicht mehr noetig, da Apify selbst zuverlaessig genug)
- Fallback-Kette: compass/crawler -> scraper-mind -> Mock-Daten
- Kein externer API-Anbieter ausserhalb von Apify mehr noetig
- Acceptance Criteria:
  - ~~Outscraper API als Fallback konfigurierbar~~ -> scraper-mind Actor als Fallback
  - ~~Apify als Alternative konfigurierbar~~ -> Apify IST die primaere Plattform
  - Mock-Daten-Generator bleibt gleich
  - ~~Automatischer Fallback: n8n -> Outscraper -> Mock-Daten~~ -> compass/crawler -> scraper-mind -> Mock-Daten

### Weitere betroffene Referenzen

| PROJ-Item | Aenderung |
|-----------|-----------|
| PROJ-12 (Such-Formular) | API-Endpoint aendern: `/api/search/start` statt Edge Function Call |
| PROJ-16 (Lead-Ergebnis-Tabelle) | Keine Aenderung (konsumiert Daten aus search_results) |
| PROJ-14 (Fortschrittsanzeige) | Polling-Quelle aendern (siehe oben) |
| PROJ-2 (DB-Schema) | Neue Felder in search_results: `apify_run_id`, `apify_dataset_id`, `apify_cost_usd` |

### Entfallende Komponenten

Die folgenden Architektur-Elemente aus der urspruenglichen Planung sind komplett gestrichen:

1. **Supabase Edge Functions** - Kein `n8n-proxy`, kein `n8n-results-webhook`, kein `apify-google-maps`
2. **n8n-Server** - Kein Hosting, keine Workflows, keine Wartung
3. **n8n-Webhook-URLs** - Keine Environment Variables fuer n8n
4. **Outscraper API** - Kein separater API-Anbieter neben Apify

---

## 10. Offene Entscheidungen

| Entscheidung | Optionen | Empfehlung | Status |
|--------------|----------|------------|--------|
| Webhook vs. Polling | Webhook primaer / Polling primaer / Hybrid | Hybrid (Webhook + Polling-Fallback) | Empfohlen |
| Apify Token Speicherung | Environment Variable / Supabase Vault | Environment Variable (einfacher) | Empfohlen |
| Stufe-2-Trigger | Automatisch / User entscheidet | Automatisch basierend auf Plan | Empfohlen |
| Rate Limiting | Pro User / Global / Beides | Pro User (basierend auf Plan) | Empfohlen |

---

## Anhang: Actor-IDs und Links

| Actor | Apify-ID | Dokumentation |
|-------|----------|---------------|
| Google Maps Crawler | `compass/crawler-google-places` | https://apify.com/compass/crawler-google-places |
| Email/Contact Scraper | `vdrmota/contact-info-scraper` | https://apify.com/vdrmota/contact-info-scraper |
| Google Maps Email (Fallback) | `scraper-mind/google-maps-email-scraper-unlimited` | https://apify.com/scraper-mind/google-maps-email-scraper-unlimited |
