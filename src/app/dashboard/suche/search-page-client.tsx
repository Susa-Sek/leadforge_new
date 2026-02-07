/**
 * Search Page Client Component
 *
 * Client-side logic for the search page including:
 * - Search form with validation
 * - Real-time progress tracking
 * - Lead results table with plan-based gating
 * - Export functionality
 *
 * @module SearchPageClient
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearch } from '@/hooks/use-search'
import { SearchForm } from '@/components/search/search-form'
import { SearchProgress } from '@/components/search/search-progress'
import { LeadResultsTable } from '@/components/search/lead-results-table'
import { ActiveSearchBanner, registerActiveSearch } from '@/components/search/active-search-banner'
import { SmartFilter, SmartFilterState, DEFAULT_FILTER_STATE } from '@/components/search/smart-filter'
import { QuickFilterBar, QuickFilterState } from '@/components/search/quick-filter-bar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SearchResultLead } from '@/lib/search/types'

interface SearchPageClientProps {
  userId: string
  userCredits: number
  userTotalCredits: number
  /** User's subscription plan tier for feature gating */
  planTier?: 'free' | 'pro' | 'enterprise'
}

export function SearchPageClient({
  userCredits,
  planTier = 'free',
}: SearchPageClientProps) {
  const {
    searchId,
    status,
    progress,
    results,
    error,
    isLoading,
    creditsCost,
    startSearch,
    cancelSearch,
    reset,
    isComplete,
  } = useSearch()

  // BUG-1 FIX: SmartFilter state management
  const [filters, setFilters] = useState<SmartFilterState>(DEFAULT_FILTER_STATE)

  // BUG-7 FIX: Quick filter state for badge bar
  const [quickFilters, setQuickFilters] = useState<QuickFilterState>({
    hasWebsite: null,
    hasEmail: null,
    hasPhone: null,
    minRating: null,
  })

  // Filter leads based on SmartFilter state and QuickFilters
  const filteredResults = useMemo(() => {
    if (!results) return []

    return results.filter((lead: SearchResultLead) => {
      // BUG-7 FIX: Quick filters
      if (quickFilters.hasWebsite === true && !lead.website) return false
      if (quickFilters.hasEmail === true && !lead.email) return false
      if (quickFilters.hasPhone === true && !lead.phone) return false
      if (quickFilters.minRating !== null && (lead.rating || 0) < quickFilters.minRating) return false

      // Website filter
      if (filters.hasWebsite === 'yes' && !lead.website) return false
      if (filters.hasWebsite === 'no' && lead.website) return false

      // Email filter
      if (filters.hasEmail === 'yes' && !lead.email) return false
      if (filters.hasEmail === 'no' && lead.email) return false

      // Phone filter
      if (filters.hasPhone === 'yes' && !lead.phone) return false
      if (filters.hasPhone === 'no' && lead.phone) return false

      // LinkedIn filter (Pro+)
      if (filters.hasLinkedIn === 'yes' && !lead.socialLinks?.linkedin) return false
      if (filters.hasLinkedIn === 'no' && lead.socialLinks?.linkedin) return false

      // Xing filter (Pro+)
      if (filters.hasXing === 'yes' && !lead.socialLinks?.xing) return false
      if (filters.hasXing === 'no' && lead.socialLinks?.xing) return false

      // Industry filter
      if (filters.industries.length > 0 && !filters.industries.includes(lead.category || '')) {
        return false
      }

      // Rating filter (BUG-3 FIX: Min/Max rating filter)
      if (lead.rating !== undefined && lead.rating !== null) {
        if (lead.rating < filters.rating.min) return false
        if (lead.rating > filters.rating.max) return false
      }

      // Reviews count filter (BUG-3 FIX: Min/Max reviews filter)
      if (lead.reviewsCount !== undefined && lead.reviewsCount !== null) {
        if (lead.reviewsCount < filters.reviewsCount.min) return false
        if (lead.reviewsCount > filters.reviewsCount.max) return false
      }

      return true
    })
  }, [results, filters, quickFilters])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SmartFilterState) => {
    setFilters(newFilters)
  }, [])

  // Register active search in banner when search starts
  useEffect(() => {
    if (searchId && status && !['completed', 'failed', 'cancelled'].includes(status)) {
      registerActiveSearch({
        id: searchId,
        status,
        progress: progress.percent,
        stepName: progress.stepName,
        leadsFound: progress.leadsFound,
        leadsExpected: progress.leadsExpected,
      })
    }
  }, [searchId, status, progress])

  // Determine which view to show
  const showSearchForm = !searchId || status === null || status === 'cancelled'
  const showProgress = searchId && status !== null && status !== 'cancelled'

  return (
    <>
      {/* Active Search Banner (shown on all pages) */}
      <ActiveSearchBanner />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Form */}
        {(showSearchForm || !showProgress) && (
          <SearchForm
            onSearchStart={startSearch}
            userCredits={userCredits}
            isLoading={isLoading}
          />
        )}

        {/* Progress Display */}
        {showProgress && (
          <SearchProgress
            searchId={searchId}
            status={status}
            progress={progress}
            results={results}
            error={error}
            onCancel={cancelSearch}
            onReset={reset}
          />
        )}

        {/* BUG-1 FIX: Lead Results with SmartFilter Integration */}
        {isComplete && results && results.length > 0 && (
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar with SmartFilter and Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <SmartFilter
                  userPlan={planTier}
                  onFilterChange={handleFilterChange}
                  variant="drawer"
                />
                {/* BUG-9 FIX: Live filtered results count */}
                <span className="text-sm text-muted-foreground">
                  {filteredResults.length} von {results.length} Leads angezeigt
                </span>
              </div>
            </div>

            {/* BUG-7 FIX: Quick Filter Badges Bar */}
            <QuickFilterBar
              filters={quickFilters}
              onFilterChange={setQuickFilters}
              onReset={() => setQuickFilters({ hasWebsite: null, hasEmail: null, hasPhone: null, minRating: null })}
              resultCount={filteredResults.length}
              totalCount={results.length}
            />

            {/* Results Table with filtered data */}
            <LeadResultsTable
              leads={filteredResults}
              planTier={planTier}
              searchId={searchId || undefined}
              totalCount={filteredResults.length}
            />
          </div>
        )}

        {/* Info Card (shown when no search is active) */}
        {showSearchForm && (
          <div className="space-y-6">
            {/* How it works */}
            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="font-semibold mb-4">So funktioniert es</h3>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li>Wähle eine Branche aus dem Dropdown</li>
                <li>Gib einen Standort ein (z.B. Hamburg)</li>
                <li>Lege die Anzahl der gewünschten Leads fest</li>
                <li>Klicke auf "Suche starten"</li>
                <li>Warte, bis die Suche abgeschlossen ist</li>
              </ol>
            </div>

            {/* Credit Information */}
            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="font-semibold mb-4">Credit-Kosten</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basis-Suche</span>
                  <span>1 Credit pro 10 Leads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimale Kosten</span>
                  <span>1 Credit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximale Kosten</span>
                  <span>10 Credits (100 Leads)</span>
                </div>
              </div>
            </div>

            {/* Low Credits Warning */}
            {userCredits < 5 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wenige Credits verfügbar</AlertTitle>
                <AlertDescription>
                  Du hast nur noch {userCredits} Credits. Lade jetzt auf, um weitere Suchen durchführen zu können.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Credit Cost Info (shown during search) */}
        {showProgress && (
          <div className="space-y-6">
            {/* Credit Usage */}
            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="font-semibold mb-4">Credit-Verbrauch</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diese Suche:</span>
                  <span className="font-medium">{creditsCost} Credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verbleibend:</span>
                  <span className="font-medium">{userCredits} Credits</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nach dieser Suche:</span>
                  <span className="font-medium">{Math.max(0, userCredits - creditsCost)} Credits</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border bg-muted/50 p-6">
              <h3 className="font-semibold mb-4">Tipps für bessere Ergebnisse</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Verwende spezifische Branchen für präzisere Ergebnisse
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Größere Städte liefern in der Regel mehr Ergebnisse
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Die Suche kann 1-3 Minuten dauern
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
