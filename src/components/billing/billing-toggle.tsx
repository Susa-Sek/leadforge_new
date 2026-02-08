"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BillingToggleProps {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
  showSavings?: boolean;
}

export function BillingToggle({ value, onChange, showSavings }: BillingToggleProps) {
  return (
    <div className="flex items-center gap-4 bg-muted/50 p-1 rounded-lg inline-flex">
      <Button
        variant={value === "monthly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("monthly")}
        className={cn(
          "transition-all",
          value === "monthly" && "shadow-sm"
        )}
      >
        Monatlich
      </Button>
      <div className="flex items-center gap-2 pr-2">
        <Button
          variant={value === "yearly" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("yearly")}
          className={cn(
            "transition-all",
            value === "yearly" && "shadow-sm"
          )}
        >
          Jährlich
        </Button>
        {showSavings && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
            20% sparen
          </Badge>
        )}
      </div>
    </div>
  );
}
