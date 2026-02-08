'use client'

import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreditProgressProps {
  remaining: number
  total: number
  showIcon?: boolean
  className?: string
}

/**
 * CreditProgress - Zeigt verbleibende Credits mit Fortschrittsbalken
 *
 * Farbcodierung:
 * - Grün: > 50% verbleibend
 * - Gelb: 10-50% verbleibend
 * - Rot: < 10% verbleibend
 */
export function CreditProgress({
  remaining,
  total,
  showIcon = true,
  className,
}: CreditProgressProps) {
  // Berechne Prozentsatz (min 0, max 100)
  const percentage = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0

  // Farbcodierung basierend auf verbleibendem Prozentsatz
  const getColorVariant = () => {
    if (percentage > 50) return 'success'    // Grün
    if (percentage >= 10) return 'warning'   // Gelb
    return 'danger'                          // Rot
  }

  const colorVariant = getColorVariant()

  // Progress-Farben basierend auf Variant
  const progressColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }

  // Text-Farben basierend auf Variant
  const textColors = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-rose-600 dark:text-rose-400',
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header mit Icon und Text */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {showIcon && <Coins className="h-4 w-4" />}
          <span>Credits</span>
        </div>
        <div className={cn('font-medium tabular-nums', textColors[colorVariant])}>
          <span className="text-foreground">{remaining}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </div>
      </div>

      {/* Custom Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            progressColors[colorVariant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Prozent-Anzeige */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(percentage)}% verbleibend</span>
        {percentage < 10 && (
          <span className="text-rose-500 font-medium animate-pulse">
            Fast aufgebraucht!
          </span>
        )}
      </div>
    </div>
  )
}
