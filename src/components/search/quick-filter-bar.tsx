/**
 * Quick Filter Bar Component
 *
 * BUG-7 FIX: Quick filter badges for common filter operations.
 * Displays toggleable badges above the results table for quick access
 * to frequently used filters.
 *
 * @module QuickFilterBar
 */

'use client'

import { useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Mail, Phone, Star, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuickFilterState {
  hasWebsite: boolean | null
  hasEmail: boolean | null
  hasPhone: boolean | null
  minRating: number | null
}

interface QuickFilterBarProps {
  filters: QuickFilterState
  onFilterChange: (filters: QuickFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

const QUICK_FILTERS = [
  { key: 'hasWebsite', label: 'Mit Website', icon: Globe },
  { key: 'hasEmail', label: 'Mit E-Mail', icon: Mail },
  { key: 'hasPhone', label: 'Mit Telefon', icon: Phone },
  { key: 'minRating', label: '4.5+ Sterne', icon: Star },
] as const

export function QuickFilterBar({
  filters,
  onFilterChange,
  onReset,
  resultCount,
  totalCount,
}: QuickFilterBarProps) {
  const hasActiveFilters =
    filters.hasWebsite !== null ||
    filters.hasEmail !== null ||
    filters.hasPhone !== null ||
    filters.minRating !== null

  const toggleFilter = useCallback(
    (key: keyof QuickFilterState) => {
      const newFilters = { ...filters }

      if (key === 'minRating') {
        // Toggle between 4.5 and null
        newFilters.minRating = filters.minRating === 4.5 ? null : 4.5
      } else {
        // Toggle between true and null
        newFilters[key] = filters[key] === true ? null : true
      }

      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Quick-Filter:</span>

        {QUICK_FILTERS.map(({ key, label, icon: Icon }) => {
          const isActive =
            key === 'minRating'
              ? filters.minRating !== null
              : filters[key as keyof QuickFilterState] === true

          return (
            <button
              key={key}
              onClick={() => toggleFilter(key as keyof QuickFilterState)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        })}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>

      <div className="flex-1" />

      <Badge variant="secondary" className="text-xs">
        {resultCount} von {totalCount} Leads
      </Badge>
    </div>
  )
}
