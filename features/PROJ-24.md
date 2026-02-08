# PROJ-24: Billing Portal & Invoices

**Epic:** E8 - Stripe-Integration
**Status:** 🔵 Planned
**Priority:** Medium
**Assigned To:** Backend Developer, Frontend Developer

---

## Overview

Billing Portal & Invoices ermöglicht Nutzern, ihre Zahlungsmethoden zu verwalten, Rechnungen einzusehen und ihre Subscription-Einstellungen zu ändern. Nutzt Stripe Customer Portal für Self-Service-Billing.

---

## User Stories

### US-24.1: Stripe Customer Portal öffnen
**Als User möchte ich das Stripe Customer Portal öffnen, damit ich meine Zahlungsdaten verwalten kann.**

**Acceptance Criteria:**
- [ ] API Endpoint: `/api/billing/portal` (POST, authentifiziert)
- [ ] Stripe Billing Portal Session erstellen:
  ```typescript
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/einstellungen/abrechnung`,
    flow_data: {
      type: 'payment_method_update', // Optional: direkter Flow
    },
  });
  ```
- [ ] Konfiguration im Stripe Dashboard:
  - Enabled Features:
    - Zahlungsmethoden verwalten (add, remove, update)
    - Rechnungsverlauf (view, download)
    - Subscription verwalten (cancel, update)
    - Plan-Wechsel (Upgrade/Downgrade)
  - Business Information:
    - Name: Manyleads.io
    - Support Email: support@manyleads.io
    - Privacy Policy / Terms Links
- [ ] Return URL: `/dashboard/einstellungen/abrechnung`
- [ ] Redirect zu Stripe Portal URL (`session.url`)
- [ ] Session gültig für 1 Stunde

---

### US-24.2: Rechnungsliste anzeigen
**Als User möchte ich alle meine Rechnungen sehen, damit ich meine Zahlungen nachvollziehen kann.**

**Acceptance Criteria:**
- [ ] Route: `/dashboard/einstellungen/abrechnung`
- [ ] Sektion: "Rechnungsverlauf"
- [ ] Tabelle mit allen Invoices des Users:
  | Spalte | Inhalt |
  |--------|--------|
  | Datum | `created_at` formatted (DD.MM.YYYY) |
  | Beschreibung | `description` oder "[Plan] Plan ([Intervall])" |
  | Betrag | `amount_paid` / 100 € (mit MwSt) |
  | Status | Badge: Bezahlt (grün), Ausstehend (gelb), Fehlgeschlagen (rot) |
  | Aktionen | PDF-Download Button |
- [ ] Sortierung: Neueste zuerst (default)
- [ ] Pagination: 10 pro Seite
- [ ] Filter: Alle, Bezahlt, Ausstehend, Fehlgeschlagen
- [ ] Empty State: "Noch keine Rechnungen" (für Free-User)
- [ ] Loading State: Skeleton oder Spinner

**Database - Invoices Table:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT NOT NULL,
  amount_due INTEGER, -- Cent (inkl. MwSt)
  amount_paid INTEGER, -- Cent
  amount_remaining INTEGER, -- Cent
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_pdf TEXT, -- Stripe PDF URL
  hosted_invoice_url TEXT, -- Stripe hosted page URL
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own invoices" ON invoices
  FOR ALL USING (user_id = auth.uid());
```

---

### US-24.3: Rechnung herunterladen
**Als User möchte ich eine Rechnung als PDF herunterladen, damit ich sie für meine Buchhaltung speichern kann.**

**Acceptance Criteria:**
- [ ] Download-Button in Rechnungsliste (jede Zeile)
- [ ] Button öffnet `invoice_pdf` URL in neuem Tab
- [ ] Oder: Direct Download via `download` Attribute
- [ ] Dateiname: `Manyleads_Rechnung_[stripe_invoice_id].pdf`
- [ ] Icon: Download-Icon (Lucide)
- [ ] Tooltip: "PDF herunterladen"
- [ ] Falls PDF nicht verfügbar: Hosted URL öffnen (`hosted_invoice_url`)

---

### US-24.4: Zahlungsmethoden anzeigen
**Als User möchte ich meine gespeicherten Zahlungsmethoden sehen, damit ich den Überblick behalte.**

**Acceptance Criteria:**
- [ ] Sektion auf `/dashboard/einstellungen/abrechnung`
- [ ] Überschrift: "Zahlungsmethoden"
- [ ] Liste aller Payment Methods (von Stripe via API)
- [ ] Pro Payment Method:
  - Icon: Karten-Marke (Visa, Mastercard, etc.)
  - Letzte 4 Ziffern: "•••• 4242"
  - Ablaufdatum: "Läuft ab MM/YY"
  - Badge: "Standard" für Default
- [ ] Button: "Zahlungsmethode hinzufügen" → Öffnet Portal
- [ ] Button: "Zahlungsmethode ändern" → Öffnet Portal
- [ ] Nicht-Default Methoden können gelöscht werden (im Portal)
- [ ] Empty State: "Keine Zahlungsmethode gespeichert" (nur bei Free/Trial)

**API:**
```typescript
// /api/billing/payment-methods
const methods = await stripe.paymentMethods.list({
  customer: customerId,
  type: 'card',
});
```

---

### US-24.5: Billing-Einstellungen anzeigen
**Als User möchte ich meine Abonnement-Details sehen, damit ich den Status kenne.**

**Acceptance Criteria:**
- [ ] Card mit aktuellem Plan und Status auf `/dashboard/einstellungen/abrechnung`
- [ ] Anzeige-Felder:
  ```
  Aktueller Plan: Pro (Monatlich)
  Status: Aktiv / In Testphase / Gekündigt (endet am X)
  Nächste Abrechnung: €29,00 am 15.03.2026
  Zahlungsintervall: Monatlich
  Testphase endet: 22.02.2026 (falls in Trial)
  ```
- [ ] Status-Badges mit Farben:
  - Aktiv: Grün
  - Trialing: Blau
  - Canceled (aber noch aktiv): Orange
  - Past Due: Rot
- [ ] Action-Buttons je nach Status:
  - Free: "Upgrade zu Pro/Enterprise"
  - Pro/Enterprise aktiv: "Upgrade", "Downgrade", "Kündigen"
  - Trialing: "Kündigen" (beendet Trial sofort)
  - Canceled: "Reaktivieren"
- [ ] "Zahlungsmethode ändern" Button (öffnet Portal)
- [ ] "Rechnungsverlauf ansehen" Link

---

### US-24.6: Rechnungs-Email erhalten
**Als User möchte ich bei jeder neuen Rechnung eine Email erhalten, damit ich meine Zahlungen tracken kann.**

**Acceptance Criteria:**
- [ ] Email bei `invoice.payment_succeeded` Webhook
- [ ] Email-Template (Deutsch):
  ```
  Betreff: Ihre Rechnung von Manyleads.io - [Rechnungsnummer]

  Hallo [Name],

  vielen Dank für Ihr Vertrauen in Manyleads.io!

  Ihre Rechnung für den Zeitraum [Start] - [Ende]:

  Beschreibung: [Plan] Plan ([Intervall])
  Betrag: €[Betrag] (inkl. MwSt)
  Rechnungsnummer: [ID]

  Die Rechnung können Sie hier herunterladen:
  [PDF-Link]

  Fragen? Antworten Sie einfach auf diese Email.

  Mit freundlichen Grüßen,
  Das Manyleads.io Team
  ```
- [ ] Absender: billing@manyleads.io
- [ ] PDF-Link: `hosted_invoice_url` oder `invoice_pdf`

---

### US-24.7: Payment Failed Email
**Als User möchte ich bei Zahlungsproblemen eine Email erhalten, damit ich meine Zahlungsmethode aktualisieren kann.**

**Acceptance Criteria:**
- [ ] Email bei `invoice.payment_failed` Webhook
- [ ] Email-Template (Deutsch):
  ```
  Betreff: Zahlung fehlgeschlagen - Bitte aktualisieren Sie Ihre Zahlungsmethode

  Hallo [Name],

  die Zahlung für Ihren [Plan] Plan ist fehlgeschlagen.

  Betrag: €[Betrag]
  Grund: [Fehlermeldung]

  Bitte aktualisieren Sie Ihre Zahlungsmethode:
  [Billing Portal Link]

  Ihr Account bleibt noch 7 Tage aktiv. Danach wird Ihr Plan auf Free zurückgesetzt.

  Mit freundlichen Grüßen,
  Das Manyleads.io Team
  ```
- [ ] Retry-Schedule: Stripe versucht automatisch alle 3 Tage (Tag 1, 3, 5)
- [ ] Link zum Billing Portal für Zahlungsmethode-Update

---

## API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/billing/portal` | POST | Billing Portal Session erstellen | Required |
| `/api/billing/invoices` | GET | Rechnungen laden | Required |
| `/api/billing/payment-methods` | GET | Zahlungsmethoden laden | Required |
| `/api/billing/subscription` | GET | Subscription-Details | Required |

---

## Components

**Pages:**
- `BillingSettingsPage` (`/dashboard/einstellungen/abrechnung`)

**Components:**
- `BillingOverviewCard` (Plan-Status, Preis, Aktionen)
- `InvoiceList` (Tabelle mit Pagination)
- `InvoiceRow` (Einzelne Rechnung)
- `PaymentMethodsList` (Karten-Anzeige)
- `PaymentMethodCard` (Einzelne Karte)
- `BillingPortalButton` (Öffnet Portal)
- `StatusBadge` (Aktiv/Trial/Canceled/PastDue)
- `TrialBanner` (Dashboard-Banner für Trial/Canceled)

---

## Edge Cases

| ID | Kategorie | Scenario | Expected Behavior |
|----|-----------|----------|---------------------|
| **EC-24-01** | Invoice | Keine Rechnungen (Free-User) | Empty State: "Noch keine Rechnungen. Upgrade für Rechnungsverlauf." |
| **EC-24-02** | Invoice | PDF-Download nicht verfügbar | Fehlermeldung, stattdessen hosted_invoice_url öffnen |
| **EC-24-03** | Payment | Karte läuft bald ab | Stripe sendet automatisch Email (1 Monat vorher) |
| **EC-24-04** | Payment | Letzte Zahlungsmethode löschen | Stripe Portal verhindert das (mindestens 1 Methode) |
| **EC-24-05** | Portal | Session abgelaufen | Fehlermeldung, "Bitte erneut versuchen"-Button |
| **EC-24-06** | VAT | Rechnung mit/ohne MwSt | Korrekte Anzeige je nach Kunde (Stripe Tax) |
| **EC-24-07** | History | Sehr viele Rechnungen (>100) | Pagination, 10 pro Seite |
| **EC-24-08** | Currency | Andere Währung (nicht EUR) | Nicht unterstützt - nur EUR für DE-Markt |
| **EC-24-09** | Status | Subscription past_due | Roter Badge, "Zahlung erforderlich" |
| **EC-24-10** | Status | Subscription unpaid | Roter Badge, Plan-Downgrade imminent |
| **EC-24-11** | Access | User ohne Subscription | Zeigt Free-Status, Upgrade-CTA |
| **EC-24-12** | Sync | Invoice Webhook verspätet | Polling-Fallback alle 5 Minuten |

---

## Technical Requirements

### Billing Portal API

```typescript
// /api/billing/portal/route.ts
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Get Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return new Response('No billing account found', { status: 404 });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/einstellungen/abrechnung`,
  });

  return Response.json({ url: session.url });
}
```

### Invoices API

```typescript
// /api/billing/invoices/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response('Failed to load invoices', { status: 500 });
  }

  return Response.json({ invoices });
}
```

### Payment Methods API

```typescript
// /api/billing/payment-methods/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return Response.json({ methods: [] });
  }

  const methods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card',
  });

  // Get default payment method
  const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
  const defaultMethod = (customer as Stripe.Customer).invoice_settings?.default_payment_method;

  return Response.json({
    methods: methods.data.map(m => ({
      id: m.id,
      brand: m.card?.brand,
      last4: m.card?.last4,
      expMonth: m.card?.exp_month,
      expYear: m.card?.exp_year,
      isDefault: m.id === defaultMethod,
    })),
  });
}
```

---

## UI Specifications

### Billing Settings Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EINSTELLUNGEN                                                           │
│  Abrechnung & Pläne                                              [Zurück]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  IHR AKTUELLER PLAN                                              │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  Plan:            Pro (Monatlich)                               │    │
│  │  Status:          [AKTIV] (grün)                                │    │
│  │                                                                  │    │
│  │  Nächste Abrechnung:  €29,00 am 15.03.2026                      │    │
│  │  Zahlungsintervall:   Monatlich                                 │    │
│  │                                                                  │    │
│  │  [Upgrade zu Enterprise]  [Downgrade]  [Kündigen]               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ZAHLUNGSMETHODEN                                                │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  💳 Visa •••• 4242                                              │    │
│  │     Läuft ab 12/27                                               │    │
│  │     [STANDARD]                                                   │    │
│  │                                                                  │    │
│  │  [Zahlungsmethode ändern]                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  RECHNUNGSVERLAUF                                                │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  [Alle ▼]                    Zeige 1-10 von 24                   │    │
│  │                                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │ Datum      │ Beschreibung        │ Betrag    │ Status   │   │    │
│  │  │────────────│─────────────────────│───────────│──────────│   │    │
│  │  │ 15.02.2026 │ Pro (Monatlich)     │ €29,00    │ [BEZAHLT]│   │    │
│  │  │            │                     │           │ (grün)   │   │    │
│  │  │            │                                   [PDF ↓]   │   │    │
│  │  │────────────│─────────────────────│───────────│──────────│   │    │
│  │  │ 15.01.2026 │ Pro (Monatlich)     │ €29,00    │ [BEZAHLT]│   │    │
│  │  │            │                                   [PDF ↓]   │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │                                                                  │    │
│  │  ← 1 2 3 →                                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Trial Banner (Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎁 Sie sind in der 14-Tage-Testphase. Noch 5 Tage übrig.               │
│     [Upgrade jetzt]  [Mehr erfahren]                           [✕]      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️  Ihr Pro Plan endet am 15.03.2026. Möchten Sie fortfahren?          │
│     [Reaktivieren]  [Mehr erfahren]                            [✕]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

**Blocks:**
- None

**Blocked By:**
- PROJ-22 (Stripe Customer Setup, Webhooks)
- PROJ-23 (Subscription Management)

---

## Success Criteria

- [ ] Billing Portal öffnet sich korrekt
- [ ] Rechnungen werden in Liste angezeigt
- [ ] PDF-Download funktioniert
- [ ] Zahlungsmethoden werden angezeigt
- [ ] Abonnement-Details sind korrekt
- [ ] Rechnungs-Email wird bei Zahlung gesendet
- [ ] Payment-Failed-Email wird gesendet
- [ ] Status-Badges sind korrekt (Farben)
- [ ] Trial-Banner erscheint im Dashboard
- [ ] Canceled-Banner erscheint im Dashboard
- [ ] Deutsche UI überall
- [ ] Mobile-Ansicht nutzbar

---

## Estimated Effort

- Backend: 1-2 Tage (APIs, Webhooks für Invoices)
- Frontend: 2-3 Tage (UI, Integration)
- Email-Templates: 0.5 Tage
- Testing: 1 Tage

**Total:** 4-6 Tage
