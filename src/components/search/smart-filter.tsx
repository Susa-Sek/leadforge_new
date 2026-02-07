/**
 * Smart Filter Component
 *
 * Main filter component with Ja/Nein/Egal logic for lead results.
 * Supports plan-based feature gating and URL state persistence.
 *
 * @module SmartFilter
 * @requires @/components/ui/sheet
 * @requires @/components/ui/button
 * @requires lucide-react
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Filter,
  SlidersHorizontal,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Users,
  MapPin,
  RotateCcw,
  X,
  Crown,
  Sparkles,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

import { FilterToggleGroup, FilterState } from './filter-toggle-group'
import { FilterRangeSlider, RadiusFilter } from './filter-range-slider'
import { ActiveFilters, ActiveFilter } from './active-filters'
import { PlanGate, PlanTier } from './plan-gate'
import { INDUSTRY_OPTIONS } from '@/lib/search/types'

/** Complete filter state interface */
export interface SmartFilterState {
  hasWebsite: FilterState
  hasEmail: FilterState
  hasPhone: FilterState
  hasLinkedIn: FilterState
  hasXing: FilterState
  industries: string[]
  employeeCount: { min: number; max: number }
  revenue: { min: number; max: number }
  radius: number
  // BUG-3 FIX: Rating filters (min/max rating and reviews count)
  rating: { min: number; max: number }
  reviewsCount: { min: number; max: number }
}

/** Default filter state (no filters active) */
export const DEFAULT_FILTER_STATE: SmartFilterState = {
  hasWebsite: 'any',
  hasEmail: 'any',
  hasPhone: 'any',
  hasLinkedIn: 'any',
  hasXing: 'any',
  industries: [],
  employeeCount: { min: 1, max: 1000 },
  revenue: { min: 0, max: 100 },
  radius: 50,
  // BUG-3 FIX: Default rating filters (0-5 stars, 0-1000 reviews)
  rating: { min: 0, max: 5 },
  reviewsCount: { min: 0, max: 1000 },
}

interface SmartFilterProps {
  /** User's subscription tier for feature gating */
  userPlan: PlanTier
  /** Callback when filters change */
  onFilterChange: (filters: SmartFilterState) => void
  /** Optional additional className */
  className?: string
  /** Whether to show as sidebar (desktop) or drawer (mobile) */
  variant?: 'sidebar' | 'drawer' | 'auto'
}

/**
 * SmartFilter Component
 *
 * Advanced filter panel with Ja/Nein/Egal logic and plan-based gating.
 *
 * @example
 * ```tsx
 * <SmartFilter
 *   userPlan="pro"
 *   onFilterChange={(filters) => applyFilters(filters)}
 * />
 * ```
 */
export function SmartFilter({
  userPlan,
  onFilterChange,
  className,
  variant = 'auto',
}: SmartFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse URL params into filter state
  const parseFiltersFromURL = useCallback((): SmartFilterState => {
    const getParam = (key: string, defaultValue: FilterState): FilterState => {
      const value = searchParams.get(key)
      if (value === 'yes' || value === 'no' || value === 'any') return value
      return defaultValue
    }

    const getRangeParam = (key: string, defaultMin: number, defaultMax: number) => {
      const min = parseInt(searchParams.get(`${key}_min`) || String(defaultMin))
      const max = parseInt(searchParams.get(`${key}_max`) || String(defaultMax))
      return { min, max }
    }

    // BUG-3 FIX: Parse rating and reviews count from URL
    const getFloatRangeParam = (key: string, defaultMin: number, defaultMax: number) => {
      const min = parseFloat(searchParams.get(`${key}_min`) || String(defaultMin))
      const max = parseFloat(searchParams.get(`${key}_max`) || String(defaultMax))
      return { min, max }
    }

    return {
      hasWebsite: getParam('f_web', 'any'),
      hasEmail: getParam('f_email', 'any'),
      hasPhone: getParam('f_phone', 'any'),
      hasLinkedIn: getParam('f_linkedin', 'any'),
      hasXing: getParam('f_xing', 'any'),
      industries: searchParams.get('f_industry')?.split(',').filter(Boolean) || [],
      employeeCount: getRangeParam('f_emp', 1, 1000),
      revenue: getRangeParam('f_rev', 0, 100),
      radius: parseInt(searchParams.get('f_radius') || '50'),
      // BUG-3 FIX: Parse rating filters from URL
      rating: getFloatRangeParam('f_rating', 0, 5),
      reviewsCount: getRangeParam('f_reviews', 0, 1000),
    }
  }, [searchParams])

  const [filters, setFilters] = useState<SmartFilterState>(parseFiltersFromURL)
  const [isOpen, setIsOpen] = useState(false)

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: SmartFilterState) => {
      const params = new URLSearchParams(searchParams)

      // Helper to set or delete param
      const setParam = (key: string, value: string, defaultValue: string) => {
        if (value !== defaultValue) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }

      // Toggle filters
      setParam('f_web', newFilters.hasWebsite, 'any')
      setParam('f_email', newFilters.hasEmail, 'any')
      setParam('f_phone', newFilters.hasPhone, 'any')
      setParam('f_linkedin', newFilters.hasLinkedIn, 'any')
      setParam('f_xing', newFilters.hasXing, 'any')

      // Multi-select
      if (newFilters.industries.length > 0) {
        params.set('f_industry', newFilters.industries.join(','))
      } else {
        params.delete('f_industry')
      }

      // Ranges
      if (newFilters.employeeCount.min !== 1) {
        params.set('f_emp_min', String(newFilters.employeeCount.min))
      } else {
        params.delete('f_emp_min')
      }
      if (newFilters.employeeCount.max !== 1000) {
        params.set('f_emp_max', String(newFilters.employeeCount.max))
      } else {
        params.delete('f_emp_max')
      }

      // Revenue (only if enterprise)
      if (userPlan === 'enterprise') {
        if (newFilters.revenue.min !== 0) {
          params.set('f_rev_min', String(newFilters.revenue.min))
        } else {
          params.delete('f_rev_min')
        }
        if (newFilters.revenue.max !== 100) {
          params.set('f_rev_max', String(newFilters.revenue.max))
        } else {
          params.delete('f_rev_max')
        }
      }

      // Radius (only if enterprise)
      if (userPlan === 'enterprise' && newFilters.radius !== 50) {
        params.set('f_radius', String(newFilters.radius))
      } else {
        params.delete('f_radius')
      }

      // BUG-3 FIX: Rating filters in URL
      if (newFilters.rating.min !== 0) {
        params.set('f_rating_min', String(newFilters.rating.min))
      } else {
        params.delete('f_rating_min')
      }
      if (newFilters.rating.max !== 5) {
        params.set('f_rating_max', String(newFilters.rating.max))
      } else {
        params.delete('f_rating_max')
      }

      // BUG-3 FIX: Reviews count filters in URL
      if (newFilters.reviewsCount.min !== 0) {
        params.set('f_reviews_min', String(newFilters.reviewsCount.min))
      } else {
        params.delete('f_reviews_min')
      }
      if (newFilters.reviewsCount.max !== 1000) {
        params.set('f_reviews_max', String(newFilters.reviewsCount.max))
      } else {
        params.delete('f_reviews_max')
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, userPlan]
  )

  // Handle filter changes
  const handleFilterChange = useCallback(
    (updates: Partial<SmartFilterState>) => {
      const newFilters = { ...filters, ...updates }
      setFilters(newFilters)
      updateURL(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange, updateURL]
  )

  // Reset all filters
  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE)
    updateURL(DEFAULT_FILTER_STATE)
    onFilterChange(DEFAULT_FILTER_STATE)
  }, [onFilterChange, updateURL])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.hasWebsite !== 'any') count++
    if (filters.hasEmail !== 'any') count++
    if (filters.hasPhone !== 'any') count++
    if (filters.hasLinkedIn !== 'any') count++
    if (filters.hasXing !== 'any') count++
    if (filters.industries.length > 0) count++
    if (filters.employeeCount.min !== 1 || filters.employeeCount.max !== 1000) count++
    if (filters.revenue.min !== 0 || filters.revenue.max !== 100) count++
    if (filters.radius !== 50) count++
    // BUG-3 FIX: Count rating filters
    if (filters.rating.min !== 0 || filters.rating.max !== 5) count++
    if (filters.reviewsCount.min !== 0 || filters.reviewsCount.max !== 1000) count++
    return count
  }, [filters])

  // Generate active filters list for display
  const activeFiltersList = useMemo<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = []

    if (filters.hasWebsite !== 'any') {
      list.push({
        id: 'website',
        label: 'Website',
        value: filters.hasWebsite === 'yes' ? 'Ja' : 'Nein',
        type: 'toggle',
        state: filters.hasWebsite,
      })
    }

    if (filters.hasEmail !== 'any') {
      list.push({
        id: 'email',
        label: 'Email',
        value: filters.hasEmail === 'yes' ? 'Ja' : 'Nein',
        type: 'toggle',
        state: filters.hasEmail,
      })
    }

    if (filters.hasPhone !== 'any') {
      list.push({
        id: 'phone',
        label: 'Telefon',
        value: filters.hasPhone === 'yes' ? 'Ja' : 'Nein',
        type: 'toggle',
        state: filters.hasPhone,
      })
    }

    if (filters.hasLinkedIn !== 'any') {
      list.push({
        id: 'linkedin',
        label: 'LinkedIn',
        value: filters.hasLinkedIn === 'yes' ? 'Ja' : 'Nein',
        type: 'toggle',
        state: filters.hasLinkedIn,
      })
    }

    if (filters.hasXing !== 'any') {
      list.push({
        id: 'xing',
        label: 'Xing',
        value: filters.hasXing === 'yes' ? 'Ja' : 'Nein',
        type: 'toggle',
        state: filters.hasXing,
      })
    }

    if (filters.industries.length > 0) {
      list.push({
        id: 'industries',
        label: 'Branchen',
        value: `${filters.industries.length} ausgewählt`,
        type: 'multi',
      })
    }

    if (filters.employeeCount.min !== 1 || filters.employeeCount.max !== 1000) {
      list.push({
        id: 'employees',
        label: 'Mitarbeiter',
        value: `${filters.employeeCount.min} - ${filters.employeeCount.max}`,
        type: 'range',
      })
    }

    if (filters.revenue.min !== 0 || filters.revenue.max !== 100) {
      list.push({
        id: 'revenue',
        label: 'Umsatz',
        value: `${filters.revenue.min} - ${filters.revenue.max} Mio €`,
        type: 'range',
      })
    }

    if (filters.radius !== 50) {
      list.push({
        id: 'radius',
        label: 'Umkreis',
        value: `${filters.radius} km`,
        type: 'radius',
      })
    }

    // BUG-3 FIX: Rating filter chips
    if (filters.rating.min !== 0 || filters.rating.max !== 5) {
      list.push({
        id: 'rating',
        label: 'Bewertung',
        value: `${filters.rating.min} - ${filters.rating.max} ★`,
        type: 'range',
      })
    }

    // BUG-3 FIX: Reviews count filter chips
    if (filters.reviewsCount.min !== 0 || filters.reviewsCount.max !== 1000) {
      list.push({
        id: 'reviews',
        label: 'Bewertungen',
        value: `${filters.reviewsCount.min} - ${filters.reviewsCount.max}`,
        type: 'range',
      })
    }

    return list
  }, [filters])

  // Remove individual filter
  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      const updates: Partial<SmartFilterState> = {}

      switch (filterId) {
        case 'website':
          updates.hasWebsite = 'any'
          break
        case 'email':
          updates.hasEmail = 'any'
          break
        case 'phone':
          updates.hasPhone = 'any'
          break
        case 'linkedin':
          updates.hasLinkedIn = 'any'
          break
        case 'xing':
          updates.hasXing = 'any'
          break
        case 'industries':
          updates.industries = []
          break
        case 'employees':
          updates.employeeCount = { min: 1, max: 1000 }
          break
        case 'revenue':
          updates.revenue = { min: 0, max: 100 }
          break
        case 'radius':
          updates.radius = 50
          break
        // BUG-3 FIX: Reset rating filters
        case 'rating':
          updates.rating = { min: 0, max: 5 }
          break
        case 'reviews':
          updates.reviewsCount = { min: 0, max: 1000 }
          break
      }

      handleFilterChange(updates)
    },
    [handleFilterChange]
  )

  // Check plan access
  const hasProAccess = userPlan === 'pro' || userPlan === 'enterprise'
  const hasEnterpriseAccess = userPlan === 'enterprise'

  // Filter panel content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters Summary */}
      <ActiveFilters
        filters={activeFiltersList}
        onRemove={handleRemoveFilter}
        onReset={handleReset}
      />

      <Separator />

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pr-4">
          {/* Basic Filters - All Plans */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Basis-Filter
            </h4>

            <FilterToggleGroup
              label="Hat Website"
              description="Nur Firmen mit Website anzeigen"
              value={filters.hasWebsite}
              onChange={(value) => handleFilterChange({ hasWebsite: value })}
            />

            <FilterToggleGroup
              label="Hat Email"
              description="Nur Firmen mit E-Mail-Adresse anzeigen"
              value={filters.hasEmail}
              onChange={(value) => handleFilterChange({ hasEmail: value })}
            />

            <FilterToggleGroup
              label="Hat Telefon"
              description="Nur Firmen mit Telefonnummer anzeigen"
              value={filters.hasPhone}
              onChange={(value) => handleFilterChange({ hasPhone: value })}
            />
          </div>

          <Separator />

          {/* BUG-3 FIX: Rating Filters - Available for all plans */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Bewertungs-Filter
            </h4>

            {/* Rating Range Slider (0-5 stars) */}
            <FilterRangeSlider
              label="Bewertung (Sterne)"
              value={filters.rating}
              onChange={(value) => handleFilterChange({ rating: value })}
              min={0}
              max={5}
              step={0.5}
              unit="★"
            />

            {/* Reviews Count Range Slider */}
            <FilterRangeSlider
              label="Anzahl Bewertungen"
              value={filters.reviewsCount}
              onChange={(value) => handleFilterChange({ reviewsCount: value })}
              min={0}
              max={1000}
              step={10}
              unit=""
            />
          </div>

          <Separator />

          {/* Pro Filters */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Pro-Filter
              {!hasProAccess && (
                <Badge variant="secondary" className="text-xs">
                  Pro
                </Badge>
              )}
            </h4>

            <div className={cn(!hasProAccess && 'opacity-75')}>
              <FilterToggleGroup
                label="Hat LinkedIn"
                description="Nur Firmen mit LinkedIn-Profil"
                value={filters.hasLinkedIn}
                onChange={(value) => handleFilterChange({ hasLinkedIn: value })}
                disabled={!hasProAccess}
              />
            </div>

            <div className={cn(!hasProAccess && 'opacity-75')}>
              <FilterToggleGroup
                label="Hat Xing"
                description="Nur Firmen mit Xing-Profil"
                value={filters.hasXing}
                onChange={(value) => handleFilterChange({ hasXing: value })}
                disabled={!hasProAccess}
              />
            </div>

            {/* Industry Multi-Select */}
            <div className={cn('space-y-2', !hasProAccess && 'opacity-75')}>
              <label className="text-sm font-medium">Branchen</label>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRY_OPTIONS.filter((o) => o.value).map((option) => {
                  const isSelected = filters.industries.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!hasProAccess) return
                        const newIndustries = isSelected
                          ? filters.industries.filter((i) => i !== option.value)
                          : [...filters.industries, option.value]
                        handleFilterChange({ industries: newIndustries })
                      }}
                      disabled={!hasProAccess}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md border transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-input',
                        !hasProAccess && 'cursor-not-allowed'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Employee Count Range */}
            <div className={cn(!hasProAccess && 'opacity-75')}>
              <FilterRangeSlider
                label="Mitarbeiterzahl"
                value={filters.employeeCount}
                onChange={(value) => handleFilterChange({ employeeCount: value })}
                min={1}
                max={1000}
                step={10}
                unit="MA"
                disabled={!hasProAccess}
              />
            </div>

            {!hasProAccess && (
              <PlanGate
                requiredPlan="pro"
                featureName="Erweiterte Filter"
                variant="card"
              >
                <div className="h-20" />
              </PlanGate>
            )}
          </div>

          <Separator />

          {/* Enterprise Filters */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              Enterprise-Filter
              {!hasEnterpriseAccess && (
                <Badge variant="secondary" className="text-xs">
                  Enterprise
                </Badge>
              )}
            </h4>

            <div className={cn(!hasEnterpriseAccess && 'opacity-75')}>
              <FilterRangeSlider
                label="Umsatz (Mio €)"
                value={filters.revenue}
                onChange={(value) => handleFilterChange({ revenue: value })}
                min={0}
                max={1000}
                step={10}
                unit="Mio €"
                disabled={!hasEnterpriseAccess}
              />
            </div>

            <div className={cn(!hasEnterpriseAccess && 'opacity-75')}>
              <RadiusFilter
                value={filters.radius}
                onChange={(value) => handleFilterChange({ radius: value })}
                disabled={!hasEnterpriseAccess}
              />
            </div>

            {!hasEnterpriseAccess && (
              <PlanGate
                requiredPlan="enterprise"
                featureName="Enterprise-Filter"
                variant="card"
              >
                <div className="h-20" />
              </PlanGate>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )

  // Mobile drawer
  if (variant === 'drawer' || variant === 'auto') {
    return (
      <div className={className}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {activeFilterCount > 99 ? '99+' : activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader className="space-y-2.5 pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter
              </SheetTitle>
            </SheetHeader>
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop sidebar
  return (
    <div className={cn('w-80 border-r bg-muted/30 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
      <FilterContent />
    </div>
  )
}

/**
 * SmartFilterProvider
 *
 * Hook for consuming filter state in child components
 */
export function useSmartFilter() {
  const [filters, setFilters] = useState<SmartFilterState>(DEFAULT_FILTER_STATE)

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE)
  }, [])

  const updateFilter = useCallback(<K extends keyof SmartFilterState>(
    key: K,
    value: SmartFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const activeCount = useMemo(() => {
    let count = 0
    if (filters.hasWebsite !== 'any') count++
    if (filters.hasEmail !== 'any') count++
    if (filters.hasPhone !== 'any') count++
    if (filters.hasLinkedIn !== 'any') count++
    if (filters.hasXing !== 'any') count++
    if (filters.industries.length > 0) count++
    if (filters.employeeCount.min !== 1 || filters.employeeCount.max !== 1000) count++
    if (filters.revenue.min !== 0 || filters.revenue.max !== 100) count++
    if (filters.radius !== 50) count++
    // BUG-3 FIX: Count rating filters
    if (filters.rating.min !== 0 || filters.rating.max !== 5) count++
    if (filters.reviewsCount.min !== 0 || filters.reviewsCount.max !== 1000) count++
    return count
  }, [filters])

  return {
    filters,
    setFilters,
    resetFilters,
    updateFilter,
    activeCount,
  }
}
