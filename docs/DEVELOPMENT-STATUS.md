# Manyleads.io - Entwicklungsstand

**Letzte Aktualisierung:** 2026-02-07
**Aktueller Sprint:** Sprint 1
**Feature-Specs:** [docs/FEATURE-SPEC.md](FEATURE-SPEC.md) (Source of Truth fuer alle 31 Features)

---

## Feature-Matrix (PROJ-X Tracking)

### E1: Foundation & Projektsetup
| PROJ | Feature | Status | Evidenz |
|------|---------|--------|---------|
| PROJ-1 | Supabase Client Setup | ✅ Done | src/lib/supabase/client.ts, server.ts, middleware.ts |
| PROJ-2 | DB Schema & RLS | ✅ Done | 12 Tables deployed, handle_new_user trigger, has_role() |
| PROJ-3 | App-Layout & Navigation | ✅ Done | dashboard-shell.tsx, Sidebar, User-Nav, Theme Toggle |
| PROJ-4 | Design System & CSS | ✅ Done | globals.css: Variablen, Animationen, Glass-Card, Gradients |

### E2: Authentifizierung & User Management
| PROJ | Feature | Status | Evidenz / Was fehlt |
|------|---------|--------|---------------------|
| PROJ-5 | Email/Passwort Auth | ✅ Done | (auth)/login, (auth)/registrieren, Zod Validation |
| PROJ-6 | Google OAuth | ✅ Done | GoogleButton component, OAuth callback handling |
| PROJ-7 | Passwort-Reset | ✅ Done | /passwort-vergessen + /passwort-zuruecksetzen Seiten |
| PROJ-8 | User-Provider & Context | ✅ Done | UserProvider mit Realtime, useUser() Hook, PlanConfig |
| PROJ-9 | Route Protection | ⏳ Teilweise | Dashboard protected ✅, Admin-Route fehlt |

### E3: Credit-System
| PROJ | Feature | Status | Was fehlt |
|------|---------|--------|-----------|
| PROJ-10 | Credit-System Backend | ✅ Done | `deductCredits`, `addCredits`, RPC Functions, Audit Trail |
| PROJ-10 | Credit-Anzeige Frontend | 🔄 In Progress | CreditProgress + LowCreditWarning Components |
| PROJ-11 | Credit-Reset (Cron) | ⏳ Ready | SQL Functions ready, pg_cron Setup ausstehend |

### E4: Lead-Suche (Kernfunktion)
| PROJ | Feature | Status | Was fehlt |
|------|---------|--------|-----------|
| PROJ-12 | Such-Formular | 🔲 Not Started | Platzhalter-Seite existiert |
| PROJ-13 | Scraping-Integration | 🔲 Not Started | Apify REST API (nicht n8n!) |
| PROJ-14 | Such-Fortschrittsanzeige | 🔲 Not Started | Realtime Steps |
| PROJ-15 | Scraping-Fallback | 🔲 Not Started | Mock-Daten + Outscraper |

### E5: Ergebnis-Anzeige & Filter
| PROJ | Feature | Status |
|------|---------|--------|
| PROJ-16 | Lead-Ergebnis-Tabelle | 🔲 Not Started |
| PROJ-17 | Smart-Filter-System | 🔲 Not Started |

### E6: Sammlungen & Suchverlauf
| PROJ | Feature | Status |
|------|---------|--------|
| PROJ-18 | Sammlungen | 🔲 Not Started |
| PROJ-19 | Suchverlauf | 🔲 Not Started |

### E7: CRM-System
| PROJ | Feature | Status |
|------|---------|--------|
| PROJ-20 | CRM-Kontaktliste | 🔲 Not Started |
| PROJ-21 | CRM-Kontakt bearbeiten | 🔲 Not Started |

### E8: Stripe-Integration
| PROJ | Feature | Status |
|------|---------|--------|
| PROJ-22 | Preisseite | 🔲 Not Started |
| PROJ-23 | Stripe Checkout | 🔲 Not Started |
| PROJ-24 | Stripe Webhook | 🔲 Not Started |

### E9-E14: Weitere Features
| PROJ | Feature | Status |
|------|---------|--------|
| PROJ-25 | CSV/Excel Export | 🔲 Not Started |
| PROJ-26 | Benachrichtigungen | 🔲 Not Started |
| PROJ-27 | Admin-Dashboard | 🔲 Not Started |
| PROJ-28 | Landing Page | 🔲 Not Started |
| PROJ-29 | Marketing-Seiten | 🔲 Not Started |
| PROJ-30 | Einstellungen | 🔲 Not Started |
| PROJ-31 | In-App Feedback | 🔲 Not Started |

---

## Infrastruktur

| Komponente | Status | Details |
|------------|--------|---------|
| Supabase (DB) | ✅ Live | Project: mffvbluqnfgnthwlavlj, Region: eu-central-1 |
| Vercel (Hosting) | ⏳ Setup | Security Headers ready, Deploy ausstehend |
| GitHub Repo | ⏳ Setup | Muss erstellt werden |
| Sentry (Monitoring) | 🔲 Pending | Optional |
| Stripe | 🔲 Pending | Sprint 4 |

---

## Blocker

| Blocker | Betrifft | Status | Loesung |
|---------|----------|--------|---------|
| Apify API Token | PROJ-13 | Offen | User muss Token bereitstellen |
| Google OAuth Config | PROJ-6 | Offen | Google Cloud Console Credentials |
| Stripe API Keys | PROJ-22-24 | Offen | Wird in Sprint 4 benoetigt |

---

## Aktiver Plan: PROJ-6, PROJ-7, PROJ-8 ✅ ABGESCHLOSSEN

**Status:** Abgeschlossen (2026-02-07)
**Plan-Datei:** `.claude/plans/quiet-mapping-pascal.md`

**Abgeschlossene Tasks:**
1. ✅ PROJ-6 → Google OAuth (Button + Config + Callback)
2. ✅ PROJ-7 → Passwort-Reset (/passwort-vergessen + /passwort-zuruecksetzen)
3. ✅ PROJ-8 → User Provider (Context + useUser() Hook + Realtime)

**Nächster Sprint:**
4. PROJ-10 → Credit-System Frontend (Fortschrittsbalken, Warnungen)
5. PROJ-12 → Such-Formular (Branche, Standort, Max Ergebnisse)
6. PROJ-13 → Scraping-Integration (Apify REST API)

---

## PROJ-10 Backend Implementation Details (2026-02-07)

**Files Created:**
- `src/lib/actions/credits.ts` - Server Actions for credit operations
- `src/lib/credits/check.ts` - Credit check utilities and cost calculation
- `supabase/migrations/20250207_credit_system.sql` - Database functions

**Database Functions (Atomar mit Row-Level Locking):**
- `deduct_credits(user_id, amount, reason, metadata)` - Credits abziehen
- `add_credits(user_id, amount, reason, metadata)` - Credits hinzufügen
- `reset_monthly_credits()` - Monatlicher Reset (Admin only)
- `reset_user_credits(user_id, new_total)` - Einzelner User Reset

**Neue Tabelle:**
- `credit_transactions` - Audit Trail für alle Credit-Operationen

**Server Actions:**
- `deductCredits(userId, amount, reason, metadata)` - Mit Race-Condition Protection
- `addCredits(userId, amount, reason, metadata)` - Für Purchases/Refunds
- `checkCredits(userId, requiredAmount)` - Lightweight check
- `getCreditBalance(userId)` - Aktueller Stand

**Credit Check Utilities:**
- `hasEnoughCredits(userId, amount)` - Boolean check mit Defizit-Info
- `requireCredits(userId, amount)` - Throws wenn nicht genug
- `calculateSearchCost(maxResults)` - 1 Credit pro 10 Ergebnisse
- `calculateExportCost(count, format)` - Export-Kosten
- `isLowOnCredits(userId, threshold)` - Für Warnungen (default 20%)

**Edge Cases Handled:**
- Race Conditions: `SELECT ... FOR UPDATE` Locking
- Insufficient Credits: Error "Nicht genug Credits"
- Validation: Positive amounts only, required fields
- Atomic Operations: Alles in RPC Functions

**Usage Example:**
```typescript
// In API Route oder Server Action
import { hasEnoughCredits, requireCredits } from '@/lib/credits/check'
import { deductCredits } from '@/lib/actions/credits'

// Check vor Search
const status = await hasEnoughCredits(userId, 5)
if (!status.hasEnough) {
  return { error: `Nicht genug Credits. Verfügbar: ${status.available}` }
}

// Credits abziehen
const result = await deductCredits(userId, 5, 'search', { search_id: 'abc123' })
if (!result.success) {
  return { error: result.error } // "Nicht genug Credits"
}
```

---

## Changelog

| Datum | Aenderung | Agent |
|-------|-----------|-------|
| 2026-02-07 | PROJ-10 Backend: Credit System vollständig implementiert | Backend Dev |
| 2026-02-07 | SQL Migration: `credit_transactions` + 4 RPC Functions deployed | Backend Dev |
| 2026-02-07 | Server Actions: `deductCredits`, `addCredits`, `checkCredits`, `getCreditBalance` | Backend Dev |
| 2026-02-07 | Credit Utilities: `hasEnoughCredits`, `calculateSearchCost`, `isLowOnCredits` | Backend Dev |
| 2026-02-07 | Row-Level Locking: `SELECT ... FOR UPDATE` gegen Race Conditions | Backend Dev |
| 2026-02-07 | PROJ-1 bis PROJ-5 + PROJ-9 als Done markiert | Orchestrator |
| 2026-02-07 | PROJ-8, PROJ-10 als Teilweise markiert | Orchestrator |
| 2026-02-07 | Sprint 1 gestartet: DevOps + PROJ-6/7/8 | Orchestrator |
| 2026-02-07 | Security Headers in next.config.ts | DevOps |
| 2026-02-07 | Git Commit 67527d6: Auth + Supabase + Schema | DevOps |
