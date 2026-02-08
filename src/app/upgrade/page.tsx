"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PricingTable } from "@/components/billing/pricing-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlan } from "@/hooks/use-plan";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, CheckCircle, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();
  const { plan: currentPlan, isLoading: planLoading, mutate: mutatePlan } = usePlan();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const canceled = searchParams.get("canceled") === "true";
  const error = searchParams.get("error");

  // Handle upgrade
  const handleUpgrade = async (planId: string, billingInterval: "monthly" | "yearly") => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/anmelden?returnTo=/upgrade`);
      return;
    }

    setIsCheckoutLoading(true);
    setSelectedPlanId(planId);
    setSelectedBillingInterval(billingInterval);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingInterval,
        }),
      });

      if (response.status === 409) {
        toast.error("Sie haben bereits diesen Plan");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Checkout fehlgeschlagen");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
      setIsCheckoutLoading(false);
    }
  };

  // Handle downgrade (show confirmation)
  const handleDowngrade = (planId: string) => {
    setSelectedPlanId(planId);
    setShowDowngradeDialog(true);
  };

  // Confirm downgrade
  const confirmDowngrade = async () => {
    if (!selectedPlanId) return;

    setIsCheckoutLoading(true);

    try {
      const response = await fetch("/api/subscription", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlanId,
        }),
      });

      if (!response.ok) {
        throw new Error("Downgrade fehlgeschlagen");
      }

      toast.success("Downgrade erfolgreich! Änderungen am Periodenende aktiv.");
      await mutatePlan();
      setShowDowngradeDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const isLoading = userLoading || planLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Vollenden Sie Ihre Registrierung
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Wählen Sie Ihren Plan für Manyleads.io
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Starten Sie kostenlos oder wählen Sie einen Premium-Plan für mehr Leads und Features.
          </p>
        </div>

        {/* Alerts */}
        {canceled && (
          <Alert className="mb-8 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Checkout abgebrochen. Ihr Plan bleibt unverändert.
              Kein Problem! Sie können jederzeit upgraden.
            </AlertDescription>
          </Alert>
        )}

        {error === "invalid" && (
          <Alert variant="destructive" className="mb-8 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ungültige Checkout-Session. Bitte versuchen Sie es erneut.
            </AlertDescription>
          </Alert>
        )}

        {/* Trial Highlight */}
        {!isLoading && currentPlan === "free" && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">14 Tage kostenlos testen</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Testen Sie Pro oder Enterprise 14 Tage lang ohne Risiko.
              Keine Kreditkarte erforderlich für den Start.
              Jederzeit kündbar.
            </p>
          </div>
        )}

        {/* Pricing Table */}
        <PricingTable
          currentPlan={currentPlan}
          onUpgrade={handleUpgrade}
          onDowngrade={handleDowngrade}
          isLoading={isLoading}
          disabled={isCheckoutLoading}
        />

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Haben Sie Fragen?{" "}
            <Link href="mailto:support@manyleads.io" className="text-primary hover:underline">
              Kontaktieren Sie unser Support-Team
            </Link>
          </p>
          <p className="mt-2">
            Durch die Auswahl eines Plans akzeptieren Sie unsere{" "}
            <Link href="/agb" className="text-primary hover:underline">AGB</Link>{" "}
            und{" "}
            <Link href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>.
          </p>
        </div>
      </div>

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan-Downgrade bestätigen</DialogTitle>
            <DialogDescription>
              Ihr Downgrade wird am Ende der aktuellen Abrechnungsperiode aktiv.
              Sie haben bis dahin weiterhin Zugriff auf alle Features Ihres aktuellen Plans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Keine sofortige Änderung</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Features bis Periodenende verfügbar</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Jederzeit abbrechen möglich</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Abbrechen
            </Button>
            <Button
              variant="default"
              onClick={confirmDowngrade}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? "Wird verarbeitet..." : "Downgrade bestätigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
