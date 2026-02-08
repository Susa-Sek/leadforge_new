# PROJ-23: Checkout & Subscriptions

**Epic:** E8 - Stripe-Integration
**Status:** 🔵 Planned
**Priority:** High
**Assigned To:** Backend Developer, Frontend Developer

---

## Overview

Checkout & Subscriptions ermöglicht Nutzern, Pläne zu buchen, Upgrades durchzuführen und ihre Subscriptions zu verwalten. Beinhaltet die Upgrade-Seite, Stripe Checkout Integration, Plan-Gating-Logik und Subscription-Management.

---

## User Stories

### US-23.1: Upgrade-Seite anzeigen
**Als Free-User möchte ich eine Übersicht aller Pläne sehen, damit ich den passenden Plan wählen kann.**

**Acceptance Criteria:**
- [ ] Route: `/upgrade` (authentifiziert, aber auch für nicht-eingeloggte sichtbar mit Auth-Prompt)
- [ ] 3 Plan-Cards: Free, Pro, Enterprise
- [ ] Aktueller Plan als "Ihr aktueller Plan" markiert (Badge)
- [ ] Feature-Vergleich pro Plan mit Checkmarks/X
- [ ] Preisanzeige: Monatlich/Jährlich Toggle (persistiert in State)
- [ ] Jährlich-Preis zeigt "20% sparen" Badge
- [ ] "Upgrade" Button für höhere Pläne (Primary)
- [ ] "Downgrade" Button für niedrigere Pläne (Secondary, Hinweis: am Period-Ende)
- [ ] Trial-Hinweis prominent: "14 Tage kostenlos testen"
- [ ] FAQ-Sektion (Accordion): Wie funktioniert das Upgrade? Was ist mit Trial?
- [ ] Trust-Indikatoren: "Jederzeit kündbar", "Keine Kreditkarte für Trial"

**Plan-Feature-Vergleich:**

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Kontakte | 50 | 500 | Unbegrenzt |
| Deals | 10 | 100 | Unbegrenzt |
| Such-Export | 10/Monat | 100/Monat | 500/Monat |
| Kanban View | ❌ | ✅ | ✅ |
| CSV Import | ❌ | ✅ | ✅ |
| CSV Export | ❌ | ✅ | ✅ |
| API-Zugang | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

**UI Labels (Deutsch):**
| English | German |
|---------|--------|
| Upgrade | Upgrade |
| Choose Your Plan | Wählen Sie Ihren Plan |
| Monthly | Monatlich |
| Yearly | Jährlich |
| Save 20% | 20% sparen |
| Current Plan | Ihr aktueller Plan |
| Start Free Trial | Kostenlos testen |
| Upgrade Now | Jetzt upgraden |
| Downgrade Plan | Downgrade |
| Most Popular | Beliebt |
| 14 days free | 14 Tage kostenlos |
| No credit card required | Keine Kreditkarte erforderlich |
| Cancel anytime | Jederzeit kündbar |
| Features | Funktionen |
| Compare Plans | Pläne vergleichen |

---

### US-23.2: Checkout Session erstellen
**Als User möchte ich zu Stripe Checkout weitergeleitet werden, damit ich sicher bezahlen kann.**

**Acceptance Criteria:**
- [ ] API Endpoint: `/api/checkout` (POST, authentifiziert)
- [ ] Request Body Validation:
  ```typescript
  { planId: 'pro' | 'enterprise', billingInterval: 'monthly' | 'yearly' }
  ```
- [ ] Error Handling:
  - Ungültiger Plan: 400 Bad Request
  - Bereits aktiver Plan: 409 Conflict
  - Kein Stripe Customer: 500 (sollte nie passieren)
- [ ] Stripe Checkout Session erstellen:
  ```typescript
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId, planId, billingInterval }
    },
    automatic_tax: { enabled: true },
    success_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/upgrade?canceled=true`,
    metadata: { userId, planId, billingInterval },
    allow_promotion_codes: true, // Für Coupons
    billing_address_collection: 'required', // Für VAT
  });
  ```
- [ ] 14-Tage Trial automatisch hinzufügen
- [ ] VAT automatisch berechnen (Stripe Tax)
- [ ] Redirect zu Stripe Checkout URL (`session.url`)

**Price ID Mapping:**
```typescript
const priceMap = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  },
};
```

---

### US-23.3: Checkout Success Handler
**Als User möchte ich nach erfolgreichem Checkout auf eine Bestätigungsseite geleitet werden.**

**Acceptance Criteria:**
- [ ] Route: `/upgrade/success`
- [ ] Query Param: `session_id` (required)
- [ ] Session validieren:
  - `stripe.checkout.sessions.retrieve(session_id)`
  - Prüfen ob `payment_status === 'paid'` oder `subscription` vorhanden
- [ ] Bestätigung anzeigen:
  - "Willkommen im [Plan]!"
  - Trial-Info: "Ihre 14-Tage-Testphase läuft bis [Datum]"
  - Nächste Zahlung: [Betrag] am [Datum] (nach Trial)
- [ ] Button: "Zum Dashboard"
- [ ] Confetti-Animation (optional, lottie oder canvas)
- [ ] Event-Tracking: "subscription_started"
- [ ] Error-Case: Ungültige Session → Redirect zu `/upgrade?error=invalid`

---

### US-23.4: Checkout Cancel Handler
**Als User möchte ich bei Checkout-Abbruch zurück zur Upgrade-Seite kommen.**

**Acceptance Criteria:**
- [ ] Cancel-Redirect zu `/upgrade?canceled=true`
- [ ] Toast/Info-Message anzeigen:
  - "Checkout abgebrochen. Ihr Plan bleibt unverändert."
  - Oder: "Kein Problem! Sie können jederzeit upgraden."
- [ ] Plan bleibt unverändert (Free)
- [ ] Kein Stripe Customer/Subscription erstellt
- [ ] "Zurück zum Checkout" Button ermöglicht Retry

---

### US-23.5: Upgrade von Free zu Pro/Enterprise
**Als Free-User möchte ich jederzeit upgraden können, damit ich sofort mehr Features nutzen kann.**

**Acceptance Criteria:**
- [ ] Upgrade-Button auf /upgrade für Free-User sichtbar
- [ ] Checkout Session mit Trial (14 Tage)
- [ ] Nach Checkout: Plan sofort auf Pro/Enterprise
- [ ] Limits sofort erhöht (kein Logout nötig)
- [ ] Dashboard-Refresh: Neue Features sofort verfügbar
- [ ] Willkommens-Email mit Feature-Übersicht senden
- [ ] Banner im Dashboard: "Willkommen im Pro Plan!"

---

### US-23.6: Upgrade von Pro zu Enterprise
**Als Pro-User möchte ich auf Enterprise upgraden können, damit ich mehr Limits und Features bekomme.**

**Acceptance Criteria:**
- [ ] Upgrade-Button auf /upgrade (Enterprise-Card)
- [ ] Sofortige Rechnung für Differenz (Stripe Proration)
  - Stripe berechnet automatisch verbleibende Tage
  - Sofortige Charge für Differenz
- [ ] Plan sofort auf Enterprise geändert (kein Warten)
- [ ] Neue Limits sofort aktiv
- [ ] Email: "Sie sind jetzt Enterprise-User"
- [ ] Dashboard-Banner: Upgrade-Bestätigung

**Proration:**
- Stripe handled automatisch via `proration_behavior: 'create_prorations'`
- User sieht Differenz-Betrag im Checkout

---

### US-23.7: Downgrade Handling
**Als Pro/Enterprise-User möchte ich meinen Plan downgraden können, damit ich Kosten spare.**

**Acceptance Criteria:**
- [ ] Downgrade-Button auf /upgrade für niedrigere Pläne
- [ ] Confirmation-Dialog:
  - Titel: "Plan-Downgrade bestätigen"
  - Text: "Ihr Downgrade zu [Plan] wird am [Period-Ende] aktiv."
  - "Sie haben bis dahin weiterhin Zugriff auf [aktueller Plan]."
  - Buttons: "Downgrade bestätigen", "Abbrechen"
- [ ] API: Stripe Subscription Update
  - `items[0].price = newPriceId`
  - `proration_behavior: 'none'` (keine Rückerstattung)
- [ ] Downgrade wird am Period-Ende aktiv (Stripe-handled)
- [ ] Email-Benachrichtigung: "Downgrade geplant für [Datum]"
- [ ] User kann Downgrade vor Period-Ende abbrechen (US-23.9)
- [ ] Banner im Dashboard: "Downgrade geplant: [neuer Plan] ab [Datum]"

---

### US-23.8: Subscription kündigen
**Als User möchte ich mein Abonnement kündigen können, damit es am Period-Ende endet.**

**Acceptance Criteria:**
- [ ] Kündigen-Button im Billing-Portal und auf Plan-Seite
- [ ] Confirmation-Dialog mit Alternativen:
  - Titel: "Möchten Sie wirklich kündigen?"
  - Alternativen-Liste:
    - "Pause statt kündigen?" (späteres Feature)
    - "Zu Pro downgraden und sparen?"
    - "Support kontaktieren für Hilfe?"
  - Haupt-Button: "Ja, kündigen"
  - Secondary: "Support kontaktieren"
- [ ] API: Stripe Subscription Update
  - `cancel_at_period_end: true`
- [ ] DB: `cancel_at_period_end` = true speichern
- [ ] Banner im Dashboard: "Ihr Plan endet am [Datum]. [Reaktivieren]"
- [ ] Email: Kündigungs-Bestätigung
- [ ] Nach Period-Ende: Automatischer Wechsel zu Free (via Webhook)

---

### US-23.9: Subscription reaktivieren
**Als User mit gekündigtem Abonnement möchte ich es reaktivieren können, damit ich nicht unterbrochen werde.**

**Acceptance Criteria:**
- [ ] "Reaktivieren" Button sichtbar wenn `cancel_at_period_end = true`
- [ ] Banner im Dashboard mit Reaktivierungs-Button
- [ ] API: Stripe Subscription Update
  - `cancel_at_period_end: false`
- [ ] Sofortige Bestätigung:
  - Toast: "Ihr Abonnement läuft weiter!"
  - Banner verschwindet
- [ ] Email-Bestätigung: "Reaktivierung erfolgreich"
- [ ] Plan bleibt aktuell, kein Wechsel

---

### US-23.10: Plan-Gating Sync
**Als System möchte ich den User-Plan synchronisieren, damit Feature-Limits korrekt angewendet werden.**

**Acceptance Criteria:**
- [ ] `usePlan()` Hook liest Plan aus `profiles` Tabelle
- [ ] Hook liefert:
  ```typescript
  { plan: 'free' | 'pro' | 'enterprise', status: 'active' | 'trialing' | 'canceled', expiresAt: Date, isTrial: boolean }
  ```
- [ ] Bei Subscription-Change via Webhook:
  - Plan in profiles aktualisieren
  - Event-Broadcast (CustomEvent oder Context)
- [ ] Real-time Sync: Kein Logout nötig
- [ ] Cache-Invalidation nach Plan-Change
- [ ] Edge Case: Trial-Ende → automatischer Wechsel zu Free (via Webhook)

**Plan-Gating Helper:**
```typescript
const limits = {
  free: { contacts: 50, deals: 10, exports: 10 },
  pro: { contacts: 500, deals: 100, exports: 100 },
  enterprise: { contacts: Infinity, deals: Infinity, exports: 500 },
};

export function usePlanLimits() {
  const { plan } = usePlan();
  return limits[plan];
}
```

---

## API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/checkout` | POST | Checkout Session erstellen | Required |
| `/api/checkout/success` | GET | Checkout verifizieren | Public (via session_id) |
| `/api/subscription` | GET | Aktuelle Subscription laden | Required |
| `/api/subscription` | PATCH | Subscription ändern (Upgrade/Downgrade) | Required |
| `/api/subscription/cancel` | POST | Subscription kündigen | Required |
| `/api/subscription/reactivate` | POST | Subscription reaktivieren | Required |

---

## Components

**Pages:**
- `UpgradePage` (`/upgrade`)
- `CheckoutSuccessPage` (`/upgrade/success`)

**Components:**
- `PlanCard` (Einzelne Plan-Karte)
- `PlanComparison` (Feature-Vergleich)
- `BillingToggle` (Monatlich/Jährlich)
- `PlanBadge` (Current Plan Indicator)
- `UpgradeButton` (Mit Loading-State)
- `CancelSubscriptionDialog` (Mit Alternativen)
- `TrialBanner` (Dashboard-Banner)

---

## Edge Cases

| ID | Kategorie | Scenario | Expected Behavior |
|----|-----------|----------|---------------------|
| **EC-23-01** | Checkout | User hat bereits aktiven Plan | Upgrade-Logik (Proration) |
| **EC-23-02** | Checkout | User hat gekündigt aber noch aktiv | Reaktivierungs-Option statt Checkout |
| **EC-23-03** | Checkout | Zahlungsmethode abgelehnt | Stripe-Error anzeigen, Retry-Möglichkeit |
| **EC-23-04** | Checkout | 3D Secure Authentifizierung nötig | Stripe handled automatisch |
| **EC-23-05** | Checkout | Coupon-Code eingeben | `allow_promotion_codes: true` in Session |
| **EC-23-06** | Upgrade | Upgrade während Trial | Trial bleibt, neuer Plan nach Trial |
| **EC-23-07** | Upgrade | Upgrade zu gleichem Plan | 409 Conflict, "Bereits aktiver Plan" |
| **EC-23-08** | Downgrade | Downgrade zu Free während über Limits | Warnung: "Sie haben X Kontakte zu viel. Löschen Sie Kontakte vor dem Downgrade." |
| **EC-23-09** | Cancel | Kündigung während Trial | Sofort Free, keine Kosten |
| **EC-23-10** | Reactivate | Reaktivierung nach Period-Ende | Neuer Checkout nötig (alte Subscription ist `deleted`) |
| **EC-23-11** | Sync | Webhook verspätet | Polling-Fallback alle 5 Minuten (optional) |
| **EC-23-12** | VAT | B2B-Kunde mit VAT ID | VAT-Reverse-Charge (0% MwSt) via Stripe Tax |
| **EC-23-13** | Trial | Trial ohne Kreditkarte | Stripe erlaubt das (trial_settings) |
| **EC-23-14** | Trial | Trial-Ende, keine Zahlung | Grace Period 3 Tage, dann Free |
| **EC-23-15** | Trial | User kündigt während Trial | Sofortiger Wechsel zu Free |
| **EC-23-16** | Session | Ungültige session_id in Success | Error-Page mit Link zu Upgrade |
| **EC-23-17** | Network | Timeout bei Checkout-Redirect | Retry-Button, Fehlermeldung |
| **EC-23-18** | Concurrent | Doppelter Klick auf Upgrade | Button disablen während Loading |

---

## Technical Requirements

### Stripe Checkout Session

```typescript
// /api/checkout/route.ts
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  const { planId, billingInterval } = await request.json();

  // Validation
  const priceId = getPriceId(planId, billingInterval);
  if (!priceId) {
    return new Response('Invalid plan', { status: 400 });
  }

  // Get user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await supabase.from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: user.id, planId, billingInterval },
    },
    automatic_tax: { enabled: true },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=true`,
    metadata: { userId: user.id, planId, billingInterval },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return Response.json({ url: session.url });
}
```

### Plan Hook

```typescript
// hooks/use-plan.ts
export function usePlan() {
  const { data, error, mutate } = useSWR('/api/subscription', fetcher);

  return {
    plan: data?.plan ?? 'free',
    status: data?.status ?? 'active',
    isTrial: data?.status === 'trialing',
    expiresAt: data?.current_period_end ? new Date(data.current_period_end) : null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    isLoading: !data && !error,
    mutate,
  };
}
```

---

## UI Specifications

### Upgrade Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VOLLENDEN SIE IHRE REGISTRIERUNG                                        │
│  Wählen Sie Ihren Plan für Manyleads.io                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Monatlich] [Jährlich ▼]  ← 20% sparen                                  │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │   FREE        │  │   PRO         │  │  ENTERPRISE   │                │
│  │   €0          │  │   €29/Monat   │  │   €99/Monat   │                │
│  │   /Monat      │  │   BELIEBT     │  │               │                │
│  │               │  │               │  │               │                │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤                │
│  │ ✓ 50 Kontakte │  │ ✓ 500 Kontakte│  │ ✓ Unbegrenzt  │                │
│  │ ✓ 10 Deals    │  │ ✓ 100 Deals   │  │ ✓ Unbegrenzt  │                │
│  │ ✗ Kanban      │  │ ✓ Kanban      │  │ ✓ Kanban      │                │
│  │ ✗ Import      │  │ ✓ Import      │  │ ✓ Import      │                │
│  │ ✗ API         │  │ ✗ API         │  │ ✓ API         │                │
│  │               │  │               │  │               │                │
│  │  AKTUELLER    │  │  14 TAGE      │  │  14 TAGE      │                │
│  │     PLAN      │  │  KOSTENLOS    │  │  KOSTENLOS    │                │
│  │               │  │   TESTEN →    │  │   TESTEN →    │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│                                                                          │
│  ✓ Jederzeit kündbar  ✓ Keine Kreditkarte für Trial                     │
│  ✓ Sichere Zahlung via Stripe                                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  HÄUFIG GESTELLTE FRAGEN                                         │    │
│  │  ▼ Wie funktioniert die Testphase?                               │    │
│  │  ▼ Kann ich später upgraden?                                     │    │
│  │  ▼ Was passiert beim Kündigen?                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Success Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         🎉                                               │
│                                                                          │
│               Willkommen im Pro Plan!                                    │
│                                                                          │
│    Ihre 14-Tage-Testphase läuft bis 22.02.2026                          │
│                                                                          │
│    Danach: €29/Monat (jederzeit kündbar)                                │
│                                                                          │
│    Sie haben jetzt Zugriff auf:                                         │
│    ✓ 500 Kontakte                                                       │
│    ✓ 100 Deals                                                          │
│    ✓ Kanban-View                                                        │
│    ✓ CSV Import & Export                                                │
│                                                                          │
│              [Zum Dashboard →]                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

**Blocks:**
- None

**Blocked By:**
- PROJ-22 (Stripe Setup, Webhooks, Customer Creation)
- PROJ-8 (User Provider für Plan-Info)

---

## Success Criteria

- [ ] Upgrade-Seite zeigt alle Pläne korrekt
- [ ] Monatlich/Jährlich Toggle funktioniert
- [ ] Checkout Session wird erstellt und leitet zu Stripe
- [ ] 14-Tage Trial wird hinzugefügt
- [ ] Success-Page zeigt Bestätigung nach Checkout
- [ ] Cancel-Redirect funktioniert
- [ ] Upgrade Free → Pro/Enterprise funktioniert
- [ ] Upgrade Pro → Enterprise funktioniert (mit Proration)
- [ ] Downgrade zeigt Confirmation und wird am Period-Ende aktiv
- [ ] Kündigung funktioniert (cancel_at_period_end)
- [ ] Reaktivierung funktioniert
- [ ] Plan-Sync ist real-time
- [ ] Deutsche UI überall
- [ ] VAT wird korrekt berechnet

---

## Estimated Effort

- Backend: 1-2 Tage (APIs)
- Frontend: 2-3 Tage (UI + Integration)
- Testing: 1-2 Tage (Stripe Testmodus)

**Total:** 4-7 Tage
