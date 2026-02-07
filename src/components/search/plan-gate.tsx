/**
 * Plan Gate Component
 *
 * Displays upgrade prompts for features that are locked based on the user's subscription plan.
 * Shows blurred content with an upgrade badge that links to the pricing page.
 *
 * @module PlanGate
 * @requires @/components/ui/badge
 * @requires @/components/ui/button
 * @requires lucide-react
 */

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'

/** Available subscription tiers */
export type PlanTier = 'free' | 'pro' | 'enterprise'

interface PlanGateProps {
  /** The children to render inside the gated area */
  children: ReactNode
  /** The minimum plan required to unlock this feature */
  requiredPlan: PlanTier
  /** The name of the feature being gated (shown in badge) */
  featureName: string
  /** Optional additional className for styling */
  className?: string
  /** Whether to show the full upgrade card or just a badge */
  variant?: 'badge' | 'card' | 'inline'
}

/**
 * Plan configuration with display names and colors
 */
const PLAN_CONFIG: Record<PlanTier, { name: string; color: string; icon: typeof Lock }> = {
  free: { name: 'Free', color: 'bg-slate-100 text-slate-700', icon: Lock },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-700', icon: Sparkles },
  enterprise: { name: 'Enterprise', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

/**
 * PlanGate Component
 *
 * Wraps content that requires a specific plan tier. Shows an upgrade prompt
 * for users on lower tiers.
 *
 * @example
 * ```tsx
 * <PlanGate requiredPlan="pro" featureName="CSV Export">
 *   <ExportButton />
 * </PlanGate>
 * ```
 */
export function PlanGate({
  children,
  requiredPlan,
  featureName,
  className = '',
  variant = 'inline',
}: PlanGateProps) {
  const config = PLAN_CONFIG[requiredPlan]
  const Icon = config.icon

  // Badge variant - small inline badge
  if (variant === 'badge') {
    return (
      <div className={`relative inline-flex items-center gap-2 ${className}`}>
        <div className="blur-[2px] opacity-50 select-none">{children}</div>
        <Badge className={`${config.color} gap-1`}>
          <Icon className="h-3 w-3" />
          {config.name}
        </Badge>
      </div>
    )
  }

  // Card variant - full upgrade card
  if (variant === 'card') {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-[3px] opacity-40 select-none pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 shadow-lg text-center max-w-xs">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h4 className="font-semibold mb-1">{featureName}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade auf {config.name} um {featureName} zu nutzen
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/einstellungen/abonnement">Jetzt upgraden</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Inline variant (default) - blurred with badge overlay
  return (
    <div className={`relative inline-block min-w-[60px] ${className}`}>
      <div className="blur-[3px] opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link href="/dashboard/einstellungen/abonnement">
          <Badge
            className={`${config.color} gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
            title={`Upgrade auf ${config.name} für ${featureName}`}
          >
            <Icon className="h-3 w-3" />
            {config.name}
          </Badge>
        </Link>
      </div>
    </div>
  )
}

/**
 * PlanGateBadge Component
 *
 * Simple badge that shows plan requirement without content blur
 *
 * @example
 * ```tsx
 * <PlanGateBadge plan="pro" />
 * ```
 */
interface PlanGateBadgeProps {
  plan: PlanTier
  className?: string
}

export function PlanGateBadge({ plan, className = '' }: PlanGateBadgeProps) {
  const config = PLAN_CONFIG[plan]
  const Icon = config.icon

  return (
    <Link href="/dashboard/einstellungen/abonnement">
      <Badge className={`${config.color} gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}>
        <Icon className="h-3 w-3" />
        {config.name}
      </Badge>
    </Link>
  )
}

/**
 * UpgradePrompt Component
 *
 * Full upgrade prompt for standalone use (e.g., in empty states)
 *
 * @example
 * ```tsx
 * <UpgradePrompt
 *   requiredPlan="enterprise"
 *   featureName="Excel Export"
 *   description="Exportieren Sie Ihre Leads als Excel-Datei mit allen Details"
 * />
 * ```
 */
interface UpgradePromptProps {
  requiredPlan: PlanTier
  featureName: string
  description?: string
}

export function UpgradePrompt({ requiredPlan, featureName, description }: UpgradePromptProps) {
  const config = PLAN_CONFIG[requiredPlan]
  const Icon = config.icon

  return (
    <div className="border rounded-lg p-6 text-center bg-muted/30">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${config.color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{featureName}</h3>
      {description && <p className="text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>}
      <Button asChild>
        <Link href="/dashboard/einstellungen/abonnement">
          Upgrade auf {config.name}
        </Link>
      </Button>
    </div>
  )
}
