"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CheckoutButtonProps {
  planId: string;
  billingInterval: "monthly" | "yearly";
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CheckoutButton({
  planId,
  billingInterval,
  variant = "default",
  size = "default",
  className,
  children,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsLoading(true);

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

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Checkout fehlgeschlagen");
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        onSuccess?.();
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wird geladen...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || "Jetzt upgraden"}
        </>
      )}
    </Button>
  );
}
