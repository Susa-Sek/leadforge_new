"use client";

import { useState } from "react";
import { PlanCard, Plan, PlanFeature } from "./plan-card";
import { BillingToggle } from "./billing-toggle";
import { Check, Shield, X, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingTableProps {
  currentPlan?: string;
  onUpgrade?: (planId: string, billingInterval: "monthly" | "yearly") => void;
  onDowngrade?: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Für Einsteiger",
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 0,
    features: [
      { name: "Kontakte", included: true, value: "50" },
      { name: "Deals", included: true, value: "10" },
      { name: "Such-Export", included: true, value: "10/Monat" },
      { name: "Kanban View", included: false },
      { name: "CSV Import", included: false },
      { name: "CSV Export", included: false },
      { name: "API-Zugang", included: false },
      { name: "Priority Support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Für wachsende Teams",
    priceMonthly: 29,
    priceYearly: 278, // 20% Rabatt: 29 * 12 * 0.8 = 278
    trialDays: 14,
    popular: true,
    features: [
      { name: "Kontakte", included: true, value: "500" },
      { name: "Deals", included: true, value: "100" },
      { name: "Such-Export", included: true, value: "100/Monat" },
      { name: "Kanban View", included: true },
      { name: "CSV Import", included: true },
      { name: "CSV Export", included: true },
      { name: "API-Zugang", included: false },
      { name: "Priority Support", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Für Unternehmen",
    priceMonthly: 99,
    priceYearly: 950, // 20% Rabatt: 99 * 12 * 0.8 = 950
    trialDays: 14,
    features: [
      { name: "Kontakte", included: true, value: "Unbegrenzt" },
      { name: "Deals", included: true, value: "Unbegrenzt" },
      { name: "Such-Export", included: true, value: "500/Monat" },
      { name: "Kanban View", included: true },
      { name: "CSV Import", included: true },
      { name: "CSV Export", included: true },
      { name: "API-Zugang", included: true },
      { name: "Priority Support", included: true },
    ],
  },
];

export function PricingTable({
  currentPlan,
  onUpgrade,
  onDowngrade,
  isLoading,
  disabled,
}: PricingTableProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const handleUpgrade = (planId: string) => {
    onUpgrade?.(planId, billingInterval);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center">
          <Skeleton className="w-64 h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-4">
        <BillingToggle
          value={billingInterval}
          onChange={setBillingInterval}
          showSavings
        />
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            billingInterval={billingInterval}
            onUpgrade={handleUpgrade}
            onDowngrade={onDowngrade}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>Jederzeit kündbar</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>Keine Kreditkarte für Trial</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>Sichere Zahlung via Stripe</span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto pt-8">
        <h3 className="text-lg font-semibold text-center mb-4">
          Häufig gestellte Fragen
        </h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="trial">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Wie funktioniert die Testphase?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              Sie können Pro oder Enterprise 14 Tage kostenlos testen.
              In dieser Zeit haben Sie Zugriff auf alle Features.
              Die Kreditkarte wird erst nach der Testphase belastet.
              Sie können jederzeit vor Ablauf kündigen.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="upgrade">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Kann ich später upgraden?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              Ja! Sie können jederzeit upgraden. Bei einem Upgrade während einer
              laufenden Subscription wird die Differenz automatisch berechnet (Proration).
              Sie haben sofort Zugriff auf die neuen Features.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cancel">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Was passiert beim Kündigen?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              Sie können Ihr Abonnement jederzeit kündigen. Es läuft dann bis zum
              Ende der aktuellen Periode weiter. Danach wechseln Sie automatisch
              zum Free Plan. Ihre Daten bleiben erhalten.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="yearly">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Warum jährlich zahlen?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              Bei jährlicher Zahlung sparen Sie 20% im Vergleich zur monatlichen
              Zahlung. Das sind bei Pro 70€ Ersparnis pro Jahr.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

// Feature Comparison Table
export function FeatureComparisonTable() {
  const allFeatures = [
    { name: "Kontakte", free: "50", pro: "500", enterprise: "Unbegrenzt" },
    { name: "Deals", free: "10", pro: "100", enterprise: "Unbegrenzt" },
    { name: "Such-Export", free: "10/Monat", pro: "100/Monat", enterprise: "500/Monat" },
    { name: "Kanban View", free: false, pro: true, enterprise: true },
    { name: "CSV Import", free: false, pro: true, enterprise: true },
    { name: "CSV Export", free: false, pro: true, enterprise: true },
    { name: "API-Zugang", free: false, pro: false, enterprise: true },
    { name: "Priority Support", free: false, pro: false, enterprise: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Feature</th>
            <th className="text-center py-3 px-4 font-medium">Free</th>
            <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
            <th className="text-center py-3 px-4 font-medium">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((feature, index) => (
            <tr key={index} className="border-b">
              <td className="py-3 px-4">{feature.name}</td>
              <td className="text-center py-3 px-4">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )
                ) : (
                  feature.free
                )}
              </td>
              <td className="text-center py-3 px-4 bg-primary/5">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )
                ) : (
                  <span className="font-medium text-primary">{feature.pro}</span>
                )}
              </td>
              <td className="text-center py-3 px-4">
                {typeof feature.enterprise === "boolean" ? (
                  feature.enterprise ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )
                ) : (
                  feature.enterprise
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
