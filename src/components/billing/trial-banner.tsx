"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";

export type TrialBannerVariant = "trial" | "ending" | "canceled";

interface TrialBannerProps {
  variant: TrialBannerVariant;
  daysRemaining?: number;
  trialEndDate?: string;
  subscriptionEndDate?: string;
  planName?: string;
  onUpgrade?: () => void;
  onReactivate?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function TrialBanner({
  variant,
  daysRemaining,
  trialEndDate,
  subscriptionEndDate,
  planName = "Pro",
  onUpgrade,
  onReactivate,
  onDismiss,
  className,
}: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissed state in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(`trial-banner-${variant}`, "dismissed");
    }
  };

  // Check if banner was previously dismissed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(`trial-banner-${variant}`);
      if (dismissed === "dismissed") {
        setIsVisible(false);
      }
    }
  }, [variant]);

  if (!isVisible) return null;

  const configs = {
    trial: {
      icon: <Sparkles className="w-5 h-5" />,
      badge: "Testphase",
      badgeVariant: "secondary" as const,
      bgClass: "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200",
      textClass: "text-blue-900",
      buttonVariant: "default" as const,
      getTitle: () => `Sie sind in der 14-Tage-Testphase.`,
      getMessage: () =>
        daysRemaining !== undefined
          ? `Noch ${daysRemaining} Tage übrig.`
          : trialEndDate
          ? `Endet am ${formatDate(trialEndDate)}.`
          : "",
      buttonText: "Upgrade jetzt",
      onClick: onUpgrade,
    },
    ending: {
      icon: <Clock className="w-5 h-5" />,
      badge: "Läuft ab",
      badgeVariant: "outline" as const,
      bgClass: "bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-200",
      textClass: "text-orange-900",
      buttonVariant: "default" as const,
      getTitle: () =>
        subscriptionEndDate
          ? `Ihr ${planName} Plan endet am ${formatDate(subscriptionEndDate)}.`
          : `Ihr ${planName} Plan endet bald.`,
      getMessage: () => "Möchten Sie fortfahren?",
      buttonText: "Reaktivieren",
      onClick: onReactivate,
    },
    canceled: {
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: "Gekündigt",
      badgeVariant: "destructive" as const,
      bgClass: "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-200",
      textClass: "text-red-900",
      buttonVariant: "outline" as const,
      getTitle: () =>
        subscriptionEndDate
          ? `Ihr ${planName} Plan endet am ${formatDate(subscriptionEndDate)}.`
          : `Ihr ${planName} Plan wurde gekündigt.`,
      getMessage: () => "Reaktivieren Sie jetzt, um Ihre Features zu behalten.",
      buttonText: "Reaktivieren",
      onClick: onReactivate,
    },
  };

  const config = configs[variant];

  return (
    <div
      className={cn(
        "relative rounded-lg border px-4 py-3 shadow-sm",
        config.bgClass,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 mt-0.5", config.textClass)}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={config.badgeVariant} className="text-xs">
              {config.badge}
            </Badge>
            <p className={cn("font-medium", config.textClass)}>
              {config.getTitle()}
            </p>
          </div>

          {config.getMessage() && (
            <p className={cn("text-sm mt-1", config.textClass, "opacity-90")}>
              {config.getMessage()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {config.onClick && (
            <Button
              variant={config.buttonVariant}
              size="sm"
              onClick={config.onClick}
              className="whitespace-nowrap"
            >
              {config.buttonText}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Banner that shows based on subscription status
interface DashboardBannerProps {
  subscription: {
    status: string;
    plan: string;
    trialEnd?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  onUpgrade?: () => void;
  onReactivate?: () => void;
  className?: string;
}

export function DashboardSubscriptionBanner({
  subscription,
  onUpgrade,
  onReactivate,
  className,
}: DashboardBannerProps) {
  if (!subscription) return null;

  const { status, plan, trialEnd, currentPeriodEnd, cancelAtPeriodEnd } = subscription;

  // Calculate days remaining for trial
  let daysRemaining: number | undefined;
  if (trialEnd) {
    const end = new Date(trialEnd);
    const now = new Date();
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Determine banner variant
  if (status === "trialing") {
    return (
      <TrialBanner
        variant="trial"
        daysRemaining={daysRemaining}
        trialEndDate={trialEnd}
        planName={plan}
        onUpgrade={onUpgrade}
        className={className}
      />
    );
  }

  if (cancelAtPeriodEnd || status === "canceled") {
    return (
      <TrialBanner
        variant="canceled"
        subscriptionEndDate={currentPeriodEnd}
        planName={plan}
        onReactivate={onReactivate}
        className={className}
      />
    );
  }

  // Show "ending" banner if subscription expires in less than 7 days
  if (currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    const now = new Date();
    const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
      return (
        <TrialBanner
          variant="ending"
          subscriptionEndDate={currentPeriodEnd}
          planName={plan}
          onReactivate={onReactivate}
          className={className}
        />
      );
    }
  }

  return null;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
