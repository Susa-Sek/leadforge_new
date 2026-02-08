# Epic E11: Admin-Dashboard - Requirements (PROJ-27)

**Status:** 🔵 Planned
**Epic ID:** E11
**Projekt:** PROJ-27 (Admin-Dashboard)
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E11 implementiert ein umfassendes Admin-Dashboard für Manyleads.io, das autorisierten Administratoren ermöglicht, das System zu verwalten, Benutzer zu moderieren, Statistiken einzusehen und administrative Aufgaben durchzuführen.

**Kern-Features:**
- Role-based Admin-Zugang (nur `role = 'admin'`)
- User Management und Moderation
- System-Statistiken und Analytics
- Credit-Verwaltung (manuelle Anpassung)
- Content Management (Ankündigungen)
- Audit Logging (unveränderbar)
- Report-Moderation (gemeldete Inhalte)

**Kontext:**
- E2 (Auth) ist COMPLETED - User-Rollen-System verfügbar
- E3 (Credit-System) ist COMPLETED - credit_transactions Tabelle verfügbar
- E7 (CRM) ist IN PROGRESS - contacts, deals Tabellen verfügbar
- E8 (Stripe) ist IN PROGRESS - subscriptions, invoices verfügbar
- E9 (Export) ist PLANNED - export_logs Tabelle verfügbar

---

## 1. Admin Role System

### Role Definition

| Feld | Typ | Werte | Default |
|------|-----|-------|---------|
| `profiles.role` | TEXT | 'user', 'admin' | 'user' |

- Admin-Users werden manuell in der Datenbank gesetzt (`UPDATE profiles SET role = 'admin' WHERE id = '...'`)
- Es gibt kein "self-service" Admin-Upgrade
- Der erste Admin muss manuell vom Entwickler-Team gesetzt werden

### Access Control

**Middleware-Checks:**
- Alle Routen unter `/admin/*` prüfen Admin-Role
- Nicht-Admins werden auf `/dashboard` umgeleitet
- API-Routen unter `/api/admin/*` erfordern Admin-Role

**RLS Policies:**
- Admin-Tabellen (audit_logs, reports) haben spezielle Admin-Policies
- Admin kann alle User-Daten sehen (bypass RLS für Admin-Zwecke)
- Service Role für Admin-Operationen

---

## 2. User Stories

### US-27.1: Admin-Zugang

**Als Admin möchte ich auf das Admin-Dashboard zugreifen, damit ich Systemverwaltung durchführen kann.**

**Acceptance Criteria:**
- [ ] Route `/admin` ist nur für Admins zugänglich (Middleware-Prüfung)
- [ ] Admin-Role wird in `profiles.role` geprüft
- [ ] Nicht-Admins werden auf `/dashboard` umgeleitet
- [ ] Admin-Layout mit Sidebar-Navigation vorhanden
- [ ] Admin-Badge im Header sichtbar (z.B. "Admin" Chip)
- [ ] Alle Admin-Seiten haben konsistentes Layout
- [ ] Mobile: Admin-Dashboard ist Desktop-optimiert (keine mobile Priorität)

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Admin Dashboard | Admin-Bereich |
| Admin | Administrator |
| Access Denied | Zugriff verweigert |
| Insufficient Permissions | Unzureichende Berechtigungen |

---

### US-27.2: User-Verwaltung

**Als Admin möchte ich alle User sehen und verwalten können.**

**Acceptance Criteria:**
- [ ] Tabelle aller User mit Spalten: Name, Email, Plan, Credits, Status, Registrierungsdatum
- [ ] Pagination: 50 Einträge pro Seite (konfigurierbar: 25/50/100)
- [ ] Suche nach Name oder Email (Echtzeit, debounced)
- [ ] Filter nach Plan: Free, Pro, Enterprise
- [ ] Filter nach Status: aktiv, gesperrt
- [ ] Filter nach Role: user, admin
- [ ] Sortierung nach: Registrierungsdatum, Name, Email, letzte Aktivität
- [ ] User-Detail-Ansicht mit allen Profil-Daten
- [ ] User sperren/entsperren (Soft-Delete-Alternative)
- [ ] User-Plan manuell ändern (mit Begründung)
- [ ] Letzte Aktivität anzeigen (letzter Login)
- [ ] Schnell-Aktionen in Tabelle: Sperren, Details ansehen

**User-Detail-Ansicht:**
- Profil-Informationen (Name, Email, Firma, Telefon)
- Aktueller Plan und Abonnement-Status
- Credit-Balance und Transaktions-Historie
- Registrierungsdatum und letzte Aktivität
- Verknüpfte Daten: Anzahl Kontakte, Deals, Suchen, Exporte
- Admin-Aktionen: Sperren, Plan ändern, Credits anpassen

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Users | Nutzer |
| User Management | Nutzerverwaltung |
| Search users... | Nutzer suchen... |
| Filter by Plan | Nach Tarif filtern |
| Filter by Status | Nach Status filtern |
| All Users | Alle Nutzer |
| Active | Aktiv |
| Suspended | Gesperrt |
| Suspend User | Nutzer sperren |
| Unsuspend User | Nutzer entsperren |
| User Details | Nutzerdetails |
| Registration Date | Registrierungsdatum |
| Last Active | Zuletzt aktiv |
| Plan | Tarif |
| Change Plan | Tarif ändern |
| Credits Balance | Credit-Guthaben |

---

### US-27.3: System-Statistiken

**Als Admin möchte ich System-Statistiken sehen.**

**Acceptance Criteria:**
- [ ] Dashboard mit KPI-Karten:
  - Aktive User (heute / 7 Tage / 30 Tage)
  - Neue Registrierungen (heute / 7 Tage / 30 Tage)
  - Durchgeführte Suchen (heute / 7 Tage / 30 Tage)
  - Exporte erstellt (heute / 7 Tage / 30 Tage)
  - Umsatz (Stripe) - heute / 7 Tage / 30 Tage
  - Credit-Transaktionen (Anzahl, Volumen)
- [ ] Charts (Zeitverlauf) mit Recharts:
  - User-Registrierungen (Linien-Chart)
  - Suchen pro Tag (Balken-Chart)
  - Revenue über Zeit (Linien-Chart)
  - Aktive User über Zeit (Area-Chart)
- [ ] Top-Nutzer:
  - Meiste Suchen
  - Meiste Exporte
  - Meiste Kontakte
  - Höchster Umsatz
- [ ] Date-Range-Picker:
  - Voreingestellt: 7 Tage, 30 Tage, 90 Tage
  - Benutzerdefiniert: Von/Bis Date-Picker
- [ ] Vergleich mit vorherigem Zeitraum (+/- %)
- [ ] Auto-Refresh: Daten alle 5 Minuten aktualisieren
- [ ] Export der Statistiken als CSV

**KPI-Definitionen:**

| KPI | Berechnung |
|-----|------------|
| Aktive User (heute) | Eindeutige User mit Login am aktuellen Tag |
| Aktive User (7d) | Eindeutige User mit Login in letzten 7 Tagen |
| Neue Registrierungen | COUNT profiles WHERE created_at im Zeitraum |
| Durchgeführte Suchen | COUNT search_history WHERE completed_at im Zeitraum |
| Exporte | COUNT export_logs WHERE status = 'completed' im Zeitraum |
| Umsatz | SUM invoices.amount WHERE paid_at im Zeitraum |

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Statistics | Statistiken |
| Dashboard | Übersicht |
| Active Users | Aktive Nutzer |
| New Registrations | Neue Registrierungen |
| Searches | Suchanfragen |
| Exports | Exporte |
| Revenue | Umsatz |
| Credit Transactions | Credit-Transaktionen |
| Top Users | Top-Nutzer |
| Date Range | Zeitraum |
| Last 7 days | Letzte 7 Tage |
| Last 30 days | Letzte 30 Tage |
| Last 90 days | Letzte 90 Tage |
| Custom | Benutzerdefiniert |
| Compared to previous period | Im Vergleich zum vorherigen Zeitraum |
| Refresh | Aktualisieren |
| Export Stats | Statistiken exportieren |

---

### US-27.4: Credit-Verwaltung

**Als Admin möchte ich Credits manuell vergeben oder korrigieren.**

**Acceptance Criteria:**
- [ ] Credit-Übersicht pro User (aktueller Stand, Verlauf)
- [ ] Manuelle Credit-Zuweisung: Formular mit User-Auswahl, Amount (+/-), Begründung
- [ ] Positive Beträge: Credits hinzufügen
- [ ] Negative Beträge: Credits abziehen (nur wenn genug vorhanden)
- [ ] Pflichtfeld: Begründung für jede Anpassung
- [ ] Transaktions-History einsehen (alle User oder pro User)
- [ ] Filter: Nach User, Typ (add/deduct), Zeitraum
- [ ] Bulk-Operationen: Mehreren Usern gleichzeitig Credits geben
- [ ] Export der Transaktions-History als CSV
- [ ] Benachrichtigung an User bei Credit-Anpassung (optional)
- [ ] Validation: Amount muss zwischen -1000 und +1000 liegen (pro Transaktion)

**Credit-Anpassung Formular:**
- User-Auswahl: Dropdown mit Suche (alle User)
- Amount: Number Input (positive/negative Werte)
- Reason: Textarea (min. 10 Zeichen)
- Notify User: Checkbox (Default: true)
- Submit: "Credits anpassen" Button

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Credit Management | Credits verwalten |
| Adjust Credits | Credits anpassen |
| Current Balance | Aktuelles Guthaben |
| Amount | Betrag |
| Reason | Begründung |
| Notify User | Nutzer benachrichtigen |
| Add Credits | Credits hinzufügen |
| Remove Credits | Credits entfernen |
| Transaction History | Transaktionsverlauf |
| Bulk Credit Adjustment | Massen-Credit-Anpassung |
| Select Users | Nutzer auswählen |

---

### US-27.5: Content-Management (Ankündigungen)

**Als Admin möchte ich System-Ankündigungen verwalten.**

**Acceptance Criteria:**
- [ ] Ankündigungen erstellen: Titel, Nachricht, Typ
- [ ] Ankündigungen bearbeiten (solange nicht abgelaufen)
- [ ] Ankündigungen löschen (Soft-Delete)
- [ ] Ankündigung als Notification an alle User senden
- [ ] Ankündigung auf Landing Page anzeigen (optional)
- [ ] Schedule: Start-Datum und End-Datum
- [ ] Typen: Info (blau), Warning (gelb), Success (grün), Maintenance (rot)
- [ ] Zielgruppe: Alle User oder spezifische Pläne (Free/Pro/Enterprise)
- [ ] Aktiv/Deaktivieren ohne Löschen
- [ ] Vorschau vor Veröffentlichung

**Announcement-Typen:**

| Typ | Farbe | Verwendung |
|-----|-------|------------|
| info | Blau (#3B82F6) | Allgemeine Informationen |
| warning | Gelb (#F59E0B) | Warnungen, geplante Änderungen |
| success | Grün (#10B981) | Neue Features, Abschlüsse |
| maintenance | Rot (#EF4444) | Wartungsarbeiten, Downtime |

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Announcements | Ankündigungen |
| Create Announcement | Ankündigung erstellen |
| Edit Announcement | Ankündigung bearbeiten |
| Title | Titel |
| Message | Nachricht |
| Type | Typ |
| Start Date | Startdatum |
| End Date | Enddatum |
| Target Audience | Zielgruppe |
| Show on Landing Page | Auf Landing Page anzeigen |
| Send as Notification | Als Benachrichtigung senden |
| Preview | Vorschau |
| Publish | Veröffentlichen |
| Active | Aktiv |
| Inactive | Inaktiv |

---

### US-27.6: Moderation (Reports)

**Als Admin möchte ich Inhalte moderieren können.**

**Acceptance Criteria:**
- [ ] Gemeldete Kontakte anzeigen (Reporter, Grund, Zeitpunkt)
- [ ] Gemeldete Deals anzeigen
- [ ] Report-Grund einsehen (Spam, Fake, Inappropriate, Other)
- [ ] Inhalt löschen (Content entfernen, Report akzeptieren)
- [ ] Report ablehnen (Content behalten, Report als unbegründet markieren)
- [ ] User bei schwerem Verstoß sperren (Option bei Löschung)
- [ ] Moderations-History anzeigen (wer hat was entschieden)
- [ ] Status-Filter: Offen, Bearbeitet, Abgelehnt
- [ ] Benachrichtigung an Reporter bei Entscheidung (optional)

**Report-Gründe:**

| Grund | Beschreibung |
|-------|--------------|
| spam | Unerwünschte Werbung |
| fake | Falscher/fiktiver Eintrag |
| inappropriate | Unangemessene Inhalte |
| duplicate | Doppelter Eintrag |
| other | Sonstiges (Freitext) |

**Moderations-Workflow:**
1. Report wird erstellt (Status: open)
2. Admin sieht Report in Queue
3. Admin prüft Inhalt und entscheidet:
   - "Inhalt löschen" → Content entfernt, Status: resolved_content_deleted
   - "Report ablehnen" → Content bleibt, Status: resolved_rejected
4. Optional: User sperren bei Verstoß
5. Reporter wird benachrichtigt (optional)

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Reports | Meldungen |
| Moderation Queue | Moderations-Warteschlange |
| Reported Content | Gemeldete Inhalte |
| Reason | Grund |
| Reporter | Meldender |
| Target | Ziel |
| Delete Content | Inhalt löschen |
| Dismiss Report | Meldung ablehnen |
| Suspend User | Nutzer sperren |
| Moderation History | Moderationsverlauf |
| Open | Offen |
| Resolved | Bearbeitet |
| Rejected | Abgelehnt |

---

### US-27.7: Audit-Logs

**Als Admin möchte ich alle Admin-Aktionen nachvollziehen können.**

**Acceptance Criteria:**
- [ ] Vollständige Log aller Admin-Aktionen
- [ ] Jeder Log-Eintrag enthält:
  - Admin-User (Wer)
  - Zeitstempel (Wann)
  - Aktionstyp (Was)
  - Betroffener User (Wen)
  - Details (JSONB - Zusätzliche Daten)
  - IP-Adresse (optional)
- [ ] Filter nach Admin-User
- [ ] Filter nach Aktionstyp
- [ ] Filter nach Zeitraum
- [ ] Filter nach betroffenem User
- [ ] Sortierung: Neueste zuerst (Default)
- [ ] Export der Logs als CSV
- [ ] Logs sind **nicht löschbar** (append-only)
- [ ] Auto-Archivierung nach 1 Jahr (in separates Archiv-Table)
- [ ] Pagination: 100 Einträge pro Seite

**Audit-Log Actions:**

| Aktion | Beschreibung |
|--------|--------------|
| user_suspend | User gesperrt |
| user_unsuspend | User entsperrt |
| user_plan_change | Plan geändert |
| user_role_change | Rolle geändert |
| credits_add | Credits hinzugefügt |
| credits_remove | Credits entfernt |
| content_delete | Inhalt gelöscht |
| report_resolve | Report bearbeitet |
| announcement_create | Ankündigung erstellt |
| announcement_update | Ankündigung aktualisiert |
| announcement_delete | Ankündigung gelöscht |
| settings_update | Systemeinstellungen geändert |

**UI Labels (Deutsch):**

| English | German |
|---------|--------|
| Audit Logs | Audit-Logs |
| Action | Aktion |
| Admin | Administrator |
| Target User | Betroffener Nutzer |
| Timestamp | Zeitstempel |
| Details | Details |
| IP Address | IP-Adresse |
| Export Logs | Logs exportieren |
| Append-only | Nur Anhängen |
| Cannot delete | Nicht löschbar |

---

## 3. Datenbank Schema Requirements

### 3.1 admin_audit_logs Tabelle

```sql
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    target_type TEXT, -- 'user', 'contact', 'deal', 'report', 'announcement'
    target_id UUID,   -- ID des betroffenen Objekts
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target_user ON public.admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- GIN Index für JSONB Details
CREATE INDEX idx_audit_logs_details ON public.admin_audit_logs USING GIN (details);

-- RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only service role can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (true); -- Inserted via service role or trigger
```

### 3.2 system_announcements Tabelle

```sql
CREATE TABLE public.system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'maintenance')),
    target_plans TEXT[] DEFAULT '{}', -- Leer = alle Pläne
    show_on_landing BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_announcements_active ON public.system_announcements(active) WHERE active = TRUE;
CREATE INDEX idx_announcements_dates ON public.system_announcements(start_date, end_date);
CREATE INDEX idx_announcements_type ON public.system_announcements(type);

-- RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
    ON public.system_announcements FOR SELECT
    USING (active = TRUE AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Only admins can manage announcements"
    ON public.system_announcements FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));
```

### 3.3 reports Tabelle (Moderation)

```sql
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('contact', 'deal', 'user')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'fake', 'inappropriate', 'duplicate', 'other')),
    reason_details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved_content_deleted', 'resolved_rejected')),
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can update reports"
    ON public.reports FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));
```

### 3.4 profiles.role Extension

```sql
-- Role Spalte hinzufügen (falls noch nicht vorhanden)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Index für Role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- is_suspended Spalte für User-Sperrung
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Index für Suspended
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON public.profiles(is_suspended) WHERE is_suspended = TRUE;
```

---

## 4. API Requirements

### 4.1 Admin API Endpoints

Alle Admin-Routen erfordern Admin-Role (`profiles.role = 'admin'`).

#### User Management

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/users` | GET | Liste aller User (mit Filter, Sort, Pagination) |
| `/api/admin/users/:id` | GET | User-Details |
| `/api/admin/users/:id` | PATCH | User aktualisieren (Plan, Status) |
| `/api/admin/users/:id/suspend` | POST | User sperren |
| `/api/admin/users/:id/unsuspend` | POST | User entsperren |
| `/api/admin/users/:id/credits` | POST | Credits anpassen |
| `/api/admin/users/:id/audit` | GET | Audit-Logs für User |

#### Statistics

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/stats` | GET | Übersichts-Statistiken (KPIs) |
| `/api/admin/stats/users` | GET | User-Statistiken (Zeitverlauf) |
| `/api/admin/stats/searches` | GET | Such-Statistiken |
| `/api/admin/stats/revenue` | GET | Revenue-Statistiken |
| `/api/admin/stats/credits` | GET | Credit-Statistiken |
| `/api/admin/stats/exports` | GET | Export-Statistiken |
| `/api/admin/stats/top-users` | GET | Top-Nutzer Listen |

#### Credit Management

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/credits/transactions` | GET | Alle Credit-Transaktionen |
| `/api/admin/credits/adjust` | POST | Credits anpassen (einzeln) |
| `/api/admin/credits/bulk-adjust` | POST | Credits anpassen (bulk) |

#### Content Management (Announcements)

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/announcements` | GET | Liste aller Ankündigungen |
| `/api/admin/announcements` | POST | Ankündigung erstellen |
| `/api/admin/announcements/:id` | PATCH | Ankündigung aktualisieren |
| `/api/admin/announcements/:id` | DELETE | Ankündigung löschen |
| `/api/admin/announcements/:id/toggle` | POST | Aktiv/Deaktivieren |

#### Moderation (Reports)

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/reports` | GET | Liste aller Reports |
| `/api/admin/reports/:id` | GET | Report-Details |
| `/api/admin/reports/:id/resolve` | POST | Report bearbeiten (löschen/ablehnen) |
| `/api/admin/reports/stats` | GET | Moderations-Statistiken |

#### Audit Logs

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/admin/audit-logs` | GET | Audit-Logs abrufen |
| `/api/admin/audit-logs/export` | POST | Audit-Logs exportieren |
| `/api/admin/audit-logs/stats` | GET | Statistiken zu Admin-Aktionen |

### 4.2 Request/Response Schemas

#### GET /api/admin/users

**Query Parameters:**
```typescript
{
  search?: string;           // Name oder Email
  plan?: 'free' | 'pro' | 'enterprise';
  status?: 'active' | 'suspended';
  role?: 'user' | 'admin';
  sortBy?: 'created_at' | 'name' | 'email' | 'last_active';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: 25 | 50 | 100;
}
```

**Response:**
```typescript
{
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    company?: string;
    plan: string;
    role: string;
    is_suspended: boolean;
    credits_balance: number;
    created_at: string;
    last_active: string;
    stats: {
      contacts_count: number;
      deals_count: number;
      searches_count: number;
      exports_count: number;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

#### POST /api/admin/users/:id/credits

**Request:**
```typescript
{
  amount: number;      // Positive = hinzufügen, Negative = entfernen
  reason: string;      // Min. 10 Zeichen
  notifyUser: boolean; // Default: true
}
```

**Response:**
```typescript
{
  success: true;
  userId: string;
  previousBalance: number;
  newBalance: number;
  transactionId: string;
}
```

#### GET /api/admin/stats

**Query Parameters:**
```typescript
{
  from: string; // ISO Date
  to: string;   // ISO Date
}
```

**Response:**
```typescript
{
  kpis: {
    activeUsers: { today: number; last7d: number; last30d: number; change: number };
    newRegistrations: { today: number; last7d: number; last30d: number; change: number };
    searches: { today: number; last7d: number; last30d: number; change: number };
    exports: { today: number; last7d: number; last30d: number; change: number };
    revenue: { today: number; last7d: number; last30d: number; change: number };
    creditTransactions: { today: number; last7d: number; last30d: number; change: number };
  };
  charts: {
    userRegistrations: Array<{ date: string; count: number }>;
    searchesPerDay: Array<{ date: string; count: number }>;
    revenuePerDay: Array<{ date: string; amount: number }>;
  };
  topUsers: {
    bySearches: Array<{ userId: string; name: string; count: number }>;
    byExports: Array<{ userId: string; name: string; count: number }>;
    byRevenue: Array<{ userId: string; name: string; amount: number }>;
  };
}
```

#### POST /api/admin/announcements

**Request:**
```typescript
{
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'maintenance';
  targetPlans?: string[]; // ['free', 'pro', 'enterprise'], leer = alle
  showOnLanding?: boolean;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}
```

#### POST /api/admin/reports/:id/resolve

**Request:**
```typescript
{
  action: 'delete_content' | 'dismiss';
  suspendUser?: boolean;
  notes?: string;
  notifyReporter?: boolean;
}
```

### 4.3 Error Responses

| Status | Code | Beschreibung |
|--------|------|--------------|
| 401 | UNAUTHORIZED | Nicht authentifiziert |
| 403 | FORBIDDEN | Kein Admin-Zugang |
| 404 | USER_NOT_FOUND | User nicht gefunden |
| 400 | INVALID_AMOUNT | Credit-Betrag ungültig |
| 400 | INVALID_REASON | Begründung zu kurz |
| 409 | INSUFFICIENT_CREDITS | User hat nicht genug Credits zum Abziehen |
| 422 | VALIDATION_ERROR | Allgemeiner Validierungsfehler |

---

## 5. UI Requirements (Deutsch)

### 5.1 Navigation Labels

| English | German | Icon |
|---------|--------|------|
| Dashboard | Übersicht | LayoutDashboard |
| Users | Nutzer | Users |
| Statistics | Statistiken | BarChart3 |
| Credits | Credits | Coins |
| Announcements | Ankündigungen | Megaphone |
| Reports | Meldungen | Flag |
| Audit Logs | Audit-Logs | ClipboardList |
| Settings | Einstellungen | Settings |

### 5.2 Action Labels

| English | German |
|---------|--------|
| Suspend | Sperren |
| Unsuspend | Entsperren |
| Delete | Löschen |
| Edit | Bearbeiten |
| View | Ansehen |
| Save | Speichern |
| Cancel | Abbrechen |
| Confirm | Bestätigen |
| Export | Exportieren |
| Filter | Filtern |
| Search | Suchen |
| Refresh | Aktualisieren |
| Send Notification | Benachrichtigung senden |
| Preview | Vorschau |

### 5.3 Status Labels

| English | German | Farbe |
|---------|--------|-------|
| Active | Aktiv | Grün |
| Suspended | Gesperrt | Rot |
| Pending | Ausstehend | Gelb |
| Resolved | Bearbeitet | Grün |
| Rejected | Abgelehnt | Grau |
| Open | Offen | Blau |

### 5.4 Plan Labels

| English | German |
|---------|--------|
| Free | Free |
| Pro | Pro |
| Enterprise | Enterprise |

---

## 6. Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-27-01** | Security | Nicht-Admin versucht auf /admin zuzugreifen | 403 Forbidden, Redirect zu /dashboard |
| **EC-27-02** | Security | API-Call an /api/admin/* ohne Admin-Role | 403 Forbidden |
| **EC-27-03** | User Mgmt | Admin sperrt sich selbst | Warnung: "Sie sperren sich selbst. Fortfahren?" |
| **EC-27-04** | User Mgmt | Letzter Admin versucht sich selbst zu sperren | Fehler: "Mindestens ein Admin muss aktiv bleiben" |
| **EC-27-05** | User Mgmt | Letzter Admin versucht Rolle zu 'user' zu ändern | Fehler: "Mindestens ein Admin muss existieren" |
| **EC-27-06** | User Mgmt | Suspendierter User versucht Login | Fehler: "Account gesperrt. Kontaktieren Sie den Support." |
| **EC-27-07** | Credits | Credit-Abzug größer als verfügbare Credits | Fehler: "Nicht genügend Credits verfügbar" |
| **EC-27-08** | Credits | Amount = 0 bei Credit-Anpassung | Validierungsfehler: "Betrag muss ungleich 0 sein" |
| **EC-27-09** | Credits | Begründung zu kurz (< 10 Zeichen) | Validierungsfehler: "Begründung zu kurz" |
| **EC-27-10** | Credits | Bulk-Operation mit leerer User-Liste | Validierungsfehler: "Mindestens ein User auswählen" |
| **EC-27-11** | Stats | Keine Daten im Zeitraum | Charts zeigen leere Daten (0-Werte), keine Fehler |
| **EC-27-12** | Stats | Sehr große Zeiträume (> 1 Jahr) | Warnung: "Großer Zeitraum - Performance beeinträchtigt" |
| **EC-27-13** | Announcements | End-Datum vor Start-Datum | Validierungsfehler vor Speichern |
| **EC-27-14** | Announcements | Ankündigung läuft bereits (Datum erreicht) | Bearbeiten erlaubt, aber Warnung anzeigen |
| **EC-27-15** | Reports | Report gegen gelöschten Inhalt | Status: "resolved - content deleted", keine Aktion nötig |
| **EC-27-16** | Reports | Doppelter Report für selben Inhalt | Beide Reports anzeigen, verknüpfen wenn möglich |
| **EC-27-17** | Audit | Audit-Log-Tabelle wird sehr groß (> 1M Einträge) | Auto-Archivierung nach 1 Jahr |
| **EC-27-18** | Audit | Admin versucht Audit-Log zu löschen | Nicht möglich (UI deaktiviert, API rejected) |
| **EC-27-19** | Search | Suche ergibt 0 User | "Keine User gefunden" anzeigen, Filter-Reset anbieten |
| **EC-27-20** | Export | Sehr großer Export (> 50.000 Zeilen) | Streaming verwenden, async Verarbeitung |
| **EC-27-21** | Session | Admin-Session läuft ab während Arbeit | Auto-Save wo möglich, Re-Login Dialog |
| **EC-27-22** | Concurrency | Zwei Admins bearbeiten gleichen User | Letzter gewinnt, Audit-Log zeigt beide Aktionen |
| **EC-27-23** | Rate Limit | Zu viele API-Calls vom Admin | Erhöhtes Rate-Limit für Admins (1000/Min) |
| **EC-27-24** | Database | Connection Error bei Admin-Operation | Retry-Mechanismus, Fehlermeldung mit Details |

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Security

| Anforderung | Implementierung |
|-------------|-----------------|
| Authentifizierung | JWT + Admin-Role Check |
| RLS Policies | Alle Admin-Tabellen haben RLS |
| Audit Logging | Alle Admin-Aktionen werden geloggt |
| Input Validation | Zod Schemas für alle Inputs |
| SQL Injection | Parameterized Queries |
| XSS Prevention | Output Encoding |
| Rate Limiting | 1000 Requests/Min für Admins |

### 7.2 Performance

| Operation | Ziel |
|-----------|------|
| Admin-Dashboard laden | < 2 Sekunden |
| User-Liste (50 Einträge) | < 500ms |
| Statistiken laden | < 1 Sekunde |
| Audit-Logs (100 Einträge) | < 500ms |
| Charts rendern | < 500ms |
| Credit-Anpassung | < 300ms |
| Auto-Refresh | Alle 5 Minuten |

### 7.3 Usability

- German UI (alle Texte auf Deutsch)
- Desktop-optimiert (Admin primär auf Desktop genutzt)
- Klare visuelle Hierarchie (Sidebar, Header, Content)
- Konsistentes Design mit restlicher App (shadcn/ui)
- Dark Mode Support (wie restliche App)
- Keyboard Navigation (Tab, Enter, Escape)
- Loading States für alle async Operationen
- Empty States mit hilfreichen Hinweisen
- Error Boundaries für Admin-Bereich

---

## 8. Abhängigkeiten

### Von anderen Epics:

| Epic | Benötigt für | Status |
|------|--------------|--------|
| E2 (Auth) | User-Authentifizierung, profiles Tabelle | COMPLETED |
| E3 (Credits) | credit_transactions, user_credits | COMPLETED |
| E7 (CRM) | contacts, deals Tabellen für Statistiken | IN PROGRESS |
| E8 (Stripe) | subscriptions, invoices für Revenue-Stats | IN PROGRESS |
| E9 (Export) | export_logs für Export-Statistiken | PLANNED |
| E5 (Search) | search_history für Such-Statistiken | COMPLETED |

### Neue Tabellen (E11 erstellt):

- admin_audit_logs
- system_announcements
- reports

---

## 9. Handoff Checklist

### Für Solution Architect (Task #12)

**Zu designen:**

- [ ] **Architecture Document:** `docs/architecture-e11-admin-dashboard.md`
  - [ ] Admin Middleware Design
  - [ ] Role-Based Access Control (RBAC)
  - [ ] Database Schema (vollständige SQL)
  - [ ] API Design (alle Endpoints)
  - [ ] Admin Layout Komponenten
  - [ ] State Management für Admin-Views
  - [ ] Audit Logging System Integration
  - [ ] Statistics Aggregation Queries

- [ ] **Security Design:**
  - [ ] Middleware Implementierungsdetails
  - [ ] RLS Policies für Admin-Tabellen
  - [ ] API Security (Rate Limiting, Validation)
  - [ ] Admin Self-Lock Prevention

- [ ] **UI/UX Design:**
  - [ ] Admin Layout Struktur
  - [ ] Navigation Design
  - [ ] Dashboard KPI-Layout
  - [ ] User Management Tabellen-Layout
  - [ ] Form Designs (Credits, Announcements)
  - [ ] Chart Konfigurationen

### Für Backend Developer (Task #13)

**Zu implementieren:**

- [ ] **Database Migrations:**
  - [ ] profiles.role Spalte
  - [ ] profiles.is_suspended Spalte
  - [ ] admin_audit_logs Tabelle
  - [ ] system_announcements Tabelle
  - [ ] reports Tabelle
  - [ ] RLS Policies für alle Tabellen
  - [ ] Indexes für Performance

- [ ] **Admin Middleware:**
  - [ ] Admin Role Check
  - [ ] Redirect für Non-Admins
  - [ ] API Protection

- [ ] **API Routes:**
  - [ ] User Management Routes
  - [ ] Statistics Routes (Aggregation)
  - [ ] Credit Management Routes
  - [ ] Announcements Routes
  - [ ] Reports Routes
  - [ ] Audit Logs Routes

- [ ] **Database Functions:**
  - [ ] Audit Log Insert Function
  - [ ] Statistics Aggregation Functions
  - [ ] User Suspend/Unsuspend Function

### Für Frontend Developer (Task #14)

**Zu implementieren:**

- [ ] **Admin Layout:**
  - [ ] AdminSidebar Komponente
  - [ ] AdminHeader mit Badge
  - [ ] AdminShell (Layout Wrapper)

- [ ] **Pages:**
  - [ ] `/admin` - Dashboard (Stats, Charts)
  - [ ] `/admin/users` - User Management
  - [ ] `/admin/users/[id]` - User Detail
  - [ ] `/admin/credits` - Credit Management
  - [ ] `/admin/announcements` - Announcements
  - [ ] `/admin/reports` - Moderation Queue
  - [ ] `/admin/audit-logs` - Audit Logs

- [ ] **Komponenten:**
  - [ ] UserTable mit Filter/Sort
  - [ ] CreditAdjustmentForm
  - [ ] AnnouncementForm
  - [ ] ReportModerationCard
  - [ ] AuditLogTable
  - [ ] StatsKpiCards
  - [ ] StatsCharts (Recharts)
  - [ ] DateRangePicker

- [ ] **Hooks:**
  - [ ] `useAdmin()` - Admin Check
  - [ ] `useAdminUsers()` - User Management
  - [ ] `useAdminStats()` - Statistics
  - [ ] `useAdminCredits()` - Credit Management
  - [ ] `useAdminAnnouncements()` - Announcements
  - [ ] `useAdminReports()` - Moderation
  - [ ] `useAdminAuditLogs()` - Audit Logs

### Für QA Engineer (Task #15)

**Zu testen:**

- [ ] **Security Tests:**
  - [ ] Non-Admin kann nicht auf /admin zugreifen
  - [ ] Non-Admin bekommt 403 auf API-Calls
  - [ ] RLS Policies verhindern unautorisierten Zugriff
  - [ ] Admin Self-Lock Prevention funktioniert

- [ ] **User Management Tests:**
  - [ ] User sperren/entsperren
  - [ ] Plan ändern
  - [ ] Suche und Filter
  - [ ] Pagination

- [ ] **Credit Management Tests:**
  - [ ] Credits hinzufügen
  - [ ] Credits entfernen
  - [ ] Validation (Betrag, Begründung)
  - [ ] Bulk-Operationen

- [ ] **Statistics Tests:**
  - [ ] KPI-Berechnungen korrekt
  - [ ] Charts rendern korrekt
  - [ ] Date Range Filter
  - [ ] Export funktioniert

- [ ] **Audit Log Tests:**
  - [ ] Alle Aktionen werden geloggt
  - [ ] Logs sind nicht löschbar
  - [ ] Filter funktionieren
  - [ ] Export funktioniert

- [ ] **Edge Case Tests:**
  - [ ] Alle dokumentierten Edge Cases

---

## 10. Open Questions / TODO

- [ ] Soll es mehrere Admin-Level geben (super-admin vs. support-admin)?
- [ ] Soll es ein IP-Whitelist für Admin-Access geben?
- [ ] Soll der Admin bei Credit-Anpassung eine E-Mail-Benachrichtigung an den User triggern können?
- [ ] Sollen gelöschte Inhalte (bei Moderation) wirklich gelöscht oder nur soft-deleted werden?
- [ ] Soll es ein Dashboard-Widget für aktive Alerts/Warnings geben?
- [ ] Wie sollen mehrere gleichzeitige Admin-Änderungen an einem User gehandhabt werden?

---

## Changelog

| Datum | Änderung | Autor |
|-------|----------|-------|
| 2026-02-08 | Initial erstellt mit vollständigen User Stories, API Specs, DB Schema | Requirements Engineer |
| 2026-02-08 | Edge Cases dokumentiert (24 Szenarien) | Requirements Engineer |
| 2026-02-08 | Handoff Checklist für alle Teams hinzugefügt | Requirements Engineer |

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Ready for Solution Architect Review
**Nächster Schritt:** Task #12 (Solution Architect) kann beginnen
