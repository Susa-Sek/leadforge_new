"use client";

import useSWR from "swr";

export type PlanType = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "canceled" | "past_due" | "unpaid";

export interface SubscriptionData {
  plan: PlanType;
  status: SubscriptionStatus;
  billingInterval: "monthly" | "yearly";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  creditsUsed: number;
  creditsTotal: number;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch subscription data");
  }
  return response.json();
};

export function usePlan() {
  const { data, error, isLoading, mutate } = useSWR<{
    subscription: SubscriptionData;
  }>("/api/subscription", fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const subscription = data?.subscription;

  // Helper to determine if user has access to a specific plan feature
  const hasPlan = (minimumPlan: PlanType): boolean => {
    const planRanks: Record<PlanType, number> = {
      free: 0,
      pro: 1,
      enterprise: 2,
    };

    const currentRank = planRanks[subscription?.plan || "free"];
    const requiredRank = planRanks[minimumPlan];

    return currentRank >= requiredRank;
  };

  // Check if subscription is active (including trialing)
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  // Check if user is in trial
  const isTrialing = subscription?.status === "trialing";

  // Check if subscription is canceled but still active
  const isCanceledButActive = subscription?.cancelAtPeriodEnd === true;

  // Calculate days remaining in trial
  const trialDaysRemaining = (() => {
    if (!subscription?.trialEnd) return null;
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  // Calculate days remaining until subscription ends
  const subscriptionDaysRemaining = (() => {
    if (!subscription?.currentPeriodEnd) return null;
    const end = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  // Plan limits
  const limits = {
    contacts: subscription?.plan === "enterprise" ? Infinity : subscription?.plan === "pro" ? 500 : 50,
    deals: subscription?.plan === "enterprise" ? Infinity : subscription?.plan === "pro" ? 100 : 10,
    exports: subscription?.plan === "enterprise" ? 500 : subscription?.plan === "pro" ? 100 : 10,
  };

  return {
    plan: subscription?.plan || "free",
    status: subscription?.status || "active",
    billingInterval: subscription?.billingInterval || "monthly",
    subscription,
    isLoading,
    error,
    mutate,
    hasPlan,
    isActive,
    isTrialing,
    isCanceledButActive,
    trialDaysRemaining,
    subscriptionDaysRemaining,
    limits,
    creditsUsed: subscription?.creditsUsed || 0,
    creditsTotal: subscription?.creditsTotal || 30,
  };
}

// Hook for invoices
export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  description?: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  invoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR<{
    invoices: Invoice[];
  }>("/api/billing/invoices", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    invoices: data?.invoices || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for payment methods
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export function usePaymentMethods() {
  const { data, error, isLoading, mutate } = useSWR<{
    methods: PaymentMethod[];
  }>("/api/billing/payment-methods", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    paymentMethods: data?.methods || [],
    isLoading,
    error,
    mutate,
  };
}
