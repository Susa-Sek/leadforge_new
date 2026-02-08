# Epic E8: Stripe Integration - Backend API Documentation

## Overview
Dieses Dokument beschreibt alle Backend-APIs fuer die Stripe-Integration in Manyleads.io.

## Database Schema

### Tables

#### profiles (erweitert)
| Column | Type | Description |
|--------|------|-------------|
| stripe_customer_id | TEXT UNIQUE | Stripe Customer ID (cus_...) |

#### subscriptions (erweitert)
| Column | Type | Description |
|--------|------|-------------|
| stripe_customer_id | TEXT | Stripe Customer ID |
| stripe_subscription_id | TEXT UNIQUE | Stripe Subscription ID (sub_...) |
| stripe_price_id | TEXT | Stripe Price ID (price_...) |
| plan_id | TEXT | 'free', 'pro', 'enterprise' |
| cancel_at_period_end | BOOLEAN | Whether subscription will cancel |
| trial_start | TIMESTAMPTZ | Trial start date |
| trial_end | TIMESTAMPTZ | Trial end date |

#### invoices (neu)
Lokale Kopie aller Stripe-Invoices fuer schnellen Zugriff.

#### webhook_events (neu)
Idempotency-Tracking fuer Stripe Webhooks.

---

## API Endpoints

### Webhooks

#### POST /api/webhooks/stripe
Stripe Webhook Handler fuer alle Stripe-Events.

**Security:**
- Stripe Signature Verification
- Idempotency via webhook_events Tabelle

**Handled Events:**
- `checkout.session.completed` - Subscription erstellen
- `invoice.payment_succeeded` - Invoice speichern
- `invoice.payment_failed` - Payment failed handling
- `customer.subscription.updated` - Plan-Aenderungen
- `customer.subscription.deleted` - Subscription beendet
- `customer.subscription.trial_will_end` - Trial Reminder

**Response:**
```json
{ "received": true, "status": "processed" }
```

---

### Checkout

#### POST /api/stripe/checkout-session
Erstellt eine neue Stripe Checkout Session.

**Auth:** Required

**Body:**
```json
{
  "planId": "pro" | "enterprise",
  "billingInterval": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Errors:**
- 401: Nicht authentifiziert
- 400: Ungueltige Plan-Auswahl
- 409: Bereits aktiver Plan
- 500: Preis nicht konfiguriert

---

#### GET /api/checkout/success?session_id=xxx
Verifiziert eine erfolgreiche Checkout-Session.

**Response:**
```json
{
  "success": true,
  "planId": "pro",
  "planName": "Pro",
  "isTrial": true,
  "trialEndsAt": "2026-02-22T00:00:00Z",
  "currentPeriodEnd": "2026-03-08T00:00:00Z",
  "status": "trialing"
}
```

---

### Subscription Management

#### GET /api/stripe/subscription-status
Aktueller Subscription-Status des Users.

**Auth:** Required

**Response:**
```json
{
  "plan": "Pro",
  "planId": "pro",
  "status": "trialing",
  "isTrial": true,
  "trialEndsAt": "2026-02-22T00:00:00Z",
  "daysLeftInTrial": 12,
  "currentPeriodStart": "2026-02-08T00:00:00Z",
  "currentPeriodEnd": "2026-03-08T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_..."
}
```

**Free User Response:**
```json
{
  "plan": "free",
  "planId": "free",
  "status": "active",
  "isTrial": false,
  ...
}
```

---

#### POST /api/stripe/cancel-subscription
Kuendigt das aktuelle Abonnement.

**Auth:** Required

**Body (optional):**
```json
{
  "immediate": false  // true = sofort kuendigen, false = am Period-Ende
}
```

**Response:**
```json
{
  "success": true,
  "immediate": false,
  "message": "Ihr Abonnement wurde gekuendigt und laeuft am Ende der aktuellen Periode aus."
}
```

---

#### POST /api/stripe/reactivate-subscription
Reaktiviert ein gekuendigtes Abonnement.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "Ihr Abonnement wurde erfolgreich reaktiviert."
}
```

---

#### POST /api/stripe/upgrade
Upgrade/Downgrade des aktuellen Plans.

**Auth:** Required

**Body:**
```json
{
  "planId": "pro" | "enterprise",
  "billingInterval": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "success": true,
  "isUpgrade": true,
  "message": "Upgrade zu Pro erfolgreich!"
}
```

---

### Billing Portal

#### POST /api/stripe/create-portal-session
Erstellt eine Stripe Billing Portal Session.

**Auth:** Required

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

---

### Invoices

#### GET /api/stripe/invoices?status=&limit=&offset=
Liste aller Rechnungen des Users.

**Auth:** Required

**Query Params:**
- `status`: Filter by status (paid, open, void, all)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "stripeInvoiceId": "in_...",
      "invoiceNumber": "A1B2C3D4-0001",
      "amountDue": 2900,
      "amountPaid": 2900,
      "currency": "eur",
      "status": "paid",
      "formattedAmount": "29,00 EUR",
      "formattedDate": "08.02.2026",
      "invoicePdf": "https://pay.stripe.com/invoice/.../pdf",
      "hostedInvoiceUrl": "https://invoice.stripe.com/..."
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Environment Variables

```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Error Messages (German)

Alle APIs geben deutsche Fehlermeldungen zurueck:

- "Nicht authentifiziert" - 401
- "Ungueltige Plan-Auswahl" - 400
- "Kein aktives Abonnement gefunden" - 404
- "Preis nicht konfiguriert" - 500
- "Ein Fehler ist aufgetreten" - 500

---

## Stripe Webhook Setup

1. Gehe zu https://dashboard.stripe.com/webhooks
2. Create new endpoint
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.updated
   - customer.subscription.deleted
   - customer.subscription.trial_will_end
5. Copy signing secret to STRIPE_WEBHOOK_SECRET

---

## Testing

### Stripe CLI fuer lokale Tests:
```bash
# Install Stripe CLI
npm install -g stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## Security

- Alle `/api/stripe/*` Routes erfordern Authentication
- Webhook Signature Verification aktiviert
- RLS Policies auf subscriptions und invoices Tabellen
- Service-Role-Only Zugriff auf webhook_events

---

**Version:** 1.0
**Epic:** E8 - Stripe Integration
**Status:** Implemented
