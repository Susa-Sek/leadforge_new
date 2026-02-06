# Manyleads.io - Feature Specification

## Projektueberblick

**Manyleads.io** ist eine B2B Lead-Generierungs-Plattform mit KI-gestuetzter Google Maps Integration.
Dieses Dokument definiert alle Features, aufgeteilt in priorisierte Epics mit User Stories, Acceptance Criteria und Edge Cases.

**Tech-Stack (Neu):** Next.js 16 (App Router), Supabase, Stripe, n8n, Google Maps API, Tailwind CSS, shadcn/ui

**Tech-Stack (Alt/Lovable):** React 18 + Vite, Supabase, Stripe, n8n/Apify, Google Maps API

---

## Epic-Uebersicht und Implementierungsreihenfolge

| Epic | Name | Prioritaet | Abhaengigkeiten |
|------|------|-----------|-----------------|
| E1 | Foundation & Projektsetup | KRITISCH | Keine |
| E2 | Authentifizierung & User Management | KRITISCH | E1 |
| E3 | Credit-System | KRITISCH | E2 |
| E4 | Lead-Suche (Kernfunktion) | KRITISCH | E2, E3 |
| E5 | Ergebnis-Anzeige & Filter | HOCH | E4 |
| E6 | Sammlungen & Suchverlauf | HOCH | E4 |
| E7 | CRM-System | HOCH | E6 |
| E8 | Stripe-Integration & Abonnements | HOCH | E3 |
| E9 | Export-Funktionen | MITTEL | E5 |
| E10 | Benachrichtigungssystem | MITTEL | E2 |
| E11 | Admin-Dashboard | MITTEL | E2 |
| E12 | Landing Page & Marketing-Seiten | NIEDRIG | E1 |
| E13 | Einstellungen & Profilverwaltung | NIEDRIG | E2 |
| E14 | Feedback & Kontaktformulare | NIEDRIG | E1 |

---

## E1: Foundation & Projektsetup

### PROJ-1: Supabase Client Setup & Konfiguration

**Status:** Geplant

**Beschreibung:** Einrichtung der Supabase-Clients fuer Browser und Server in Next.js 16 mit App Router. Umfasst Client-Erstellung, Middleware fuer Session-Refresh und Umgebungsvariablen.

**Migration aus altem Repo:** Das alte Repo (`leadforge_old`) hat bereits funktionierende Supabase-Clients unter `src/lib/supabase/client.ts`, `server.ts` und `middleware.ts`. Diese koennen direkt uebernommen werden, da beide Projekte Next.js 16 mit `@supabase/ssr` verwenden.

**User Stories:**
- Als Entwickler moechte ich einen konfigurierten Supabase Browser-Client, um clientseitige Datenbankabfragen durchzufuehren
- Als Entwickler moechte ich einen konfigurierten Supabase Server-Client, um serverseitige Datenbankabfragen mit Cookie-basierter Auth durchzufuehren
- Als Entwickler moechte ich eine Next.js Middleware, die Sessions automatisch refresht und geschuetzte Routen absichert

**Acceptance Criteria:**
- [ ] `src/lib/supabase/client.ts` erstellt einen Browser-Client mit `createBrowserClient`
- [ ] `src/lib/supabase/server.ts` erstellt einen Server-Client mit `createServerClient` + Cookie-Handling
- [ ] `src/lib/supabase/middleware.ts` implementiert Session-Refresh-Logik
- [ ] `src/middleware.ts` schuetzt `/dashboard/*` Routen
- [ ] Umgebungsvariablen `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` werden korrekt verwendet
- [ ] `.env.local.example` dokumentiert alle benoetigten Variablen

**Edge Cases:**
- Was passiert wenn Supabase-URL/Key fehlen? Klare Fehlermeldung beim Build
- Was passiert bei abgelaufener Session? Automatischer Refresh via Middleware
- Was passiert bei Netzwerkfehler zu Supabase? Graceful Error Handling mit Retry-Logik

---

### PROJ-2: Datenbank-Schema & RLS Policies

**Status:** Geplant

**Beschreibung:** Vollstaendiges Datenbank-Schema in Supabase mit allen Tabellen, RLS Policies, Triggern und Functions. Das Schema aus der Projektdokumentation ist deutlich umfangreicher als das aus dem alten Repo.

**Migration aus altem Repo:** Das alte Repo hat ein minimales Schema (profiles, searches, collections, collection_leads). Das neue Schema aus der Projektdokumentation ist wesentlich umfangreicher und sollte als Basis dienen. Elemente, die uebernommen werden koennen:
- `handle_new_user()` Trigger-Logik (angepasst an neues Schema)
- RLS-Policy-Muster

**User Stories:**
- Als Plattformbetreiber moechte ich ein vollstaendiges Datenbankschema, das alle Geschaeftsfaelle abdeckt
- Als Plattformbetreiber moechte ich RLS Policies, die sicherstellen dass User nur eigene Daten sehen
- Als Entwickler moechte ich automatische Profilerstellung bei Registrierung via Trigger

**Acceptance Criteria:**
- [ ] Tabelle `profiles` mit id, email, full_name, avatar_url, created_at, updated_at
- [ ] Tabelle `user_credits` mit user_id, total_credits, used_credits (separate Tabelle, nicht in profiles!)
- [ ] Tabelle `subscriptions` mit plan_name, status, stripe_customer_id, stripe_subscription_id, period_start/end
- [ ] Tabelle `payments` mit product_type, plan_name, credits_amount, amount_paid, currency, status, stripe_session_id
- [ ] Tabelle `search_results` mit search_id, query_params (JSONB), status, progress, results (JSONB)
- [ ] Tabelle `search_collections` mit search_query, location, results_count, search_results (JSONB), csv_data
- [ ] Tabelle `crm_contacts` mit allen Feldern (name, company, email, phone, website, address, stage, status, source, url, category_name)
- [ ] Tabelle `notifications` mit type, title, message, metadata (JSONB), read
- [ ] Tabelle `user_roles` mit role ENUM (admin/moderator/user)
- [ ] Tabelle `feedback` mit message, attachment_url, status
- [ ] Tabelle `contact_submissions` mit name, email, subject, message, status
- [ ] RLS auf ALLEN Tabellen aktiviert
- [ ] User koennen nur eigene Daten lesen/schreiben
- [ ] Admin-Rolle via `has_role()` Function pruefbar
- [ ] Trigger `handle_new_user()` erstellt Profil + initiale Credits bei Registrierung

**Edge Cases:**
- Was passiert bei gleichzeitigem Credit-Update von Webhook und User? Atomare Operationen verwenden
- Was passiert wenn Trigger fehlschlaegt? User kann sich nicht einloggen - Fehlerbehandlung noetig
- Was passiert bei Loeschung eines Users? CASCADE auf alle abhaengigen Tabellen

---

### PROJ-3: App-Layout & Navigation

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-1 (Supabase Client) fuer Auth-Status-Pruefung

**Beschreibung:** Root-Layout, Dashboard-Layout mit Sidebar, Theme-Provider, Toast-Benachrichtigungen und responsive Navigation.

**Migration aus altem Repo:** Das alte Repo hat bereits ein vollstaendiges Layout-System:
- `src/app/layout.tsx` (Root-Layout mit Fonts, ThemeProvider)
- `src/app/dashboard/layout.tsx` (Dashboard-Layout mit Sidebar + UserProvider)
- `src/components/dashboard/sidebar.tsx` (Sidebar mit Navigation)
- `src/components/dashboard/mobile-sidebar.tsx` (Mobile Sheet-Sidebar)
- `src/components/layout/` (Navbar, Footer, Logo, ThemeToggle)
Diese koennen grossteils uebernommen werden, muessen aber an das erweiterte Routing angepasst werden.

**User Stories:**
- Als User moechte ich eine konsistente Navigation in der gesamten App
- Als User moechte ich zwischen Hell- und Dunkelmodus wechseln koennen
- Als User moechte ich auf Mobilgeraeten eine bedienbare Navigation haben
- Als User moechte ich meinen Credit-Stand in der Sidebar sehen

**Acceptance Criteria:**
- [ ] Root-Layout mit Font-Loading (Inter), ThemeProvider, Toaster
- [ ] Dashboard-Layout mit kollabierbarer Sidebar (links) und Content-Bereich (rechts)
- [ ] Sidebar zeigt: Navigation (Suche, Dashboard, CRM, Verlauf, Sammlungen), Credit-Anzeige, User-Info
- [ ] Mobile: Hamburger-Menu oeffnet Sheet-Sidebar
- [ ] Topbar fuer Mobile mit Logo und Hamburger-Button
- [ ] Theme-Toggle (Hell/Dunkel) in Sidebar oder Topbar
- [ ] Toast-System (sonner) fuer globale Benachrichtigungen
- [ ] Active-Link-Highlighting in der Sidebar

**Edge Cases:**
- Was passiert bei sehr langem Benutzernamen? Truncation mit Tooltip
- Was passiert bei 0 Credits? Visueller Hinweis (rot) + Link zu Pricing
- Was passiert bei Fenstergroessen-Aenderung? Responsive Breakpoints (md: 768px)

---

### PROJ-4: Design System & CSS Variablen

**Status:** Geplant

**Beschreibung:** Einrichtung des vollstaendigen Design Systems mit CSS-Variablen, Gradienten, Animationen und shadcn/ui Theme-Konfiguration.

**Migration aus altem Repo:** Das alte Repo hat in `src/app/globals.css` Brand-Farben definiert. Die Projektdokumentation beschreibt ein erweitertes Design System mit Gradienten, Glasmorphismus und Animationen, das als Referenz dient. Das aktuelle Projekt hat bereits shadcn/ui Komponenten installiert.

**User Stories:**
- Als Entwickler moechte ich ein einheitliches Design System mit CSS-Variablen
- Als Designer moechte ich konsistente Farben, Schatten und Animationen
- Als User moechte ich ein modernes, professionelles UI-Erscheinungsbild

**Acceptance Criteria:**
- [ ] CSS-Variablen fuer Hellen und Dunklen Modus (Background, Foreground, Primary, Accent etc.)
- [ ] Primary-Farbe: Blau (HSL 217 91% 60%)
- [ ] Accent-Farbe: Lila/Violett (HSL 270 95% 75%)
- [ ] Gradient-Variablen (gradient-primary, gradient-secondary, gradient-accent)
- [ ] Schatten-Variablen (shadow-soft, shadow-medium, shadow-large, shadow-glow)
- [ ] Animationen: fade-in, scale-in, slide-up, pulse-glow
- [ ] Utility-Klassen: `.glass-card`, `.gradient-text`, `.hover-lift`
- [ ] Alle shadcn/ui Komponenten verwenden die CSS-Variablen

**Edge Cases:**
- Was passiert bei hohem Kontrast-Modus? Barrierefreiheit sicherstellen
- Was passiert bei `prefers-reduced-motion`? Animationen deaktivieren

---

## E2: Authentifizierung & User Management

### PROJ-5: Email/Passwort Registrierung & Login

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-1 (Supabase Client), PROJ-2 (DB-Schema mit profiles)

**Beschreibung:** Registrierung und Login mit Email/Passwort ueber Supabase Auth.

**Migration aus altem Repo:** Das alte Repo hat vollstaendige Auth-Seiten:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/registrieren/page.tsx`
- `src/app/(auth)/layout.tsx`
Diese koennen direkt uebernommen werden. Die Logik ist identisch.

**User Stories:**
- Als neuer User moechte ich mich mit Email und Passwort registrieren koennen
- Als registrierter User moechte ich mich einloggen koennen
- Als User moechte ich nach dem Login zum Dashboard weitergeleitet werden
- Als User moechte ich klare Fehlermeldungen bei falschen Eingaben sehen

**Acceptance Criteria:**
- [ ] Registrierungsseite unter `/registrieren` mit Formular (Vorname, Nachname, Email, Passwort)
- [ ] Login-Seite unter `/login` mit Formular (Email, Passwort)
- [ ] Auth-Layout (zentriert, Card-basiert)
- [ ] Erfolgreicher Login leitet zu `/dashboard` weiter
- [ ] Erfolgreiche Registrierung zeigt Email-Bestaetigungs-Hinweis (je nach Supabase-Konfiguration)
- [ ] Fehlermeldungen: "Email bereits registriert", "Falsches Passwort", "Email nicht gefunden"
- [ ] Passwort-Validierung: Mindestens 8 Zeichen
- [ ] Trigger erstellt automatisch `profiles`-Eintrag mit 30 Free Credits

**Edge Cases:**
- Was passiert bei doppelter Email-Registrierung? Fehlermeldung "Email bereits verwendet"
- Was passiert bei zu kurzem Passwort? Inline-Validierung vor Absenden
- Was passiert wenn Email-Bestaetigung aktiviert ist? Hinweis "Bitte pruefen Sie Ihren Posteingang"
- Was passiert bei SQL-Injection-Versuchen? Supabase Auth handhabt dies intern

---

### PROJ-6: Google OAuth Login

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-5 (Auth-Seiten existieren)

**Beschreibung:** Social Login mit Google OAuth ueber Supabase Auth.

**Migration aus altem Repo:** Nicht im alten Repo implementiert. Die Projektdokumentation (Lovable-Version) hatte Google OAuth via Lovable Cloud. Muss fuer Supabase Auth neu konfiguriert werden.

**User Stories:**
- Als User moechte ich mich mit einem Klick ueber mein Google-Konto anmelden koennen
- Als User moechte ich bei erstem Google-Login automatisch ein Profil erhalten

**Acceptance Criteria:**
- [ ] "Mit Google anmelden" Button auf Login- und Registrierungsseite
- [ ] Google OAuth Flow ueber Supabase Auth konfiguriert
- [ ] Auth Callback Route unter `/auth/callback` verarbeitet OAuth-Redirect
- [ ] Bei erstem Login wird automatisch Profil erstellt (Name aus Google-Profil)
- [ ] Bei wiederholtem Login wird bestehendes Profil verwendet
- [ ] Visuell abgetrennt vom Email-Formular ("oder" Separator)

**Edge Cases:**
- Was passiert wenn Google OAuth fehlschlaegt? Fehlermeldung + Fallback auf Email-Login
- Was passiert wenn User mit gleicher Email bereits per Email registriert ist? Supabase merged Accounts (konfigurierbar)
- Was passiert bei blockierten Popups? Redirect-basierter Flow statt Popup

---

### PROJ-7: Passwort-Reset Flow

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-5 (Email/Passwort Auth)

**Beschreibung:** "Passwort vergessen" Funktionalitaet mit Email-Link und Reset-Seite.

**Migration aus altem Repo:** Nicht im alten Repo implementiert. Die Projektdokumentation beschreibt den Flow mit `ForgotPasswordDialog` und `ResetPassword.tsx`. Muss neu gebaut werden.

**User Stories:**
- Als User moechte ich mein Passwort zuruecksetzen koennen wenn ich es vergessen habe
- Als User moechte ich per Email einen Link zum Zuruecksetzen erhalten
- Als User moechte ich auf einer dedizierten Seite mein neues Passwort eingeben koennen

**Acceptance Criteria:**
- [ ] "Passwort vergessen?" Link auf der Login-Seite
- [ ] Dialog oder Seite zur Email-Eingabe
- [ ] Supabase `resetPasswordForEmail()` sendet Reset-Email
- [ ] Reset-Seite unter `/auth/reset-password` mit neuem-Passwort-Formular
- [ ] Nach erfolgreichem Reset: Weiterleitung zum Login mit Erfolgsmeldung
- [ ] Email-Vorlage in Supabase angepasst (deutsch)

**Edge Cases:**
- Was passiert bei nicht-existierender Email? Keine Fehlermeldung (Sicherheit - verhindert Email-Enumeration)
- Was passiert bei abgelaufenem Reset-Link? Fehlermeldung "Link abgelaufen, bitte erneut anfordern"
- Was passiert bei mehrfachem Anfordern? Nur der neueste Link ist gueltig

---

### PROJ-8: User-Provider & Auth-Context

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-5 (Auth), PROJ-2 (profiles-Tabelle)

**Beschreibung:** React Context Provider der User-Profildaten, Plan-Konfiguration und Credits global bereitstellt.

**Migration aus altem Repo:** `src/components/providers/user-provider.tsx` kann grossteils uebernommen werden. Muss erweitert werden um:
- Separate `user_credits`-Tabelle (statt Credits in `profiles`)
- Separate `subscriptions`-Tabelle (statt `plan` in `profiles`)
- Realtime-Subscription fuer Credit-Updates

**User Stories:**
- Als Entwickler moechte ich ueberall in der App auf User-Daten zugreifen koennen via `useUser()` Hook
- Als Entwickler moechte ich die Plan-Konfiguration zentral abfragen koennen
- Als User moechte ich dass mein Credit-Stand in Echtzeit aktualisiert wird

**Acceptance Criteria:**
- [ ] `UserProvider` laedt Profil, Subscription und Credits nach Auth-State-Change
- [ ] `useUser()` Hook liefert: user, planConfig, creditsRemaining, loading, refresh, logout
- [ ] Plan-Konfiguration definiert Feature-Flags: showEmail, showContactName, showSocial, hasCRM, hasAPI, hasCSVExport, hasAdvancedFilters
- [ ] Realtime-Subscription auf `user_credits`-Tabelle fuer Live-Updates
- [ ] Auth-State-Listener reagiert auf Login/Logout/Token-Refresh
- [ ] Logout-Funktion: SignOut + Redirect zu `/login`

**Edge Cases:**
- Was passiert wenn Profil-Fetch fehlschlaegt? Loading-State + Retry-Button
- Was passiert bei Race-Condition zwischen Auth-State-Change und Profil-Fetch? Sequenzielles Loading
- Was passiert wenn Subscription abgelaufen ist aber Status nicht aktualisiert? Fallback auf Free-Plan

---

### PROJ-9: Route-Protection (Protected & Admin Routes)

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-8 (User-Provider), PROJ-2 (user_roles-Tabelle)

**Beschreibung:** Schutz von Dashboard-Routen und Admin-Routen vor unautorisiertem Zugriff.

**Migration aus altem Repo:** Middleware (`src/middleware.ts`) kann direkt uebernommen werden. Admin-Route-Protection muss neu gebaut werden (war nicht im alten Repo).

**User Stories:**
- Als nicht-eingeloggter User moechte ich zu `/login` weitergeleitet werden wenn ich eine geschuetzte Seite aufrufe
- Als normaler User moechte ich keinen Zugriff auf das Admin-Dashboard haben
- Als Admin moechte ich zusaetzlich auf `/admin` zugreifen koennen

**Acceptance Criteria:**
- [ ] Next.js Middleware prueft Session auf `/dashboard/*` Routen
- [ ] Nicht-eingeloggte User werden zu `/login` weitergeleitet
- [ ] Bereits eingeloggte User auf `/login` werden zu `/dashboard` weitergeleitet
- [ ] Admin-Route prueft `user_roles`-Tabelle via `has_role(auth.uid(), 'admin')`
- [ ] Nicht-Admins auf `/admin` werden zu `/dashboard` weitergeleitet
- [ ] Loading-Spinner waehrend Auth-Check

**Edge Cases:**
- Was passiert bei abgelaufener Session waehrend Nutzung? Middleware refresht Token automatisch
- Was passiert bei geloeschtem Admin-Role-Eintrag? Sofortiger Zugriffsverlust
- Was passiert bei direktem URL-Zugriff auf geschuetzte Seite? Redirect nach Login zurueck zur gewuenschten Seite

---

## E3: Credit-System

### PROJ-10: Credit-Anzeige & -Verwaltung

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-2 (user_credits-Tabelle), PROJ-8 (User-Provider)

**Beschreibung:** Anzeige der verfuegbaren Credits, Credit-Verbrauch bei Suchen und Realtime-Synchronisation.

**Migration aus altem Repo:** Das alte Repo hatte Credits direkt in der `profiles`-Tabelle. Die Projektdokumentation trennt Credits in eigene Tabelle `user_credits` mit Realtime-Sync. Die Logik aus `useCredits.ts` (Lovable-Version) sollte als Referenz dienen, muss aber fuer Next.js angepasst werden.

**User Stories:**
- Als User moechte ich jederzeit sehen wie viele Credits ich noch habe
- Als User moechte ich bei einer Suche sehen wie viele Credits verbraucht werden
- Als User moechte ich in Echtzeit sehen wenn Credits abgezogen werden
- Als User moechte ich gewarnt werden wenn meine Credits niedrig sind

**Acceptance Criteria:**
- [ ] Credit-Anzeige in der Sidebar (verbleibend / gesamt)
- [ ] Fortschrittsbalken fuer Credit-Verbrauch (gruen > gelb > rot)
- [ ] Warnung bei < 10% Credits verbleibend
- [ ] Credit-Uebersichtsseite unter `/dashboard/credits`
- [ ] Realtime-Sync: Credits aktualisieren sich live nach Suche
- [ ] Credit-Verbrauch: 1 Credit pro Lead (Standard-Suche)
- [ ] Credit-Verbrauch: 1 Credit + 0,5 Credit pro Entscheider (Entscheider-Suche)
- [ ] Credit-Check VOR Start einer Suche

**Edge Cases:**
- Was passiert bei 0 Credits und Suchversuch? Fehlermeldung + Link zu Pricing/Credit-Paketen
- Was passiert bei gleichzeitigem Credit-Update (User + Webhook)? Atomare DB-Operationen
- Was passiert bei negativen Credits durch Race-Condition? DB-Constraint: credits >= 0
- Was passiert bei Free-Plan mit aufgebrauchten 30 Credits? Hinweis auf Upgrade

---

### PROJ-11: Credit-Reset bei Abrechnungsperiode

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-10 (Credit-System), PROJ-2 (subscriptions-Tabelle)

**Beschreibung:** Automatisches Zuruecksetzen der Credits zum Beginn einer neuen Abrechnungsperiode via Cron-Job.

**Migration aus altem Repo:** Nicht im alten Repo implementiert. Die Projektdokumentation beschreibt eine Edge Function `reset-subscription-credits` mit pg_cron. Muss neu gebaut werden.

**User Stories:**
- Als zahlender User moechte ich monatlich meine Credits automatisch aufgeladen bekommen
- Als User moechte ich benachrichtigt werden wenn meine Credits erneuert wurden

**Acceptance Criteria:**
- [ ] pg_cron Job laeuft taeglich um 00:05 Uhr
- [ ] Prueft alle aktiven Subscriptions ob `current_period_start` erreicht ist
- [ ] Setzt `used_credits` auf 0 und `total_credits` auf Plan-Kontingent
- [ ] Erstellt Benachrichtigung "Credits erneuert"
- [ ] Starter: 150, Pro: 500, Enterprise: 1.500 Credits
- [ ] Free-Plan wird NICHT zurueckgesetzt (einmalig 30)

**Edge Cases:**
- Was passiert wenn Cron-Job fehlschlaegt? Retry-Mechanismus + Alerting
- Was passiert bei Planwechsel mitten im Monat? Sofortige Anpassung der Credits
- Was passiert bei gekunedigtem Abo? Keine Erneuerung, Credits laufen aus

---

## E4: Lead-Suche (Kernfunktion)

### PROJ-12: Such-Formular & Parameter

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-3 (Dashboard-Layout), PROJ-10 (Credit-Check)

**Beschreibung:** Suchformular fuer die Lead-Suche mit Branche, Standort und Optionen.

**Migration aus altem Repo:** Das alte Repo hat ein Suchformular im Dashboard (`src/app/dashboard/page.tsx`). Die Suchparameter (query, location, limit) sind identisch. Muss erweitert werden um: Entscheider-Toggle, Ergebnisanzahl-Slider (1-500).

**User Stories:**
- Als User moechte ich eine Branche/Suchbegriff eingeben koennen (z.B. "Restaurant", "Friseur")
- Als User moechte ich einen Standort angeben koennen (Stadt, PLZ oder Region)
- Als User moechte ich die maximale Ergebnisanzahl festlegen koennen (1-500)
- Als User moechte ich optional nach Entscheidern suchen koennen (Premium)

**Acceptance Criteria:**
- [ ] Suchseite unter `/dashboard` (Hauptseite des Dashboards)
- [ ] Input-Feld fuer Suchbegriff/Branche (Pflichtfeld)
- [ ] Input-Feld fuer Standort (optional, aber empfohlen)
- [ ] Slider oder Number-Input fuer Max. Ergebnisse (1-500, Default: 50)
- [ ] Toggle "Mit Entscheidern suchen" (nur fuer Starter+, sonst Upsell-Badge)
- [ ] Plan-Limit wird durchgesetzt: Free max 50, Starter max 200, Pro/Enterprise max 500
- [ ] Effektives Limit = min(user_limit, plan_max, credits_remaining)
- [ ] Credit-Kosten-Vorschau vor Start der Suche
- [ ] "Suche starten" Button (deaktiviert bei fehlenden Pflichtfeldern oder 0 Credits)

**Edge Cases:**
- Was passiert bei leerem Suchbegriff? Button deaktiviert + Hinweis
- Was passiert wenn User mehr Ergebnisse will als Credits hat? Limitierung auf verfuegbare Credits + Hinweis
- Was passiert bei Sonderzeichen im Suchbegriff? Input-Sanitization
- Was passiert bei bereits laufender Suche? Neue Suche blockieren oder alte abbrechen

---

### PROJ-13: n8n-Integration & Scraping-Workflow

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-12 (Such-Formular), PROJ-2 (search_results-Tabelle)

**Beschreibung:** Backend-Integration mit n8n fuer das eigentliche Lead-Scraping ueber Google Maps.

**Migration aus altem Repo:** Das alte Repo verwendet Outscraper API direkt (`/api/leads/route.ts`). Die Projektdokumentation beschreibt einen n8n-basierten Workflow mit Edge Functions. Die Outscraper-Logik kann als Fallback dienen, aber der primaere Flow geht ueber n8n. Folgende Architektur-Aenderung:
- Alt: Next.js API Route -> Outscraper API (synchron)
- Neu: Next.js -> Supabase Edge Function `n8n-proxy` -> n8n Workflow -> Webhook zurueck

**User Stories:**
- Als User moechte ich dass meine Suche zuverlaessig Ergebnisse liefert
- Als User moechte ich den Fortschritt meiner Suche in Echtzeit sehen
- Als Plattformbetreiber moechte ich einen skalierbaren Scraping-Workflow

**Acceptance Criteria:**
- [ ] API Route oder Edge Function `n8n-proxy` leitet Suchanfrage an n8n weiter
- [ ] n8n-Webhook-URL ist als Environment Variable konfiguriert
- [ ] Suchparameter werden als JSON an n8n gesendet: query, location, limit, search_id, user_id
- [ ] `search_results`-Eintrag wird mit Status "processing" erstellt
- [ ] Edge Function `n8n-results-webhook` empfaengt Ergebnisse von n8n
- [ ] Webhook speichert Ergebnisse in `search_results` (Status: "completed")
- [ ] Webhook berechnet und zieht Credits ab
- [ ] Webhook erstellt automatisch eine Sammlung in `search_collections`
- [ ] Webhook erstellt Benachrichtigung "Suche abgeschlossen"
- [ ] Bei Fehler: Status auf "failed" + error_message

**Edge Cases:**
- Was passiert wenn n8n nicht erreichbar ist? Timeout nach 30s + Fehlermeldung
- Was passiert wenn n8n-Webhook keine Ergebnisse zurueckgibt? Status "completed" mit 0 Ergebnissen + Hinweis
- Was passiert bei Timeout des Scraping-Prozesses? Polling alle 5s, Timeout nach 5 Minuten
- Was passiert bei doppeltem Webhook-Aufruf? Idempotenz via search_id Check

---

### PROJ-14: Such-Fortschrittsanzeige

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-13 (n8n-Integration)

**Beschreibung:** Echtzeit-Fortschrittsanzeige waehrend einer laufenden Suche mit Schritt-fuer-Schritt-Visualisierung.

**Migration aus altem Repo:** Nicht im alten Repo (dort war die Suche synchron). Die Projektdokumentation beschreibt ein Step-basiertes System mit 6 Schritten und Realtime-Updates. Muss komplett neu gebaut werden.

**User Stories:**
- Als User moechte ich sehen in welchem Schritt sich meine Suche befindet
- Als User moechte ich einen globalen Banner sehen wenn eine Suche laeuft (auch auf anderen Seiten)
- Als User moechte ich nach Browser-Schliessung die laufende Suche wiederfinden

**Acceptance Criteria:**
- [ ] 6 Such-Schritte mit Status-Anzeige: Validieren, Verbinden, Suchen, Extrahieren, Anreichern, Speichern
- [ ] Jeder Schritt zeigt: Pending (grau), Active (blau, animiert), Done (gruen, Haekchen), Error (rot)
- [ ] Realtime-Updates via Supabase Channel auf `search_results`-Tabelle
- [ ] Fortschrittsbalken (0-100%) basierend auf `progress`-Feld
- [ ] `ActiveSearchBanner` zeigt laufende Suche auf allen Dashboard-Seiten
- [ ] Such-Status wird in localStorage persistiert fuer Recovery
- [ ] Abbrechen-Button (optional, abhaengig von n8n-Capability)

**Edge Cases:**
- Was passiert bei Verbindungsabbruch waehrend der Suche? Reconnect + Status-Recovery
- Was passiert wenn Browser geschlossen und wieder geoeffnet wird? Laufende Suche wird erkannt und fortgesetzt
- Was passiert wenn Suche laenger als 5 Minuten dauert? Timeout-Handling + Fehlermeldung

---

### PROJ-15: Outscraper-Fallback / Alternative Scraping-APIs

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-13 (n8n-Integration)

**Beschreibung:** Fallback auf Outscraper API oder Apify falls n8n nicht verfuegbar ist. Inkl. Mock-Daten fuer Entwicklung.

**Migration aus altem Repo:** Die Outscraper-Integration aus `/api/leads/route.ts` kann als Fallback uebernommen werden. Die Mock-Daten-Generierung (`generateMockLeads()`) ist nuetzlich fuer die Entwicklung.

**User Stories:**
- Als Plattformbetreiber moechte ich einen Fallback wenn der primaere Scraping-Dienst ausfaellt
- Als Entwickler moechte ich mit Mock-Daten arbeiten koennen ohne API-Key

**Acceptance Criteria:**
- [ ] Outscraper API als Fallback konfigurierbar
- [ ] Apify als Alternative konfigurierbar (mit Edge Function `apify-google-maps`)
- [ ] Mock-Daten-Generator fuer Entwicklung (ohne API-Key)
- [ ] Automatischer Fallback: n8n -> Outscraper -> Mock-Daten
- [ ] Konfigurierbar via Environment Variables

**Edge Cases:**
- Was passiert wenn alle APIs ausfallen? Fehlermeldung "Service voruebergehend nicht verfuegbar"
- Was passiert bei Rate-Limiting von Outscraper? 429-Error abfangen + Wartezeit

---

## E5: Ergebnis-Anzeige & Filter

### PROJ-16: Lead-Ergebnis-Tabelle

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-13 (Suche liefert Ergebnisse)

**Beschreibung:** Tabellarische Anzeige der Suchergebnisse mit plan-basiertem Feature-Gating.

**Migration aus altem Repo:** `lead-results-table.tsx` aus dem alten Repo kann als Basis dienen. Muss erweitert werden um:
- Mehr Spalten (Social Media, Entscheider, etc.)
- Partial-Blur fuer Starter-Plan
- Spalten-Konfiguration (sichtbare Spalten waehlen)

**User Stories:**
- Als User moechte ich meine Suchergebnisse in einer uebersichtlichen Tabelle sehen
- Als Free-User moechte ich sehen welche Daten mir mit einem Upgrade zur Verfuegung stehen
- Als Pro-User moechte ich alle Daten ohne Einschraenkungen sehen
- Als User moechte ich die angezeigten Spalten anpassen koennen

**Acceptance Criteria:**
- [ ] Tabelle mit Spalten: Name, Adresse, Telefon, Email, Website, Bewertung, Bewertungsanzahl
- [ ] Zusaetzliche Spalten (premium): Entscheider, Instagram, Facebook, LinkedIn, YouTube, Twitter
- [ ] Feature-Gating basierend auf Plan:
  - Free: Nur Name, Adresse, Telefon, Bewertung
  - Starter: + Social Media (teilweise geblurrt), + Entscheider (teilweise geblurrt)
  - Pro/Enterprise: Alles sichtbar
- [ ] Geblurrte Felder zeigen "Pro"-Badge oder Lock-Icon mit Upgrade-Link
- [ ] Selektierbare Zeilen (Checkbox) fuer Bulk-Aktionen
- [ ] Sortierbar nach allen Spalten
- [ ] Responsive: Horizontaler Scroll auf kleinen Bildschirmen
- [ ] Spalten-Konfiguration: User kann Spalten ein-/ausblenden

**Edge Cases:**
- Was passiert bei 500 Ergebnissen? Pagination oder Virtual Scrolling
- Was passiert bei fehlenden Daten (kein Telefon, keine Website)? "-" oder "Nicht verfuegbar" anzeigen
- Was passiert bei sehr langen Firmennamen? Truncation mit Tooltip

---

### PROJ-17: Smart-Filter-System

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-16 (Ergebnis-Tabelle)

**Beschreibung:** Erweitertes Filter-System mit Ja/Nein/Egal-Logik fuer Social Media, Kontaktdaten und Qualitaet.

**Migration aus altem Repo:** Nicht im alten Repo. Die Projektdokumentation beschreibt ein umfangreiches Filter-System mit `SmartFiltersDialog` und `QuickFiltersDialog`. Muss komplett neu gebaut werden. Nur fuer Pro+ User verfuegbar.

**User Stories:**
- Als Pro-User moechte ich meine Suchergebnisse nach Social-Media-Praesenz filtern koennen
- Als Pro-User moechte ich nach Bewertung und Bewertungsanzahl filtern koennen
- Als Starter-User moechte ich sehen dass erweiterte Filter verfuegbar sind (Upsell)

**Acceptance Criteria:**
- [ ] Quick-Filter: Website vorhanden, Email vorhanden, Telefon vorhanden (fuer alle User)
- [ ] Smart-Filter (Pro+): Ja/Nein/Egal fuer: Instagram, Facebook, LinkedIn, YouTube, TikTok, Twitter
- [ ] Smart-Filter (Pro+): Bewertungs-Range (min/max Sterne), Bewertungsanzahl-Range
- [ ] Smart-Filter (Pro+): Geschaeftsstatus (geoeffnet, betriebsbereit)
- [ ] Filter werden client-seitig auf geladene Ergebnisse angewandt
- [ ] Aktive Filter werden visuell angezeigt (Badge-Count)
- [ ] Filter zuruecksetzen Button
- [ ] Starter/Free User sehen Smart-Filter als locked mit Upgrade-Hinweis

**Edge Cases:**
- Was passiert wenn alle Ergebnisse weggefiltert werden? "Keine Ergebnisse mit diesen Filtern" + Hinweis Filter zu lockern
- Was passiert bei widersprüchlichen Filtern? Alle Filter werden UND-verknuepft

---

## E6: Sammlungen & Suchverlauf

### PROJ-18: Sammlungen (Suchergebnisse speichern)

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-13 (Suche), PROJ-2 (search_collections-Tabelle)

**Beschreibung:** Automatisches und manuelles Speichern von Suchergebnissen in Sammlungen.

**Migration aus altem Repo:** Das alte Repo hat `collections` und `collection_leads`-Tabellen. Die Projektdokumentation verwendet eine andere Struktur (`search_collections` mit JSONB). Das neue Schema sollte verwendet werden, da es die Ergebnisse als JSONB speichert (performanter fuer den Use-Case).

**User Stories:**
- Als User moechte ich dass meine Suchergebnisse automatisch als Sammlung gespeichert werden
- Als User moechte ich meine Sammlungen einsehen und oeffnen koennen
- Als User moechte ich eine Sammlung loeschen koennen

**Acceptance Criteria:**
- [ ] Sammlungen-Seite unter `/dashboard/sammlungen` (oder `/collection`)
- [ ] Liste aller Sammlungen mit: Name (Suchbegriff + Standort), Datum, Ergebnisanzahl
- [ ] Klick auf Sammlung oeffnet Detail-Ansicht mit allen gespeicherten Leads
- [ ] Automatische Sammlung bei jeder abgeschlossenen Suche
- [ ] Loeschen einzelner Sammlungen (mit Bestaetigungsdialog)
- [ ] Suche innerhalb der Sammlungen (nach Name/Standort)

**Edge Cases:**
- Was passiert bei 100+ Sammlungen? Pagination (10-20 pro Seite)
- Was passiert wenn User eine Sammlung oeffnet deren Daten veraltet sind? Daten bleiben wie zum Zeitpunkt der Suche
- Was passiert bei Loeschung? Bestaetigung erforderlich, keine Wiederherstellung

---

### PROJ-19: Suchverlauf

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-13 (Suche speichert History)

**Beschreibung:** Chronologischer Verlauf aller durchgefuehrten Suchen.

**Migration aus altem Repo:** `src/app/dashboard/verlauf/page.tsx` existiert im alten Repo. Kann uebernommen und um die erweiterten Suchparameter ergaenzt werden.

**User Stories:**
- Als User moechte ich sehen welche Suchen ich in der Vergangenheit durchgefuehrt habe
- Als User moechte ich sehen wie viele Credits jede Suche verbraucht hat
- Als User moechte ich eine alte Suche erneut ausfuehren koennen

**Acceptance Criteria:**
- [ ] Verlaufsseite unter `/dashboard/verlauf`
- [ ] Liste mit: Suchbegriff, Standort, Ergebnisanzahl, Credits verbraucht, Datum/Uhrzeit, Status
- [ ] Sortierung: Neueste zuerst
- [ ] "Erneut suchen" Button bei jeder Suche
- [ ] Link zur zugehoerigen Sammlung (wenn vorhanden)
- [ ] Pagination bei vielen Eintraegen

**Edge Cases:**
- Was passiert bei fehlgeschlagenen Suchen im Verlauf? Status "Fehlgeschlagen" mit Fehlermeldung
- Was passiert bei Suchen die noch laufen? Status "Wird verarbeitet..." mit Fortschritt

---

## E7: CRM-System

### PROJ-20: CRM-Kontaktliste

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-18 (Sammlungen, um Leads zu importieren), PROJ-2 (crm_contacts-Tabelle)

**Beschreibung:** CRM-System zur Verwaltung von importierten Leads mit Status-Tracking und Pipeline.

**Migration aus altem Repo:** Das alte Repo hat `src/app/dashboard/crm/page.tsx` mit Plan-Gating (Lock-Screen fuer Free-Plan). Die Logik ist minimal. Die Projektdokumentation beschreibt ein deutlich umfangreicheres CRM. Muss grossteils neu gebaut werden.

**User Stories:**
- Als User moechte ich Leads aus meinen Suchergebnissen ins CRM importieren koennen
- Als User moechte ich alle meine CRM-Kontakte in einer Tabelle sehen
- Als User moechte ich Kontakte nach Status und Stage filtern koennen
- Als User moechte ich den Status eines Kontakts aendern koennen

**Acceptance Criteria:**
- [ ] CRM-Seite unter `/dashboard/crm` (nur Starter+ User, Free sieht Lock-Screen)
- [ ] Import-Funktion: Leads aus Suchergebnissen/Sammlungen ins CRM
- [ ] Duplikats-Check via Google Maps URL-Hash bei Import
- [ ] Kontakt-Tabelle mit allen Feldern: Name, Firma, Email, Telefon, Website, Status, Stage
- [ ] Status-Dropdown: nicht_angegangen, kontaktiert, interessiert, nicht_interessiert
- [ ] Stage-Pipeline: Lead -> Qualifiziert -> Opportunity -> Kunde
- [ ] Filter nach: Status, Stage, Hat Website, Hat Email, Hat Telefon
- [ ] Suche nach Name/Firma
- [ ] Bulk-Aktionen: Mehrere Kontakte auswaehlen + loeschen
- [ ] Kontakt-Detail-Dialog zum Bearbeiten

**Edge Cases:**
- Was passiert bei Import von bereits existierenden Kontakten? Duplikat-Warnung, kein doppelter Import
- Was passiert bei 1000+ Kontakten? Pagination + Server-Side-Filtering
- Was passiert wenn User von Starter auf Free downgraded? CRM-Zugriff gesperrt, Daten bleiben erhalten

---

### PROJ-21: CRM-Kontakt bearbeiten

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-20 (CRM-Kontaktliste)

**Beschreibung:** Bearbeitungsdialog fuer einzelne CRM-Kontakte mit allen Feldern.

**User Stories:**
- Als User moechte ich Kontaktdaten manuell korrigieren koennen
- Als User moechte ich Notizen zu einem Kontakt hinzufuegen koennen
- Als User moechte ich den letzten Kontaktversuch dokumentieren koennen

**Acceptance Criteria:**
- [ ] Edit-Dialog oeffnet sich bei Klick auf Kontakt-Zeile
- [ ] Bearbeitbare Felder: Name, Firma, Email, Telefon, Website, Adresse, Status, Stage
- [ ] Feld "Letzter Kontakt" (Datum)
- [ ] Feld "Kontaktversuche" (Zaehler, auto-increment bei Status-Aenderung)
- [ ] Speichern-Button aktualisiert Daten in `crm_contacts`
- [ ] Aenderungen sofort in Tabelle sichtbar

**Edge Cases:**
- Was passiert bei gleichzeitiger Bearbeitung? Optimistic-Update + Conflict-Resolution
- Was passiert bei ungueltigem Email-Format? Inline-Validierung

---

## E8: Stripe-Integration & Abonnements

### PROJ-22: Preisseite & Plan-Auswahl

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-3 (Layout)

**Beschreibung:** Oeffentliche und eingeloggte Preisseite mit allen Plaenen und Credit-Paketen.

**Migration aus altem Repo:** `src/app/(marketing)/preise/page.tsx` und `src/app/dashboard/preise/page.tsx` existieren im alten Repo. Koennen als UI-Basis uebernommen werden. Die Preise muessen an die Projektdokumentation angepasst werden (unterschiedliche Preise!).

**Achtung: Preisunterschiede zwischen altem Repo und Projektdokumentation:**
- Alt: Free 0/Starter 29/Pro 79/Enterprise Anfrage
- Neu (Projektdok): Free 0/Starter 19/Pro 49/Enterprise 199

**User Stories:**
- Als Besucher moechte ich die Preise und Plaene sehen bevor ich mich registriere
- Als eingeloggter User moechte ich meinen Plan upgraden koennen
- Als User moechte ich Credit-Pakete als Einmalkauf erwerben koennen

**Acceptance Criteria:**
- [ ] Oeffentliche Preisseite unter `/preise`
- [ ] Dashboard-Preisseite unter `/dashboard/preise` (mit aktuellem Plan hervorgehoben)
- [ ] 4 Abo-Plaene: Free (0 EUR), Starter (19 EUR/Monat), Pro (49 EUR/Monat), Enterprise (199 EUR/Monat)
- [ ] Feature-Vergleichstabelle pro Plan
- [ ] 3 Credit-Pakete: 100 Credits (29 EUR), 500 Credits (99 EUR), 1.000 Credits (149 EUR)
- [ ] "Jetzt starten"/"Upgraden" Buttons pro Plan
- [ ] Aktueller Plan wird hervorgehoben (eingeloggt)
- [ ] "Beliebteste" Badge fuer Pro-Plan

**Edge Cases:**
- Was passiert bei Klick auf "Downgrade"? Warnung dass Features verloren gehen
- Was passiert bei Enterprise-Klick? Kontaktformular oder Direct-Link

---

### PROJ-23: Stripe Checkout Integration

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-22 (Preisseite), PROJ-2 (subscriptions + payments Tabellen)

**Beschreibung:** Stripe Checkout Session Erstellung und Weiterleitung fuer Abonnements und Credit-Pakete.

**Migration aus altem Repo:** Nicht im alten Repo implementiert (Credits wurden manuell verwaltet). Die Projektdokumentation beschreibt Edge Functions `create-checkout` und `stripe-webhook`. Muessen als Next.js API Routes oder Supabase Edge Functions neu gebaut werden.

**User Stories:**
- Als User moechte ich per Klick auf "Upgraden" zum Stripe Checkout weitergeleitet werden
- Als User moechte ich nach erfolgreicher Zahlung automatisch den neuen Plan erhalten
- Als User moechte ich Credit-Pakete kaufen koennen

**Acceptance Criteria:**
- [ ] API Route/Edge Function `create-checkout` erstellt Stripe Checkout Session
- [ ] Unterstuetzt `mode: 'subscription'` fuer Abo-Plaene
- [ ] Unterstuetzt `mode: 'payment'` fuer Credit-Pakete
- [ ] Stripe Price IDs konfigurierbar via Environment Variables
- [ ] Success-URL leitet zu `/dashboard?checkout=success` weiter
- [ ] Cancel-URL leitet zu `/dashboard/preise` zurueck
- [ ] Stripe Customer wird mit User-ID und Email erstellt/zugeordnet

**Edge Cases:**
- Was passiert bei Checkout-Abbruch? User bleibt auf altem Plan, keine Aenderung
- Was passiert bei doppeltem Checkout? Nur eine Subscription wird erstellt
- Was passiert bei Zahlungsfehler? Stripe zeigt eigene Fehlermeldung

---

### PROJ-24: Stripe Webhook Handler

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-23 (Checkout)

**Beschreibung:** Webhook-Handler fuer Stripe Events zur Aktualisierung von Subscriptions, Payments und Credits.

**User Stories:**
- Als Plattformbetreiber moechte ich dass Zahlungen automatisch verarbeitet werden
- Als Plattformbetreiber moechte ich dass Kuendigungen automatisch den Plan aendern

**Acceptance Criteria:**
- [ ] Webhook-Endpoint unter `/api/stripe-webhook` oder als Edge Function
- [ ] Event `checkout.session.completed`:
  - Subscription: Erstellt/aktualisiert `subscriptions`-Eintrag + setzt Credits
  - Credit-Pack: Fuegt Credits hinzu zu `user_credits`
  - Erstellt `payments`-Eintrag
- [ ] Event `customer.subscription.deleted`: Setzt Plan auf "Free", Status auf "canceled"
- [ ] Event `customer.subscription.updated`: Aktualisiert Plan-Aenderungen
- [ ] Event `invoice.payment_succeeded`: Loggt erfolgreiche Zahlung
- [ ] Stripe-Signature-Verifizierung fuer Sicherheit
- [ ] Idempotenz: Doppelte Events werden ignoriert

**Edge Cases:**
- Was passiert bei fehlerhafter Stripe-Signatur? 400-Error, kein Verarbeiten
- Was passiert wenn User geloescht wurde aber Webhook kommt? Graceful Skip + Logging
- Was passiert bei gleichzeitigem Subscription-Update und Webhook? Atomare Operationen

---

## E9: Export-Funktionen

### PROJ-25: CSV/Excel Export

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-16 (Ergebnis-Tabelle), Plan-basiertes Feature-Gating

**Beschreibung:** Export von Suchergebnissen und CRM-Kontakten als CSV-Datei.

**Migration aus altem Repo:** Nicht im alten Repo. Muss neu gebaut werden. Nur fuer Pro+ User.

**User Stories:**
- Als Pro-User moechte ich meine Suchergebnisse als CSV exportieren koennen
- Als Pro-User moechte ich meine CRM-Kontakte als CSV exportieren koennen
- Als Starter/Free-User moechte ich sehen dass CSV-Export ein Pro-Feature ist

**Acceptance Criteria:**
- [ ] "CSV Export" Button in Ergebnis-Tabelle und CRM (nur Pro+)
- [ ] Exportierte Felder: Unternehmen, Adresse, Telefon, Email, Website, Bewertung, Bewertungsanzahl, Entscheider, Instagram, Facebook, LinkedIn, YouTube, Twitter
- [ ] UTF-8 Encoding mit BOM fuer korrekte Umlaute in Excel
- [ ] Semikolon als Separator (deutsch-freundlich)
- [ ] Dateiname: `manyleads_[suchbegriff]_[datum].csv`
- [ ] Starter/Free User sehen deaktivierten Button mit "Pro"-Badge

**Edge Cases:**
- Was passiert bei 500 Ergebnissen? Export sollte trotzdem funktionieren (client-seitig)
- Was passiert bei fehlenden Daten? Leere Felder statt "undefined"
- Was passiert bei Sonderzeichen in Daten? Korrekte CSV-Escaping (Anfuehrungszeichen)

---

## E10: Benachrichtigungssystem

### PROJ-26: In-App Benachrichtigungen

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-2 (notifications-Tabelle), PROJ-8 (User-Provider)

**Beschreibung:** Echtzeit-Benachrichtigungssystem mit Glocken-Icon in der Sidebar.

**Migration aus altem Repo:** Nicht im alten Repo. Die Projektdokumentation beschreibt `NotificationBell.tsx` mit Realtime-Updates. Muss komplett neu gebaut werden.

**User Stories:**
- Als User moechte ich benachrichtigt werden wenn meine Suche abgeschlossen ist
- Als User moechte ich benachrichtigt werden wenn meine Credits niedrig sind
- Als User moechte ich Benachrichtigungen als gelesen markieren koennen

**Acceptance Criteria:**
- [ ] Glocken-Icon in der Sidebar/Topbar mit Ungelesen-Counter (Badge)
- [ ] Dropdown/Popover zeigt letzte Benachrichtigungen
- [ ] Benachrichtigungstypen: search_completed, credits_low, subscription_renewed
- [ ] Realtime via Supabase Channel auf `notifications`-Tabelle
- [ ] "Alle als gelesen markieren" Button
- [ ] Einzelne Benachrichtigung als gelesen markieren bei Klick
- [ ] Maximal 50 Benachrichtigungen anzeigen (aeltere werden nicht geladen)

**Edge Cases:**
- Was passiert bei 100+ ungelesenen Benachrichtigungen? "99+" Badge
- Was passiert bei Realtime-Verbindungsabbruch? Fallback auf Polling alle 30s
- Was passiert bei gleichzeitiger Benachrichtigung auf mehreren Geraeten? Konsistenter Read-Status via DB

---

## E11: Admin-Dashboard

### PROJ-27: Admin-Dashboard Uebersicht

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-9 (Admin-Route-Protection), PROJ-2 (user_roles, feedback, contact_submissions)

**Beschreibung:** Admin-Bereich zur Verwaltung von Kontaktanfragen, Feedback und Statistiken.

**Migration aus altem Repo:** Nicht im alten Repo. Muss komplett neu gebaut werden.

**User Stories:**
- Als Admin moechte ich eine Uebersicht ueber neue Kontaktanfragen und Feedback sehen
- Als Admin moechte ich Kontaktanfragen bearbeiten und als erledigt markieren koennen
- Als Admin moechte ich User-Feedback einsehen und den Status aendern koennen

**Acceptance Criteria:**
- [ ] Admin-Seite unter `/admin` (nur Admin-User)
- [ ] Dashboard-Karten: Anzahl neue Kontaktanfragen, Anzahl neues Feedback
- [ ] Tab "Kontaktanfragen": Liste aller Anfragen mit Name, Email, Betreff, Datum, Status
- [ ] Status-Aenderung: neu -> in_bearbeitung -> bearbeitet
- [ ] Tab "Feedback": Liste aller Feedbacks mit Email, Nachricht, Anhang-Link, Status
- [ ] Loeschfunktion fuer Eintraege (mit Bestaetigung)

**Edge Cases:**
- Was passiert bei fehlender Admin-Rolle? Redirect zu `/dashboard`
- Was passiert bei gleichzeitiger Bearbeitung durch mehrere Admins? Optimistic Locking

---

## E12: Landing Page & Marketing-Seiten

### PROJ-28: Landing Page (Business Landing)

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-4 (Design System)

**Beschreibung:** Oeffentliche Landing Page mit Hero, Features, Pricing, Testimonials, FAQ und CTA-Sections.

**Migration aus altem Repo:** Das alte Repo hat eine vollstaendige Landing Page mit 7 Sections unter `src/app/page.tsx` und `src/components/landing/`. Koennen als Basis uebernommen und an das neue Design angepasst werden. Statische Daten in `src/data/` koennen ebenfalls uebernommen werden.

**User Stories:**
- Als Besucher moechte ich verstehen was Manyleads.io bietet
- Als Besucher moechte ich die wichtigsten Features sehen
- Als Besucher moechte ich mich direkt registrieren koennen

**Acceptance Criteria:**
- [ ] Hero-Section: Headline, Subtitle, CTA-Buttons ("Kostenlos starten", "Preise ansehen")
- [ ] Features-Section: 6+ Feature-Karten mit Icons und Beschreibungen
- [ ] Social-Proof-Section: Testimonials oder Statistiken
- [ ] Pricing-Preview: Kompakte Plan-Uebersicht mit Link zu `/preise`
- [ ] FAQ-Section: 5-8 haeufig gestellte Fragen mit Accordion
- [ ] CTA-Section: Finaler Call-to-Action
- [ ] Responsive Design: Mobile-first
- [ ] Navbar mit: Logo, Navigation (Features, Preise, Kontakt), Login/Register Buttons
- [ ] Footer mit: Links, Impressum, Datenschutz, Kontakt

**Edge Cases:**
- Was passiert bei eingeloggten Usern auf der Landing Page? CTA aendert sich zu "Zum Dashboard"
- Was passiert bei Slow Connection? Lazy-Loading fuer Bilder und Sections

---

### PROJ-29: Marketing-Seiten (Impressum, Datenschutz, AGB, Kontakt, About)

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-3 (Layout)

**Beschreibung:** Statische Seiten fuer rechtliche Pflichtangaben und Information.

**Migration aus altem Repo:** `impressum/page.tsx`, `datenschutz/page.tsx`, `kontakt/page.tsx` existieren im alten Repo. Koennen uebernommen und inhaltlich vervollstaendigt werden.

**User Stories:**
- Als Besucher moechte ich das Impressum einsehen koennen (gesetzliche Pflicht)
- Als Besucher moechte ich die Datenschutzerklaerung lesen koennen (DSGVO)
- Als Besucher moechte ich die AGB lesen koennen
- Als Besucher moechte ich ein Kontaktformular nutzen koennen

**Acceptance Criteria:**
- [ ] `/impressum` mit vollstaendigen Angaben (Name, Adresse, Kontakt des Inhabers)
- [ ] `/datenschutz` mit DSGVO-konformer Datenschutzerklaerung
- [ ] `/agb` mit Allgemeinen Geschaeftsbedingungen
- [ ] `/kontakt` mit Kontaktformular (Name, Email, Betreff, Nachricht)
- [ ] `/about` mit Unternehmensvorstellung
- [ ] `/hilfe` mit FAQ und Support-Informationen
- [ ] Kontaktformular speichert in `contact_submissions`-Tabelle
- [ ] Alle Seiten im Marketing-Layout (mit Navbar und Footer)

**Edge Cases:**
- Was passiert bei Spam im Kontaktformular? Rate-Limiting (z.B. max 3 pro Stunde pro IP)
- Was passiert bei fehlerhafter Email im Kontaktformular? Inline-Validierung

---

## E13: Einstellungen & Profilverwaltung

### PROJ-30: Benutzer-Einstellungen

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-8 (User-Provider)

**Beschreibung:** Einstellungsseite fuer Profildaten, Passwort-Aenderung und Account-Verwaltung.

**Migration aus altem Repo:** `src/app/dashboard/einstellungen/page.tsx` existiert im alten Repo. Kann als Basis uebernommen werden.

**User Stories:**
- Als User moechte ich meinen Namen und meine Email-Adresse aendern koennen
- Als User moechte ich mein Passwort aendern koennen
- Als User moechte ich meinen aktuellen Plan und die naechste Abrechnungsperiode sehen

**Acceptance Criteria:**
- [ ] Einstellungsseite unter `/dashboard/einstellungen`
- [ ] Profil-Bereich: Name, Email bearbeiten
- [ ] Passwort-Bereich: Altes Passwort, Neues Passwort, Bestaetigung
- [ ] Abo-Bereich: Aktueller Plan, naechste Abrechnung, Link zum Stripe Customer Portal
- [ ] Speichern-Button pro Bereich
- [ ] Erfolgsmeldung nach Aenderung

**Edge Cases:**
- Was passiert bei Aenderung der Email? Neue Email muss bestaetigt werden
- Was passiert bei falschem altem Passwort? Fehlermeldung
- Was passiert bei Kuendigung des Abos? Link zum Stripe Customer Portal

---

## E14: Feedback & Kontaktformulare

### PROJ-31: In-App Feedback

**Status:** Geplant

**Abhaengigkeiten:** Benoetigt PROJ-8 (User-Provider), PROJ-2 (feedback-Tabelle)

**Beschreibung:** Feedback-Dialog innerhalb der App fuer eingeloggte User.

**Migration aus altem Repo:** Nicht im alten Repo. Die Projektdokumentation beschreibt `FeedbackDialog.tsx`. Muss neu gebaut werden.

**User Stories:**
- Als User moechte ich direkt aus der App Feedback geben koennen
- Als User moechte ich optional einen Screenshot/Anhang mitsenden koennen

**Acceptance Criteria:**
- [ ] Feedback-Button in der Sidebar (unten)
- [ ] Dialog mit: Nachrichten-Textfeld, optionaler Datei-Upload
- [ ] Speichert in `feedback`-Tabelle mit user_id, email, message, attachment_url
- [ ] Status initial: "neu"
- [ ] Erfolgsmeldung nach Absenden
- [ ] Rate-Limiting: Max 5 Feedbacks pro Tag pro User

**Edge Cases:**
- Was passiert bei sehr langer Nachricht? Max. 2000 Zeichen
- Was passiert bei grosser Datei? Max. 5 MB, nur Bilder (PNG, JPG)

---

## Zusammenfassung: Empfohlene Implementierungsreihenfolge

### Phase 1: Foundation (Woche 1-2)
1. PROJ-1: Supabase Client Setup
2. PROJ-2: Datenbank-Schema & RLS
3. PROJ-4: Design System
4. PROJ-3: App-Layout & Navigation

### Phase 2: Auth & User (Woche 2-3)
5. PROJ-5: Email/Passwort Auth
6. PROJ-6: Google OAuth
7. PROJ-7: Passwort-Reset
8. PROJ-8: User-Provider
9. PROJ-9: Route-Protection

### Phase 3: Kernfunktion (Woche 3-5)
10. PROJ-10: Credit-Anzeige
11. PROJ-12: Such-Formular
12. PROJ-13: n8n-Integration
13. PROJ-14: Fortschrittsanzeige
14. PROJ-15: Scraping-Fallback

### Phase 4: Ergebnisse & Daten (Woche 5-7)
15. PROJ-16: Lead-Tabelle
16. PROJ-17: Smart-Filter
17. PROJ-18: Sammlungen
18. PROJ-19: Suchverlauf
19. PROJ-25: CSV-Export

### Phase 5: CRM & Monetarisierung (Woche 7-9)
20. PROJ-20: CRM-Kontaktliste
21. PROJ-21: CRM-Kontakt bearbeiten
22. PROJ-22: Preisseite
23. PROJ-23: Stripe Checkout
24. PROJ-24: Stripe Webhook
25. PROJ-11: Credit-Reset Cron

### Phase 6: Polish & Marketing (Woche 9-11)
26. PROJ-26: Benachrichtigungen
27. PROJ-27: Admin-Dashboard
28. PROJ-28: Landing Page
29. PROJ-29: Marketing-Seiten
30. PROJ-30: Einstellungen
31. PROJ-31: Feedback

---

## Abhaengigkeitsdiagramm (vereinfacht)

```
PROJ-1 (Supabase) ──> PROJ-2 (Schema) ──> PROJ-5 (Auth) ──> PROJ-8 (User-Provider)
     │                      │                    │                    │
     v                      v                    v                    v
PROJ-4 (Design) ──> PROJ-3 (Layout) ──> PROJ-9 (Routes) ──> PROJ-10 (Credits)
                                                                     │
                                                                     v
                                                              PROJ-12 (Suchformular)
                                                                     │
                                                                     v
                                                              PROJ-13 (n8n)
                                                              /      |      \
                                                             v       v       v
                                                     PROJ-14  PROJ-15  PROJ-16 (Tabelle)
                                                      (Progress) (Fallback)   |
                                                                              v
                                                                       PROJ-17 (Filter)
                                                                       PROJ-18 (Sammlungen)
                                                                       PROJ-25 (Export)
                                                                              |
                                                                              v
                                                                       PROJ-20 (CRM)
                                                                              |
                                                                              v
                                                                       PROJ-21 (CRM Edit)
```

Parallel dazu (unabhaengig):
- PROJ-22/23/24 (Stripe) nach PROJ-10 (Credits)
- PROJ-26 (Benachrichtigungen) nach PROJ-8 (User-Provider)
- PROJ-27 (Admin) nach PROJ-9 (Route-Protection)
- PROJ-28/29 (Landing/Marketing) nach PROJ-4 (Design System)
- PROJ-30 (Einstellungen) nach PROJ-8 (User-Provider)
- PROJ-31 (Feedback) nach PROJ-8 (User-Provider)
