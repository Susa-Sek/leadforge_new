"use client";

import { InvoiceList } from "@/components/billing/invoice-list";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { useInvoices, usePaymentMethods, usePlan } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Building2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Credit card brand icons (simplified)
const cardBrandIcons: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  jcb: "JCB",
  diners: "Diners Club",
  unionpay: "UnionPay",
};

export default function BillingSettingsPage() {
  const { plan: currentPlan, subscription, isLoading: planLoading } = usePlan();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { paymentMethods, isLoading: methodsLoading } = usePaymentMethods();

  const isFree = currentPlan === "free";
  const isLoading = planLoading || invoicesLoading || methodsLoading;

  // Plan info for display
  const planLabels: Record<string, { name: string; price: number; icon: any }> = {
    free: { name: "Free", price: 0, icon: CheckCircle },
    pro: { name: "Pro", price: 29, icon: Receipt },
    enterprise: { name: "Enterprise", price: 99, icon: Building2 },
  };

  const planInfo = planLabels[currentPlan] || planLabels.free;

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
        <h1 className="text-3xl font-bold">Abrechnung & Rechnungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalten Sie Ihre Zahlungsmethoden und Rechnungen
        </p>
      </div>

      <div className="grid gap-8">
        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <planInfo.icon className="w-5 h-5 text-primary" />
              Aktueller Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{planInfo.name}</h3>
                    <Badge variant={isFree ? "secondary" : "default"}>
                      {isFree ? "Kostenlos" : subscription?.status === "trialing" ? "Testphase" : "Aktiv"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {isFree
                      ? "Keine Zahlung erforderlich"
                      : subscription?.billingInterval === "yearly"
                      ? `€${planInfo.price * 12 * 0.8}/Jahr (20% gespart)`
                      : `€${planInfo.price}/Monat`}
                  </p>
                </div>

                {!isFree && (
                  <div className="text-sm text-muted-foreground">
                    {subscription?.status === "trialing" && subscription.trialEnd ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-4 h-4" />
                        Testphase endet: {formatDate(subscription.trialEnd)}
                      </div>
                    ) : subscription?.cancelAtPeriodEnd ? (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        Endet am: {formatDate(subscription.currentPeriodEnd)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Nächste Abrechnung: {formatDate(subscription?.currentPeriodEnd)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Zahlungsmethoden
            </CardTitle>
            <CardDescription>
              Ihre gespeicherten Zahlungsmethoden bei Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {methodsLoading ? (
              <Skeleton className="h-24" />
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {isFree
                    ? "Keine Zahlungsmethode erforderlich für Free Plan"
                    : "Keine Zahlungsmethoden gespeichert"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-medium">
                        {cardBrandIcons[method.brand] || method.brand}
                      </div>
                      <div>
                        <p className="font-medium">
                          •••• {method.last4}
                          {method.isDefault && (
                            <Badge variant="secondary" className="ml-2">
                              Standard
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Läuft ab {method.expMonth.toString().padStart(2, "0")}/
                          {method.expYear.toString().slice(-2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isFree && (
              <div className="mt-4">
                <BillingPortalButton>
                  Zahlungsmethode ändern
                </BillingPortalButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Address Info */}
        {!isFree && (
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsadresse</CardTitle>
              <CardDescription>
                Ihre Rechnungsadresse wird von Stripe verwaltet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingPortalButton variant="outline">
                Rechnungsadresse aktualisieren
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </BillingPortalButton>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Invoice History */}
        <InvoiceList
          invoices={invoices.map((inv) => ({
            ...inv,
            stripeInvoiceId: inv.stripeInvoiceId,
            amountDue: inv.amountDue,
            amountPaid: inv.amountPaid,
          }))}
          isLoading={invoicesLoading}
        />

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Hilfe & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Haben Sie Fragen zu Ihrer Abrechnung oder benötigen Sie Hilfe?
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="mailto:support@manyleads.io">
                <Button variant="outline" size="sm">
                  Support kontaktieren
                </Button>
              </Link>
              <Link href="/dashboard/einstellungen/abonnement">
                <Button variant="outline" size="sm">
                  Abonnement verwalten
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
