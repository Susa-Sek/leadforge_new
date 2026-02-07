'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LowCreditWarningProps {
  remaining: number
  total: number
  className?: string
}

/**
 * LowCreditWarning - Alert Banner wenn weniger als 10% Credits verbleiben
 *
 * Zeigt eine Warnung an und bietet einen Link zur Credits-Aufladung
 * (vorbereitet fur spatere Stripe-Integration)
 */
export function LowCreditWarning({
  remaining,
  total,
  className,
}: LowCreditWarningProps) {
  // Berechne Prozentsatz
  const percentage = total > 0 ? (remaining / total) * 100 : 0

  // Nur anzeigen wenn weniger als 10% verbleiben
  if (percentage >= 10) {
    return null
  }

  // Bestimme Schweregrad fur Messaging
  const severity = remaining === 0 ? 'critical' : 'warning'

  const titles = {
    critical: 'Keine Credits mehr verfugbar',
    warning: 'Credits fast aufgebraucht',
  }

  const descriptions = {
    critical: 'Du hast keine Credits mehr ubrig. Lade jetzt auf, um weitere Leads zu suchen.',
    warning: `Nur noch ${remaining} von ${total} Credits verbleibend. Lade jetzt auf, um deine Suche fortzusetzen.`,
  }

  return (
    <Alert
      variant="destructive"
      className={cn(
        'glass-card border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/5',
        'animate-fade-in',
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-rose-500" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <AlertTitle className="text-rose-700 dark:text-rose-400">
            {titles[severity]}
          </AlertTitle>
          <AlertDescription className="text-rose-600/80 dark:text-rose-400/80">
            {descriptions[severity]}
          </AlertDescription>
        </div>
        <Button
          asChild
          size="sm"
          className={cn(
            'shrink-0',
            severity === 'critical'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          )}
        >
          {/* Link zur Credits-Seite - Platzhalter fur Stripe-Integration */}
          <Link href="/dashboard/credits" className="flex items-center gap-1">
            Credits aufladen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Alert>
  )
}

/**
 * Compact Version - Kleine Badge-Variante fur die Sidebar
 */
export function LowCreditBadge({
  remaining,
  total,
}: {
  remaining: number
  total: number
}) {
  const percentage = total > 0 ? (remaining / total) * 100 : 0

  if (percentage >= 10) {
    return null
  }

  return (
    <Link
      href="/dashboard/credits"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        'border border-rose-500/20',
        'hover:bg-rose-500/20 transition-colors animate-pulse'
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      <span>Nur {remaining} Credits</span>
    </Link>
  )
}
