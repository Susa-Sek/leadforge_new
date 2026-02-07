/**
 * Active Filters Component
 *
 * Displays currently active filters as removable chips/tags.
 * Shows filter count badge and provides reset functionality.
 *
 * @module ActiveFilters
 * @requires @/components/ui/badge
 * @requires lucide-react
 */

'use client'

import { cn } from '@/lib/utils'
import { X, Filter, Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterState } from './filter-toggle-group'

/** Active filter item */
export interface ActiveFilter {
  /** Unique identifier for the filter */
  id: string
  /** Human-readable label */
  label: string
  /** Current value display text */
  value: string
  /** Filter type for styling */
  type: 'toggle' | 'range' | 'multi' | 'radius'
  /** Original filter state (for toggle filters) */
  state?: FilterState
}

interface ActiveFiltersProps {
  /** Array of active filters to display */
  filters: ActiveFilter[]
  /** Callback when a filter is removed */
  onRemove: (filterId: string) => void
  /** Callback to reset all filters */
  onReset: () => void
  /** Optional additional className */
  className?: string
  /** Whether to show the filter count badge */
  showCount?: boolean
  /** Maximum number of filters to show before "+X more" */
  maxVisible?: number
}

/**
 * ActiveFilters Component
 *
 * Renders chips for active filters with remove buttons.
 *
 * @example
 * ```tsx
 * <ActiveFilters
 *   filters={[
 *     { id: 'website', label: 'Website', value: 'Ja', type: 'toggle', state: 'yes' },
 *     { id: 'employees', label: 'Mitarbeiter', value: '10-50', type: 'range' }
 *   ]}
 *   onRemove={(id) => removeFilter(id)}
 *   onReset={() => resetAllFilters()}
 * />
 * ```
 */
export function ActiveFilters({
  filters,
  onRemove,
  onReset,
  className,
  showCount = true,
  maxVisible = 8,
}: ActiveFiltersProps) {
  const hasFilters = filters.length > 0
  const visibleFilters = filters.slice(0, maxVisible)
  const hiddenCount = filters.length - maxVisible

  if (!hasFilters) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Filter className="h-4 w-4" />
        <span>Keine Filter aktiv</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Aktive Filter</span>
          {showCount && (
            <Badge variant="secondary" className="text-xs">
              {filters.length}
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Alle zurücksetzen
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleFilters.map((filter) => (
          <ActiveFilterChip
            key={filter.id}
            filter={filter}
            onRemove={() => onRemove(filter.id)}
          />
        ))}

        {hiddenCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{hiddenCount} weitere
          </Badge>
        )}
      </div>
    </div>
  )
}

/**
 * Individual Filter Chip
 */
interface ActiveFilterChipProps {
  filter: ActiveFilter
  onRemove: () => void
}

function ActiveFilterChip({ filter, onRemove }: ActiveFilterChipProps) {
  // Get color based on filter type and state
  const getChipStyles = () => {
    if (filter.type === 'toggle' && filter.state) {
      switch (filter.state) {
        case 'yes':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
        case 'no':
          return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
        case 'any':
          return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      }
    }
    return 'bg-muted text-foreground border-border hover:bg-muted/80'
  }

  // Get icon based on state
  const getStateIcon = () => {
    if (filter.type === 'toggle' && filter.state) {
      switch (filter.state) {
        case 'yes':
          return <Check className="h-3 w-3 text-emerald-600" />
        case 'no':
          return <Minus className="h-3 w-3 text-rose-600 rotate-90" />
        case 'any':
          return <Minus className="h-3 w-3 text-slate-500" />
      }
    }
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm',
        'transition-colors group',
        getChipStyles()
      )}
    >
      {getStateIcon()}
      <span className="font-medium">{filter.label}:</span>
      <span>{filter.value}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'ml-1 p-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        aria-label={`${filter.label} Filter entfernen`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

/**
 * Filter Summary Badge
 *
 * Compact badge showing filter count, suitable for buttons or headers
 */
interface FilterSummaryProps {
  count: number
  className?: string
}

export function FilterSummary({ count, className }: FilterSummaryProps) {
  if (count === 0) return null

  return (
    <Badge
      variant="default"
      className={cn(
        'ml-2 h-5 min-w-5 flex items-center justify-center text-xs',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}

/**
 * Filter Indicator Dot
 *
 * Simple dot indicator for when filters are active
 */
interface FilterIndicatorProps {
  active: boolean
  className?: string
}

export function FilterIndicator({ active, className }: FilterIndicatorProps) {
  if (!active) return null

  return (
    <span
      className={cn(
        'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary',
        className
      )}
    />
  )
}
