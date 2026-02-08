# Epic E11: Admin Dashboard - High-Level Architecture

**Status:** ARCHITECTURE DESIGN COMPLETE
**Projekt:** Manyleads.io
**Framework:** Next.js 16 + Supabase
**Epic:** E11 - Admin Dashboard
**Projekt:** PROJ-27 (Admin Dashboard System)

---

## Executive Summary

Das Admin Dashboard ist ein zentrales Verwaltungssystem für Manyleads.io-Administratoren. Es ermöglicht die Verwaltung aller Nutzer, Kredit-Guthaben, Inhalte und Moderation innerhalb der Plattform.

### Scope

- **User Management:** Nutzer suchen, filtern, sperren/entsperren, Pläne ändern
- **Statistics Dashboard:** KPIs, Charts, Trends, Aktivitäts-Metriken
- **Credit Administration:** Guthaben manuell hinzufügen/entfernen
- **Content Management:** System-Ankündigungen verwalten
- **Moderation:** Nutzer-Reports bearbeiten und lösen
- **Audit Logging:** Unveränderliches Protokoll aller Admin-Aktionen

### Key Challenges

1. **Security:** Strikte Admin-Only Zugriffskontrolle (Middleware + RLS)
2. **Performance:** Große Datensätze (Nutzer, Audit-Logs) effizient laden
3. **Audit Trail:** Alle Aktionen müssen nachvollziehbar sein

---

## 1. Datenbank-Schema (Supabase)

### 1.1 Neue Tabellen

#### admin_audit_logs (Unveränderliches Audit-Protokoll)

Speichert alle Aktionen, die Admins durchführen:

- **Wer:** admin_id (welcher Admin)
- **Was:** action (z.B. USER_SUSPEND, CREDIT_ADJUSTMENT)
- **Wen:** target_type + target_id (betroffener Nutzer/Objekt)
- **Details:** JSON-Feld mit zusätzlichen Informationen
- **Wann:** created_at Zeitstempel
- **Wo:** ip_address für Sicherheits-Tracking

**Warum wichtig:** Compliance, Nachvollziehbarkeit, Sicherheit

#### system_announcements (CMS für Ankündigungen)

Verwaltet globale System-Nachrichten:

- **Inhalt:** Titel, Nachricht (Rich Text)
- **Sichtbarkeit:** Typ (Info, Warnung, Wartung, Kritisch)
- **Zeitraum:** Start- und Enddatum
- **Zielgruppe:** audience (alle, nur Free, nur Pro, etc.)
- **Status:** is_active Flag

**Warum wichtig:** Kommunikation mit Nutzern bei Updates/Wartung

#### reports (Moderationssystem)

Nutzer können Inhalte melden:

- **Reporter:** Wer hat gemeldet
- **Ziel:** Was wurde gemeldet (Nutzer, Inhalt)
- **Grund:** Warum wurde gemeldet
- **Status:** Offen, In Bearbeitung, Gelöst, Abgelehnt
- **Details:** Beschreibung + optionaler Screenshot-Link

**Warum wichtig:** Community-Management, Trust & Safety

#### admin_action_types (Lookup-Tabelle)

Definiert gültige Admin-Aktionen:

- USER_SUSPEND, USER_UNSUSPEND
- USER_PLAN_CHANGE
- CREDIT_ADJUSTMENT
- ANNOUNCEMENT_CREATE/UPDATE/DELETE
- REPORT_RESOLVE, REPORT_DISMISS

### 1.2 Erweiterung bestehender Tabellen

#### profiles (Erweiterung für Admin-Funktionen)

Neue Felder:

- **role:** 'user' | 'admin' - Rolle des Nutzers
- **is_suspended:** boolean - Account gesperrt?
- **suspended_at:** Zeitstempel der Sperrung
- **suspended_by:** Welcher Admin hat gesperrt
- **suspension_reason:** Grund der Sperrung

### 1.3 Performance-Optimierung (Indexes)

```
admin_audit_logs:
- admin_id (für Admin-spezifische Logs)
- created_at (für Zeitbereichs-Filter)
- action (für Aktions-Filter)
- target_type + target_id (für Objekt-Tracking)

system_announcements:
- is_active + end_date (für aktive Ankündigungen)
- audience (für Zielgruppen-Filter)

reports:
- status (für Status-Filter)
- created_at (für Zeit-Sortierung)
- target_type (für Typ-Filter)
```

---

## 2. API Design

### 2.1 User Management APIs

| Endpoint | Funktion | Zugriff |
|----------|----------|---------|
| `/api/admin/users` (GET) | Nutzer-Liste mit Filter, Pagination | Admin |
| `/api/admin/users/[id]` (GET) | Einzelnen Nutzer laden (mit Statistiken) | Admin |
| `/api/admin/users/[id]` (PATCH) | Nutzer-Profil bearbeiten (Plan, Status) | Admin |
| `/api/admin/users/[id]/suspend` (POST) | Nutzer sperren | Admin |
| `/api/admin/users/[id]/unsuspend` (POST) | Nutzer entsperren | Admin |

**Query Parameter für /api/admin/users:**
- search: Email/Name-Suche
- plan: 'free' | 'pro' | 'enterprise'
- status: 'active' | 'suspended'
- role: 'user' | 'admin'
- page, limit: Pagination
- sort_by, sort_order: Sortierung

### 2.2 Statistics APIs

| Endpoint | Funktion | Caching |
|----------|----------|---------|
| `/api/admin/stats` (GET) | Überblick KPIs (Nutzer, Umsatz, Aktivität) | 5 Min |
| `/api/admin/stats/revenue` (GET) | Umsatz-Statistiken (Stripe) | 5 Min |
| `/api/admin/stats/activity` (GET) | Aktivitäts-Metriken (Suchen, Logins) | 5 Min |
| `/api/admin/stats/users` (GET) | Nutzer-Wachstum (Registrierungen) | 5 Min |

**Query Parameter:**
- from, to: Datumsbereich
- period: 'day' | 'week' | 'month' für Aggregation

### 2.3 Credit Administration APIs

| Endpoint | Funktion |
|----------|----------|
| `/api/admin/credits` (POST) | Guthaben hinzufügen/entfernen |
| `/api/admin/credits/transactions` (GET) | Transaktions-History |
| `/api/admin/credits/summary` (GET) | Guthaben-Übersicht pro Nutzer |

**Body für POST /api/admin/credits:**
- user_id: Ziel-Nutzer
- amount: Positive (Gutschrift) oder Negative (Abbuchung) Zahl
- reason: Grund für die Anpassung
- reference: Optionale Referenz-ID

### 2.4 Content Management APIs (Ankündigungen)

| Endpoint | Funktion |
|----------|----------|
| `/api/admin/announcements` (GET) | Alle Ankündigungen |
| `/api/admin/announcements` (POST) | Neue Ankündigung erstellen |
| `/api/admin/announcements/[id]` (PATCH) | Ankündigung bearbeiten |
| `/api/admin/announcements/[id]` (DELETE) | Ankündigung löschen |
| `/api/admin/announcements/[id]/toggle` (POST) | Aktiv/Inaktiv umschalten |

### 2.5 Moderation APIs (Reports)

| Endpoint | Funktion |
|----------|----------|
| `/api/admin/reports` (GET) | Reports mit Filter (Status, Typ) |
| `/api/admin/reports/[id]` (GET) | Einzelnen Report laden |
| `/api/admin/reports/[id]/resolve` (PATCH) | Report als gelöst markieren |
| `/api/admin/reports/[id]/dismiss` (DELETE) | Report ablehnen |

### 2.6 Audit Log APIs

| Endpoint | Funktion |
|----------|----------|
| `/api/admin/audit-logs` (GET) | Audit-Logs mit Filter |
| `/api/admin/audit-logs/export` (POST) | Logs als CSV exportieren |

**Query Parameter:**
- admin_id: Filter nach Admin
- action: Filter nach Aktionstyp
- from, to: Zeitbereich
- target_type, target_id: Filter nach Ziel

---

## 3. Admin Middleware & Security

### 3.1 Middleware-Update (src/middleware.ts)

Erweiterung für Admin-Route-Schutz:

```
Wenn Pfad mit '/admin' beginnt:
  1. Prüfe ob User eingeloggt (Session-Cookie)
  2. Lade User-Profil aus Supabase
  3. Prüfe ob role === 'admin'
  4. Wenn nicht Admin → Redirect zu /dashboard
  5. Wenn Admin → Weiterleitung erlauben
```

**Warum Middleware:**
- Frühe Abwehr (vor dem Rendern)
- Kein Admin-Code wird je an Nicht-Admins ausgeliefert
- Zusätzliche Sicherheit zur API-Prüfung

### 3.2 API-Layer Protection

**Jede /api/admin/* Route muss:**

1. Session validieren (authenticate)
2. User-Profil laden mit Rolle
3. Prüfen ob role === 'admin'
4. Bei Fehler: 403 Forbidden zurückgeben
5. Bei Erfolg: Audit-Log für Mutationen schreiben

### 3.3 RLS Policies (Row-Level Security)

**admin_audit_logs:**
- SELECT: Nur Admins (keine User-Zugriff)
- INSERT: Nur durch Service Role (API schreibt)
- UPDATE/DELETE: Keiner (immutable)

**system_announcements:**
- SELECT: Alle (für Anzeige im Frontend)
- INSERT/UPDATE/DELETE: Nur Admins

**reports:**
- SELECT: Nur Admins
- INSERT: Authentifizierte User (können melden)
- UPDATE: Nur Admins (Status-Änderung)

**profiles (erweitert):**
- SELECT: Admins können ALLE Profile lesen
- UPDATE: Admins können ALLE Profile updaten (Plan, Status)

---

## 4. Frontend Architecture

### 4.1 Route-Struktur

```
admin/                              # (admin) Route-Gruppe für Middleware
├── layout.tsx                      # AdminShell mit Sidebar
├── page.tsx                        # Redirect zu /admin/dashboard
├── dashboard/
│   └── page.tsx                    # Übersicht mit KPIs und Charts
├── users/
│   ├── page.tsx                    # Nutzer-Liste (Tabelle)
│   └── [id]/
│       └── page.tsx                # Nutzer-Detail mit Aktionen
├── credits/
│   └── page.tsx                    # Kredit-Verwaltung
├── announcements/
│   └── page.tsx                    # Ankündigungen verwalten
├── reports/
│   └── page.tsx                    # Moderation/Reports
└── audit-logs/
    └── page.tsx                    # Audit-Protokoll
```

**Anmerkung:** /admin ist die einzige nicht-deutsche Route (Industrie-Standard)

### 4.2 Component-Struktur

#### Admin Layout Components

```
AdminLayout (/admin/layout.tsx)
├── AdminSidebar
│   ├── Logo
│   ├── Navigation-Items
│   │   ├── Dashboard
│   │   ├── Users
│   │   ├── Credits
│   │   ├── Announcements
│   │   ├── Reports
│   │   └── Audit Logs
│   └── User-Info (Admin-Badge)
├── AdminHeader
│   ├── Breadcrumb
│   ├── Admin-Badge (rot, prominent)
│   └── Logout-Button
└── Main Content Area
```

#### Dashboard Components

```
AdminDashboardPage (/admin/dashboard)
├── StatsGrid
│   └── StatsCard (4x)
│       ├── Title
│       ├── Value (groß)
│       ├── Change-Indicator (Trend)
│       └── Icon
├── ChartsSection
│   ├── UserGrowthChart (Line)
│   ├── RevenueChart (Area)
│   └── ActivityChart (Bar)
├── TopUsersTable
│   └── Ranking der aktivsten Nutzer
└── QuickActions
    └── Buttons für häufige Aktionen
```

#### User Management Components

```
AdminUsersPage (/admin/users)
├── PageHeader
│   ├── Title
│   └── UserCount
├── FilterBar
│   ├── SearchInput
│   ├── PlanFilter (Select)
│   ├── StatusFilter (Select)
│   └── RoleFilter (Select)
├── UserDataTable (TanStack Table)
│   ├── Columns: Name, Email, Plan, Status, Created, Actions
│   ├── Pagination
│   └── Sorting
└── UserDetailModal
    ├── UserInfoSection
    ├── StatsSection (Suchen, Credits, etc.)
    ├── ActionsSection (Suspend, Change Plan)
    └── CreditAdjustmentForm
```

#### Credit Administration Components

```
AdminCreditsPage (/admin/credits)
├── SearchUserForm
│   └── Suche nach Email/User
├── CreditAdjustmentForm
│   ├── User-Info (Name, aktuelle Credits)
│   ├── AmountInput (±)
│   ├── ReasonTextarea
│   └── SubmitButton
└── RecentTransactionsTable
    └── Letzte 20 Transaktionen
```

#### Announcement Management Components

```
AdminAnnouncementsPage (/admin/announcements)
├── Header + "Neue Ankündigung" Button
├── AnnouncementList
│   └── AnnouncementCard (je Eintrag)
│       ├── Title + Type-Badge
│       ├── Date-Range
│       ├── Audience
│       ├── Status (Active/Inactive)
│       └── Actions (Edit, Delete, Toggle)
└── AnnouncementEditor (Modal)
    ├── TitleInput
    ├── RichTextEditor (Nachricht)
    ├── TypeSelector
    ├── DateRangePicker
    ├── AudienceSelector
    └── Preview
```

#### Report Moderation Components

```
AdminReportsPage (/admin/reports)
├── FilterBar (Status, Type)
├── ReportList
│   └── ReportCard
│       ├── Reporter-Info
│       ├── Target-Info (was wurde gemeldet)
│       ├── Reason
│       ├── Status-Badge
│       ├── Created-Date
│       └── Actions (Resolve, Dismiss, View)
└── ReportDetailModal
    ├── Full Report Info
    ├── Context (z.B. Nutzer-Profil)
    └── ResolutionForm
```

#### Audit Log Components

```
AdminAuditLogsPage (/admin/audit-logs)
├── FilterBar
│   ├── Admin-Filter
│   ├── Action-Filter
│   └── DateRangePicker
├── AuditLogTable
│   ├── Columns: Time, Admin, Action, Target, Details
│   └── Expandable Details
└── ExportButton (CSV)
```

### 4.3 Shared Admin Components

```
src/components/admin/
├── admin-shell.tsx           # Layout mit Sidebar
├── admin-sidebar.tsx         # Navigation
├── admin-header.tsx          # Header mit Badge
├── stats-card.tsx            # KPI-Karte
├── stats-chart.tsx           # Recharts-Wrapper
├── user-data-table.tsx       # Nutzer-Tabelle
├── user-detail-modal.tsx     # Nutzer-Detail
├── credit-adjustment-form.tsx # Guthaben-Form
├── announcement-editor.tsx   # Ankündigungs-Editor
├── report-review-panel.tsx   # Report-Moderation
├── audit-log-table.tsx       # Audit-Tabelle
└── date-range-picker.tsx     # Zeitraum-Auswahl
```

### 4.4 Admin Hooks

```
src/hooks/use-admin.ts

export function useAdmin() {
  return {
    // Users
    useAdminUsers,
    useAdminUser,
    useSuspendUser,
    useUnsuspendUser,
    useUpdateUserPlan,

    // Stats
    useAdminStats,
    useAdminRevenue,
    useAdminActivity,

    // Credits
    useAdminCredits,
    useAdjustCredits,
    useCreditTransactions,

    // Announcements
    useAnnouncements,
    useCreateAnnouncement,
    useUpdateAnnouncement,
    useDeleteAnnouncement,

    // Reports
    useReports,
    useResolveReport,
    useDismissReport,

    // Audit
    useAuditLogs,
    useExportAuditLogs,
  };
}
```

---

## 5. Statistics Aggregation & Caching

### 5.1 Query-Strategie

**Materialized Views für schwere Aggregationen:**

```sql
-- Daily stats summary (wird nächtlich aktualisiert)
CREATE MATERIALIZED VIEW daily_stats AS ...

-- User activity summary
CREATE MATERIALIZED VIEW user_activity_stats AS ...
```

**Caching-Strategie:**
- Statistiken werden für 5 Minuten gecacht
- Cache-Key enthält Datumsbereich
- Bei Admin-Aktionen: Cache invalidieren

### 5.2 Key Metrics

**Active Users (heute):**
```
Anzahl eindeutige User mit Search-History-Eintrag in den letzten 24h
```

**Revenue (Stripe):**
```
SUM(stripe_invoices.amount) WHERE status = 'paid' AND created_at > $from
```

**Top Users (nach Such-Aktivität):**
```
SELECT user_id, COUNT(*) as searches
FROM search_history
GROUP BY user_id
ORDER BY searches DESC
LIMIT 10
```

**Nutzer-Wachstum:**
```
SELECT DATE(created_at), COUNT(*)
FROM profiles
GROUP BY DATE(created_at)
ORDER BY date
```

### 5.3 Real-Time vs. Cached

| Metrik | Update-Häufigkeit | Quelle |
|--------|-------------------|--------|
| Total Users | Real-Time | profiles.count |
| Active Today | 5 Min Cache | search_history |
| Revenue | 1 Stunde Cache | stripe_invoices |
| Searches Today | 5 Min Cache | search_history |

---

## 6. Audit Logging System

### 6.1 Automatische Erfassung

**Wann wird ein Audit-Log geschrieben:**

Jede Admin-Mutation löst einen Audit-Log aus:
- Nutzer sperren/entsperren
- Plan-Änderung
- Kredit-Anpassung
- Ankündigung erstellen/bearbeiten/löschen
- Report lösen/ablehnen

### 6.2 Audit Actions (vollständige Liste)

```
USER_SUSPEND          - Nutzer gesperrt
USER_UNSUSPEND        - Nutzer entsperrt
USER_PLAN_CHANGE      - Plan geändert (Free→Pro, etc.)
USER_ROLE_CHANGE      - Rolle geändert (User→Admin)
CREDIT_ADJUSTMENT     - Guthaben angepasst
ANNOUNCEMENT_CREATE   - Ankündigung erstellt
ANNOUNCEMENT_UPDATE   - Ankündigung bearbeitet
ANNOUNCEMENT_DELETE   - Ankündigung gelöscht
ANNOUNCEMENT_TOGGLE   - Ankündigung aktiviert/deaktiviert
REPORT_RESOLVE        - Report gelöst
REPORT_DISMISS        - Report abgelehnt
ADMIN_LOGIN           - Admin-Login (optional)
```

### 6.3 Audit-Log-Eintrag (Struktur)

```
{
  id: UUID,
  admin_id: UUID (Fremdschlüssel zu auth.users),
  action: Enum (siehe Liste oben),
  target_type: 'user' | 'announcement' | 'report',
  target_id: UUID (ID des betroffenen Objekts),
  details: JSONB {
    previous_value: any,
    new_value: any,
    reason: string,
    metadata: object
  },
  ip_address: string,
  user_agent: string,
  created_at: timestamp
}
```

### 6.4 Implementierung

**In jeder Admin-API-Route:**

```typescript
// Nach erfolgreicher Mutation
await logAuditAction({
  adminId: session.user.id,
  action: 'USER_SUSPEND',
  targetType: 'user',
  targetId: userId,
  details: {
    previousStatus: 'active',
    newStatus: 'suspended',
    reason: suspensionReason,
    previousPlan: 'pro',
    newPlan: null
  },
  ip: request.ip,
  userAgent: request.headers.get('user-agent')
});
```

---

## 7. Charts & Visualization

### 7.1 Library: Recharts

**Warum Recharts?**
- React-native (keine Framework-Bridges)
- Leichtgewichtig (kleiner Bundle)
- Deklarative API (komponentenbasiert)
- Gut dokumentiert
- Aktiv maintained

**Alternativen verworfen:**
- Chart.js: Mehr Boilerplate, React-Integration aufwendiger
- D3: Zu komplex für diese Use-Case

### 7.2 Chart-Typen

| Chart | Typ | Verwendung |
|-------|-----|------------|
| User Growth | Line | Registrierungen über Zeit |
| Revenue | Area | Umsatz-Trend |
| Searches | Bar | Such-Aktivität pro Tag |
| Plan Distribution | Pie | Free vs. Pro vs. Enterprise |
| Top Users | Horizontal Bar | Meiste Suchen |

### 7.3 Responsive Design

- Charts sind responsive (recharts built-in)
- Mobile: Charts untereinander (1 Spalte)
- Desktop: Charts nebeneinander (2-3 Spalten)
- Tablet: Mischung aus beiden

---

## 8. Dependencies

### 8.1 Neue Packages (Frontend)

```
recharts              # Charts & Visualization
@tanstack/react-table # Bereits in E5 vorhanden
```

### 8.2 Neue Packages (Backend)

```
# Keine neuen Packages nötig
# Bestehende Supabase-Client reicht
```

### 8.3 Shadcn/ui Components (zu installieren)

```
npx shadcn add calendar      # Für DatePicker
npx shadcn add popover       # Für Dropdowns
npx shadcn add select        # Für Filter
npx shadcn add dialog        # Für Modals
npx shadcn add textarea      # Für Formulare
npx shadcn add badge         # Für Status-Badges
npx shadcn add tooltip       # Für Hilfe-Texte
npx shadcn add separator     # Für Trennlinien
npx shadcn add scroll-area   # Für scrollbare Bereiche
npx shadcn add skeleton      # Für Loading States
npx shadcn add switch        # Für Toggle (Active/Inactive)
```

---

## 9. Handoff Checklists

### 9.1 Für Backend Developer

- [ ] Datenbank-Migration erstellen (Section 1)
  - [ ] admin_audit_logs Tabelle
  - [ ] system_announcements Tabelle
  - [ ] reports Tabelle
  - [ ] profiles Tabelle erweitern (role, is_suspended)
  - [ ] Alle Indexes hinzufügen
- [ ] Admin Middleware implementieren (Section 3)
  - [ ] Middleware.ts erweitern
  - [ ] Admin-Route-Check hinzufügen
- [ ] Alle API-Routen erstellen (Section 2)
  - [ ] User Management (5 Endpoints)
  - [ ] Statistics (4 Endpoints)
  - [ ] Credits (3 Endpoints)
  - [ ] Announcements (5 Endpoints)
  - [ ] Reports (4 Endpoints)
  - [ ] Audit Logs (2 Endpoints)
- [ ] Audit-Logging-Integration (Section 6)
  - [ ] logAuditAction Helper-Funktion
  - [ ] Alle Mutationen loggen
- [ ] RLS Policies für Admin-Zugriff (Section 3.3)
- [ ] Statistics Aggregation Queries (Section 5)
  - [ ] Materialized Views (optional)
  - [ ] Caching-Logik

### 9.2 Für Frontend Developer

- [ ] AdminShell Layout erstellen (Section 4.2)
  - [ ] AdminSidebar mit Navigation
  - [ ] AdminHeader mit Badge
  - [ ] Layout-Wrapper
- [ ] Alle Admin Pages erstellen (Section 4.1)
  - [ ] /admin/dashboard (KPIs + Charts)
  - [ ] /admin/users (Tabelle + Filter)
  - [ ] /admin/users/[id] (Detail)
  - [ ] /admin/credits (Guthaben)
  - [ ] /admin/announcements (CMS)
  - [ ] /admin/reports (Moderation)
  - [ ] /admin/audit-logs (Protokoll)
- [ ] Admin Components erstellen (Section 4.3)
  - [ ] StatsCard + StatsChart
  - [ ] UserDataTable (TanStack)
  - [ ] UserDetailModal
  - [ ] CreditAdjustmentForm
  - [ ] AnnouncementEditor
  - [ ] ReportReviewPanel
  - [ ] AuditLogTable
  - [ ] DateRangePicker
- [ ] Charts mit Recharts (Section 7)
- [ ] Admin Hooks erstellen (Section 4.4)
- [ ] Zod Schemas für Validierung
- [ ] Error Handling + Loading States

### 9.3 Für QA Engineer

- [ ] **Security-Tests**
  - [ ] Nicht-Admin kann /admin nicht aufrufen
  - [ ] Nicht-Admin bekommt 403 bei /api/admin/*
  - [ ] Admin kann alle Admin-Routen aufrufen
  - [ ] Audit-Logs enthalten IP-Adresse
- [ ] **Audit-Log-Tests**
  - [ ] Jede Aktion wird geloggt
  - [ ] Logs sind unveränderlich
  - [ ] Filter funktionieren (Admin, Action, Datum)
  - [ ] Export funktioniert
- [ ] **Statistik-Tests**
  - [ ] KPIs sind korrekt berechnet
  - [ ] Charts zeigen korrekte Daten
  - [ ] Zeitraum-Filter funktionieren
  - [ ] Caching funktioniert
- [ ] **Nutzer-Management-Tests**
  - [ ] Suche funktioniert
  - [ ] Filter funktionieren (Plan, Status)
  - [ ] Nutzer sperren/entsperren funktioniert
  - [ ] Plan-Änderung funktioniert
  - [ ] Pagination funktioniert
- [ ] **Kredit-Administration-Tests**
  - [ ] Guthaben hinzufügen funktioniert
  - [ ] Guthaben entfernen funktioniert
  - [ ] Grund wird gespeichert
  - [ ] Transaktions-History korrekt
- [ ] **Ankündigungen-Tests**
  - [ ] Erstellen funktioniert
  - [ ] Bearbeiten funktioniert
  - [ ] Löschen funktioniert
  - [ ] Toggle Active/Inactive funktioniert
  - [ ] Rich Text Editor funktioniert
- [ ] **Report-Moderation-Tests**
  - [ ] Reports werden angezeigt
  - [ ] Filtern funktioniert
  - [ ] Lösen funktioniert
  - [ ] Ablehnen funktioniert

---

## 10. Tech-Entscheidungen

### 10.1 Entscheidungs-Matrix

| Entscheidung | Optionen | Wahl | Begründung |
|--------------|----------|------|------------|
| Charts | Recharts / Chart.js | **Recharts** | React-native, leichter |
| Tabellen | TanStack Table | **TanStack** | Bereits in E5 verwendet |
| State Management | SWR / React Query | **SWR** | Bereits etabliert |
| Auth | Middleware + RLS | **Beides** | Defense in depth |
| Audit Logs | Postgres Table | **Tabelle** | Einfach, abfragbar |
| Rich Text Editor | Tiptap / Quill | **Tiptap** | Headless, modern |
| Date Picker | shadcn Calendar | **shadcn** | Konsistent mit Design |

### 10.2 Begründungen im Detail

**Recharts statt Chart.js:**
- Native React-Integration (keine Refs nötig)
- Deklarative Syntax passt zu React
- Kleinere Bundle-Size
- Besserer TypeScript-Support

**SWR statt React Query:**
- Bereits im Projekt etabliert (E7 CRM)
- Einfacher API
- Stale-while-revalidate perfekt für Admin-Daten
- Keine Migration nötig

**Middleware + RLS:**
- Middleware: Frühe Abwehr, keine Code-Exposure
- RLS: Letzte Verteidigungslinie
- Beide zusammen = Defense in Depth
- Selbst wenn Middleware fehlt, schützt RLS

---

## 11. Daten-Model (Konzeptionell)

### 11.1 Admin Audit Log Entity

```
AuditLog
├── Identität: Eindeutige ID
├── Wer: admin_id (Admin-User)
├── Was: action (Enum der Aktionen)
├── Wen: target_type + target_id
├── Details: JSON mit previous/new values
├── Meta: IP-Adresse, User-Agent
└── Zeit: created_at Zeitstempel
```

### 11.2 System Announcement Entity

```
Announcement
├── Identität: Eindeutige ID
├── Inhalt: Titel, Nachricht (Rich Text)
├── Typ: Info, Warnung, Wartung, Kritisch
├── Zeitraum: Start-Datum, End-Datum
├── Zielgruppe: Alle, Free, Pro, Enterprise
├── Status: is_active Flag
└── Meta: created_at, updated_at, created_by
```

### 11.3 Report Entity

```
Report
├── Identität: Eindeutige ID
├── Reporter: reporter_id (wer hat gemeldet)
├── Ziel: target_type, target_id (was wurde gemeldet)
├── Grund: reason (Enum: Spam, Abuse, etc.)
├── Beschreibung: Freitext
├── Status: open, in_progress, resolved, dismissed
├── Moderation: resolved_by, resolved_at, resolution_note
└── Meta: created_at, updated_at
```

---

## 12. User Flows

### 12.1 Nutzer sperren

```
1. Admin öffnet /admin/users
   └── Sucht Nutzer per Email/Name

2. Klickt auf Nutzer
   └── Modal öffnet sich mit Details

3. Klickt "Sperren"
   └── Bestätigungs-Dialog erscheint
   └── Grund eingeben (optional)

4. Bestätigen
   └── API-Call POST /api/admin/users/[id]/suspend
   └── Audit-Log wird geschrieben
   └── Nutzer-Status ändert sich zu "Gesperrt"
   └── Nutzer wird ausgeloggt (optional)

5. Feedback
   └── Toast: "Nutzer erfolgreich gesperrt"
   └── Tabelle aktualisiert sich
```

### 12.2 Kredit-Guthaben anpassen

```
1. Admin öffnet /admin/credits

2. Sucht Nutzer
   └── Email-Adresse eingeben
   └── Autocomplete zeigt Treffer

3. Wählt Nutzer aus
   └── Aktuelles Guthaben wird angezeigt

4. Gibt Betrag ein
   └── Positiv = Gutschrift
   └── Negativ = Abbuchung

5. Gibt Grund ein
   └── Freitext (z.B. "Gutschrift für Bug")

6. Bestätigt
   └── API-Call POST /api/admin/credits
   └── Audit-Log wird geschrieben
   └── Credit-Transaction wird erstellt

7. Feedback
   └── Toast mit neuer Credit-Balance
   └── Transaktion erscheint in History
```

### 12.3 System-Ankündigung erstellen

```
1. Admin öffnet /admin/announcements

2. Klickt "Neue Ankündigung"
   └── Editor-Modal öffnet sich

3. Füllt Formular aus
   ├── Titel eingeben
   ├── Nachricht (Rich Text)
   ├── Typ wählen (Info, Warnung, etc.)
   ├── Zeitraum setzen
   └── Zielgruppe wählen

4. Klickt "Vorschau"
   └── Zeigt, wie es Nutzern angezeigt wird

5. Speichert
   └── API-Call POST /api/admin/announcements
   └── Audit-Log wird geschrieben

6. Feedback
   └── Toast: "Ankündigung erstellt"
   └── Erscheint in Liste
```

---

## 13. Error Handling & Edge Cases

### 13.1 Nicht-Admin versucht Admin-Bereich

**Szenario:** Normaler User ruft /admin/dashboard auf

**UX:**
- Middleware fängt ab
- Redirect zu /dashboard
- Kein Fehler angezeigt (silent redirect)

**API:**
- 403 Forbidden bei /api/admin/*
- Error-Message: "Insufficient permissions"

### 13.2 Audit-Log-Schreiben fehlschlägt

**Szenario:** Mutation erfolgreich, aber Audit-Log kann nicht geschrieben werden

**UX:**
- Aktion trotzdem durchführen (wichtiger als Log)
- Error an Monitoring melden
- Admin wird nicht blockiert

**Logging:**
- Server-Log mit Details
- Alert an Entwickler

### 13.3 Statistiken können nicht geladen werden

**Szenario:** Database Timeout bei schwerer Aggregation

**UX:**
- Skeleton-Loading statt Error
- Retry-Button nach Timeout
- Fallback zu vereinfachten Queries

**Caching:**
- Zeige gecachte Daten aus Cache
- Background-Update wenn möglich

### 13.4 Gleichzeitige Credit-Anpassung

**Szenario:** Zwei Admins passen gleichzeitig Credits für selben User an

**Solution:**
- Optimistic Locking via Version
- Oder: Idempotency-Key
- Last-Write-Wins ist akzeptabel hier

---

## 14. Performance-Überlegungen

### 14.1 User-Liste (Pagination)

- Server-side Pagination (25 Items pro Seite)
- Cursor-basiert für stabile Sortierung
- Debounced Search (300ms)
- Nur notwendige Felder laden (keine JSON-Blobs)

### 14.2 Audit-Logs (große Datenmengen)

- Server-side Pagination (50 Items pro Seite)
- Date-Range-Filter obligatorisch (max 30 Tage default)
- Infinite Scroll als Alternative
- Export via Background-Job für große Datenmengen

### 14.3 Statistiken (Caching)

- 5-Minuten-Cache für Statistiken
- Materialized Views für schwere Queries
- Stale-While-Revalidate Pattern
- Background-Refresh bei Cache-Miss

### 14.4 Charts (Lazy Loading)

- Charts nur rendern wenn im Viewport
- Lazy-Loading der Chart-Daten
- Debounced Resize-Handling

---

## 15. Zusammenfassung für Product Manager

### Was wird gebaut?

| Modul | Haupt-Features | Zugriff |
|-------|---------------|---------|
| **Dashboard** | KPIs, Charts, Trends | Admin |
| **User Management** | Nutzer suchen, filtern, sperren, Pläne ändern | Admin |
| **Credit Admin** | Guthaben manuell anpassen | Admin |
| **Announcements** | System-Nachrichten verwalten | Admin |
| **Reports** | Moderation, Reports lösen | Admin |
| **Audit Logs** | Protokoll aller Aktionen | Admin |

### Wichtige Entscheidungen

1. **Sicherheit zuerst:** Middleware + RLS für Defense in Depth
2. **Audit-Trail:** Alle Aktionen werden unveränderlich protokolliert
3. **Performance:** Caching und Pagination für große Datensätze
4. **Konsistenz:** Deutsche UI, außer /admin (Industrie-Standard)
5. **Charts:** Recharts für React-native Integration

### Abhängigkeiten

**Blocks auf:**
- Alle bestehenden Epics (E1-E10) für Daten
- Stripe-Integration (E8) für Revenue-Stats
- User-System (E1) für User-Management

**Wird blockiert von:**
- PROJ-27 Implementation

---

## 16. Next Steps

1. **Backend Developer:** Datenbank-Migration + RLS Policies
2. **Backend Developer:** Admin Middleware implementieren
3. **Backend Developer:** API Endpoints erstellen
4. **Frontend Developer:** Admin Layout + Shell
5. **Frontend Developer:** Dashboard mit Charts
6. **Frontend Developer:** User Management Module
7. **Frontend Developer:** Credit Admin Module
8. **Frontend Developer:** Announcements + Reports
9. **QA:** Security-Tests (nicht-Admin Zugriff)
10. **QA:** Audit-Log-Validierung

**Geschätzte Zeit:** 8-12 Tage (parallel: 6-8 Tage)

---

**Dokument erstellt:** Solution Architect
**Letzte Änderung:** 2026-02-08
**Review-Status:** PENDING USER APPROVAL
