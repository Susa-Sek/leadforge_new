# PROJ-27: Admin-Dashboard

## Epic
E11: Admin-Dashboard

## Status
Initialized - Requirements Phase

## Description
Zentrales Admin-Dashboard für Manyleads.io zur Verwaltung von Benutzern, System-Statistiken, Credits und Moderation.

## Features

### Phase 1: Requirements
- User Stories für User Management
- System Statistics Requirements
- Credit Management Requirements
- Content Management Requirements
- Moderation Requirements
- Audit Logs Requirements

### Phase 2: Architecture
- Admin role system design
- Middleware and access control
- Database schema (audit_logs, announcements, reports)
- API design for admin endpoints
- Dashboard layout and components

### Phase 3: Implementation

#### Backend
- Admin middleware implementation
- Database migrations
- API routes for user management
- API routes for statistics
- API routes for credit management
- API routes for audit logs
- API routes for announcements
- API routes for reports
- RLS policies for admin tables
- Audit logging system

#### Frontend
- Admin layout with navigation
- Admin dashboard overview page
- User management pages (list, detail)
- Statistics page with charts
- Credit management page
- Audit logs viewer
- Announcements management
- Reports moderation queue
- Admin components and hooks

### Phase 4: QA
- Security testing (role-based access)
- User management testing
- Statistics testing
- Credit management testing
- Audit logs testing
- UI/UX testing
- Performance testing

## Acceptance Criteria
- [ ] Admin-Only Access: Nur Benutzer mit `role = 'admin'` können auf /admin zugreifen
- [ ] User Management: Admins können alle User sehen, filtern, sortieren, deaktivieren
- [ ] System Stats: Admins sehen aggregierte Statistiken mit Zeitverlauf
- [ ] Credit Admin: Admins können Credits manuell anpassen mit Begründung
- [ ] Audit Logging: Alle Admin-Aktionen werden in unveränderbarem Log gespeichert
- [ ] Moderation: Admins können gemeldete Inhalte verwalten
- [ ] Performance: Dashboard lädt in <2 Sekunden
- [ ] German UI: Alle Texte auf Deutsch

## Technical Requirements
- Next.js 16 with App Router
- Supabase for database and auth
- shadcn/ui components
- Recharts for statistics charts
- Role-based access control (RBAC)

## Dependencies
- E2 (Authentication & User Management)
- E3 (Credit System)
- E7 (CRM System) - optional

## Notes
- Admin-Interface ist Desktop-optimiert
- Audit-Logs sind append-only (kein Löschen/Editieren)
- Alle Admin-Aktionen müssen mit Begründung dokumentiert werden

## Tasks
- Task #11: E11 Requirements
- Task #12: E11 Architecture
- Task #13: E11 Backend
- Task #14: E11 Frontend
- Task #15: E11 QA
