# Manyleads.io - Migrations-Analyse

## Ueberblick

Dieses Dokument analysiert die Migration vom alten LeadForge-Repo (Next.js 16 / App Router) zum neuen Manyleads.io-Projekt (ebenfalls Next.js 16 / App Router) unter Beruecksichtigung der erweiterten Anforderungen aus der Projektdokumentation.

**Altes Repo:** `leadforge_old` - Minimaler Prototyp mit Grundfunktionen
**Neues Projekt:** `DEV_Projekts` - Starter-Kit mit shadcn/ui Komponenten, aber noch ohne Business-Logik
**Ziel-Spezifikation:** `PROJEKT-DOKUMENTATION_manyleads.md` + `FEATURE-SPEC.md` (31 Features in 14 Epics)

---

## 1. Uebersicht alte Codebasis (leadforge_old)

### 1.1 Technologie-Stack

| Technologie | Version | Status |
|-------------|---------|--------|
| Next.js | 16.1.6 | App Router |
| React | 19.2.3 | Aktuell |
| TypeScript | 5.x | Aktuell |
| Tailwind CSS | v4 | mit `@tailwindcss/postcss` |
| @supabase/ssr | 0.8.0 | SSR-faehig |
| @supabase/supabase-js | 2.94.1 | Aktuell |
| shadcn/ui | via radix-ui 1.4.3 | Monorepo-Paket |
| next-themes | 0.4.6 | Dark/Light Mode |
| sonner | 2.0.7 | Toast-Benachrichtigungen |
| motion (Framer) | 12.31.1 | Animationen |
| lucide-react | 0.563.0 | Icons |
| tw-animate-css | 1.4.0 | Tailwind Animationen |

### 1.2 Dateistruktur

#### App-Routen (src/app/)
| Datei | Funktion |
|-------|----------|
| `layout.tsx` | Root-Layout mit Font-Loading, ThemeProvider, Toaster |
| `page.tsx` | Landing Page (7 Sections) |
| `globals.css` | Tailwind v4 Setup mit oklch-Farben, Brand-Variablen |
| `(auth)/layout.tsx` | Auth-Layout (zentriert) |
| `(auth)/login/page.tsx` | Login mit Supabase `signInWithPassword` |
| `(auth)/registrieren/page.tsx` | Registrierung mit Supabase `signUp` + User-Metadaten |
| `(marketing)/preise/page.tsx` | Oeffentliche Preisseite |
| `(marketing)/kontakt/page.tsx` | Kontaktseite |
| `(marketing)/impressum/page.tsx` | Impressum |
| `(marketing)/datenschutz/page.tsx` | Datenschutzerklaerung |
| `dashboard/layout.tsx` | Dashboard-Layout mit Sidebar + UserProvider |
| `dashboard/page.tsx` | Lead-Finder (Suchformular + Ergebnis-Tabelle + CSV-Export) |
| `dashboard/crm/page.tsx` | CRM mit Plan-Gating (Lock-Screen fuer Free) |
| `dashboard/verlauf/page.tsx` | Suchverlauf |
| `dashboard/credits/page.tsx` | Credit-Uebersicht |
| `dashboard/preise/page.tsx` | Pricing im Dashboard |
| `dashboard/einstellungen/page.tsx` | Account-Einstellungen |
| `api/leads/route.ts` | POST: Outscraper API + Credit-Abzug + Mock-Fallback |
| `auth/callback/route.ts` | OAuth Code Exchange |

#### Komponenten (src/components/)
| Datei | Funktion |
|-------|----------|
| `dashboard/sidebar.tsx` | Vollstaendige Sidebar mit Navigation, Credit-Anzeige, User-Info, Logout |
| `dashboard/mobile-sidebar.tsx` | Sheet-basierte Mobile-Sidebar |
| `dashboard/lead-results-table.tsx` | Ergebnis-Tabelle mit Plan-basiertem Feature-Gating (PremiumBadge) |
| `landing/hero-section.tsx` | Hero-Section der Landing Page |
| `landing/features-section.tsx` | Features-Abschnitt |
| `landing/pricing-preview.tsx` | Pricing-Vorschau |
| `landing/how-it-works.tsx` | "So funktioniert's" Section |
| `landing/testimonials-section.tsx` | Kundenstimmen |
| `landing/faq-section.tsx` | FAQ mit Accordion |
| `landing/cta-section.tsx` | Call-to-Action |
| `layout/navbar.tsx` | Oeffentliche Navbar |
| `layout/footer.tsx` | Footer |
| `layout/logo.tsx` | Logo-Komponente |
| `layout/theme-provider.tsx` | next-themes Provider |
| `layout/theme-toggle.tsx` | Dark/Light Toggle |
| `providers/user-provider.tsx` | UserContext: Profil, Plan, Credits, Logout |
| `ui/*.tsx` | 20 shadcn/ui Komponenten |

#### Bibliotheken (src/lib/)
| Datei | Funktion |
|-------|----------|
| `supabase/client.ts` | Browser-Client mit `createBrowserClient` |
| `supabase/server.ts` | Server-Client mit `createServerClient` + Cookie-Handling |
| `supabase/middleware.ts` | Session-Refresh + Route-Protection (/dashboard, /login, /registrieren) |
| `plans.ts` | Plan-Konfiguration (Free/Starter/Pro/Enterprise) mit Feature-Flags |
| `constants.ts` | SITE_CONFIG, NAV_LINKS, DASHBOARD_NAV |
| `utils.ts` | cn() Helper (clsx + tailwind-merge) |

#### Daten (src/data/)
| Datei | Inhalt |
|-------|--------|
| `features.ts` | 6 Feature-Karten mit Icons und Beschreibungen |
| `pricing.ts` | 4 Pricing-Tiers mit Features-Listen |
| `faq.ts` | 6 FAQ-Eintraege |
| `testimonials.ts` | 3 Testimonials |

#### Typen (src/types/)
| Datei | Inhalt |
|-------|--------|
| `lead.ts` | Lead-Interface (15 Felder), SearchParams, SearchResult |

#### Middleware
| Datei | Funktion |
|-------|----------|
| `middleware.ts` | Leitet an `updateSession()` weiter, Matcher: /dashboard/*, /login, /registrieren |

#### Datenbank-Schema (supabase-schema.sql)
4 Tabellen:
- `profiles` (id, email, first_name, last_name, company, plan, credits_total, credits_used)
- `searches` (id, user_id, query, location, results_count, credits_used)
- `collections` (id, user_id, name)
- `collection_leads` (id, collection_id, lead_data JSONB)
- RLS Policies auf allen Tabellen
- Trigger `handle_new_user()` fuer automatische Profilerstellung

### 1.3 Implementierter Funktionsumfang

**Vollstaendig implementiert:**
- Supabase Auth (Email/Passwort Login + Registrierung)
- Session-Management via Middleware
- UserProvider mit Plan-Konfiguration
- Dashboard-Layout mit Sidebar + Mobile-Navigation
- Suchformular mit Branche, Standort, Limit
- Outscraper API-Integration (synchron) mit Mock-Fallback
- Lead-Ergebnis-Tabelle mit Feature-Gating (Free vs. Premium)
- Credit-System (in profiles-Tabelle integriert)
- CSV-Export (einfache Version)
- Landing Page mit 7 Sections
- Dark/Light Mode
- Marketing-Seiten (Preise, Impressum, Datenschutz, Kontakt)

**Teilweise implementiert / Placeholder:**
- CRM (nur Lock-Screen fuer Free-Plan)
- Suchverlauf (Seite existiert, Daten werden gespeichert)
- Einstellungen (Seite existiert)
- Credits-Seite (Seite existiert)

**Nicht implementiert:**
- Google OAuth
- Passwort-Reset
- n8n-Integration (nur synchrone Outscraper-Suche)
- Such-Fortschrittsanzeige (Suche ist synchron)
- Smart-Filter-System
- Realtime Credit-Updates
- Stripe-Integration
- Benachrichtigungssystem
- Admin-Dashboard
- Feedback-System
- CRM-Kontaktverwaltung (Tabelle, Edit, Import)
- Sammlungen (vollstaendig)

---

## 2. Uebersicht aktuelle Codebasis (neues Projekt)

### 2.1 Technologie-Stack

| Technologie | Version | Hinweis |
|-------------|---------|---------|
| Next.js | 16.1.1 | App Router |
| React | 19.x | Aktuell |
| TypeScript | 5.x | Aktuell |
| Tailwind CSS | v3.4.1 | **ACHTUNG: v3, nicht v4 wie im alten Repo!** |
| @supabase/supabase-js | 2.39.3 | Nur Basis-Client, **kein @supabase/ssr!** |
| shadcn/ui | Einzelne Radix-Pakete | 38 UI-Komponenten installiert |
| next-themes | 0.4.6 | Vorhanden |
| sonner | 2.0.7 | Vorhanden |
| react-hook-form | 7.71.1 | Vorhanden (fehlt im alten Repo) |
| zod | 4.3.5 | Vorhanden (fehlt im alten Repo) |
| cmdk | 1.1.1 | Command-Palette (fehlt im alten Repo) |

### 2.2 Was existiert

| Bereich | Status |
|---------|--------|
| `src/app/layout.tsx` | Standard Next.js Layout (ohne ThemeProvider etc.) |
| `src/app/page.tsx` | Placeholder-Seite |
| `src/app/globals.css` | Standard shadcn/ui CSS-Variablen (HSL-basiert, generisch) |
| `tailwind.config.ts` | Standard shadcn/ui Tailwind-Konfiguration mit HSL-Variablen |
| `src/components/ui/` | 38 shadcn/ui Komponenten (mehr als im alten Repo) |
| `src/hooks/use-mobile.tsx` | Mobile-Detection Hook |
| `src/hooks/use-toast.ts` | Toast-Hook (Radix-basiert) |
| `src/lib/supabase.ts` | **Auskommentierter** Supabase-Client (Placeholder) |
| `src/lib/utils.ts` | cn() Helper |

### 2.3 Was NICHT existiert
- Keine Business-Logik
- Keine App-Routen ausser der Startseite
- Kein Supabase SSR Setup (@supabase/ssr fehlt in package.json)
- Keine Middleware
- Keine Layouts ausser Root
- Keine Datenbank-Schemas
- Keine API-Routen
- Kein ThemeProvider-Setup
- Keine Brand-Farben oder Design-System

---

## 3. Direkt uebernehmbar (1:1 oder minimale Aenderungen)

### 3.1 Supabase Client-Setup

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/lib/supabase/client.ts` | `src/lib/supabase/client.ts` | Keine - 1:1 kopierbar |
| `src/lib/supabase/server.ts` | `src/lib/supabase/server.ts` | Keine - 1:1 kopierbar |
| `src/lib/supabase/middleware.ts` | `src/lib/supabase/middleware.ts` | Admin-Route-Check ergaenzen |
| `src/middleware.ts` | `src/middleware.ts` | Matcher um /admin erweitern |

**Voraussetzung:** `@supabase/ssr` muss als Dependency installiert werden (fehlt im aktuellen Projekt).

### 3.2 Auth-Seiten

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/app/(auth)/layout.tsx` | `src/app/(auth)/layout.tsx` | Keine - 1:1 kopierbar |
| `src/app/(auth)/login/page.tsx` | `src/app/(auth)/login/page.tsx` | Branding "LeadForge" -> "Manyleads.io" |
| `src/app/(auth)/registrieren/page.tsx` | `src/app/(auth)/registrieren/page.tsx` | Branding aendern, `company`-Feld optional halten |
| `src/app/auth/callback/route.ts` | `src/app/auth/callback/route.ts` | Keine - 1:1 kopierbar |

### 3.3 Typen

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/types/lead.ts` | `src/types/lead.ts` | Muss erweitert werden (siehe Abschnitt 4) |

### 3.4 Statische Daten

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/data/features.ts` | `src/data/features.ts` | Texte anpassen (LeadForge -> Manyleads.io) |
| `src/data/faq.ts` | `src/data/faq.ts` | Texte anpassen |
| `src/data/testimonials.ts` | `src/data/testimonials.ts` | Texte anpassen |

### 3.5 Layout-Komponenten

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/components/layout/theme-provider.tsx` | `src/components/layout/theme-provider.tsx` | Keine - 1:1 kopierbar |
| `src/components/layout/theme-toggle.tsx` | `src/components/layout/theme-toggle.tsx` | Keine - 1:1 kopierbar |
| `src/components/layout/logo.tsx` | `src/components/layout/logo.tsx` | Logo/Name aendern |

### 3.6 Utility-Funktionen

| Datei (alt) | Ziel (neu) | Aenderungen |
|-------------|-----------|-------------|
| `src/lib/utils.ts` | `src/lib/utils.ts` | Bereits vorhanden, identisch |

**Zusammenfassung:** Ca. 15 Dateien koennen direkt oder mit minimalem Aufwand (Branding-Aenderungen) uebernommen werden.

---

## 4. Teilweise uebernehmbar (braucht Anpassungen)

### 4.1 UserProvider (`src/components/providers/user-provider.tsx`)

**Basis:** Alte Version ist funktional und gut strukturiert.

**Noetige Aenderungen:**
1. **Credits aus separater Tabelle laden:** Statt `profiles.credits_total` / `profiles.credits_used` muss aus `user_credits`-Tabelle gelesen werden
2. **Subscription aus separater Tabelle laden:** Statt `profiles.plan` muss aus `subscriptions`-Tabelle gelesen werden
3. **Erweitertes PlanConfig-Interface:** Neue Flags hinzufuegen (hasCSVExport, hasAdvancedFilters, hasTeamAccounts)
4. **Partial-Access-Level:** Starter hat `'partial'` statt `true/false` fuer Social Media und Entscheider
5. **Realtime-Subscription:** Supabase Channel auf `user_credits`-Tabelle fuer Live-Updates ergaenzen

**Geschaetzter Aufwand:** 40% neu, 60% uebernehmbar

### 4.2 Plan-Konfiguration (`src/lib/plans.ts`)

**Basis:** Gute Struktur, muss erweitert werden.

**Noetige Aenderungen:**
1. **Neue Feature-Flags:**
   - `hasCSVExport: boolean`
   - `hasAdvancedFilters: boolean`
   - `hasTeamAccounts: boolean`
   - `socialAccess: boolean | 'partial'`
   - `contactAccess: boolean | 'partial'`
   - `emailAccess: boolean`
2. **Preisanpassung:** Starter 29->19 EUR, Pro 79->49 EUR, Enterprise "Anfrage"->199 EUR
3. **Credit-Anpassung:** Starter 500->150, Pro 2000->500, Enterprise unlimited->1500

**Geschaetzter Aufwand:** 30% neu, 70% uebernehmbar

### 4.3 Dashboard-Layout (`src/app/dashboard/layout.tsx`)

**Basis:** Funktional, kann uebernommen werden.

**Noetige Aenderungen:**
1. **Neue Sidebar-Links:** Sammlungen-Link hinzufuegen
2. **ActiveSearchBanner:** Globaler Banner fuer laufende Suchen einbauen
3. **NotificationBell:** Benachrichtigungs-Icon in der Topbar ergaenzen

**Geschaetzter Aufwand:** 20% neu, 80% uebernehmbar

### 4.4 Sidebar (`src/components/dashboard/sidebar.tsx`)

**Basis:** Vollstaendige Sidebar mit guter Struktur.

**Noetige Aenderungen:**
1. **Navigation erweitern:** Sammlungen-Link hinzufuegen
2. **Branding:** LeadForge -> Manyleads.io
3. **NotificationBell:** In sekundaere Navigation integrieren
4. **Feedback-Button:** Unten in der Sidebar hinzufuegen
5. **Design-System:** Brand-Farben an neues Design anpassen (HSL 217/270 statt oklch)

**Geschaetzter Aufwand:** 25% neu, 75% uebernehmbar

### 4.5 Lead-Ergebnis-Tabelle (`src/components/dashboard/lead-results-table.tsx`)

**Basis:** Feature-Gating-Logik ist gut, kann uebernommen werden.

**Noetige Aenderungen:**
1. **Partial-Blur fuer Starter:** Statt komplettem Lock ein teilweises Blurren von Daten
2. **Erweiterte Spalten:** YouTube, TikTok, Twitter hinzufuegen
3. **Spalten-Konfiguration:** User soll Spalten ein-/ausblenden koennen
4. **Sortierung:** Klickbare Spaltenkoepfe fuer Sortierung
5. **Pagination:** Bei 500+ Ergebnissen
6. **Lead-Datenstruktur erweitern:** Mehr Felder (place_id, business_status, opening_hours etc.)

**Geschaetzter Aufwand:** 50% neu, 50% uebernehmbar

### 4.6 Dashboard-Suchseite (`src/app/dashboard/page.tsx`)

**Basis:** Suchformular und Ergebnis-Anzeige funktional.

**Noetige Aenderungen:**
1. **Asynchrone Suche:** Statt synchronem fetch auf Outscraper muss die n8n-Integration verwendet werden
2. **Fortschrittsanzeige:** Step-basierte Anzeige (6 Schritte) statt einfachem Loading-Spinner
3. **Entscheider-Toggle:** Optionaler Toggle mit Plan-Gating
4. **Credit-Vorschau:** Kostenberechnung vor Suchstart
5. **Ergebnis-Limit Slider:** 1-500 statt einfachem Number-Input
6. **CSV-Export auslagern:** In eigene Komponente (Plan-gated)
7. **CRM-Import-Button:** Funktional machen (nicht nur Platzhalter)

**Geschaetzter Aufwand:** 60% neu, 40% uebernehmbar (UI-Grundstruktur)

### 4.7 API-Route `/api/leads/route.ts`

**Basis:** Outscraper-Integration und Mock-Daten-Generator sind nuetzlich.

**Noetige Aenderungen:**
1. **Primaerer Flow aendern:** Von synchronem Outscraper-Call zu asynchronem n8n-Proxy
2. **Mock-Daten erweitern:** Mehr Felder (Social Media, Entscheider, Business-Info)
3. **Credit-Tabelle aendern:** Von `profiles.credits_used` zu `user_credits`-Tabelle
4. **Search-Results-Tabelle:** Statt `searches` die `search_results`-Tabelle verwenden
5. **Outscraper als Fallback behalten:** Falls n8n nicht verfuegbar

**Geschaetzter Aufwand:** 70% neu, 30% uebernehmbar (Outscraper-Code, Mock-Generator, Auth-Pattern)

### 4.8 Pricing-Daten (`src/data/pricing.ts`)

**Basis:** Struktur ist gut.

**Noetige Aenderungen:**
1. **Preise anpassen:** Starter 29->19, Pro 79->49, Enterprise -1->199
2. **Credits anpassen:** Starter 500->150, Pro 2000->500, Enterprise ->1500
3. **Feature-Listen aktualisieren:** Partial-Zugang beschreiben

**Geschaetzter Aufwand:** 15% neu, 85% uebernehmbar

### 4.9 Constants (`src/lib/constants.ts`)

**Basis:** SITE_CONFIG und Navigation-Links brauchbar.

**Noetige Aenderungen:**
1. **Branding:** LeadForge -> Manyleads.io, URL aendern
2. **Dashboard-Nav erweitern:** Sammlungen-Link hinzufuegen
3. **Marketing-Nav erweitern:** About, Hilfe etc.

**Geschaetzter Aufwand:** 10% neu, 90% uebernehmbar

### 4.10 Landing-Page-Komponenten (`src/components/landing/`)

**Basis:** 7 Sections sind vollstaendig implementiert.

**Noetige Aenderungen:**
1. **Branding:** LeadForge -> Manyleads.io durchgehend
2. **Design-System:** Farben an Projektdokumentation anpassen (Blau/Lila statt Blau/Cyan)
3. **Inhalt aktualisieren:** Texte, Features, Pricing-Preview
4. **Animationen:** motion/react Animationen ggf. anpassen
5. **Responsive:** Pruefen und ggf. anpassen

**Geschaetzter Aufwand:** 30% neu, 70% uebernehmbar

---

## 5. Komplett neu zu bauen

Die folgenden Features aus der Projektdokumentation existieren NICHT im alten Repo und muessen vollstaendig neu entwickelt werden:

### 5.1 Authentifizierung
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Google OAuth | PROJ-6 | Social Login via Supabase Auth |
| Passwort-Reset | PROJ-7 | ForgotPasswordDialog + ResetPassword-Seite |
| Admin-Route-Protection | PROJ-9 (teilw.) | Admin-Rolle pruefen via `user_roles`-Tabelle |

### 5.2 Credit-System
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Credit-Reset Cron | PROJ-11 | pg_cron Job / Edge Function fuer monatliche Credit-Erneuerung |
| Realtime Credit-Sync | PROJ-10 (teilw.) | Supabase Realtime Channel auf `user_credits` |

### 5.3 Lead-Suche
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| n8n-Integration | PROJ-13 | Edge Function `n8n-proxy` + `n8n-results-webhook` |
| Such-Fortschrittsanzeige | PROJ-14 | 6-Step-Visualisierung mit Realtime-Updates |
| ActiveSearchBanner | PROJ-14 (Teil) | Globaler Banner fuer laufende Suchen |
| Search-Recovery | PROJ-14 (Teil) | localStorage-Persistenz fuer Browser-Restart |
| Apify-Fallback | PROJ-15 (teilw.) | Alternative Scraping-API |

### 5.4 Filter & Ergebnisse
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Smart-Filter-System | PROJ-17 | Ja/Nein/Egal-Filter fuer Social Media, Qualitaet etc. |
| Quick-Filter | PROJ-17 (Teil) | Einfache Filter (Website/Email/Telefon vorhanden) |
| Spalten-Konfiguration | PROJ-16 (Teil) | Sichtbare Spalten waehlen und speichern |

### 5.5 Sammlungen & Verlauf
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Sammlungen-Seite | PROJ-18 | Vollstaendige Sammlungsverwaltung mit Detail-Ansicht |
| Sammlungs-Detail-Ansicht | PROJ-18 (Teil) | Einzelne Sammlung mit allen Leads anzeigen |

### 5.6 CRM
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| CRM-Kontaktliste | PROJ-20 | Vollstaendiges CRM mit Import, Filter, Pipeline |
| CRM-Import aus Suche | PROJ-20 (Teil) | `useCRM` Hook mit Duplikats-Check |
| CRM-Kontakt-Edit | PROJ-21 | Bearbeitungsdialog fuer Kontakte |
| CRM-Bulk-Aktionen | PROJ-20 (Teil) | Mehrfachauswahl + Loeschen |

### 5.7 Stripe-Integration
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Stripe Checkout | PROJ-23 | Edge Function / API Route `create-checkout` |
| Stripe Webhook | PROJ-24 | Event-Handler fuer Zahlungen und Kuendigungen |
| Credit-Pakete Kauf | PROJ-23 (Teil) | Einmalkauf von Credits via Stripe |

### 5.8 Benachrichtigungen
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| NotificationBell | PROJ-26 | Glocken-Icon mit Ungelesen-Counter |
| Realtime-Notifications | PROJ-26 | Supabase Realtime auf `notifications`-Tabelle |
| Notification-Typen | PROJ-26 (Teil) | search_completed, credits_low, subscription_renewed |

### 5.9 Admin
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Admin-Dashboard | PROJ-27 | Uebersicht, Kontaktanfragen, Feedback-Management |
| Admin-Route | PROJ-27 (Teil) | `has_role()` Function + Route-Protection |

### 5.10 Feedback
| Feature | PROJ-ID | Beschreibung |
|---------|---------|-------------|
| Feedback-Dialog | PROJ-31 | In-App Feedback mit optionalem Datei-Upload |
| FAQ-Dialog | - | FAQ direkt in der App (aus Projektdokumentation) |

### 5.11 Supabase Edge Functions (alle neu)
| Function | Zweck |
|----------|-------|
| `n8n-proxy` | Suchanfragen an n8n weiterleiten |
| `n8n-results-webhook` | Ergebnisse empfangen, Credits abziehen, Sammlung erstellen |
| `create-checkout` | Stripe Checkout Sessions erstellen |
| `stripe-webhook` | Stripe Events verarbeiten |
| `apify-google-maps` | Alternative Scraping-Methode |
| `apify-progress-webhook` | Fortschritts-Updates von Apify |
| `extract-business-info` | Geschaeftsinformationen aus Webseiten extrahieren |
| `scrape-social-media` | Social Media Links finden |
| `linkedin-search-pdl` | Personen ueber People Data Labs suchen |
| `reset-subscription-credits` | Credits monatlich zuruecksetzen (Cron) |
| `get-google-maps-key` | Google Maps API Key ans Frontend liefern |
| `google-maps-proxy` | Proxy fuer Google Maps API |

---

## 6. Schema-Migration

### 6.1 Altes Schema (leadforge_old)

4 Tabellen, minimale Struktur:

```
profiles (id, email, first_name, last_name, company, plan, credits_total, credits_used)
searches (id, user_id, query, location, results_count, credits_used)
collections (id, user_id, name)
collection_leads (id, collection_id, lead_data JSONB)
```

### 6.2 Neues Schema (Projektdokumentation)

12 Tabellen, umfassende Struktur:

```
profiles (id, email, full_name, avatar_url, created_at, updated_at)
user_credits (id, user_id, total_credits, used_credits, created_at, updated_at)
subscriptions (id, user_id, plan_name, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
payments (id, user_id, product_type, plan_name, credits_amount, amount_paid, currency, status, stripe_session_id, stripe_payment_intent_id)
search_results (id, search_id, user_id, query_params JSONB, status, progress, total_expected, results JSONB, error_message)
search_collections (id, user_id, search_query, location, results_count, search_results JSONB, csv_data, filename)
crm_contacts (id, user_id, name, company, email, phone, website, address, street, city, country_code, stage, status, source, url, category_name, contact_count, last_contacted)
notifications (id, user_id, type, title, message, metadata JSONB, read)
user_roles (id, user_id, role ENUM)
feedback (id, user_id, email, message, attachment_url, status)
contact_submissions (id, name, email, subject, message, status, processed_at)
apify_progress_updates (search_id, run_id, status, processed_items, phase, dataset_id, message)
```

### 6.3 Detaillierter Vergleich

#### `profiles` - Strukturaenderung
| Alt | Neu | Aenderung |
|-----|-----|-----------|
| first_name + last_name | full_name | Zusammengefasst |
| company | - | Entfaellt (oder optional behalten) |
| plan | - | Ausgelagert in `subscriptions` |
| credits_total + credits_used | - | Ausgelagert in `user_credits` |
| - | avatar_url | Neu hinzugefuegt |
| - | updated_at | Neu hinzugefuegt |

**Auswirkung:** `profiles` wird schlanker. Plan und Credits werden in eigenen Tabellen verwaltet. Dies ermoeglicht bessere Realtime-Sync und atomare Operationen.

#### `searches` -> `search_results` - Komplette Ueberarbeitung
| Alt (searches) | Neu (search_results) |
|----------------|---------------------|
| query (TEXT) | query_params (JSONB) |
| location (TEXT) | In query_params enthalten |
| results_count (INT) | total_expected (INT) |
| credits_used (INT) | In separater Berechnung |
| - | search_id (TEXT, eindeutig) |
| - | status (processing/completed/failed) |
| - | progress (0-100) |
| - | results (JSONB) |
| - | error_message (TEXT) |

**Auswirkung:** Komplett neues Datenmodell fuer asynchrone Suchen mit Status-Tracking.

#### `collections` + `collection_leads` -> `search_collections` - Vereinfachung
| Alt | Neu |
|-----|-----|
| Zwei Tabellen (collections + collection_leads) | Eine Tabelle (search_collections) |
| lead_data JSONB pro Lead | search_results JSONB (alle Leads) |
| Manueller Name | Automatisch aus Suchbegriff + Standort |
| - | csv_data (TEXT), filename |

**Auswirkung:** Einfacheres Modell. Statt N-zu-M-Beziehung werden alle Leads einer Suche als JSONB gespeichert. Performanter fuer den Use-Case (Suche -> Sammlung).

#### Komplett neue Tabellen
| Tabelle | Zweck | Abhaengigkeiten |
|---------|-------|-----------------|
| `user_credits` | Separates Credit-Management | PROJ-10, PROJ-11 |
| `subscriptions` | Stripe-Abo-Verwaltung | PROJ-23, PROJ-24 |
| `payments` | Zahlungshistorie | PROJ-24 |
| `crm_contacts` | CRM-Kontakte | PROJ-20, PROJ-21 |
| `notifications` | Benachrichtigungen | PROJ-26 |
| `user_roles` | Admin-Rollen | PROJ-9, PROJ-27 |
| `feedback` | Nutzerfeedback | PROJ-31 |
| `contact_submissions` | Kontaktanfragen | PROJ-29 |
| `apify_progress_updates` | Scraping-Fortschritt | PROJ-15 |

### 6.4 Trigger-Aenderungen

**Alter Trigger `handle_new_user()`:**
```sql
INSERT INTO profiles (id, email, first_name, last_name, credits_total, credits_used, plan)
VALUES (NEW.id, NEW.email, first_name, last_name, 30, 0, 'free');
```

**Neuer Trigger muss:**
1. `profiles`-Eintrag erstellen (mit full_name)
2. `user_credits`-Eintrag erstellen (30 Credits, 0 used)
3. `subscriptions`-Eintrag erstellen (plan_name: 'free', status: 'active')

### 6.5 Neue RLS Policies benoetigt fuer

- `user_credits` (User liest/schreibt nur eigene)
- `subscriptions` (User liest nur eigene)
- `payments` (User liest nur eigene)
- `crm_contacts` (User CRUD nur eigene)
- `notifications` (User liest/aktualisiert nur eigene)
- `user_roles` (Nur Lesen, Admin-Function `has_role()`)
- `feedback` (User erstellt eigene, Admins lesen alle)
- `contact_submissions` (Jeder kann erstellen, Admins lesen alle)
- `apify_progress_updates` (System-intern)

### 6.6 Neue Database Functions

| Function | Zweck |
|----------|-------|
| `has_role(user_id, role)` | Prueft ob User eine bestimmte Rolle hat |
| `consume_credits(user_id, amount)` | Atomarer Credit-Abzug mit Constraint-Check |
| `reset_subscription_credits()` | Credits fuer aktive Subscriptions zuruecksetzen |

---

## 7. Technologie-Unterschiede

### 7.1 Tailwind CSS: v4 (alt) vs. v3 (aktuell)

Dies ist der **wichtigste technische Unterschied** und erfordert eine Entscheidung:

| Aspekt | Altes Repo (Tailwind v4) | Aktuelles Projekt (Tailwind v3) |
|--------|--------------------------|--------------------------------|
| CSS-Import | `@import "tailwindcss"` | `@tailwind base; @tailwind components; @tailwind utilities;` |
| Farbformat | oklch() | hsl() |
| Config | `@theme inline {}` im CSS | `tailwind.config.ts` |
| PostCSS | `@tailwindcss/postcss` | `autoprefixer` + `postcss` |
| Custom Variants | `@custom-variant dark` | `darkMode: ["class"]` in Config |
| Build | `tw-animate-css` Package | Keyframes in Config |

**Empfehlung:** Auf Tailwind v4 migrieren (wie im alten Repo), da dies der aktuelle Standard ist. Die shadcn/ui Komponenten im aktuellen Projekt muessen dann entsprechend angepasst werden, oder man generiert sie neu mit der v4-kompatiblen shadcn-CLI.

**Alternative:** Bei Tailwind v3 bleiben und die Dateien aus dem alten Repo auf v3-Syntax anpassen. Dies waere weniger Aufwand, aber technische Schulden.

### 7.2 Supabase: SSR-Client (alt) vs. Basis-Client (aktuell)

| Aspekt | Altes Repo | Aktuelles Projekt |
|--------|------------|-------------------|
| Package | `@supabase/ssr` + `@supabase/supabase-js` | Nur `@supabase/supabase-js` |
| Browser-Client | `createBrowserClient()` | `createClient()` (auskommentiert) |
| Server-Client | `createServerClient()` + Cookie-Handling | Nicht vorhanden |
| Middleware | Session-Refresh + Route-Protection | Nicht vorhanden |

**Empfehlung:** `@supabase/ssr` installieren und die Supabase-Clients aus dem alten Repo uebernehmen. Das Basis-Client-Setup im aktuellen Projekt (`src/lib/supabase.ts`) sollte durch die SSR-Variante ersetzt werden.

### 7.3 shadcn/ui: Radix-Monorepo (alt) vs. Einzelne Pakete (aktuell)

| Aspekt | Altes Repo | Aktuelles Projekt |
|--------|------------|-------------------|
| Installation | `radix-ui` (Monorepo) | Einzelne `@radix-ui/react-*` Pakete |
| Komponenten-Anzahl | 20 | 38 (mehr vorhanden) |
| Zusaetzlich | - | `form.tsx`, `checkbox.tsx`, `radio-group.tsx`, `skeleton.tsx`, `sidebar.tsx`, `toast.tsx`, `toaster.tsx` etc. |

**Empfehlung:** Die Komponenten aus dem aktuellen Projekt behalten (mehr Auswahl). Falls Tailwind v4 verwendet wird, muessen die Komponenten ggf. neu generiert werden.

### 7.4 Formular-Handling

| Aspekt | Altes Repo | Aktuelles Projekt |
|--------|------------|-------------------|
| Formulare | Natives `useState` + `FormData` | `react-hook-form` + `zod` (verfuegbar) |

**Empfehlung:** Fuer das neue Projekt `react-hook-form` + `zod` verwenden (bereits installiert). Die einfachen Formulare aus dem alten Repo koennen uebernommen werden, komplexere Formulare (CRM, Einstellungen, Admin) sollten mit react-hook-form gebaut werden.

### 7.5 Animation

| Aspekt | Altes Repo | Aktuelles Projekt |
|--------|------------|-------------------|
| Library | `motion` (Framer Motion 12.x) | Nicht installiert |
| Tailwind-Animationen | `tw-animate-css` | Keyframes in Config |

**Empfehlung:** `motion` installieren fuer Landing Page und UI-Animationen. Die Projektdokumentation erwaehnt explizit Animationen (fade-in, scale-in, slide-up, pulse-glow).

### 7.6 Routing-Unterschiede

Das alte Repo und das neue Projekt verwenden beide den Next.js App Router - kein Routing-Unterschied.

**ABER:** Die Projektdokumentation beschreibt die alte Lovable-Version mit React Router (Vite). Die Routen-Pfade unterscheiden sich:

| Lovable (React Router) | Alt (Next.js App Router) | Neu (geplant) |
|-------------------------|--------------------------|----------------|
| `/auth` | `/login` + `/registrieren` | `/login` + `/registrieren` |
| `/search` | `/dashboard` | `/dashboard` |
| `/dashboard` | `/dashboard` | `/dashboard` |
| `/crm` | `/dashboard/crm` | `/dashboard/crm` |
| `/history` | `/dashboard/verlauf` | `/dashboard/verlauf` |
| `/collection` | - | `/dashboard/sammlungen` |
| `/collection/:id` | - | `/dashboard/sammlungen/[id]` |
| `/pricing` | `/preise` | `/preise` |
| `/admin` | - | `/admin` |

---

## 8. Risiken und Empfehlungen

### 8.1 Hohes Risiko

#### R1: Tailwind v3 vs. v4 Inkompatibilitaet
**Risiko:** Dateien aus dem alten Repo (Tailwind v4) koennen nicht direkt im aktuellen Projekt (Tailwind v3) verwendet werden. CSS-Variablen-Format (oklch vs. hsl), Config-Syntax und Import-Statements sind inkompatibel.

**Empfehlung:** Entscheidung treffen: Entweder das aktuelle Projekt auf Tailwind v4 migrieren (empfohlen, da zukunftssicher) oder alle uebernommenen Dateien auf v3-Syntax anpassen. Diese Entscheidung muss VOR dem Beginn der Entwicklung fallen.

#### R2: Asynchrone vs. synchrone Suche
**Risiko:** Der alte Code basiert auf synchroner Outscraper-Suche (Request -> Response). Die neue Architektur erfordert asynchrone n8n-Integration (Request -> Webhook -> Realtime-Updates). Das ist eine fundamentale Architektur-Aenderung, die fast alle Such-bezogenen Komponenten betrifft.

**Empfehlung:** Die Outscraper-Logik als Entwicklungs-Fallback behalten, aber die n8n-Integration als primaeren Flow planen. Mock-Daten-Generator erweitern fuer die Entwicklung ohne APIs.

#### R3: Schema-Migration bei bestehenden Usern
**Risiko:** Falls das alte Projekt bereits produktive User hat, muss eine Datenmigration stattfinden (profiles mit Credits/Plan -> separate Tabellen).

**Empfehlung:** Klaeren ob Bestandsdaten migriert werden muessen. Falls ja: Migrationsskript schreiben das `profiles.plan` -> `subscriptions` und `profiles.credits_*` -> `user_credits` uebertraegt.

### 8.2 Mittleres Risiko

#### R4: Fehlende @supabase/ssr Dependency
**Risiko:** Das aktuelle Projekt hat nur `@supabase/supabase-js` ohne SSR-Support. Ohne `@supabase/ssr` funktioniert kein Server-seitiges Auth-Handling, keine Middleware, kein Cookie-basiertes Session-Management.

**Empfehlung:** `@supabase/ssr` als allerersten Schritt installieren (PROJ-1).

#### R5: Brand-Farben und Design-System-Konflikt
**Risiko:** Das alte Repo hat eigene Brand-Farben (`--color-brand`, `--color-brand-dark` etc.) die in oklch definiert sind. Die Projektdokumentation definiert ein anderes Farbschema (HSL mit Blau/Lila statt Blau/Cyan). Das aktuelle Projekt hat generische shadcn/ui-Farben.

**Empfehlung:** Design-System-Entscheidung frueh treffen. Die Farben aus der Projektdokumentation als Referenz verwenden und in PROJ-4 implementieren.

#### R6: motion/react Package nicht installiert
**Risiko:** Landing-Page-Komponenten aus dem alten Repo verwenden `motion` (Framer Motion). Dieses Package fehlt im aktuellen Projekt.

**Empfehlung:** `motion` installieren bevor Landing-Page-Komponenten uebernommen werden.

### 8.3 Niedriges Risiko

#### R7: Branding-Inkonsistenz
**Risiko:** Viele Dateien im alten Repo referenzieren "LeadForge" statt "Manyleads.io" in Texten, URLs, Email-Adressen etc.

**Empfehlung:** Globales Suchen-und-Ersetzen nach Uebernahme der Dateien. Checkliste: Seitentitel, Meta-Tags, Texte, URLs, Email-Adressen, Logo.

#### R8: Preismodell-Diskrepanz
**Risiko:** Altes Repo hat andere Preise und Credit-Mengen als die Projektdokumentation. Falls Pricing-Komponenten uebernommen werden, muessen die Werte angepasst werden.

**Empfehlung:** Pricing-Daten zentral in `src/data/pricing.ts` und `src/lib/plans.ts` verwalten. Nie hardcoded in Komponenten.

### 8.4 Empfohlene Migrationsreihenfolge

1. **Tailwind-Version-Entscheidung** treffen (v3 oder v4)
2. **Dependencies installieren:** `@supabase/ssr`, `motion`, ggf. Tailwind v4
3. **PROJ-1:** Supabase-Clients aus altem Repo uebernehmen
4. **PROJ-4:** Design-System einrichten (Brand-Farben, Animationen)
5. **PROJ-2:** Neues DB-Schema deployen (kein altes Schema uebernehmen!)
6. **PROJ-3:** Layouts und Navigation aus altem Repo uebernehmen + anpassen
7. **PROJ-5:** Auth-Seiten uebernehmen + Branding aendern
8. **PROJ-8:** UserProvider anpassen an neues Schema
9. **Weiter mit FEATURE-SPEC.md Implementierungsreihenfolge**

### 8.5 Quantitative Zusammenfassung

| Kategorie | Anzahl Dateien | Geschaetzter Anteil |
|-----------|---------------|---------------------|
| Direkt uebernehmbar (1:1) | ~15 | ~20% des Gesamtprojekts |
| Teilweise uebernehmbar | ~12 | ~15% des Gesamtprojekts |
| Komplett neu zu bauen | ~50+ | ~65% des Gesamtprojekts |

**Fazit:** Das alte Repo liefert eine solide Basis fuer die Foundation (Auth, Layout, Sidebar, Supabase-Setup) und die grundlegende UI-Struktur. Die Kernfunktionen (asynchrone Suche, CRM, Stripe, Benachrichtigungen, Admin) muessen jedoch komplett neu gebaut werden. Der groesste Nutzen liegt in der Uebernahme der erprobten Patterns (Feature-Gating, UserProvider, Middleware) statt der direkten Code-Uebernahme.

---

*Erstellt: Februar 2026*
*Basis: Analyse von leadforge_old Repository + PROJEKT-DOKUMENTATION_manyleads.md + FEATURE-SPEC.md*
