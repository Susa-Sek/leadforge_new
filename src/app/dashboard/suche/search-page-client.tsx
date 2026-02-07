'use client'

import { useEffect } from 'react'
import { useSearch } from '@/hooks/use-search'
import { SearchForm } from '@/components/search/search-form'
import { SearchProgress } from '@/components/search/search-progress'
import { ActiveSearchBanner, registerActiveSearch } from '@/components/search/active-search-banner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface SearchPageClientProps {
  userId: string
  userCredits: number
  userTotalCredits: number
}

export function SearchPageClient({
  userCredits,
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
  } = useSearch()

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
