"use client";

import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface PlanFeature {
  name: string;
  included: boolean;
  value?: string;
}

export interface Plan {
  id: "free" | "pro" | "enterprise";
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeature[];
  popular?: boolean;
  trialDays: number;
}

interface PlanCardProps {
  plan: Plan;
  currentPlan?: string;
  billingInterval: "monthly" | "yearly";
  onUpgrade?: (planId: string) => void;
  onDowngrade?: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlanCard({
  plan,
  currentPlan,
  billingInterval,
  onUpgrade,
  onDowngrade,
  isLoading,
  disabled,
}: PlanCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isUpgrade = currentPlan && getPlanRank(plan.id) > getPlanRank(currentPlan);
  const isDowngrade = currentPlan && getPlanRank(plan.id) < getPlanRank(currentPlan);

  const price = billingInterval === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const yearlySavings = plan.priceMonthly * 12 - plan.priceYearly;

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-300",
        plan.popular && "border-primary shadow-lg scale-105 z-10",
        isCurrentPlan && "border-green-500 shadow-md",
        !plan.popular && !isCurrentPlan && "hover:shadow-md"
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Beliebt
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="bg-green-100 text-green-700 px-3 py-1">
            Ihr aktueller Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Price */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">
              {price === 0 ? "Kostenlos" : `${price}€`}
            </span>
            {price > 0 && (
              <span className="text-muted-foreground">
                /{billingInterval === "monthly" ? "Monat" : "Jahr"}
              </span>
            )}
          </div>
          {billingInterval === "yearly" && price > 0 && yearlySavings > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Sie sparen {yearlySavings}€/Jahr
            </p>
          )}
          {plan.trialDays > 0 && price > 0 && !isCurrentPlan && (
            <p className="text-sm text-primary mt-2 font-medium">
              {plan.trialDays} Tage kostenlos testen
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
              )}
              <span className={cn("text-sm", !feature.included && "text-muted-foreground")}>
                {feature.value ? `${feature.name}: ${feature.value}` : feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        {isLoading ? (
          <Skeleton className="w-full h-10" />
        ) : isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Aktueller Plan
          </Button>
        ) : isUpgrade ? (
          <Button
            className="w-full"
            onClick={() => onUpgrade?.(plan.id)}
            disabled={disabled}
          >
            {plan.trialDays > 0 ? "Kostenlos testen" : "Jetzt upgraden"}
          </Button>
        ) : isDowngrade ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onDowngrade?.(plan.id)}
            disabled={disabled}
          >
            Downgrade
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onUpgrade?.(plan.id)} disabled={disabled}>
            {plan.trialDays > 0 ? "Kostenlos testen" : "Auswählen"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function getPlanRank(planId: string): number {
  const ranks: Record<string, number> = {
    free: 0,
    pro: 1,
    enterprise: 2,
  };
  return ranks[planId] ?? 0;
}
