"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  Sparkles,
  AlertTriangle,
  Crown,
  User,
} from "lucide-react";

export type PlanType = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "canceled" | "past_due" | "unpaid";

export interface SubscriptionInfo {
  plan: PlanType;
  status: SubscriptionStatus;
  billingInterval: "monthly" | "yearly";
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  creditsUsed: number;
  creditsTotal: number;
  nextPaymentAmount?: number;
}

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
  isLoading?: boolean;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  onCancel?: () => void;
  onReactivate?: () => void;
  onChangePayment?: () => void;
}

export function SubscriptionStatusCard({
  subscription,
  isLoading,
  onUpgrade,
  onDowngrade,
  onCancel,
  onReactivate,
  onChangePayment,
}: SubscriptionStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Keine Abonnement-Daten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Abonnement-Informationen konnten nicht geladen werden.
          </p>
          <Button onClick={onUpgrade} variant="outline">
            Upgrade anzeigen
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planLabels: Record<PlanType, string> = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const statusConfig: Record<SubscriptionStatus, { label: string; variant: any; icon: React.ReactNode }> = {
    active: { label: "Aktiv", variant: "default", icon: <CheckCircle className="w-4 h-4" /> },
    trialing: { label: "In Testphase", variant: "secondary", icon: <Sparkles className="w-4 h-4" /> },
    canceled: { label: "Gekündigt", variant: "destructive", icon: <AlertCircle className="w-4 h-4" /> },
    past_due: { label: "Zahlung überfällig", variant: "destructive", icon: <AlertTriangle className="w-4 h-4" /> },
    unpaid: { label: "Nicht bezahlt", variant: "destructive", icon: <AlertCircle className="w-4 h-4" /> },
  };

  const status = statusConfig[subscription.status];
  const creditsPercentage = (subscription.creditsUsed / subscription.creditsTotal) * 100;

  // Determine available actions
  const isFree = subscription.plan === "free";
  const isCanceled = subscription.status === "canceled" || subscription.cancelAtPeriodEnd;
  const isTrialing = subscription.status === "trialing";
  const isPastDue = subscription.status === "past_due" || subscription.status === "unpaid";

  return (
    <Card className={isCanceled ? "border-orange-300" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Ihr aktueller Plan
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            {status.icon}
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {planLabels[subscription.plan]} Plan
              {subscription.billingInterval === "yearly" && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Jährlich)
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {isFree ? "Kostenlos" : `${subscription.billingInterval === "monthly" ? "Monatlich" : "Jährlich"} bezahlt`}
            </p>
          </div>
        </div>

        {/* Credits Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Credits verbraucht</span>
            <span className="font-medium">
              {subscription.creditsUsed} / {subscription.creditsTotal === Infinity ? "Unbegrenzt" : subscription.creditsTotal}
            </span>
          </div>
          {subscription.creditsTotal !== Infinity && (
            <Progress value={creditsPercentage} className="h-2" />
          )}
        </div>

        {/* Billing Info */}
        <div className="space-y-2 text-sm">
          {isTrialing && subscription.trialEnd && (
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles className="w-4 h-4" />
              <span>
                Testphase endet: {formatDate(subscription.trialEnd)}
              </span>
            </div>
          )}

          {isCanceled && !isFree && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Ihr Plan endet am: {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          )}

          {!isCanceled && !isFree && subscription.nextPaymentAmount && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                Nächste Abrechnung: {formatPrice(subscription.nextPaymentAmount)} am{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          )}

          {isPastDue && !isFree && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Bitte aktualisieren Sie Ihre Zahlungsmethode, um Ihren Plan zu behalten.
              </span>
            </div>
          )}

          {isFree && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Keine zeitliche Begrenzung</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isFree && (
            <Button onClick={onUpgrade} className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade zu Pro
            </Button>
          )}

          {!isFree && !isCanceled && (
            <>
              {subscription.plan !== "enterprise" && (
                <Button onClick={onUpgrade} variant="outline" className="flex-1">
                  Upgrade
                </Button>
              )}
              {subscription.plan !== "free" && (
                <Button onClick={onDowngrade} variant="outline" className="flex-1">
                  Downgrade
                </Button>
              )}
            </>
          )}

          {!isFree && !isCanceled && !isTrialing && (
            <Button onClick={onCancel} variant="destructive" className="flex-1">
              Kündigen
            </Button>
          )}

          {!isFree && isCanceled && (
            <Button onClick={onReactivate} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Reaktivieren
            </Button>
          )}

          {!isFree && (
            <Button onClick={onChangePayment} variant="outline" className="w-full mt-2">
              <CreditCard className="w-4 h-4 mr-2" />
              Zahlungsmethode ändern
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
