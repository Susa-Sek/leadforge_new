tei # Solution Architecture Review - Manyleads.io MVP

**Datum:** 2026-02-07
**Erstellt von:** Orchestrator (Delivery Manager)
**Phase:** Post-MVP Review

---

## Aktuelle Architektur

### Tech Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deployment:** Vercel (planned)
- **Region:** EU-Central-1 (Frankfurt)

### Database Schema (Deployed)
12 Tabellen bereits deployed in Supabase:

**Core Tables:**
- `profiles` - User profile data (full_name, avatar_url)
- `user_credits` - Credit management (total_credits, used_credits)

**Feature Tables:**
- `search_results` - Lead search results
- `search_queries` - Search history
- `search_collections` - Organized lead collections
- `collection_results` - Many-to-many (collections ↔ results)

**CRM Tables:**
- `crm_contacts` - Contact management
- `crm_activities` - Activity tracking (calls, emails, meetings)
- `crm_notes` - Notes per contact

**Engagement Tracking:**
- `email_sequences` - Automated email campaigns
- `sequence_emails` - Individual emails in sequence
- `engagement_events` - Tracking (opens, clicks, replies)

**RLS:** Alle Tabellen haben Row Level Security aktiviert.

### Implementierte Features

#### Authentication
- `/login` - Email/Password Login mit Zod-Validierung
- `/registrieren` - Registration mit Zod-Validierung
- `/auth/callback` - OAuth Callback Handler
- Middleware: Route Protection für `/dashboard/*`

#### Dashboard
- `/dashboard` - Server Component mit echten Stats:
  - Credits (verfügbar)
  - Suchen (Anzahl)
  - Kontakte (Anzahl)
  - Sammlungen (Anzahl)
- `/dashboard/layout.tsx` - Server Component (User + Credits fetch)
- `<DashboardShell>` - Sidebar Navigation + User Dropdown

#### UI Components
- Theme Toggle (Light/Dark Mode)
- User Navigation mit Avatar
- Responsive Sidebar (shadcn/ui)
- Landing Page mit Hero + Features

#### Server Actions
- `signOut()` - Logout
- `getUser()` - Current user
- `getDashboardStats()` - Parallel fetch (credits, searches, contacts, collections)

---

## Architektur-Patterns

### ✅ Best Practices verwendet

1. **Server Components First**
   - Data Fetching in Server Components (Layout, Dashboard)
   - Client Components nur wo nötig (Dropdown, Sidebar, Theme Toggle)

2. **Parallele Datenabfragen**
   - `Promise.all()` in Layout (profile + credits)
   - `Promise.all()` in getDashboardStats (4 queries parallel)

3. **Type Safety**
   - Zod für Form-Validierung
   - TypeScript für alle Server Actions
   - Explizite Return-Types

4. **Security**
   - RLS auf allen Tabellen
   - Middleware für Route Protection
   - user_id filtering in allen Queries

5. **Performance**
   - Server Components (kein JS zum Client)
   - Parallele Queries
   - Static Pages wo möglich

---

## Feature Gaps (für nächste Iterationen)

### 1. Lead-Suche Feature (HIGH PRIORITY)
**Aktuell:** Platzhalter-Seite
**Benötigt:**
- Search Form (Branche, Standort, Firmengröße, etc.)
- Search API Integration (externe Lead-Datenbank)
- Results Display (Table mit Filtern)
- Credit-Abzug bei Suche
- Save to Collection Funktion

**Technische Anforderungen:**
- Neue Server Action: `performSearch(query: SearchParams)`
- Credit-Check vor Suche
- Transaction: Credit-Abzug + Result speichern (atomisch)
- Pagination für Results

---

### 2. CRM Feature (HIGH PRIORITY)
**Aktuell:** Platzhalter-Seite
**Benötigt:**
- Contact List View (Table)
- Contact Detail View
- Add Contact (manuell oder aus Search Results)
- Activities Timeline (Calls, Emails, Meetings)
- Notes pro Contact

**Technische Anforderungen:**
- Server Actions: CRUD für Contacts, Activities, Notes
- Filter/Sort/Search in Contact List
- Optimistic UI Updates (Client Component)

---

### 3. Verlauf (Search History)
**Aktuell:** Platzhalter-Seite
**Benötigt:**
- List alle search_queries (chronologisch)
- Re-run Search (mit gleichen Params)
- View Results (archived)

**Technische Anforderungen:**
- Server Action: `getSearchHistory()`
- Link zu search_results

---

### 4. Sammlungen (Collections)
**Aktuell:** Platzhalter-Seite
**Benötigt:**
- Create/Edit/Delete Collections
- Add/Remove Leads aus Collections
- Export Collection (CSV/Excel)

**Technische Anforderungen:**
- Server Actions: CRUD für Collections
- Many-to-Many Management (collection_results)
- Export Logic (Server-side CSV Generation)

---

### 5. Profil & Einstellungen (MEDIUM PRIORITY)
**Aktuell:** Nicht implementiert (aber UserNav verlinkt bereits)
**Benötigt:**
- Profil bearbeiten (full_name, avatar_url)
- Passwort ändern
- Email ändern
- Account löschen

**Technische Anforderungen:**
- Server Actions: updateProfile, updatePassword, deleteAccount
- Avatar Upload (Supabase Storage)

---

## Vorgeschlagene Feature-Reihenfolge (nächste 3-5 Sprints)

### Sprint 1: Lead-Suche MVP
**Warum zuerst:** Core Value Proposition von Manyleads.io
**Deliverables:**
- Search Form mit Basis-Filtern (Branche, Standort, Firmengröße)
- Mock API Integration (später durch echte API ersetzen)
- Results Display (Table)
- Credit-Abzug Logik
- "Save to Collection" Button

**Acceptance Criteria:**
- User kann nach Leads suchen
- Results werden angezeigt
- Credits werden abgezogen
- Leads können in Collection gespeichert werden

---

### Sprint 2: CRM Basis-Funktionalität
**Warum zweit:** Leads müssen verwaltet werden können
**Deliverables:**
- Contact List (Table mit Filtern)
- Contact Detail View
- Add Contact (manuell)
- Import aus Search Results
- Basic Notes

**Acceptance Criteria:**
- User kann Kontakte manuell anlegen
- User kann Leads aus Suche ins CRM importieren
- User kann Notizen zu Kontakten hinzufügen

---

### Sprint 3: Sammlungen (Collections)
**Warum dritt:** Organisieren von Leads
**Deliverables:**
- Create/Edit/Delete Collections
- Add/Remove Leads
- View Collection Details
- Export CSV

**Acceptance Criteria:**
- User kann Sammlungen erstellen und benennen
- User kann Leads zu Sammlungen hinzufügen
- User kann Sammlungen als CSV exportieren

---

### Sprint 4: Verlauf + Profil
**Warum viert:** Qualitätsverbesserungen
**Deliverables:**
- Search History View
- Re-run Search
- Profil bearbeiten
- Passwort ändern

**Acceptance Criteria:**
- User kann vergangene Suchen einsehen
- User kann Suchen wiederholen
- User kann Profil aktualisieren

---

### Sprint 5: CRM Advanced Features
**Warum fünft:** Erweiterung der Core-Features
**Deliverables:**
- Activity Timeline (Calls, Emails, Meetings)
- Email Sequences (Automated Campaigns)
- Engagement Tracking

**Acceptance Criteria:**
- User kann Activities zu Kontakten loggen
- User kann Email-Sequenzen erstellen
- User kann Engagement (Opens, Clicks) tracken

---

## Technische Debt & Verbesserungen

### Code Quality
- [ ] Error Boundaries hinzufügen (React Fehler-Handling)
- [ ] Loading States für alle Async Actions
- [ ] Toast-Notifications (für Success/Error Feedback)
- [ ] Skeleton Loaders (während Data Fetching)

### Performance
- [ ] Database Indexing prüfen (für große Result-Sets)
- [ ] Query Optimization (bei großen Tabellen)
- [ ] Caching-Strategie definieren (Next.js Cache)

### Testing
- [ ] Unit Tests für Server Actions (Vitest)
- [ ] Integration Tests für Auth Flow
- [ ] E2E Tests für kritische User Flows (Playwright)

### Security
- [ ] Rate Limiting (API-Missbrauch verhindern)
- [ ] CSRF Protection (für Forms)
- [ ] Input Sanitization (XSS Prevention)

### DevOps
- [ ] Monitoring Setup (Sentry für Errors)
- [ ] Logging Strategy (für Debugging)
- [ ] Backup Strategy (DB Backups)

---

## Entscheidungs-Dokumentation

### Warum Supabase statt Custom Backend?
- ✅ Schnellere Entwicklung (Auth + DB out-of-the-box)
- ✅ RLS für Datensicherheit
- ✅ Realtime-Subscriptions (für zukünftige Features)
- ✅ Günstiger Einstieg (Free Tier)
- ❌ Vendor Lock-in (akzeptiert für MVP)

### Warum shadcn/ui statt Material-UI?
- ✅ Copy-Paste (volle Kontrolle über Code)
- ✅ Tailwind-native (konsistent mit Tech Stack)
- ✅ Bessere DX (keine 200kb Bundle-Size)
- ✅ Modernes Design (Radix UI + Accessible)

### Warum Server Components statt Client-Only?
- ✅ Bessere Performance (weniger JS)
- ✅ SEO-freundlich
- ✅ Security (DB-Zugriff nur Server-side)
- ✅ Next.js Best Practice

---

## Deployment-Readiness

### ✅ Bereit für Production
- Environment Variables korrekt
- .gitignore korrekt (.env.local nicht committed)
- Build erfolgreich (keine TypeScript-Fehler)
- RLS aktiviert (Datensicherheit)

### ⚠️ Vor Production noch erforderlich
- [ ] Sentry Setup (Error Tracking)
- [ ] Security Headers (CSP, X-Frame-Options)
- [ ] Rate Limiting (API-Schutz)
- [ ] Backup-Strategie (DB Backups)
- [ ] Domain + SSL (Vercel managed)

---

## Nächste Schritte

1. **User Entscheidung:** Welches Feature soll als nächstes gebaut werden?
   - Empfehlung: Sprint 1 (Lead-Suche MVP)

2. **Requirements Engineer** beauftragen:
   - Feature Spec für gewähltes Feature erstellen
   - User Stories + Acceptance Criteria

3. **Solution Architect** beauftragen:
   - Detaillierte technische Planung
   - API Integration Design (Lead-Datenbank)
   - DB-Schema Anpassungen (falls nötig)

4. **Deployment vorbereiten** (parallel möglich):
   - Vercel Projekt erstellen
   - Environment Variables konfigurieren
   - Sentry Setup (optional)
