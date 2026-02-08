"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/billing/subscription-status";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { usePlan } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Crown,
  Building2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const { subscription, isLoading, mutate } = usePlan();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelStep, setCancelStep] = useState<"reason" | "confirm">("reason");
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  const isFree = subscription?.plan === "free";
  const isCanceled = subscription?.cancelAtPeriodEnd || subscription?.status === "canceled";
  const isTrialing = subscription?.status === "trialing";

  // Transform subscription data for the card component
  const subscriptionInfo = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        creditsUsed: subscription.creditsUsed,
        creditsTotal: subscription.creditsTotal,
        nextPaymentAmount: subscription.plan === "pro" ? 2900 : subscription.plan === "enterprise" ? 9900 : 0,
      }
    : null;

  // Handle cancel subscription
  const handleCancel = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: cancelReason,
          immediate: isTrialing, // Immediate cancel for trial
        }),
      });

      if (!response.ok) {
        throw new Error("Kündigung fehlgeschlagen");
      }

      toast.success(
        isTrialing
          ? "Testphase beendet. Sie sind jetzt auf dem Free Plan."
          : "Kündigung erfolgreich. Ihr Plan läuft bis zum Periodenende."
      );

      await mutate();
      setShowCancelDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reactivate subscription
  const handleReactivate = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/subscription/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Reaktivierung fehlgeschlagen");
      }

      toast.success("Ihr Abonnement läuft weiter!");
      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Plan comparison for upgrade
  const planComparisons = [
    {
      id: "pro",
      name: "Pro",
      price: 29,
      description: "Für wachsende Teams",
      features: ["500 Kontakte", "100 Deals", "Kanban-View", "CSV Import/Export"],
      icon: Sparkles,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      description: "Für Unternehmen",
      features: ["Unbegrenzte Kontakte", "Unbegrenzte Deals", "API-Zugang", "Priority Support"],
      icon: Building2,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="pl-0 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Abonnement verwalten</h1>
        <p className="text-muted-foreground mt-1">
          Verwalten Sie Ihren Plan, Upgrades und Kündigungen
        </p>
      </div>

      {/* Current Status */}
      <div className="mb-8">
        <SubscriptionStatusCard
          subscription={subscriptionInfo}
          isLoading={isLoading}
          onUpgrade={() => router.push("/upgrade")}
          onDowngrade={() => router.push("/upgrade")}
          onCancel={() => setShowCancelDialog(true)}
          onReactivate={handleReactivate}
          onChangePayment={() => {}}
        />
      </div>

      {/* Billing Portal Quick Access */}
      {!isFree && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Stripe Billing Portal
            </CardTitle>
            <CardDescription>
              Verwalten Sie Zahlungsmethoden, Rechnungen und Abonnement-Details direkt bei Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <BillingPortalButton returnUrl="/dashboard/einstellungen/abonnement">
              Zahlungsmethode ändern
            </BillingPortalButton>
            <Link href="/dashboard/einstellungen/abrechnung">
              <Button variant="outline">
                Rechnungsverlauf ansehen
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options (for Free users) */}
      {isFree && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upgrade-Möglichkeiten</CardTitle>
            <CardDescription>
              Wählen Sie einen Plan für mehr Features und höhere Limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planComparisons.map((plan) => (
                <Card key={plan.id} className={plan.id === "enterprise" ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <plan.icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-4">
                      {plan.price}€<span className="text-sm font-normal text-muted-foreground">/Monat</span>
                    </p>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <CheckoutButton
                      planId={plan.id}
                      billingInterval="monthly"
                      className="w-full"
                    >
                      {plan.id === "enterprise" ? "Enterprise testen" : "Pro testen"}
                    </CheckoutButton>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/upgrade">
                <Button variant="link">Alle Pläne vergleichen</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Möchten Sie wirklich kündigen?
            </DialogTitle>
            <DialogDescription>
              {isTrialing
                ? "Ihre Testphase wird sofort beendet und Sie wechseln zum Free Plan."
                : "Ihr Abonnement läuft bis zum Ende der aktuellen Periode weiter."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                <strong>Alternativen zur Kündigung:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Zu Pro downgraden und 70€/Monat sparen</li>
                  <li>Jährlich zahlen und 20% sparen</li>
                  <li>Support kontaktieren für individuelle Lösungen</li>
                </ul>
              </AlertDescription>
            </Alert>

            {cancelStep === "reason" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Warum möchten Sie kündigen?</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Zu teuer", "Nicht genutzt", "Features fehlen", "Technische Probleme"].map(
                    (reason) => (
                      <Button
                        key={reason}
                        variant={cancelReason === reason ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCancelReason(reason);
                          setCancelStep("confirm");
                        }}
                      >
                        {reason}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Abbrechen
            </Button>
            {cancelStep === "confirm" && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gekündigt...
                  </>
                ) : (
                  "Ja, kündigen"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
