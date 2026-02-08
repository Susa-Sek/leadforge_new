# Epic E8: Stripe Integration - Frontend Components

**Status:** ✅ FRONTEND COMPLETE
**Epic:** E8 - Stripe-Integration
**Features:** PROJ-23 (Checkout & Subscriptions), PROJ-24 (Billing Portal & Invoices)

---

## Übersicht

Das Frontend für Epic E8 (Stripe-Integration) ist vollständig implementiert. Alle UI-Komponenten, Pages und Hooks sind fertig und bereit für die Backend-Integration.

---

## Implementierte Pages

### 1. /upgrade - Plan-Auswahl
**Datei:** `src/app/upgrade/page.tsx`

Features:
- Plan-Vergleich (Free, Pro, Enterprise)
- Monatlich/Jährlich Toggle mit 20% Rabatt-Anzeige
- Feature-Liste pro Plan mit Checkmarks
- 14 Tage kostenlos Testen Hinweis
- FAQ-Sektion (Accordion)
- Trust-Badges (SSL, Stripe-Secured)
- Cancel-Alert Handling (Query params)
- Downgrade-Confirmation Dialog
- Auth-Redirect für nicht eingeloggte User

### 2. /upgrade/success - Checkout Erfolgsseite
**Datei:** `src/app/upgrade/success/page.tsx`

Features:
- Session-Verifikation via `session_id` Query Param
- Erfolgs-Animation mit Checkmark
- Trial-Info mit End-Datum
- Liste der neuen Features
- Abrechnungsdetails
- CTA Buttons zum Dashboard und Abrechnung
- Error-Handling für ungültige Sessions

### 3. /dashboard/einstellungen/abonnement - Subscription Management
**Datei:** `src/app/dashboard/einstellungen/abonnement/page.tsx`

Features:
- Aktueller Plan anzeigen
- Credits-Status mit Progress-Bar
- Kündigen/Reaktivieren Buttons
- Stripe Billing Portal Link
- Upgrade/Downgrade Dialoge
- Alternative-Vorschläge bei Kündigung
- Kündigungs-Grund Auswahl

### 4. /dashboard/einstellungen/abrechnung - Rechnungsverlauf
**Datei:** `src/app/dashboard/einstellungen/abrechnung/page.tsx`

Features:
- Aktueller Plan Übersicht
- Zahlungsmethoden Liste (Karten-Icons)
- Rechnungsverlauf mit Filter
- PDF-Download Button
- Pagination (10 pro Seite)
- Stripe Billing Portal Link
- Empty States für Free-User

---

## Komponenten

### 1. PricingTable
**Datei:** `src/components/billing/pricing-table.tsx`

```typescript
interface PricingTableProps {
  currentPlan?: string;
  onUpgrade?: (planId: string, billingInterval: "monthly" | "yearly") => void;
  onDowngrade?: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}
```

- Zeigt 3 Pläne nebeneinander (Desktop) oder untereinander (Mobile)
- Feature-Vergleichs-Liste
- Trust-Badges
- FAQ-Sektion

### 2. PlanCard
**Datei:** `src/components/billing/plan-card.tsx`

```typescript
interface PlanCardProps {
  plan: Plan;
  currentPlan?: string;
  billingInterval: "monthly" | "yearly";
  onUpgrade?: (planId: string) => void;
  onDowngrade?: (planId: string) => void;
}
```

- Einzelne Plan-Karte
- "Beliebt" Badge für Pro
- "Ihr aktueller Plan" Badge
- Preis-Anzeige mit jährlichem Rabatt
- Feature-Liste mit Check/X Icons

### 3. BillingToggle
**Datei:** `src/components/billing/billing-toggle.tsx`

- Monatlich/Jährlich Switch
- "20% sparen" Badge

### 4. CheckoutButton
**Datei:** `src/components/billing/checkout-button.tsx`

```typescript
interface CheckoutButtonProps {
  planId: string;
  billingInterval: "monthly" | "yearly";
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}
```

- Loading State während API Call
- POST /api/checkout aufrufen
- Redirect zu Stripe Checkout
- Error Handling mit Toast

### 5. SubscriptionStatusCard
**Datei:** `src/components/billing/subscription-status.tsx`

```typescript
interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  onCancel?: () => void;
  onReactivate?: () => void;
}
```

- Aktueller Plan mit Badge (Aktiv/Testphase/Gekündigt)
- Credits-Progress-Bar
- Status-Indikatoren mit Farben
- Action-Buttons je nach Status
- Zahlungsmethode ändern Link

### 6. InvoiceList
**Datei:** `src/components/billing/invoice-list.tsx`

```typescript
interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  itemsPerPage?: number;
}
```

- Tabelle mit Rechnungen
- Filter (Alle, Bezahlt, Ausstehend)
- Status-Badges (Farben: grün, gelb, rot)
- PDF-Download Button
- Pagination
- Empty State

### 7. BillingPortalButton
**Datei:** `src/components/billing/billing-portal-button.tsx`

- POST /api/billing/portal aufrufen
- Redirect zu Stripe Customer Portal
- Loading State
- Error Handling

### 8. TrialBanner & DashboardSubscriptionBanner
**Datei:** `src/components/billing/trial-banner.tsx`

```typescript
interface TrialBannerProps {
  variant: "trial" | "ending" | "canceled";
  daysRemaining?: number;
  onUpgrade?: () => void;
  onReactivate?: () => void;
  onDismiss?: () => void;
}
```

- Trial-Banner (blau): "14 Tage kostenlos"
- Ending-Banner (orange): "Läuft bald ab"
- Canceled-Banner (rot): "Gekündigt"
- Dismiss-Button (speichert in localStorage)

---

## Hooks

### usePlan
**Datei:** `src/hooks/use-plan.ts`

```typescript
const {
  plan,                    // 'free' | 'pro' | 'enterprise'
  status,                  // 'active' | 'trialing' | 'canceled'
  subscription,            // Full subscription data
  isLoading,
  hasPlan,                 // (minimumPlan) => boolean
  isActive,
  isTrialing,
  isCanceledButActive,
  trialDaysRemaining,
  subscriptionDaysRemaining,
  limits,                  // { contacts, deals, exports }
  creditsUsed,
  creditsTotal,
  mutate,                  // Refresh data
} = usePlan();
```

### useInvoices
**Datei:** `src/hooks/use-plan.ts`

```typescript
const { invoices, isLoading, error, mutate } = useInvoices();
```

### usePaymentMethods
**Datei:** `src/hooks/use-plan.ts`

```typescript
const { paymentMethods, isLoading, error, mutate } = usePaymentMethods();
```

---

## Dashboard Integration

### Sidebar Navigation
**Datei:** `src/components/dashboard-shell.tsx`

Neue Einstellungen-Gruppe in der Sidebar:
- Abonnement (Crown Icon)
- Abrechnung (Receipt Icon)

### Subscription Banner
- Automatisch im Dashboard angezeigt
- Zeigt Trial, Ending oder Canceled Status
- CTA Buttons für Upgrade/Reaktivierung

---

## API Endpoints (für Backend)

Das Frontend erwartet folgende API Endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout` | POST | Create Stripe Checkout Session |
| `/api/checkout/success` | GET | Verify checkout session |
| `/api/subscription` | GET | Get current subscription |
| `/api/subscription` | PATCH | Upgrade/Downgrade plan |
| `/api/subscription/cancel` | POST | Cancel subscription |
| `/api/subscription/reactivate` | POST | Reactivate subscription |
| `/api/billing/portal` | POST | Create Stripe Portal session |
| `/api/billing/invoices` | GET | Get invoices list |
| `/api/billing/payment-methods` | GET | Get payment methods |

---

## Deutsche UI Labels

Alle UI-Texte sind auf Deutsch:

| English | German |
|---------|--------|
| Upgrade | Upgrade |
| Choose Your Plan | Wählen Sie Ihren Plan |
| Monthly | Monatlich |
| Yearly | Jährlich |
| Save 20% | 20% sparen |
| Current Plan | Ihr aktueller Plan |
| Start Free Trial | Kostenlos testen |
| 14 days free | 14 Tage kostenlos |
| No credit card required | Keine Kreditkarte erforderlich |
| Cancel anytime | Jederzeit kündbar |
| Abonnement | Subscription |
| Abrechnung | Billing |
| Rechnungsverlauf | Invoice History |

---

## Responsive Design

- Mobile: Einzelne Spalte, vertikale Layouts
- Tablet: 2-Spalten Layout
- Desktop: 3-Spalten Layout für Pricing
- Sidebar Collapse auf Mobile

---

## Datei-Struktur

```
src/
├── app/
│   ├── upgrade/
│   │   ├── page.tsx
│   │   └── success/
│   │       └── page.tsx
│   └── dashboard/
│       └── einstellungen/
│           ├── abonnement/
│           │   └── page.tsx
│           └── abrechnung/
│               └── page.tsx
├── components/
│   └── billing/
│       ├── index.ts
│       ├── pricing-table.tsx
│       ├── plan-card.tsx
│       ├── billing-toggle.tsx
│       ├── checkout-button.tsx
│       ├── subscription-status.tsx
│       ├── invoice-list.tsx
│       ├── billing-portal-button.tsx
│       └── trial-banner.tsx
└── hooks/
    ├── index.ts (updated)
    └── use-plan.ts
```

---

## Dependencies

- **SWR** für Data Fetching (bereits im Projekt)
- **shadcn/ui** Components (bereits installiert)
- **Lucide React** Icons (bereits installiert)
- **Stripe.js** Optional für Embedded Checkout (nicht erforderlich)

---

## Backend-Handoff

Das Frontend ist **vollständig** und wartet auf die Backend-APIs.

**Zu implementieren:**
1. Database migrations (invoices, stripe_events tables)
2. API Routes für Checkout und Subscription Management
3. Stripe Webhook Handler
4. Fix API Version in `src/app/api/checkout/success/route.ts`:
   - Change: `'2024-12-18.acacia'` → `'2026-01-28.clover'`

**Next Steps:**
```
Lies .claude/agents/backend-dev.md und implementiere /features/PROJ-23.md
```

---

## Testing Checklist

- [ ] /upgrade Seite zeigt alle Pläne
- [ ] Monatlich/Jährlich Toggle funktioniert
- [ ] Checkout Button leitet zu Stripe weiter
- [ ] Success Page zeigt Bestätigung
- [ ] Cancel Alert wird angezeigt
- [ ] Subscription Status zeigt aktuellen Plan
- [ ] Invoice List zeigt Rechnungen
- [ ] Trial Banner erscheint im Dashboard
- [ ] Mobile-Ansicht ist nutzbar
- [ ] Deutsche UI überall

---

**Dokument Version:** 1.0
**Frontend Status:** ✅ Complete
**Backend Status:** ⏳ Waiting for implementation
**Letzte Aktualisierung:** 2026-02-08
