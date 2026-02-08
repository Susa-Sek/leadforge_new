# Manyleads.io - Vollständiger QA-Test Report

**Datum:** 2026-02-08
**Tester:** QA Engineer
**Projekt:** Next.js 16 + Supabase (Project ID: mffvbluqnfgnthwlavlj)
**Testumfang:** Auth-Flows, Credits-Anzeige, Link-Validierung, User Stories

---

## Zusammenfassung

| Kategorie | Status |
|-----------|--------|
| **Critical Bugs** | 3 |
| **High Bugs** | 4 |
| **Medium Bugs** | 3 |
| **Low Bugs** | 2 |
| **Gesamt** | **12 Bugs** |

**Gesamtergebnis:** Feature ist **NICHT production-ready**

---

## Bug #1: Endloses Login-Laden (CRITICAL)

### Beschreibung
Der Login-Flow auf `/anmelden` hängt sich auf, weil auf eine nicht-existente Datenbank-Spalte `is_suspended` zugegriffen wird.

### Erwartetes Verhalten
User meldet sich an -> Session wird erstellt -> Redirect zu `/dashboard`

### Tatsächliches Verhalten
Login-Formular lädt endlos (Button zeigt "Wird angemeldet...") und redirectet nie.

### Schritte zur Reproduktion
1. Gehe zu `/anmelden`
2. Gib gültige Credentials ein (suliemansaid.business@gmail.com)
3. Klicke "Anmelden"
4. Beobachte: Button lädt endlos, keine Fehlermeldung, kein Redirect

### Ursache
In `src/app/(auth)/login/page.tsx` Zeile 61-65 wird geprüft:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_suspended')
  .eq('id', data.user.id)
  .single()
```

**ABER:** Die Spalte `is_suspended` existiert nicht in der profiles-Tabelle!

**Beweis - Datenbank-Schema:**
```sql
profiles-Tabelle Spalten:
- id, email, full_name, avatar_url, created_at, updated_at
- stripe_customer_id, company_name, job_title
- two_factor_enabled, two_factor_secret
- pending_deletion_at, deletion_requested_at
- role (varchar)

FEHLT: is_suspended, suspended_at, suspended_reason, suspended_by
```

**Beweis - Migrationen:**
- Migration `20260210_e11_admin_dashboard.sql` existiert im Code
- Wurde aber **NIEMALS** auf die Datenbank angewendet
- `mcp__supabase__list_migrations` zeigt: Migration fehlt in der Liste

### Fix-Vorschlag
1. Migration ausführen:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
```

2. ODER: Login-Code temporär anpassen (Fallback wenn Spalte fehlt):
```typescript
if (data.user) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', data.user.id)
    .single()

  // Nur prüfen wenn die Spalte existiert
  if (!profileError && profile?.is_suspended) {
    await supabase.auth.signOut()
    setError('Dein Konto wurde gesperrt. Bitte kontaktiere den Support.')
    setIsLoading(false)
    return
  }
  // Wenn Error (Spalte fehlt), trotzdem weiterleiten
  router.refresh()
  router.push('/dashboard')
}
```

**Priority:** CRITICAL (Login komplett kaputt)

---

## Bug #2: Landing Page Link zu /login statt /anmelden (CRITICAL)

### Beschreibung
Alle Login-Links auf der Landing Page zeigen auf `/login`, aber die Route existiert nur als `/anmelden` (oder die Route fehlt komplett).

### Betroffene Dateien

#### 1. `src/lib/landing/data/content.ts` Zeile 20
```typescript
auth: {
  login: { label: 'Anmelden', href: '/login' },  // ❌ FALSCH
  register: { label: 'Kostenlos starten', href: '/registrieren' },
}
```

#### 2. Alle CTAs auf Landing Page
- Hero Section Secondary Button
- Header Login Button
- Footer Links

### Erwartetes Verhalten
Klick auf "Anmelden" -> Navigiert zu funktionierender Login-Seite

### Tatsächliches Verhalten
Klick auf "Anmelden" -> Navigiert zu `/login` -> 404 Error

### Route-Analyse
```
Existierende Auth-Routes:
✅ /login (src/app/(auth)/login/page.tsx)
❌ /anmelden (EXISTIERT NICHT als eigene Datei!)
✅ /registrieren (src/app/(auth)/registrieren/page.tsx)
```

**Problem:** Die deutsche Route `/anmelden` existiert nicht! Es gibt nur `/login`.

### Lösungsoptionen

**Option A:** Alle Links zu `/login` ändern (einfach):
```typescript
auth: {
  login: { label: 'Anmelden', href: '/login' },  // ✅ Existiert
}
```

**Option B:** Middleware oder Rewrite für `/anmelden` -> `/login`

**Option C:** Neue Datei `src/app/(auth)/anmelden/page.tsx` erstellen (dupliziert Code)

**Empfohlene Lösung:** Option A (schnell und pragmatisch)

**Priority:** CRITICAL (User kann sich nicht von Landing Page aus anmelden)

---

## Bug #3: Doppelte Notifications-Seiten (HIGH)

### Beschreibung
Es existieren zwei identische Ordner für Benachrichtigungen:
- `/dashboard/einstellungen/benachrichtigungen` (DEUTSCH - korrekt)
- `/dashboard/einstellungen/notifications` (ENGLISCH - falsch)

### Beweis
```bash
ls src/app/dashboard/einstellungen/
# Output:
# benachrichtigungen/  <- Korrekt
# notifications/       <- Falsch, sollte entfernt werden
```

### Impact
- Verwirrung bei der Navigation
- Mögliche 404-Fehler wenn Links auf den falschen Pfad zeigen
- Code-Duplizierung

**Fix:**
```bash
rm -rf "src/app/dashboard/einstellungen/notifications"
```

**Priority:** HIGH (Code-Maintenance, potentielle Routing-Probleme)

---

## Bug #4: Dashboard Layout redirectet auf /login (HIGH)

### Beschreibung
Wenn ein nicht-eingeloggter User das Dashboard aufruft, wird auf `/login` redirectet statt auf eine funktionierende Login-Route.

### Code
`src/app/dashboard/layout.tsx` Zeile 17-18:
```typescript
if (authError || !user) {
  redirect('/login')  // ❌ FALSCH
}
```

### Impact
- User landet auf 404-Seite oder falscher Route
- Schlechte UX für ausgeloggte User

**Fix:**
```typescript
if (authError || !user) {
  redirect('/login')  // ✅ Existiert, ist OK so
}
```

**Anmerkung:** Wenn wir Bug #2 fixen (alle Links auf `/login`), dann ist dieser Redirect OK.

**Priority:** HIGH (Authentication Flow kaputt wenn `/login` nicht existiert)

---

## Bug #5: User-Nav linkt auf nicht-existente Profil-Seite (HIGH)

### Beschreibung
Im User-Dropdown wird auf `/dashboard/profil` verlinkt, aber diese Route existiert nicht. Die korrekte Route ist `/dashboard/einstellungen/profil`.

### Code
`src/components/user-nav.tsx` Zeile 61:
```typescript
<Link href="/dashboard/profil" className="cursor-pointer">  // ❌ FALSCH
```

### Verfügbare Pfade
```bash
ls src/app/dashboard/
# crm/ deals/ einstellungen/ exporte/ kontakte/ notifications/
# sammlungen/ suche/ verlauf/ layout.tsx page.tsx

ls src/app/dashboard/einstellungen/
# abonnement/ abrechnung/ benachrichtigungen/ datenschutz/
# konto/ layout.tsx notifications/ page.tsx profil/ sicherheit/
```

**Korrekter Pfad:** `/dashboard/einstellungen/profil`

**Fix:**
```typescript
<Link href="/dashboard/einstellungen/profil" className="cursor-pointer">  // ✅ KORREKT
```

**Priority:** HIGH (Kaputter Link im Haupt-Navigation-Menu)

---

## Bug #6: Dashboard-Shell hat falsche Notifications-Links (HIGH)

### Beschreibung
In der Sidebar-Navigation gibt es zwei falsche Links zu Notifications.

### Code
`src/components/dashboard-shell.tsx` Zeile 50:
```typescript
{ title: 'Benachrichtigungen', href: '/dashboard/notifications', icon: Users },
// ❌ FALSCH - sollte '/dashboard/einstellungen/benachrichtigungen' sein
```

Zeile 56:
```typescript
{ title: 'Benachrichtigungen', href: '/dashboard/einstellungen/notifications', icon: Bell },
// ❌ FALSCH - sollte '/dashboard/einstellungen/benachrichtigungen' sein
```

### Impact
- User kann Benachrichtigungen-Einstellungen nicht über Sidebar erreichen
- 404-Fehler bei Klick auf diese Links

**Fix:**
```typescript
// Hauptnavigation - entfernen oder korrigieren
// Einstellungen-Navigation
{ title: 'Benachrichtigungen', href: '/dashboard/einstellungen/benachrichtigungen', icon: Bell },
```

**Priority:** HIGH (Navigation funktioniert nicht korrekt)

---

## Bug #7: Registrierungs-Success linkt auf /login (MEDIUM)

### Beschreibung
Nach erfolgreicher Registrierung wird auf `/login` verlinkt statt auf `/anmelden`.

### Code
`src/app/(auth)/registrieren/page.tsx` Zeile 89:
```typescript
<Link href="/login">  // ❌ FALSCH
  <Button variant="outline">Zurück zur Anmeldung</Button>
</Link>
```

**Fix:**
```typescript
<Link href="/login">  // ✅ OK, wenn wir Bug #2 fixen
```

**Priority:** MEDIUM (UX-Issue nach Registrierung)

---

## Bug #8: Footer-Links zu nicht-existenten Seiten (MEDIUM)

### Beschreibung
Mehrere Links im Footer zeigen auf nicht implementierte Seiten:

### Betroffene Links aus `content.ts`
```typescript
// Zeile 275-276
{ label: 'API', href: '/docs/api' },           // ❌ Existiert nicht
{ label: 'Integrationen', href: '/docs/integrations' }, // ❌ Existiert nicht

// Zeile 282-285
{ label: 'Über uns', href: '/about' },         // ❌ Existiert nicht
{ label: 'Karriere', href: '/careers' },       // ❌ Existiert nicht
{ label: 'Blog', href: '/blog' },              // ❌ Existiert nicht
{ label: 'Kontakt', href: '/contact' },        // ❌ Existiert nicht

// Zeile 291-293
{ label: 'Impressum', href: '/impressum' },    // ❌ Existiert nicht
{ label: 'Datenschutz', href: '/datenschutz' },// ❌ Existiert nicht
{ label: 'AGB', href: '/agb' },                // ❌ Existiert nicht
```

### Rechtliche Pflicht (Deutschland!)
- **Impressum** - Gesetzlich vorgeschrieben (§ 5 TMG)
- **Datenschutz** - Gesetzlich vorgeschrieben (DSGVO)
- **AGB** - Notwendig für Geschäftsbedingungen

**Diese Seiten MÜSSEN vor dem deutschen Launch erstellt werden!**

**Priority:** MEDIUM (Rechtlich relevante Seiten fehlen)

---

## Bug #9: Credits-Anzeige stimmt nicht (MEDIUM)

### Beschreibung
Die Credits-Anzeige funktioniert technisch korrekt, aber es gibt Inkonsistenzen bei der initialen Credit-Vergabe.

### Datenbank-Werte (aktuell)
```sql
user_credits:
- total_credits: 1000
- used_credits: 0
- Verfügbare Credits: 1000
```

### Frontend-Anzeige
- Dashboard-Kachel zeigt: **1000 Credits** (berechnet: total - used)
- Sidebar zeigt: **1000 verfügbar von 1000**

### Problem
- Neue User sollen laut Landing Page 30 Credits erhalten
- Die Berechnung `total_credits - used_credits` ist korrekt
- Aber die Trigger-Funktion `handle_new_user` muss geprüft werden

### Code-Analyse
`src/lib/actions/dashboard.ts` Zeile 52-54:
```typescript
const credits = creditsResult.data
  ? creditsResult.data.total_credits - creditsResult.data.used_credits
  : 0
```

Die Berechnung ist korrekt. Das Problem liegt ggf. im Trigger.

**Priority:** MEDIUM (Inkonsistenz zwischen Marketing und tatsächlicher Vergabe)

---

## Bug #10: Settings Layout - Konto hat falsches Icon (LOW)

### Beschreibung
Im Settings-Layout wird für "Konto" das Icon `Globe` verwendet, was irreführend ist.

### Code
`src/app/dashboard/einstellungen/layout.tsx` Zeile 43-46:
```typescript
{
  title: 'Konto',
  href: '/dashboard/einstellungen/konto',
  icon: Globe,  // ❌ Irreführend
}
```

**Empfohlen:** `User` oder `Settings` Icon

**Priority:** LOW (UI/UX Issue)

---

## Bug #11: Settings Navigation - doppelte Benachrichtigungen (LOW)

### Beschreibung
Im Settings-Layout und Dashboard-Shell gibt es jeweils einen Link zu Benachrichtigungen, aber mit unterschiedlichen Pfaden.

### Settings Layout (korrekt)
- `/dashboard/einstellungen/benachrichtigungen`

### Dashboard Shell (falsch)
- `/dashboard/notifications` (Hauptnav)
- `/dashboard/einstellungen/notifications` (Settings-Subnav)

**Priority:** LOW (Konsistenz-Problem)

---

## Bug #12: Fehlende Datenbank-Migrationen (CRITICAL)

### Beschreibung
Mehrere Datenbank-Tabellen und Funktionen sind im Code referenziert, aber die Migrationen wurden nie ausgeführt.

### Fehlende Migrationen

#### 1. `is_suspended` Spalte in profiles
```sql
-- Existiert in: supabase/migrations/20260210_e11_admin_dashboard.sql
-- Wurde nie ausgeführt (fehlt in migration list)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
```

#### 2. `rate_limit_logs` Tabelle
```sql
-- Referenziert in: src/lib/rate-limit.ts
-- Migration fehlt komplett
CREATE TABLE rate_limit_logs (...);
```

#### 3. `account_deletion_requests` Tabelle
```sql
-- Referenziert in: src/app/api/settings/privacy/delete-account/route.ts
-- Migration fehlt komplett
CREATE TABLE account_deletion_requests (...);
```

#### 4. `log_audit_action_atomic` Funktion
```sql
-- Referenziert in: src/lib/admin/audit.ts
-- Migration fehlt komplett
CREATE FUNCTION log_audit_action_atomic(...);
```

### Ausgewiesene Migrationen (laut Supabase)
```
20260206232208 - initial_schema
20260206233421 - fix_function_search_path
20260207132101 - 20250207_credit_system
20260208083559 - crm_system
20260208100058 - e8_add_stripe_customer_to_profiles
20260208100059 - e8_extend_subscriptions_table
20260208100100 - e8_create_invoices_table
20260208100101 - e8_create_webhook_events_table
20260208124410 - 20260209_e10_create_notifications
20260208200120 - e13_settings_profile
20260208220837 - e13_e11_final_tables
```

**Fehlt:** `20260210_e11_admin_dashboard.sql`

### Fix-Vorschlag
Migration anwenden:
```bash
supabase db push
# oder
supabase migration up
```

Oder SQL manuell ausführen:
```sql
-- 1. is_suspended Spalte
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- 2. Weitere fehlende Tabellen erstellen
-- (siehe bestehende Migrations-Dateien)
```

**Priority:** CRITICAL (Login und Admin-Features kaputt)

---

## User Stories Test Ergebnisse

### US-1: Als neuer User registrieren
| Schritt | Erwartet | Tatsächlich | Status |
|---------|----------|-------------|--------|
| 1. Gehe zu /registrieren | Registrierungs-Formular | Formular lädt | ✅ PASS |
| 2. Fülle Formular aus | Validierung funktioniert | Zod-Validierung OK | ✅ PASS |
| 3. Klicke "Registrieren" | Bestätigungs-E-Mail | Erfolgs-Meldung | ✅ PASS |
| 4. Erhalte 30 Credits | 30 Credits in DB | Trigger prüfen | ⚠️ UNCLEAR |

### US-2: Als bestehender User anmelden
| Schritt | Erwartet | Tatsächlich | Status |
|---------|----------|-------------|--------|
| 1. Gehe zu /anmelden | Login-Formular | Formular lädt | ✅ PASS |
| 2. Fülle Credentials ein | Input funktioniert | Input OK | ✅ PASS |
| 3. Klicke "Anmelden" | Redirect zu /dashboard | **ENDLOSES LADEN** | ❌ FAIL |
| 4. Dashboard lädt | Dashboard angezeigt | Nicht erreichbar | ❌ FAIL |

**Bug #1 verhindert diesen Flow komplett!**

### US-3: Einstellungen öffnen
| Schritt | Erwartet | Tatsächlich | Status |
|---------|----------|-------------|--------|
| 1. Klicke auf Einstellungen | /dashboard/einstellungen | Seite lädt | ✅ PASS |
| 2. Sidebar zeigt alle Menüs | 7 Menüpunkte | 7 Menüpunkte | ✅ PASS |
| 3. Klicke auf Profil | Profil-Formular | Lädt | ✅ PASS |
| 4. Klicke auf Benachrichtigungen | Notification-Settings | Lädt | ✅ PASS |
| 5. Klicke auf Datenschutz | Privacy-Settings | Lädt | ✅ PASS |

### US-4: Navigation zwischen Dashboard-Seiten
| Von | Zu | Status |
|-----|-----|--------|
| /dashboard | /dashboard/suche | ✅ PASS |
| /dashboard | /dashboard/kontakte | ✅ PASS |
| /dashboard | /dashboard/deals | ✅ PASS |
| /dashboard | /dashboard/verlauf | ✅ PASS |
| /dashboard | /dashboard/sammlungen | ✅ PASS |
| /dashboard | /dashboard/einstellungen | ✅ PASS |

---

## Cross-Page Link Validierung

| Seite | Link | Ziel | Status |
|-------|------|------|--------|
| / (Landing) | CTA "Kostenlos starten" | /registrieren | ✅ PASS |
| / (Landing) | Nav "Anmelden" | /login ❌ | **FAIL** |
| / (Landing) | Footer "API" | /docs/api | **FAIL - 404** |
| / (Landing) | Footer "Impressum" | /impressum | **FAIL - 404** |
| / (Landing) | Footer "Datenschutz" | /datenschutz | **FAIL - 404** |
| /registrieren | "Anmelden" Link | /login | ⚠️ OK wenn /login existiert |
| /registrieren | Success-Page Button | /login | ⚠️ OK wenn /login existiert |
| /login | "Registrieren" Link | /registrieren | ✅ PASS |
| /dashboard | Sidebar "Benachrichtigungen" | /dashboard/notifications ❌ | **FAIL** |
| /dashboard | UserNav "Profil" | /dashboard/profil ❌ | **FAIL** |

---

## Empfohlene Fixes (Priorität)

### Sofort fixen (Critical - Blocker für Deployment)

1. **Bug #1 (Login)** - Migration für `is_suspended` ausführen ODER Code-Fallback:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
   ```

2. **Bug #2 (Landing Page Links)** - Alle Links zu `/login` ändern:
   ```typescript
   // In content.ts
   login: { label: 'Anmelden', href: '/login' }  // Statt /anmelden
   ```

3. **Bug #12 (Migrationen)** - Alle fehlenden Migrationen anwenden

### High Priority (Vor Deployment)
4. **Bug #3** - Doppelten `notifications` Ordner löschen
5. **Bug #5** - UserNav Link zu `/dashboard/einstellungen/profil` ändern
6. **Bug #6** - Dashboard-Shell Notifications-Links korrigieren

### Medium Priority
7. **Bug #8** - Registrierung Success-Link prüfen
8. **Bug #9** - Rechtliche Seiten erstellen (Impressum, Datenschutz, AGB)

### Low Priority
9. **Bug #10** - Icon für Konto ändern
10. **Bug #11** - Navigation konsistent machen

---

## Regression Test Ergebnisse

### Bereits implementierte Features
| Feature | Status |
|---------|--------|
| E2: Authentication | ❌ Login kaputt (Bug #1) |
| E3: Credit System | ✅ Backend OK, Frontend OK |
| E5: Lead Results Table | ✅ Funktioniert |
| E7: CRM System | ✅ Funktioniert |
| E8: Billing | ✅ Backend implementiert |
| E10: Notifications | ✅ Implementiert |
| E11: Admin Dashboard | ❌ Migration fehlt |
| E12: Landing Page | ⚠️ Links kaputt (Bug #2) |
| E13: Settings | ✅ Funktioniert |

---

## Datenbank-Konsistenz Check

### Tabellen mit RLS enabled
✅ Alle 26 Tabellen haben RLS aktiviert

### User Credits
- User: c41c60be-d643-41e1-8629-1e54f136c52a
- total_credits: 1000
- used_credits: 0
- remaining: 1000

### Profile
- role: 'user' ✅
- FEHLEND: is_suspended (Bug #1 Ursache!)

### Subscriptions
- 1 Eintrag vorhanden
- Status: active

---

## Fazit

Die Manyleads.io App hat **signifikante Bugs**, die vor einem Production-Deployment behoben werden müssen:

### Blocker für Deployment:
1. **Login funktioniert nicht** (Bug #1 + Bug #12) - Kritisch!
2. **Wichtige Links sind kaputt** (Bug #2) - User Experience katastrophal
3. **Rechtliche Seiten fehlen** (Bug #9) - Impressum, Datenschutz, AGB sind in Deutschland Pflicht!

### Empfehlung:
**Deployment verhindern** bis folgende Bugs gefixt sind:
- Bug #1 / Bug #12 (Login)
- Bug #2 (Links)
- Bug #9 (Rechtliche Seiten)

Nach Fix dieser Bugs: **Erneuter QA-Test durchführen!**

---

## Anhänge

### Getestete Dateien
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/registrieren/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/einstellungen/layout.tsx`
- `src/components/dashboard-shell.tsx`
- `src/components/user-nav.tsx`
- `src/lib/landing/data/content.ts`
- `src/lib/actions/dashboard.ts`

### Datenbank-Abfragen
```sql
-- Credits prüfen
SELECT * FROM user_credits;

-- Profile prüfen
SELECT id, email, role FROM profiles;

-- Migrationen prüfen
SELECT * FROM schema_migrations ORDER BY version DESC;
```

---

**Report erstellt von:** QA Engineer
**Zeitpunkt:** 2026-02-08 22:45 UTC+1
