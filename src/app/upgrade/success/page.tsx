"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlan } from "@/hooks/use-plan";
import { toast } from "sonner";
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Calendar,
  CreditCard,
  Check,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface CheckoutSession {
  id: string;
  status: string;
  paymentStatus: string;
  planId: string;
  billingInterval: "monthly" | "yearly";
  trialEnd?: string;
  amountTotal?: number;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { mutate: mutatePlan } = usePlan();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Keine Session-ID gefunden");
      setIsLoading(false);
      return;
    }

    // Verify checkout session
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/checkout/success?session_id=${sessionId}`);

        if (!response.ok) {
          throw new Error("Ungültige Checkout-Session");
        }

        const data = await response.json();
        setSession(data);

        // Refresh plan data
        await mutatePlan();

        // Show success toast
        toast.success("Willkommen im Premium-Plan!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verifikation fehlgeschlagen";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [sessionId, mutatePlan]);

  const planLabels: Record<string, string> = {
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const planFeatures: Record<string, string[]> = {
    pro: [
      "500 Kontakte",
      "100 Deals",
      "Kanban-View",
      "CSV Import & Export",
      "100 Such-Export/Monat",
    ],
    enterprise: [
      "Unbegrenzte Kontakte",
      "Unbegrenzte Deals",
      "Kanban-View",
      "CSV Import & Export",
      "500 Such-Export/Monat",
      "API-Zugang",
      "Priority Support",
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Fehler bei der Verifikation</h1>
              <p className="text-muted-foreground mb-6">
                {error || "Die Checkout-Session konnte nicht verifiziert werden."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/upgrade">
                  <Button variant="outline">Zurück zu Preisen</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>Zum Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const planName = planLabels[session.planId] || session.planId;
  const features = planFeatures[session.planId] || [];
  const hasTrial = !!session.trialEnd;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-green-200 shadow-lg">
          <CardContent className="p-8">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Willkommen im {planName} Plan!
              </h1>
              <p className="text-muted-foreground">
                Ihr Abonnement wurde erfolgreich aktiviert.
              </p>
            </div>

            {/* Trial Info */}
            {hasTrial && session.trialEnd && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Ihre {calculateTrialDays(session.trialEnd)}-Tage-Testphase läuft bis{" "}
                      {formatDate(session.trialEnd)}
                    </p>
                    <p className="text-sm text-blue-700">
                      Danach: {formatPrice(session.amountTotal || 0)}/
                      {session.billingInterval === "monthly" ? "Monat" : "Jahr"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Sie haben jetzt Zugriff auf:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Info */}
            <div className="bg-muted rounded-lg p-4 mb-8">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Abrechnungsdetails
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intervall</span>
                  <span className="font-medium">
                    {session.billingInterval === "monthly" ? "Monatlich" : "Jährlich"}
                  </span>
                </div>
                {!hasTrial && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Betrag</span>
                    <span className="font-medium">{formatPrice(session.amountTotal || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600">
                    {hasTrial ? "In Testphase" : "Aktiv"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="flex-1">
                <Button size="lg" className="w-full">
                  Zum Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard/einstellungen/abrechnung" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <CreditCard className="mr-2 w-4 h-4" />
                  Abrechnung ansehen
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Fragen? Schreiben Sie uns an{" "}
              <Link href="mailto:support@manyleads.io" className="text-primary hover:underline">
                support@manyleads.io
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calculateTrialDays(trialEnd: string): number {
  const end = new Date(trialEnd);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
