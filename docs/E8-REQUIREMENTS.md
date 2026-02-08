# Epic E8: Stripe-Integration - Requirements

**Status:** 🔵 Planned
**Epic ID:** E8
**Projekte:** PROJ-22, PROJ-23, PROJ-24
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E8 implementiert die vollständige Stripe-Integration für Zahlungen und Abonnements bei Manyleads.io. Nutzer können zwischen verschiedenen Plänen wählen, Upgrades durchführen und ihr Abonnement selbst verwalten.

**Kern-Features:**
- Stripe Account Setup mit Products & Prices
- Webhook-Handling für Subscription-Events
- Stripe Checkout Integration
- Plan-Upgrades/Downgrades/Cancellations
- Customer Portal für Billing-Management
- Deutsche UI für Checkout
- 14-Tage Trial für Pro/Enterprise
- VAT/Steuer-Handling für Deutschland

**Kontext:**
- E5 (Search-System) ist COMPLETED - User können Leads suchen
- Credit-System ist implementiert (PROJ-10)
- Plan-Konfiguration existiert (Free, Pro, Enterprise)
- E7 (CRM) ist IN PROGRESS - Conversion-Tracking vorbereitet

---

## Preisstruktur

| Plan | Monatlich | Jährlich (20% Rabatt) | Features |
|------|-----------|----------------------|----------|
| **Free** | €0 | €0 | 50 Kontakte, 10 Deals, Basic Search |
| **Pro** | €29/Monat | €290/Jahr (€24.17/Monat) | 500 Kontakte, 100 Deals, Kanban, Import |
| **Enterprise** | €99/Monat | €990/Jahr (€82.50/Monat) | Unbegrenzt, API, Priority Support |

**Trial:** 14 Tage kostenlos für Pro/Enterprise, keine Kreditkarte erforderlich

---

## PROJ-22: Stripe Setup & Webhooks

**Status:** 🔵 Planned
**Abhängigkeiten:** Keine (Foundation-Feature)

### Beschreibung

Stripe Setup & Webhooks ist das Fundament für alle Zahlungsfeatures. Es umfasst die Stripe-Account-Konfiguration, Product/Price-Einrichtung, Webhook-Endpoint-Implementierung und die Synchronisation zwischen Stripe und Supabase.

---

### Stripe Products & Prices

#### Products (Stripe Dashboard)

```
Product: Pro Plan
├── Price: Pro Monthly - €29/Monat (recurring)
└── Price: Pro Yearly - €290/Jahr (recurring, 20% Rabatt)

Product: Enterprise Plan
├── Price: Enterprise Monthly - €99/Monat (recurring)
└── Price: Enterprise Yearly - €990/Jahr (recurring, 20% Rabatt)
```

#### Product-Metadaten (in Stripe)

```json
{
  "plan_id": "pro",
  "display_name": "Pro",
  "description": "Für kleine Teams und Einzelunternehmer",
  "features": "500 Kontakte,100 Deals,Kanban View,CSV Export"
}
```

---

### Webhook Events

| Event | Beschreibung | Aktion |
|-------|--------------|--------|
| `checkout.session.completed` | Checkout erfolgreich | Subscription in DB erstellen, Plan aktivieren |
| `invoice.payment_succeeded` | Zahlung erfolgreich | Invoice speichern, Payment-Status aktualisieren |
| `invoice.payment_failed` | Zahlung fehlgeschlagen | Email-Benachrichtigung, Grace Period starten |
| `customer.subscription.updated` | Subscription geändert | Plan-Update, Upgrade/Downgrade handling |
| `customer.subscription.deleted` | Subscription gekündigt | Plan auf Free setzen (am Period-Ende) |
| `customer.subscription.trial_will_end` | Trial endet bald | Erinnerungs-Email (3 Tage vor Ende) |

---

### User Stories

#### US-22.1: Stripe Customer erstellen
**Als System möchte ich automatisch einen Stripe Customer für neue User erstellen, damit Zahlungen zugeordnet werden können.**

**Acceptance Criteria:**
- [ ] Trigger: Bei User-Registrierung (nach `handle_new_user`)
- [ ] Stripe Customer wird mit Email und Name erstellt
- [ ] Stripe Customer ID wird in `profiles` Tabelle gespeichert
- [ ] Fehler werden geloggt, aber blockieren Registrierung nicht

**Database:**
```sql
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
```

---

#### US-22.2: Webhook Endpoint implementieren
**Als System möchte ich Stripe Webhooks empfangen und verarbeiten, damit Subscription-Events synchronisiert werden.**

**Acceptance Criteria:**
- [ ] Endpoint: `/api/webhooks/stripe` (POST)
- [ ] Stripe-Signature-Validierung mit `STRIPE_WEBHOOK_SECRET`
- [ ] Event-Typ-Filter: Nur relevante Events verarbeiten
- [ ] Idempotenz: Gleiches Event mehrfach = keine doppelte Aktion
- [ ] Fehler-Logging für ungültige Signatures
- [ ] 200 OK sofort zurückgeben, dann async verarbeiten

**Security:**
- [ ] Stripe Signature Verification (raw body verwenden)
- [ ] Rate Limiting (100 requests/min)
- [ ] IP-Allowlist (optional, Stripe IPs)

---

#### US-22.3: Checkout Session Completed Handler
**Als System möchte ich erfolgreiche Checkouts verarbeiten, damit der Plan sofort aktiviert wird.**

**Acceptance Criteria:**
- [ ] Extrahiert: customer_id, subscription_id, plan_id aus Metadata
- [ ] Erstellt/Updated Eintrag in `subscriptions` Tabelle
- [ ] Aktualisiert `plan` in profiles auf neuen Plan
- [ ] Aktualisiert `plan_expires_at` für nächste Abrechnung
- [ ] Erfolgs-Email an User senden

**Database:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### US-22.4: Payment Failed Handler
**Als System möchte ich fehlgeschlagene Zahlungen behandeln, damit User benachrichtigt werden.**

**Acceptance Criteria:**
- [ ] Bei `invoice.payment_failed`: Subscription-Status auf `past_due` setzen
- [ ] Email-Benachrichtigung an User senden
- [ ] Grace Period: 7 Tage weiterhin Pro/Enterprise Features
- [ ] Nach 7 Tagen: Status auf `unpaid`, Plan bleibt aktiv aber mit Warnung
- [ ] Retry-Logik: 3 Versuche (Tag 1, 3, 5) vor endgültigem Failed

---

#### US-22.5: Subscription Updated Handler
**Als System möchte ich Subscription-Änderungen verarbeiten, damit Upgrades/Downgrades korrekt synchronisiert werden.**

**Acceptance Criteria:**
- [ ] Plan-Change erkannt: Altes Price ID → Neues Price ID
- [ ] Upgrade: Sofortiger Wechsel, Differenz berechnen (Stripe macht das)
- [ ] Downgrade: Wechsel am Period-Ende
- [ ] Cancellation-Toggle: `cancel_at_period_end` aktualisieren
- [ ] Trial-Ende: Status von `trialing` zu `active` wechseln
- [ ] DB-Update: subscriptions Tabelle synchronisieren

---

#### US-22.6: Subscription Deleted Handler
**Als System möchte ich gekündigte Subscriptions verarbeiten, damit der Plan am Period-Ende auf Free zurückgesetzt wird.**

**Acceptance Criteria:**
- [ ] Bei `customer.subscription.deleted`: Plan auf `free` setzen
- [ ] Timing: Sofort nach Event (Stripe kündigt erst am Period-Ende)
- [ ] Kündigungs-Email an User senden
- [ ] Optional: Exit-Survey anbieten
- [ ] Credits bleiben erhalten (nicht resetten)
- [ ] Daten bleiben erhalten (nur Limits greifen)

---

### Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-22-01** | Webhook | Ungültige Stripe-Signature | 400 Error, Event ignorieren |
| **EC-22-02** | Webhook | Dupliziertes Event (gleiche ID) | Idempotenz-Check, keine doppelte Aktion |
| **EC-22-03** | Webhook | Unbekannter Event-Typ | Loggen, 200 OK (nicht 400) |
| **EC-22-04** | Webhook | Customer nicht in DB gefunden | Loggen, Admin-Benachrichtigung |
| **EC-22-05** | Webhook | Timeout bei Verarbeitung | 200 OK trotzdem, Retry über Stripe |
| **EC-22-06** | Webhook | Supabase DB-Error | Fehler loggen, Stripe wird retryen |
| **EC-22-07** | Sync | User löscht Account | Stripe Customer beibehalten (Datenschutz?) |
| **EC-22-08** | Sync | Subscription manuell in Stripe gekündigt | Webhook löst Downgrade aus |
| **EC-22-09** | Sync | Refund in Stripe ausgelöst | Kein autom. Downgrade, manuelle Review |
| **EC-22-10** | Sync | Chargeback/Dispute | Account suspendieren, Admin-Alert |

---

## PROJ-23: Checkout & Subscriptions

**Status:** 🔵 Planned
**Abhängigkeiten:** PROJ-22 (Stripe Setup)

### Beschreibung

Checkout & Subscriptions ermöglicht Nutzern, Pläne zu buchen, Upgrades durchzuführen und ihre Subscriptions zu verwalten. Beinhaltet die Upgrade-Seite, Stripe Checkout Integration und Plan-Gating-Logik.

---

### User Stories

#### US-23.1: Upgrade-Seite anzeigen
**Als Free-User möchte ich eine Übersicht aller Pläne sehen, damit ich den passenden Plan wählen kann.**

**Acceptance Criteria:**
- [ ] Route: `/upgrade` (öffentlich, aber mit Auth-Redirect nach Checkout)
- [ ] 3 Plan-Cards: Free, Pro, Enterprise
- [ ] Aktueller Plan als "Ihr aktueller Plan" markiert
- [ ] Feature-Vergleich pro Plan (Checkmarks/X)
- [ ] Preisanzeige: Monatlich/Jährlich Toggle
- [ ] "Upgrade" Button für höhere Pläne
- [ ] "Downgrade" Button für niedrigere Pläne (Hinweis: am Period-Ende)
- [ ] Trial-Hinweis: "14 Tage kostenlos testen"
- [ ] FAQ-Sektion: Wie funktioniert das Upgrade?

**UI Labels (Deutsch):**
| Label | German |
|-------|--------|
| Upgrade | Upgrade |
| Choose Your Plan | Wählen Sie Ihren Plan |
| Monthly | Monatlich |
| Yearly | Jährlich (20% sparen) |
| Current Plan | Ihr aktueller Plan |
| Start Trial | Kostenlos testen |
| Upgrade Now | Jetzt upgraden |
| Downgrade | Downgrade |
| Most Popular | Beliebt |
| 14 days free | 14 Tage kostenlos |
| No credit card required | Keine Kreditkarte erforderlich |
| Cancel anytime | Jederzeit kündbar |

---

#### US-23.2: Checkout Session erstellen
**Als User möchte ich zu Stripe Checkout weitergeleitet werden, damit ich sicher bezahlen kann.**

**Acceptance Criteria:**
- [ ] API Endpoint: `/api/checkout` (POST)
- [ ] Request Body: `planId` ('pro' | 'enterprise'), `billingInterval` ('monthly' | 'yearly')
- [ ] Stripe Checkout Session wird erstellt mit:
  - `customer`: Stripe Customer ID des Users
  - `line_items`: Price ID basierend auf Plan + Interval
  - `mode`: 'subscription'
  - `subscription_data.trial_period_days`: 14 (für Pro/Enterprise)
  - `success_url`: `/upgrade/success?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: `/upgrade?canceled=true`
  - `metadata`: `{ userId, planId, billingInterval }`
- [ ] 14-Tage Trial automatisch hinzufügen
- [ ] VAT automatisch berechnen (Stripe Tax)
- [ ] Redirect zu Stripe Checkout URL

---

#### US-23.3: Checkout Success Handler
**Als User möchte ich nach erfolgreichem Checkout auf eine Bestätigungsseite geleitet werden.**

**Acceptance Criteria:**
- [ ] Route: `/upgrade/success`
- [ ] Query Param: `session_id` validieren
- [ ] Checkout Session von Stripe abrufen
- [ ] Bestätigung anzeigen: "Willkommen im [Plan]!"
- [ ] Trial-Info: "Ihre 14-Tage-Testphase läuft bis [Datum]"
- [ ] Button: "Zum Dashboard"
- [ ] Confetti-Animation (optional)
- [ ] Event-Tracking: "Subscription Started"

---

#### US-23.4: Checkout Cancel Handler
**Als User möchte ich bei Checkout-Abbuch zurück zur Upgrade-Seite kommen.**

**Acceptance Criteria:**
- [ ] Cancel-Redirect zu `/upgrade?canceled=true`
- [ ] Toast/Info-Message: "Checkout abgebrochen. Ihr Plan bleibt unverändert."
- [ ] Plan bleibt unverändert (Free)
- [ ] Kein Stripe Customer/Subscription erstellt

---

#### US-23.5: Upgrade von Free zu Pro/Enterprise
**Als Free-User möchte ich jederzeit upgraden können, damit ich sofort mehr Features nutzen kann.**

**Acceptance Criteria:**
- [ ] Upgrade-Button auf /upgrade für Free-User
- [ ] Checkout Session mit Trial (14 Tage)
- [ ] Nach Checkout: Plan sofort auf Pro/Enterprise
- [ ] Limits sofort erhöht (kein Logout nötig)
- [ ] Willkommens-Email mit Feature-Übersicht

---

#### US-23.6: Upgrade von Pro zu Enterprise
**Als Pro-User möchte ich auf Enterprise upgraden können, damit ich mehr Limits und Features bekomme.**

**Acceptance Criteria:**
- [ ] Upgrade-Button auf /upgrade (Enterprise-Card)
- [ ] Sofortige Rechnung für Differenz (Stripe Proration)
- [ ] Plan sofort auf Enterprise geändert
- [ ] Neue Limits sofort aktiv
- [ ] Email: "Sie sind jetzt Enterprise-User"

---

#### US-23.7: Downgrade Handling
**Als Pro/Enterprise-User möchte ich meinen Plan downgraden können, damit ich Kosten spare.**

**Acceptance Criteria:**
- [ ] Downgrade-Button auf /upgrade für niedrigere Pläne
- [ ] Confirmation-Dialog: "Plan-Wechsel am [Period-Ende]"
- [ ] `cancel_at_period_end` wird NICHT gesetzt (nur Plan-Change)
- [ ] Stripe Subscription Update mit neuer Price ID
- [ ] Downgrade wird am Period-Ende aktiv
- [ ] Email-Benachrichtigung: "Downgrade geplant für [Datum]"
- [ ] User kann Downgrade vor Period-Ende abbrechen

---

#### US-23.8: Subscription kündigen
**Als User möchte ich mein Abonnement kündigen können, damit es am Period-Ende endet.**

**Acceptance Criteria:**
- [ ] Kündigen-Button im Billing-Portal (PROJ-24)
- [ ] Confirmation-Dialog: "Wirklich kündigen?"
- [ ] Alternative anbieten: Pause, Downgrade, Support-Chat
- [ ] `cancel_at_period_end` = true in Stripe
- [ ] Status in DB: `canceled` aber `current_period_end` in Zukunft
- [ ] Banner im Dashboard: "Ihr Plan endet am [Datum]"
- [ ] Reaktivierung möglich vor Period-Ende
- [ ] Nach Period-Ende: Automatischer Wechsel zu Free

---

#### US-23.9: Subscription reaktivieren
**Als User mit gekündigtem Abonnement möchte ich es reaktivieren können, damit ich nicht unterbrochen werde.**

**Acceptance Criteria:**
- [ ] "Reaktivieren" Button wenn `cancel_at_period_end = true`
- [ ] Stripe API: `cancel_at_period_end` = false
- [ ] Sofortige Bestätigung: "Ihr Abonnement läuft weiter"
- [ ] Banner verschwindet
- [ ] Email-Bestätigung

---

#### US-23.10: Plan-Gating Sync
**Als System möchte ich den User-Plan synchronisieren, damit Feature-Limits korrekt angewendet werden.**

**Acceptance Criteria:**
- [ ] `usePlan()` Hook liest Plan aus `profiles` Tabelle
- [ ] Bei Subscription-Change: Plan in profiles aktualisieren
- [ ] Real-time Sync: Kein Logout nötig
- [ ] Cache-Invalidation nach Plan-Change
- [ ] Edge Case: Trial-Ende → automatischer Wechsel zu Free (falls keine Zahlung)

---

### Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-23-01** | Checkout | User hat bereits aktiven Plan | Upgrade-Logik (Proration) |
| **EC-23-02** | Checkout | User hat gekündigt aber noch aktiv | Reaktivierungs-Option |
| **EC-23-03** | Checkout | Zahlungsmethode abgelehnt | Stripe-Error anzeigen, Retry |
| **EC-23-04** | Checkout | 3D Secure Authentifizierung | Stripe handled automatisch |
| **EC-23-05** | Upgrade | Upgrade während Trial | Trial bleibt, neuer Plan nach Trial |
| **EC-23-06** | Downgrade | Downgrade zu Free während über Limits | Warnung: "Sie haben X Kontakte zu viel" |
| **EC-23-07** | Cancel | Kündigung während Trial | Sofort Free, keine Kosten |
| **EC-23-08** | Reactivate | Reaktivierung nach Period-Ende | Neuer Checkout nötig |
| **EC-23-09** | Sync | Webhook verspätet | Polling-Fallback alle 5 Minuten |
| **EC-23-10** | VAT | B2B-Kunde mit VAT ID | VAT-Reverse-Charge (0% MwSt) |
| **EC-23-11** | Trial | Trial ohne Kreditkarte | Stripe erlaubt das (Trial_settings) |
| **EC-23-12** | Trial | Trial-Ende, keine Zahlung | Grace Period 3 Tage, dann Free |

---

## PROJ-24: Billing Portal & Invoices

**Status:** 🔵 Planned
**Abhängigkeiten:** PROJ-22 (Stripe Setup)

### Beschreibung

Billing Portal & Invoices ermöglicht Nutzern, ihre Zahlungsmethoden zu verwalten, Rechnungen einzusehen und ihre Subscription-Einstellungen zu ändern. Nutzt Stripe Customer Portal für die meisten Funktionen.

---

### User Stories

#### US-24.1: Stripe Customer Portal öffnen
**Als User möchte ich das Stripe Customer Portal öffnen, damit ich meine Zahlungsdaten verwalten kann.**

**Acceptance Criteria:**
- [ ] API Endpoint: `/api/billing/portal` (POST)
- [ ] Stripe Billing Portal Session erstellen
- [ ] Konfiguration:
  - `customer`: Stripe Customer ID
  - `return_url`: `/dashboard/einstellungen/abrechnung`
  - `flow_data`: Optional für direkten Flow
- [ ] Features im Portal:
  - Zahlungsmethoden verwalten
  - Rechnungsverlauf
  - Subscription kündigen/reaktivieren
  - Plan-Wechsel (Upgrade/Downgrade)
- [ ] Redirect zu Stripe Portal URL

---

#### US-24.2: Rechnungsliste anzeigen
**Als User möchte ich alle meine Rechnungen sehen, damit ich meine Zahlungen nachvollziehen kann.**

**Acceptance Criteria:**
- [ ] Route: `/dashboard/einstellungen/abrechnung`
- [ ] Tabelle mit allen Invoices des Users
- [ ] Spalten: Datum, Beschreibung (Plan), Betrag, Status, Aktionen
- [ ] Status: Bezahlt, Ausstehend, Fehlgeschlagen
- [ ] Sortierung: Neueste zuerst
- [ ] Pagination: 10 pro Seite
- [ ] Download-Button für PDF (Stripe-Link)

**Database:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  amount_due INTEGER, -- Cent
  amount_paid INTEGER,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_pdf TEXT, -- Stripe PDF URL
  hosted_invoice_url TEXT, -- Stripe hosted page
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### US-24.3: Rechnung herunterladen
**Als User möchte ich eine Rechnung als PDF herunterladen, damit ich sie für meine Buchhaltung speichern kann.**

**Acceptance Criteria:**
- [ ] Download-Button in Rechnungsliste
- [ ] Öffnet Stripe-PDF in neuem Tab
- [ ] Oder direkter Download via `invoice_pdf` URL
- [ ] Dateiname: `Manyleads_Rechnung_[Nummer].pdf`

---

#### US-24.4: Zahlungsmethoden anzeigen
**Als User möchte ich meine gespeicherten Zahlungsmethoden sehen, damit ich den Überblick behalte.**

**Acceptance Criteria:**
- [ ] Sektion auf `/dashboard/einstellungen/abrechnung`
- [ ] Liste aller Payment Methods (von Stripe)
- [ ] Anzeige: Karten-Marke (Visa/MC), letzte 4 Ziffern, Ablaufdatum
- [ ] Default Payment Method markiert
- [ ] "Zahlungsmethode hinzufügen" Button → Portal
- [ ] "Löschen" Button für nicht-Default Methoden → Portal

---

#### US-24.5: Billing-Einstellungen anzeigen
**Als User möchte ich meine Abonnement-Details sehen, damit ich den Status kenne.**

**Acceptance Criteria:**
- [ ] Card mit aktuellem Plan und Status
- [ ] Anzeige:
  - Aktueller Plan (Free/Pro/Enterprise)
  - Status (Aktiv, Gekündigt, Trial)
  - Nächste Abrechnung (Datum, Betrag)
  - Zahlungsintervall (Monatlich/Jährlich)
  - Trial-Ende (falls in Trial)
- [ ] "Upgrade" / "Downgrade" / "Kündigen" Buttons
- [ ] "Zahlungsmethode ändern" Button

---

#### US-24.6: Rechnungs-Email erhalten
**Als User möchte ich bei jeder neuen Rechnung eine Email erhalten, damit ich meine Zahlungen tracken kann.**

**Acceptance Criteria:**
- [ ] Email bei `invoice.payment_succeeded`
- [ ] Email-Template: Deutsch
- [ ] Inhalt: Betrag, Periode, Download-Link
- [ ] Absender: billing@manyleads.io

---

### Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-24-01** | Invoice | Keine Rechnungen (Free-User) | Empty State: "Noch keine Rechnungen" |
| **EC-24-02** | Invoice | PDF-Download nicht verfügbar | Fehlermeldung: "PDF nicht verfügbar" |
| **EC-24-03** | Payment | Karte läuft ab | Stripe Email 1 Monat vorher |
| **EC-24-04** | Payment | Letzte Zahlungsmethode löschen | Stripe verhindert das (Portal) |
| **EC-24-05** | Portal | Session abgelaufen | Neuen Portal-Link generieren |
| **EC-24-06** | VAT | Rechnung mit/ohne MwSt | Korrekte Anzeige je nach Kunde |
| **EC-24-07** | History | Sehr viele Rechnungen (>100) | Pagination oder Lazy Loading |
| **EC-24-08** | Currency | Währung ändert sich | EUR bleibt fest (nur DE-Markt) |

---

## Technische Anforderungen

### Stripe Konfiguration

**Environment Variables:**
```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Test)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...

# Stripe Tax Settings
STRIPE_TAX_SETTINGS=txs_...
```

### API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/webhooks/stripe` | POST | Stripe Webhook Handler |
| `/api/checkout` | POST | Checkout Session erstellen |
| `/api/checkout/success` | GET | Checkout Success verifizieren |
| `/api/billing/portal` | POST | Billing Portal Session |
| `/api/billing/invoices` | GET | Rechnungen laden |
| `/api/billing/subscription` | GET | Aktuelle Subscription |

### Datenbank Schema Erweiterungen

```sql
-- Profiles: Stripe Customer ID
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;

-- Subscriptions Tabelle
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Tabelle
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  amount_due INTEGER,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  description TEXT,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
```

### Performance

| Operation | Ziel |
|-----------|------|
| Checkout Session erstellen | < 500ms |
| Webhook Verarbeitung | < 1s (async) |
| Billing Portal öffnen | < 500ms |
| Invoice-Liste laden | < 300ms |
| Plan-Sync | Real-time via Webhook |

### Email-Benachrichtigungen

| Event | Empfänger | Timing |
|-------|-----------|--------|
| Subscription Started | User | Sofort nach Checkout |
| Trial Endet Bald | User | 3 Tage vor Trial-Ende |
| Payment Failed | User | Sofort + Retry-Reminders |
| Invoice Created | User | Sofort nach Zahlung |
| Subscription Canceled | User | Sofort nach Kündigung |
| Plan Changed | User | Sofort nach Upgrade/Downgrade |

---

## UI Spezifikationen

### Upgrade-Seite Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VOLLENDEN SIE IHRE REGISTRIERUNG                                        │
│  Wählen Sie Ihren Plan                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Monatlich] [Jährlich - 20% sparen]                                    │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │   FREE        │  │   PRO         │  │  ENTERPRISE   │                │
│  │   €0          │  │   €29/Monat   │  │   €99/Monat   │                │
│  │               │  │   BELIEBT     │  │               │                │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤                │
│  │ • 50 Kontakte │  │ • 500 Kontakte│  │ • Unbegrenzt  │                │
│  │ • 10 Deals    │  │ • 100 Deals   │  │ • Unbegrenzt  │                │
│  │ • Basis-Suche │  │ • Kanban      │  │ • API-Zugang  │                │
│  │               │  │ • Import      │  │ • Priority    │                │
│  │               │  │ • Export      │  │   Support     │                │
│  │               │  │               │  │               │                │
│  │  AKTUELLER    │  │  14 TAGE      │  │  14 TAGE      │                │
│  │     PLAN      │  │  KOSTENLOS    │  │  KOSTENLOS    │                │
│  │               │  │   TESTEN      │  │   TESTEN      │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│                                                                          │
│  ✓ Jederzeit kündbar  ✓ Keine Kreditkarte für Trial                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Billing-Einstellungen Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ABRECHNUNG & PLÄNE                                              [Zurück]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  IHR AKTUELLER PLAN                                              │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  Plan: Pro (Monatlich)                                          │    │
│  │  Status: Aktiv                                                   │    │
│  │  Nächste Abrechnung: €29 am 15.03.2026                          │    │
│  │                                                                  │    │
│  │  [Upgrade zu Enterprise]  [Downgrade]  [Kündigen]               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ZAHLUNGSMETHODEN                                                │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  💳 Visa •••• 4242 (läuft 12/27)                                │    │
│  │     Standard-Zahlungsmethode                                     │    │
│  │                                                                  │    │
│  │  [Zahlungsmethode ändern]                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  RECHNUNGEN                                                      │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  Datum          Beschreibung              Betrag      Status    │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │  15.02.2026     Pro Plan (Monatlich)      €29,00      Bezahlt   │    │
│  │  15.01.2026     Pro Plan (Monatlich)      €29,00      Bezahlt   │    │
│  │                                                                  │    │
│  │  [PDF] [PDF]                                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Abhängigkeiten

### PROJ-22 hängt ab von:
- Keine (Foundation-Feature)

### PROJ-23 hängt ab von:
- PROJ-22 (Stripe Setup, Webhooks)
- PROJ-8 (User-Provider für Plan-Info)

### PROJ-24 hängt ab von:
- PROJ-22 (Stripe Customer Setup)
- PROJ-23 (Subscription Management)

---

## VAT/Steuer-Handling

### Konfiguration (Stripe Tax)

1. **Stripe Tax aktivieren** im Dashboard
2. **Tax Settings** für Deutschland:
   - Standard-MwSt: 19%
   - B2B Reverse-Charge: 0% (mit gültiger VAT ID)
3. **Tax Location** aus IP-Adresse oder Billing-Adresse bestimmen

### Preis-Anzeige

| Szenario | Anzeige |
|----------|---------|
| B2C Deutschland | €29 + €5,51 MwSt = €34,51 |
| B2B Deutschland (mit VAT) | €29 + €0 MwSt = €29 (Reverse-Charge) |
| B2B EU (außer DE) | €29 + €0 MwSt = €29 (Reverse-Charge) |

### Implementation

```typescript
// Checkout Session mit Tax
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [...],
  mode: 'subscription',
  automatic_tax: { enabled: true },  // Stripe Tax aktivieren
  subscription_data: {
    trial_period_days: 14,
    metadata: { ... }
  },
  success_url: ...,
  cancel_url: ...,
});
```

---

## Trial-Period Handling

### 14-Tage Trial

- **Start:** Automatisch bei Checkout für Pro/Enterprise
- **Features:** Voller Zugriff auf alle Plan-Features
- **Kosten:** €0 während Trial
- **Ende:** Automatische Zahlung bei aktiver Kreditkarte
- **Keine Karte:** Downgrade zu Free nach Trial

### Trial-Ende Prozess

1. **3 Tage vorher:** Erinnerungs-Email
2. **1 Tag vorher:** Letzte Erinnerung
3. **Am Tag:**
   - Mit Karte: Automatische Zahlung, Status → active
   - Ohne Karte: 3 Tage Grace Period
4. **Nach Grace Period:** Status → canceled, Plan → Free

---

## Refund-Handling

### Policy

- **14 Tage:** Voller Refund ohne Fragen (Widerrufsrecht)
- **Danach:** Case-by-case, Support-Ticket öffnen
- **Stripe:** Refund über Stripe Dashboard manuell

### Prozess

1. User kontaktiert Support
2. Review durch Admin
3. Stripe Refund auslösen
4. User benachrichtigen
5. Subscription bleibt aktiv bis Period-Ende (oder sofort canceln)

---

## QA Checklist (für später)

### PROJ-22 Testfälle
- [ ] Stripe Customer wird bei Registrierung erstellt
- [ ] Webhook Endpoint akzeptiert gültige Events
- [ ] Webhook lehnt ungültige Signature ab
- [ ] checkout.session.completed aktiviert Plan
- [ ] invoice.payment_failed sendet Email
- [ ] subscription.updated syncs mit DB
- [ ] subscription.deleted setzt Plan auf Free

### PROJ-23 Testfälle
- [ ] Upgrade-Seite zeigt alle Pläne
- [ ] Checkout funktioniert mit Test-Karte
- [ ] Trial wird korrekt hinzugefügt (14 Tage)
- [ ] Upgrade Pro → Enterprise funktioniert
- [ ] Downgrade wird am Period-Ende aktiv
- [ ] Kündigung setzt cancel_at_period_end
- [ ] Reaktivierung funktioniert vor Period-Ende
- [ ] Plan-Sync ist real-time

### PROJ-24 Testfälle
- [ ] Billing Portal öffnet sich korrekt
- [ ] Rechnungen werden gelistet
- [ ] PDF-Download funktioniert
- [ ] Zahlungsmethoden werden angezeigt
- [ ] Abonnement-Details sind korrekt
- [ ] Email-Benachrichtigungen werden gesendet

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Pending Solution Architect Review
