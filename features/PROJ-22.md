# PROJ-22: Stripe Setup & Webhooks

**Epic:** E8 - Stripe-Integration
**Status:** 🔵 Planned
**Priority:** High
**Assigned To:** Backend Developer

---

## Overview

Stripe Setup & Webhooks ist das Fundament für alle Zahlungsfeatures. Es umfasst die Stripe-Account-Konfiguration, Product/Price-Einrichtung, Webhook-Endpoint-Implementierung und die Synchronisation zwischen Stripe und Supabase.

---

## User Stories

### US-22.1: Stripe Customer erstellen
**Als System möchte ich automatisch einen Stripe Customer für neue User erstellen, damit Zahlungen zugeordnet werden können.**

**Acceptance Criteria:**
- [ ] Trigger: Bei User-Registrierung (nach `handle_new_user` Trigger)
- [ ] Stripe Customer wird mit Email und Name erstellt
- [ ] Stripe Customer ID (`cus_...`) wird in `profiles` Tabelle gespeichert
- [ ] Fehler werden geloggt, aber blockieren Registrierung nicht
- [ ] Idempotenz: Bei erneutem Trigger (z.B. Retry) keine Duplikate

**Database Schema:**
```sql
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
```

**Implementation Notes:**
- Edge Function oder DB Trigger
- Stripe API Key: `STRIPE_SECRET_KEY`
- Customer-Metadaten: `{ userId, email }`

---

### US-22.2: Webhook Endpoint implementieren
**Als System möchte ich Stripe Webhooks empfangen und verarbeiten, damit Subscription-Events synchronisiert werden.**

**Acceptance Criteria:**
- [ ] Endpoint: `/api/webhooks/stripe` (POST)
- [ ] Content-Type: `application/json` (raw body für Signature)
- [ ] Stripe-Signature-Validierung mit `stripe.webhooks.constructEvent()`
- [ ] Secret: `STRIPE_WEBHOOK_SECRET`
- [ ] Event-Typ-Filter: Nur relevante Events verarbeiten
- [ ] Idempotenz: Gleiches Event (`id`) mehrfach = keine doppelte Aktion
- [ ] Fehler-Logging für ungültige Signatures
- [ ] 200 OK sofort zurückgeben, dann async verarbeiten
- [ ] Nicht-verarbeitete Events: Loggen, aber 200 OK (kein Retry-Trigger)

**Event-Handler Registry:**
```typescript
const handlers: Record<string, EventHandler> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'customer.subscription.trial_will_end': handleTrialWillEnd,
};
```

**Security Requirements:**
- [ ] Stripe Signature Verification (raw body verwenden)
- [ ] Rate Limiting: 100 requests/min pro IP
- [ ] Logging: Alle Events mit ID loggen

---

### US-22.3: Checkout Session Completed Handler
**Als System möchte ich erfolgreiche Checkouts verarbeiten, damit der Plan sofort aktiviert wird.**

**Acceptance Criteria:**
- [ ] Extrahiert aus Session: `customer`, `subscription`, `metadata.userId`, `metadata.planId`
- [ ] Subscription-Daten von Stripe abrufen (`stripe.subscriptions.retrieve`)
- [ ] Erstellt Eintrag in `subscriptions` Tabelle
- [ ] Aktualisiert `plan` in `profiles` auf neuen Plan
- [ ] Aktualisiert `plan_expires_at` (=`current_period_end`)
- [ ] Aktualisiert `trial_ends_at` (falls Trial aktiv)
- [ ] Erfolgs-Email an User senden (via Email-Service)
- [ ] Event-Tracking: "subscription_created"

**Database - Subscriptions Table:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS Policy
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own subscriptions" ON subscriptions
  FOR ALL USING (user_id = auth.uid());
```

---

### US-22.4: Payment Failed Handler
**Als System möchte ich fehlgeschlagene Zahlungen behandeln, damit User benachrichtigt werden.**

**Acceptance Criteria:**
- [ ] Bei `invoice.payment_failed`:
  - Subscription-Status auf `past_due` setzen
  - `payment_failed_at` Timestamp speichern
- [ ] Email-Benachrichtigung an User senden
  - Betreff: "Zahlung fehlgeschlagen - Bitte aktualisieren Sie Ihre Zahlungsmethode"
  - Link zum Billing Portal
- [ ] Grace Period: 7 Tage weiterhin Pro/Enterprise Features
- [ ] Nach 7 Tagen: Status auf `unpaid`, Banner im Dashboard
- [ ] Retry-Logik: Stripe versucht automatisch 3x (kein extra Code nötig)
- [ ] Event-Tracking: "payment_failed"

**Email-Content (Deutsch):**
```
Betreff: Zahlung fehlgeschlagen - Manyleads.io

Hallo [Name],

Die Zahlung für Ihren [Plan] in Höhe von [Betrag] ist fehlgeschlagen.

Grund: [failure_message]

Bitte aktualisieren Sie Ihre Zahlungsmethode:
[Billing Portal Link]

Ihr Account bleibt für 7 Tage aktiv. Danach wird Ihr Plan auf Free zurückgesetzt.
```

---

### US-22.5: Subscription Updated Handler
**Als System möchte ich Subscription-Änderungen verarbeiten, damit Upgrades/Downgrades korrekt synchronisiert werden.**

**Acceptance Criteria:**
- [ ] Plan-Change erkannt: Vergleiche `items.data[0].price.id` (alt vs neu)
- [ ] Upgrade erkannt: Neuer Plan > Alter Plan
  - Sofortiger Wechsel
  - DB-Update: `plan_id`, `current_period_*`
  - Email: Upgrade-Bestätigung
- [ ] Downgrade erkannt: Neuer Plan < Alter Plan
  - `cancel_at_period_end` prüfen
  - DB-Update: Plan-Wechsel dokumentieren
  - Email: Downgrade-Bestätigung mit Hinweis auf Period-Ende
- [ ] Cancellation-Toggle:
  - `cancel_at_period_end` aktualisieren
  - User benachrichtigen (Kündigung geplant/Reaktiviert)
- [ ] Trial-Ende:
  - Status von `trialing` zu `active` wechseln
  - Erste Zahlung wird getriggert
- [ ] Alle Änderungen: `subscriptions` Tabelle aktualisieren

**Plan-Vergleich:**
```typescript
const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
const isUpgrade = planHierarchy[newPlan] > planHierarchy[oldPlan];
```

---

### US-22.6: Subscription Deleted Handler
**Als System möchte ich gekündigte Subscriptions verarbeiten, damit der Plan am Period-Ende auf Free zurückgesetzt wird.**

**Acceptance Criteria:**
- [ ] Bei `customer.subscription.deleted`:
  - Plan in `profiles` auf `free` setzen
  - `plan_expires_at` auf `NOW()` setzen
  - `subscription` Tabelle: Status auf `canceled`
- [ ] Timing: Event kommt erst am Period-Ende von Stripe
- [ ] Kündigungs-Email an User senden
- [ ] Optional: Exit-Survey Link (späteres Feature)
- [ ] Credits bleiben erhalten (nicht resetten)
- [ ] Daten bleiben erhalten (nur Limits greifen)
- [ ] Event-Tracking: "subscription_canceled"

**Note:** Das "Deleted" Event kommt erst am Ende der Period, NICHT beim Kündigungs-Click.

---

### US-22.7: Trial Will End Handler
**Als System möchte ich vor Trial-Ende warnen, damit User ihre Zahlungsmethode prüfen können.**

**Acceptance Criteria:**
- [ ] Bei `customer.subscription.trial_will_end` (3 Tage vorher):
  - Erinnerungs-Email an User senden
  - Link zum Billing Portal für Zahlungsmethode
- [ ] Email-Betreff: "Ihre Testphase endet in 3 Tagen"
- [ ] Hinweis: Automatische Zahlung startet danach
- [ ] Keine DB-Änderung nötig (nur Information)

---

## Stripe Products & Prices Setup

### Products (im Stripe Dashboard manuell erstellen)

#### Product: Pro Plan
```
Name: Pro
Description: Für kleine Teams und Einzelunternehmer. 500 Kontakte, 100 Deals, Kanban View.
Metadata:
  plan_id: pro
  display_name: Pro
  features: 500 Kontakte,100 Deals,Kanban View,CSV Export
```

**Prices:**
- **Pro Monthly:** €29/Monat, recurring
- **Pro Yearly:** €290/Jahr, recurring (20% Rabatt)

#### Product: Enterprise Plan
```
Name: Enterprise
Description: Für wachsende Unternehmen. Unbegrenzte Kontakte und Deals, API-Zugang, Priority Support.
Metadata:
  plan_id: enterprise
  display_name: Enterprise
  features: Unbegrenzte Kontakte,Unbegrenzte Deals,API,Priority Support
```

**Prices:**
- **Enterprise Monthly:** €99/Monat, recurring
- **Enterprise Yearly:** €990/Jahr, recurring (20% Rabatt)

### Environment Variables

```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (von Stripe Dashboard kopieren)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx
```

---

## API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/webhooks/stripe` | POST | Stripe Webhook Handler | Stripe Signature |
| `/api/webhooks/stripe/test` | POST | Test-Webhook (nur Dev) | Admin only |

---

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| **EC-22-01** | Ungültige Stripe-Signature | 400 Bad Request, Event ignorieren |
| **EC-22-02** | Dupliziertes Event (gleiche ID) | Idempotenz-Check via DB oder Redis, keine doppelte Aktion |
| **EC-22-03** | Unbekannter Event-Typ | Loggen (info), 200 OK (nicht 400 um Retry zu verhindern) |
| **EC-22-04** | Customer nicht in DB gefunden | Loggen (error), Admin-Benachrichtigung, 200 OK |
| **EC-22-05** | User nicht in DB gefunden | Loggen, möglicherweise gelöschter User, 200 OK |
| **EC-22-06** | Timeout bei Verarbeitung | 200 OK trotzdem zurückgeben, Stripe wird retryen |
| **EC-22-07** | Supabase DB-Error | Fehler loggen, Stripe wird retryen (Exponentieller Backoff) |
| **EC-22-08** | Webhook Payload zu groß | Stripe hat Limit (1MB), sollte nie passieren |
| **EC-22-09** | Race Condition: 2 Events parallel | DB-Constraints (UNIQUE) verhindern Duplikate |
| **EC-22-10** | Subscription manuell in Stripe gekündigt | Webhook löst Downgrade aus (US-22.6) |
| **EC-22-11** | Refund in Stripe ausgelöst | Kein autom. Downgrade, manuelle Review |
| **EC-22-12** | Chargeback/Dispute | Account suspendieren, Admin-Alert |
| **EC-22-13** | Test-Webhook auf Production | Ignorieren wenn `livemode=false` auf Prod?

---

## Technical Requirements

### Stripe SDK

```bash
npm install stripe
```

### Webhook Verification

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia', // Aktuelle Version
});

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Idempotenz-Check
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existing) {
    return new Response('Already processed', { status: 200 });
  }

  // Event speichern
  await supabase.from('webhook_events').insert({
    stripe_event_id: event.id,
    type: event.type,
    processed: false,
  });

  // Handler ausführen
  const handler = handlers[event.type];
  if (handler) {
    await handler(event.data.object);
  }

  // Als processed markieren
  await supabase.from('webhook_events')
    .update({ processed: true, processed_at: new Date() })
    .eq('stripe_event_id', event.id);

  return new Response('OK', { status: 200 });
}
```

### Webhook Events Table (Idempotenz)

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
```

---

## Dependencies

**Blocks:**
- PROJ-23 (Checkout & Subscriptions)
- PROJ-24 (Billing Portal)

**Blocked By:**
- None (Foundation Feature)

---

## Success Criteria

- [ ] Stripe Customer wird bei Registrierung erstellt
- [ ] Webhook Endpoint akzeptiert gültige Events
- [ ] Webhook lehnt ungültige Signature ab (400)
- [ ] Idempotenz funktioniert (gleiches Event = keine doppelte Aktion)
- [ ] checkout.session.completed aktiviert Plan
- [ ] invoice.payment_failed sendet Email
- [ ] customer.subscription.updated syncs mit DB
- [ ] customer.subscription.deleted setzt Plan auf Free
- [ ] Trial-Ende Handler sendet Erinnerung
- [ ] Alle Events werden geloggt

---

## Estimated Effort

- Backend: 2-3 Tage (Webhooks komplex)
- Stripe Setup: 0.5 Tage (Dashboard-Konfig)
- Testing: 1-2 Tage (Webhooks testen)

**Total:** 3-5 Tage
