# Epic E8: Stripe-Integration - Architecture

**Status:** IN PROGRESS (vorbereitend - wartet auf Requirements PROJ-22, PROJ-23, PROJ-24)
**Epic ID:** E8
**Ziel:** Zahlungsabwicklung via Stripe fur Premium-Abonnements
**Tech Stack:** Next.js 16 + Supabase + Stripe

---

## 1. Executive Summary

Epic E8 integriert Stripe als Zahlungsanbieter fur Manyleads.io. User konnen uber Stripe Checkout Premium-Plane buchen, Abonnements verwalten und Rechnungen einsehen.

**Bestehende Infrastruktur:**
- Subscriptions-Tabelle (basic) existiert bereits
- Payments-Tabelle existiert bereits
- Plan-Feature-Gating ist im UserProvider implementiert
- Webhook-Handler-Struktur existiert (Apify als Referenz)

**Neue Komponenten:**
- Stripe Webhook Handler
- Checkout Flow
- Subscription Management UI
- Invoice Management

---

## 2. Datenbank-Schema (Supabase)

### 2.1 Bestehende Tabellen (Review)

Die folgenden Tabellen existieren bereits und werden erweitert:

**subscriptions** (Erweiterung notig)
```
- id (UUID, PK)
- user_id (UUID, FK)
- plan_name (text)
- status (text) - 'active', 'canceled', 'past_due', etc.
- stripe_customer_id (text, nullable) - NEU erweitern
- stripe_subscription_id (text, nullable) - NEU erweitern
- stripe_price_id (text, nullable) - NEU erweitern
- current_period_start (timestamptz) - NEU erweitern
- current_period_end (timestamptz) - NEU erweitern
- cancel_at_period_end (boolean, default false) - NEU erweitern
- created_at, updated_at
```

**payments** (Erweiterung moglich)
```
- id (UUID, PK)
- user_id (UUID, FK)
- product_type (text)
- plan_name (text)
- amount_paid (numeric)
- currency (text)
- status (text)
- stripe_session_id (text) - checkout.session.id
- stripe_payment_intent_id (text)
```

### 2.2 Neue Tabellen

**invoices** (Lokale Kopie fur schnellen Zugriff)
```
Jede Rechnung speichert:
- id (UUID, PK)
- user_id (UUID, FK)
- stripe_invoice_id (text, unique)
- stripe_subscription_id (text, FK zu subscriptions)
- amount_due (numeric) - Betrag in Cent
- amount_paid (numeric)
- currency (text) - 'eur', 'usd'
- status (text) - 'paid', 'open', 'void', 'uncollectible'
- pdf_url (text) - Stripe Invoice PDF URL
- invoice_number (text) - z.B. "A1B2C3D4-0001"
- period_start, period_end (timestamptz)
- created_at, updated_at
```

**stripe_events** (Idempotency + Logging)
```
Verhindert doppelte Verarbeitung:
- id (UUID, PK)
- stripe_event_id (text, unique) - evt_...
- event_type (text) - 'checkout.session.completed', etc.
- processed_at (timestamptz)
- payload_hash (text) - fur Integritatsprufung
- status (text) - 'success', 'failed', 'pending'
- error_message (text, nullable)
```

**payment_methods** (Optional - fur spatere Features)
```
- id (UUID, PK)
- user_id (UUID, FK)
- stripe_payment_method_id (text, unique)
- type (text) - 'card', 'sepa_debit'
- brand (text) - 'visa', 'mastercard'
- last4 (text)
- expiry_month, expiry_year
- is_default (boolean)
- created_at
```

---

## 3. Stripe Webhook Handler

### 3.1 Route

**Endpoint:** `POST /api/webhooks/stripe`

**Security:**
- Stripe-Signature-Verification via `stripe.webhooks.constructEvent()`
- Webhook Secret aus `STRIPE_WEBHOOK_SECRET`

### 3.2 Event-Verarbeitung

| Event | Aktion | Prioritat |
|-------|--------|-----------|
| **checkout.session.completed** | Subscription aktivieren, UserCredits updaten | Hoch |
| **invoice.payment_succeeded** | Invoice speichern, Status aktualisieren | Hoch |
| **invoice.payment_failed** | Email-Benachrichtigung, Retry-Logik starten | Hoch |
| **customer.subscription.updated** | Plan-Anderung verarbeiten (Upgrade/Downgrade) | Mittel |
| **customer.subscription.deleted** | Subscription als 'canceled' markieren | Mittel |
| **customer.subscription.created** | Neue Subscription loggen | Niedrig |
| **invoice.created** | Lokale Invoice-Vorschau speichern | Niedrig |
| **payment_intent.succeeded** | Zahlung bestatigen (Redundanz zu invoice) | Niedrig |
| **payment_intent.payment_failed** | Fehler loggen, User benachrichtigen | Mittel |

### 3.3 Event-Handler Logik (Konzept)

**checkout.session.completed:**
1. Stripe Customer ID extrahieren
2. Subscription ID aus Session holen
3. subscriptions-Tabelle aktualisieren/erstellen
4. User Credits auf Plan-Limit setzen (z.B. 2000 fur Pro)
5. Notification an User senden ("Willkommen bei Pro!")

**invoice.payment_succeeded:**
1. Invoice-Daten in invoices-Tabelle speichern
2. PDF-URL cachen
3. Notification: "Rechnung #XXX bezahlt"

**invoice.payment_failed:**
1. Retry-Count tracken (max 3 Versuche)
2. Email an User: "Zahlung fehlgeschlagen - bitte aktualisieren"
3. Nach 3 Fehlversuchen: Subscription auf 'past_due' setzen

**customer.subscription.updated:**
1. Prüfen auf Plan-Wechsel (price_id geandert?)
2. Bei Upgrade: Sofortige Aktivierung, Differenz berechnen
3. Bei Downgrade: Am Period-Ende aktivieren
4. User Credits anpassen

---

## 4. Checkout Flow

### 4.1 API Endpoints

**POST /api/stripe/checkout-session**
- Erstellt Stripe Checkout Session
- Body: `{ priceId: string, successUrl: string, cancelUrl: string }`
- Response: `{ sessionId: string, url: string }`

**GET /api/stripe/subscription-status**
- Liefert aktuellen Subscription-Status
- Response: `{ status: string, plan: string, currentPeriodEnd: string, cancelAtPeriodEnd: boolean }`

**POST /api/stripe/create-portal-session**
- Erstellt Stripe Customer Portal Session
- Response: `{ url: string }`

**POST /api/stripe/cancel-subscription**
- Setzt cancel_at_period_end = true
- Sofortige Cancellation optional (Parameter)

### 4.2 Frontend Pages

**Plan-Auswahl: `/dashboard/upgrade` (oder `/dashboard/preise`)**
```
Page
├── Header: "Wahlen Sie Ihren Plan"
├── PricingTable (3 Plane: Starter, Pro, Enterprise)
│   ├── Feature-Liste pro Plan
│   ├── Preis-Anzeige (monatlich/jahrlich Toggle)
│   └── CheckoutButton (CTA)
├── FAQ-Section (Zahlungsfragen)
└── Trust-Badges (SSL, Stripe-Secured)
```

**Abonnement-Management: `/dashboard/einstellungen/abonnement`**
```
Page
├── SubscriptionStatus Card
│   ├── Aktueller Plan (Badge)
│   ├── Nachste Abbuchung / Ablaufdatum
│   └── Zahlungsmethode (letzte 4 Ziffern)
├── InvoiceList
│   ├── Tabelle: Datum, Betrag, Status, PDF-Link
│   └── Download-Button pro Rechnung
├── Actions
│   ├── "Zahlungsmethode andern" -> Customer Portal
│   ├── "Plan andern" -> Upgrade/Downgrade
│   └── "Kundigen" -> Confirmation Dialog
└── BillingPortalButton (direkt zu Stripe Portal)
```

---

## 5. Security & Validation

### 5.1 Webhook Security

**Signature Verification:**
```
Jeder Webhook-Request enthalt:
- stripe-signature Header

Verifizierung:
1. Raw Body extrahieren (nicht geparst!)
2. stripe.webhooks.constructEvent(rawBody, signature, secret)
3. Bei Fehler: 400 Response, Event ignorieren
```

**Idempotency:**
```
Vor Verarbeitung:
1. Prüfen ob stripe_event_id in stripe_events existiert
2. Falls ja: 200 OK returnen (bereits verarbeitet)
3. Falls nein: In DB eintragen, dann verarbeiten
```

### 5.2 API Security

**Authentication:**
- Alle /api/stripe/* Routes erfordern authentifizierten User
- Server-Side Supabase Client verwenden (await createClient())

**Authorization:**
- User darf nur eigene Subscriptions verwalten
- RLS Policies auf subscriptions-Tabelle prüfen

### 5.3 Environment Variables

**Stripe Secrets:**
```bash
STRIPE_SECRET_KEY=sk_live_...          # Backend-only, nie expose!
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Frontend (NEXT_PUBLIC_)
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook verification
```

**Sicherheitsregeln:**
- Secret Key NIE im Frontend verwenden
- Webhook Secret regelmaßig rotieren
- Test/Live Keys getrennt halten

---

## 6. Frontend Components

### 6.1 Neue Komponenten

**PricingTable**
```
Zeigt 3 Plane nebeneinander (Desktop) oder untereinander (Mobile):
- Free/Starter: 49EUR/Monat
- Pro: 99EUR/Monat (Highlighted)
- Enterprise: 199EUR/Monat

Features:
- Toggle: Monatlich / Jahrlich (-20%)
- Feature-Vergleichs-Liste
- "Beliebt"-Badge auf Pro
```

**CheckoutButton**
```
Props: { priceId: string, mode: 'subscription' | 'payment' }

Verhalten:
1. Klick -> Loading State
2. POST /api/stripe/checkout-session
3. Redirect zu Stripe Checkout (session.url)
```

**SubscriptionStatus**
```
Zeigt aktuellen Plan:
- Plan-Name mit Badge (Free, Pro, Enterprise)
- Progress-Bar: Credits used / total
- Ablaufdatum / nachste Zahlung
- Status-Indikator (aktiv, abgelaufen, gekundigt)
```

**InvoiceList**
```
Tabelle mit Pagination:
- Spalten: Rechnungsnr., Datum, Betrag, Status, Aktionen
- Status: Bezahlt (grun), Offen (gelb), Fehlgeschlagen (rot)
- Aktionen: PDF-Download, Details anzeigen
```

**BillingPortalButton**
```
Einfacher Button:
- Text: "Zahlungsmethode andern" oder "Rechnungsverlauf"
- Klick -> POST /api/stripe/create-portal-session
- Redirect zu Stripe Customer Portal
```

**PlanGate (Erweiterung bestehender Komponente)**
```
Erweitert src/components/search/plan-gate.tsx:
- Upgrade-Dialog mit PricingTable
- Direkter Link zu /dashboard/upgrade
```

### 6.2 Component-Tree

```
src/components/billing/
├── pricing-table.tsx           # Plan-Vergleich
├── pricing-card.tsx            # Einzelner Plan
├── checkout-button.tsx         # Stripe Checkout CTA
├── subscription-status.tsx     # Aktueller Plan-Status
├── invoice-list.tsx            # Rechnungs-Tabelle
├── invoice-row.tsx             # Einzelne Rechnung
├── billing-portal-button.tsx   # Stripe Portal Redirect
├── plan-toggle.tsx             # Monatlich/Jahrlich Switch
└── cancel-dialog.tsx           # Kundigungs-Bestatigung
```

---

## 7. Tech-Entscheidungen

### 7.1 Warum Stripe?

| Kriterium | Stripe | Alternative (Paddle/Chargebee) |
|-----------|--------|-------------------------------|
| **DPCI Compliance** | Stripe ubernimmt alles | Paddle auch, Chargebee nicht |
| **Preis** | 1.5% + 0.25EUR pro Transaktion | Paddle 5%+ Chargebee + Gateway |
| **Customer Portal** | Kostenlos enthalten | Bei Paddle/Chargebee extra |
| **Invoice Hosting** | Automatisch | Automatisch |
| **SEPA-Lastschrift** | Unterstutzt | Stripe bestes EU-Support |

**Entscheidung:** Stripe fur beste EU-Unterstutzung und niedrigste Kosten bei unserem Volumen.

### 7.2 Warum lokale Invoice-Kopie?

1. **Performance:** Kein API-Call zu Stripe fur Rechnungsliste
2. **Offline-Verfugbarkeit:** User sieht Rechnungen auch bei Stripe-Ausfall
3. **Erweiterbarkeit:** Eigene Felder moglich (interne Notizen, etc.)

### 7.3 Warum Stripe Customer Portal?

**Vorteile:**
- Keine eigene Zahlungsmethoden-Verwaltung bauen
- Stripe-Standard: Sicher, getestet, PCI-konform
- Weniger Code = weniger Bugs
- User kennt Interface von anderen Diensten

**Limitationen:**
- Custom Branding kostet extra
- Wenig Flexibilitat im Workflow
- Nicht fur komplexe B2B-Features

**Trade-off:** Fur MVP optimal. Spater evtl. eigene Implementation.

---

## 8. Plan-Struktur (Vorschlag)

| Feature | Free | Starter (49EUR) | Pro (99EUR) | Enterprise (199EUR) |
|---------|------|----------------|-------------|---------------------|
| **Credits/Monat** | 30 | 500 | 2000 | 5000 |
| **Suchergebnisse** | 50 max | 500 max | Unbegrenzt | Unbegrenzt |
| **Export (CSV)** | 10 Leads | 500 Leads | Unbegrenzt | Unbegrenzt |
| **Smart Filter** | Nein | Ja | Ja | Ja |
| **CRM-Kontakte** | 10 | 100 | 1000 | Unbegrenzt |
| **Deals** | 3 | 20 | 100 | Unbegrenzt |
| **Support** | Email | Email | Priority | Dedicated |

**Stripe Price IDs:**
- Produkt-Konfiguration in Stripe Dashboard
- Price IDs in Umgebungsvariablen oder plans-Tabelle

---

## 9. Dependencies

**Installieren:**
```bash
npm install stripe
npm install @stripe/stripe-js          # Frontend (optional, Checkout redirect reicht)
```

**Keine zusatzlichen Packages notig:**
- Webhook-Handling via Next.js Route
- UI via bestehende shadcn/ui Komponenten
- State Management via UserProvider (bestehend)

---

## 10. Migrations-Plan

### Phase 1: Datenbank (Migration 1)
```sql
-- 1. subscriptions Tabelle erweitern
ALTER TABLE subscriptions ADD COLUMN ...

-- 2. invoices Tabelle erstellen
CREATE TABLE invoices ...

-- 3. stripe_events Tabelle erstellen
CREATE TABLE stripe_events ...

-- 4. RLS Policies hinzufugen
```

### Phase 2: Backend (PROJ-23)
- Webhook Handler implementieren
- API Routes fur Checkout erstellen
- Environment Variables setzen

### Phase 3: Frontend (PROJ-24)
- PricingTable Komponente
- Subscription Management Page
- Integration in bestehende Plan-Gates

### Phase 4: Testing & Go-Live
- Stripe Test-Mode durchlaufen
- Webhook-Events simulieren
- Live-Switch mit kleiner User-Gruppe

---

## 11. Offene Fragen (fur Requirements Engineer)

1. **Sollen Trials unterstutzt werden?** (14 Tage Pro?)
2. **Brauchen wir SEPA-Lastschrift oder nur Kreditkarte?**
3. **Soll Upgrade/Downgrade sofort oder am Period-Ende wirksam werden?**
4. **Brauchen wir Team/Account-Funktionalitat (mehrere User pro Subscription)?**
5. **Sollen Rechnungen per Email versendet werden (Stripe-Feature)?**
6. **Mussen wir Mehrwertsteuer ausweisen (OSS-One-Stop-Shop)?**

---

## 12. Referenzen

- Stripe Docs: https://stripe.com/docs
- Checkout Session: https://stripe.com/docs/api/checkout/sessions
- Webhooks: https://stripe.com/docs/webhooks
- Customer Portal: https://stripe.com/docs/customer-management
- Best Practices: https://stripe.com/docs/billing/subscriptions/build-subscriptions

---

**Dokument Version:** 1.0 (vorbereitend)
**Autor:** Solution Architect
**Letzte Aktualisierung:** 2026-02-08
**Status:** Wartet auf Requirements (PROJ-22, PROJ-23, PROJ-24)
