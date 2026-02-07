/**
 * Filter Toggle Group Component
 *
 * A three-state toggle for filter options: Ja (Yes), Nein (No), Egal (Any)
 * Used for boolean filter fields like "Has Website", "Has Email", etc.
 *
 * @module FilterToggleGroup
 * @requires @/components/ui/button
 * @requires lucide-react
 */

'use client'

import { cn } from '@/lib/utils'
import { Check, X, Minus } from 'lucide-react'

/** Filter state type: 'yes' | 'no' | 'any' */
export type FilterState = 'yes' | 'no' | 'any'

interface FilterToggleGroupProps {
  /** Current filter state value */
  value: FilterState
  /** Callback when filter state changes */
  onChange: (value: FilterState) => void
  /** Label displayed above the toggle group */
  label: string
  /** Optional description text */
  description?: string
  /** Whether the filter is disabled */
  disabled?: boolean
  /** Optional additional className */
  className?: string
}

/**
 * Configuration for each toggle state
 */
const STATE_CONFIG: Record<
  FilterState,
  { label: string; icon: typeof Check; color: string; activeColor: string }
> = {
  yes: {
    label: 'Ja',
    icon: Check,
    color: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
    activeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  no: {
    label: 'Nein',
    icon: X,
    color: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
    activeColor: 'bg-rose-100 text-rose-700 border-rose-300',
  },
  any: {
    label: 'Egal',
    icon: Minus,
    color: 'text-slate-600 hover:text-slate-700 hover:bg-slate-50',
    activeColor: 'bg-slate-100 text-slate-700 border-slate-300',
  },
}

/**
 * FilterToggleGroup Component
 *
 * Renders a three-state toggle for Yes/No/Any filter logic.
 *
 * @example
 * ```tsx
 * <FilterToggleGroup
 *   label="Hat Website"
 *   value={filters.hasWebsite}
 *   onChange={(value) => setFilters({ ...filters, hasWebsite: value })}
 * />
 * ```
 */
export function FilterToggleGroup({
  value,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: FilterToggleGroupProps) {
  const states: FilterState[] = ['yes', 'no', 'any']

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex rounded-lg border border-border p-1 bg-muted/30">
        {states.map((state) => {
          const config = STATE_CONFIG[state]
          const Icon = config.icon
          const isActive = value === state

          return (
            <button
              key={state}
              type="button"
              onClick={() => !disabled && onChange(state)}
              disabled={disabled}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium rounded-md transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive ? config.activeColor : config.color,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={isActive}
              aria-label={`${label}: ${config.label}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Compact Filter Toggle
 *
 * Smaller version for tight spaces or inline filters
 */
interface CompactFilterToggleProps {
  value: FilterState
  onChange: (value: FilterState) => void
  label: string
  disabled?: boolean
  className?: string
}

export function CompactFilterToggle({
  value,
  onChange,
  label,
  disabled = false,
  className,
}: CompactFilterToggleProps) {
  const states: FilterState[] = ['yes', 'no', 'any']

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground min-w-[100px]">{label}</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {states.map((state) => {
          const config = STATE_CONFIG[state]
          const Icon = config.icon
          const isActive = value === state

          return (
            <button
              key={state}
              type="button"
              onClick={() => !disabled && onChange(state)}
              disabled={disabled}
              className={cn(
                'flex items-center justify-center px-2 py-1 text-xs transition-colors',
                isActive ? config.activeColor : 'hover:bg-muted',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={config.label}
              aria-pressed={isActive}
            >
              <Icon className="h-3 w-3" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
