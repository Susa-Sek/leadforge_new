"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface BillingPortalButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
  returnUrl?: string;
}

export function BillingPortalButton({
  variant = "outline",
  size = "default",
  className,
  children,
  returnUrl = "/dashboard/einstellungen/abrechnung",
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPortal = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnUrl }),
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 404) {
          throw new Error("Kein Stripe-Konto gefunden. Haben Sie ein aktives Abonnement?");
        }
        throw new Error(error || "Billing Portal konnte nicht geöffnet werden");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Keine Portal-URL erhalten");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleOpenPortal}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wird geladen...
        </>
      ) : (
        <>
          {children || (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Zahlungsmethode ändern
            </>
          )}
          <ExternalLink className="ml-2 h-3 w-3" />
        </>
      )}
    </Button>
  );
}
