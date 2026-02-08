import Stripe from 'stripe';

// Stripe client instance - lazy initialization for build compatibility
// This ensures the build doesn't fail when STRIPE_SECRET_KEY is not set
let stripeClient: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeClient;
};

// Lazy-loaded stripe export for backward compatibility
// Accessing this will throw at runtime if STRIPE_SECRET_KEY is not set,
// but it won't break the build
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = getStripe();
    const value = client[prop as keyof Stripe];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Plan hierarchy for upgrade/downgrade detection
export const planHierarchy: Record<string, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

// Get price ID from plan and interval
export function getPriceId(planId: string, interval: string): string | null {
  const priceMap: Record<string, Record<string, string | undefined>> = {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    },
  };

  return priceMap[planId]?.[interval] || null;
}

// Format amount from cents to currency string
export function formatAmount(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Plan display names
export const planNames: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

// Subscription status display names (German)
export const statusNames: Record<string, string> = {
  active: 'Aktiv',
  trialing: 'In Testphase',
  past_due: 'Zahlung überfällig',
  canceled: 'Gekündigt',
  unpaid: 'Unbezahlt',
  incomplete: 'Unvollständig',
  incomplete_expired: 'Abgelaufen',
  paused: 'Pausiert',
};

// Check if subscription is active or in trial
export function isSubscriptionActive(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

// Check if user can upgrade
export function canUpgrade(currentPlan: string, targetPlan: string): boolean {
  return planHierarchy[targetPlan] > planHierarchy[currentPlan];
}

// Check if user can downgrade
export function canDowngrade(currentPlan: string, targetPlan: string): boolean {
  return planHierarchy[targetPlan] < planHierarchy[currentPlan];
}
