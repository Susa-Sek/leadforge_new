/**
 * Suchverlauf (Search History) Page
 *
 * Displays user's search history with:
 * - Header with title "Suchverlauf" + summary stats
 * - Status filter tabs (Alle | Abgeschlossen | Fehlgeschlagen | Laufend)
 * - HistoryList with HistoryItem components
 * - HistoryItem: search term, location, results, credits, status, date
 * - Actions: [Search again], [To collection], [Details]
 * - Pagination
 * - Empty state
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  History,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Coins,
  Users,
  Clock,
  X,
} from 'lucide-react'
import { HistoryItem } from '@/components/search/history-item'
import {
  SearchHistoryItem,
  SearchHistoryResponse,
  SearchHistoryFilters,
} from '@/lib/collections/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

// Loading skeleton
function HistoryItemSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ status }: { status: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: 'Noch keine Suchen',
      description: 'Starte deine erste Suche, um Leads zu finden und deinen Verlauf zu füllen.',
    },
    completed: {
      title: 'Keine abgeschlossenen Suchen',
      description: 'Es wurden noch keine Suchen erfolgreich abgeschlossen.',
    },
    failed: {
      title: 'Keine fehlgeschlagenen Suchen',
      description: 'Gute Nachrichten: Bisher sind alle Suchen erfolgreich gewesen!',
    },
    running: {
      title: 'Keine laufenden Suchen',
      description: 'Momentan laufen keine Suchen. Starte eine neue Suche.',
    },
  }

  const message = messages[status] || messages.all

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <History className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{message.title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{message.description}</p>
      <Button asChild>
        <Link href="/dashboard/suche">
          <Search className="mr-2 h-4 w-4" />
          Neue Suche starten
        </Link>
      </Button>
    </div>
  )
}

// Error state component
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Fehler beim Laden</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Der Suchverlauf konnte nicht geladen werden. Bitte versuche es erneut.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Erneut versuchen
      </Button>
    </div>
  )
}

// Summary stats card
function SummaryStats({
  totalSearches,
  totalCredits,
  totalLeads,
}: {
  totalSearches: number
  totalCredits: number
  totalLeads: number
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalSearches}</p>
            <p className="text-sm text-muted-foreground">Gesamte Suchen</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Coins className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCredits}</p>
            <p className="text-sm text-muted-foreground">Credits verbraucht</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalLeads.toLocaleString('de-DE')}</p>
            <p className="text-sm text-muted-foreground">Leads gefunden</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerlaufPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10)
  const statusFilter = searchParams.get('status') || 'all'
  // BUG-1 FIX: Date range filter from URL
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''

  // Local state
  const [searches, setSearches] = useState<SearchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  })
  const [summary, setSummary] = useState({
    total_searches: 0,
    total_credits_used: 0,
    total_leads_found: 0,
  })
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // Update URL with filters
  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Fetch search history
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })

      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      // BUG-1 FIX: Add date range filters to API request
      if (dateFrom) {
        params.set('date_from', new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        params.set('date_to', new Date(dateTo).toISOString())
      }

      const response = await fetch(`/api/search/history?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Fehler beim Laden des Verlaufs')
      }

      const data: SearchHistoryResponse = await response.json()
      setSearches(data.searches)
      setPagination(data.pagination)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, dateFrom, dateTo])

  // Retry search
  const handleRetry = async (searchId: string) => {
    setRetryingId(searchId)

    try {
      const response = await fetch('/api/search/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_id: searchId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler beim Starten der Suche')
      }

      const data = await response.json()

      toast({
        title: 'Suche gestartet',
        description: `Eine neue Suche wurde mit ID ${data.new_search_id} gestartet.`,
      })

      // Redirect to search page
      router.push('/dashboard/suche')
    } catch (err) {
      toast({
        title: 'Fehler',
        description: err instanceof Error ? err.message : 'Die Suche konnte nicht gestartet werden.',
        variant: 'destructive',
      })
    } finally {
      setRetryingId(null)
    }
  }

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    updateURL({ status: value === 'all' ? undefined : value, page: '1' })
  }

  // BUG-1 FIX: Handle date range filter changes
  const handleDateFromChange = (value: string) => {
    updateURL({ date_from: value || undefined, page: '1' })
  }

  const handleDateToChange = (value: string) => {
    updateURL({ date_to: value || undefined, page: '1' })
  }

  const clearDateFilter = () => {
    updateURL({ date_from: undefined, date_to: undefined, page: '1' })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateURL({ page: String(newPage) })
  }

  // Fetch on mount and when URL params change
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suchverlauf</h1>
          <p className="text-muted-foreground">
            Deine vergangenen Suchen und ihre Ergebnisse
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {!isLoading && !error && (
        <SummaryStats
          totalSearches={summary.total_searches}
          totalCredits={summary.total_credits_used}
          totalLeads={summary.total_leads_found}
        />
      )}

      {/* BUG-1 FIX: Status Filter Tabs with Date Range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
            <TabsTrigger value="failed">Fehlgeschlagen</TabsTrigger>
            <TabsTrigger value="running">Laufend</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* BUG-1 FIX: Date Range Filter UI */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
              placeholder="Von"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
              placeholder="Bis"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState onRetry={fetchHistory} />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <HistoryItemSkeleton key={i} />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <EmptyState status={statusFilter} />
      ) : (
        <div className="space-y-4">
          {searches.map((search) => (
            <HistoryItem
              key={search.id}
              search={search}
              onRetry={handleRetry}
              isRetrying={retryingId === search.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && searches.length > 0 && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Zeige {(page - 1) * pagination.limit + 1} -{' '}
            {Math.min(page * pagination.limit, pagination.total)} von{' '}
            {pagination.total} Einträgen
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) handlePageChange(page - 1)
                  }}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from(
                { length: Math.min(5, pagination.total_pages) },
                (_, i) => {
                  let pageNum: number
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(pageNum)
                        }}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
              )}

              {pagination.total_pages > 5 && page < pagination.total_pages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < pagination.total_pages) handlePageChange(page + 1)
                  }}
                  className={
                    page >= pagination.total_pages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
