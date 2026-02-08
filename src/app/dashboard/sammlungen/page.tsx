/**
 * Sammlungen (Collections) Overview Page
 *
 * Displays all user's collections with:
 * - Search input (filter by name/location/industry)
 * - View toggle (Grid/List)
 * - Sort options
 * - Collections list (grid or table view)
 * - Pagination
 * - Empty state
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  FolderOpen,
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react'
import { CollectionCard } from '@/components/collections/collection-card'
import { Collection, CollectionsResponse, ViewMode } from '@/lib/collections/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Loading skeleton for cards
function CollectionCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
      <div className="flex justify-between">
        <div className="h-5 bg-muted rounded w-20" />
        <div className="h-5 bg-muted rounded w-16" />
      </div>
    </div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Noch keine Sammlungen</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Starte eine Suche, um automatisch eine Sammlung zu erstellen.
        Deine gesuchten Leads werden hier gespeichert.
      </p>
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
        Die Sammlungen konnten nicht geladen werden. Bitte versuche es erneut.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Erneut versuchen
      </Button>
    </div>
  )
}

// Collections table component (list view)
function CollectionsTable({
  collections,
  onDelete,
  isDeleting,
}: {
  collections: Collection[]
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Standort</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection.id}>
              <TableCell className="font-medium">{collection.name}</TableCell>
              <TableCell>{collection.query_params.location}</TableCell>
              <TableCell>{collection.result_count}</TableCell>
              <TableCell>
                {format(new Date(collection.created_at), 'dd.MM.yyyy', {
                  locale: de,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={collection.status === 'completed' ? 'default' : 'destructive'}
                >
                  {collection.status === 'completed' ? 'Abgeschlossen' : 'Fehlgeschlagen'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/sammlungen/${collection.id}`}>
                    Öffnen
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function SammlungenPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10)
  const viewParam = searchParams.get('view') as ViewMode | null
  const sortBy = searchParams.get('sort_by') || 'date'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const searchQuery = searchParams.get('search') || ''

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam || 'grid')
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  })
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/collections?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Sammlungen')
      }

      const data: CollectionsResponse = await response.json()
      setCollections(data.collections)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, searchQuery])

  // Delete collection
  const handleDelete = async (id: string) => {
    setDeletingId(id)

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Fehler beim Löschen')
      }

      toast({
        title: 'Sammlung gelöscht',
        description: 'Die Sammlung wurde erfolgreich entfernt.',
      })

      // Refresh list
      fetchCollections()
    } catch (err) {
      toast({
        title: 'Fehler',
        description: 'Die Sammlung konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchInput(value)
    updateURL({ search: value || undefined, page: '1' })
  }

  // Handle view mode change
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    updateURL({ view: mode })
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-')
    updateURL({
      sort_by: newSortBy,
      sort_order: newSortOrder,
    })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateURL({ page: String(newPage) })
  }

  // Fetch on mount and when URL params change
  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meine Sammlungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine gespeicherten Lead-Sammlungen
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sammlungen suchen..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortierung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Neueste zuerst</SelectItem>
              <SelectItem value="date-asc">Älteste zuerst</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="count-desc">Meiste Leads</SelectItem>
              <SelectItem value="count-asc">Wenigste Leads</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-none rounded-l-md',
                viewMode === 'grid' && 'bg-muted'
              )}
              onClick={() => handleViewChange('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-none rounded-r-md',
                viewMode === 'list' && 'bg-muted'
              )}
              onClick={() => handleViewChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState onRetry={fetchCollections} />
      ) : isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )
      ) : collections.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onDelete={handleDelete}
              isDeleting={deletingId === collection.id}
            />
          ))}
        </div>
      ) : (
        <CollectionsTable
          collections={collections}
          onDelete={handleDelete}
          isDeleting={!!deletingId}
        />
      )}

      {/* Pagination */}
      {!isLoading && !error && collections.length > 0 && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Zeige {(page - 1) * pagination.limit + 1} -{' '}
            {Math.min(page * pagination.limit, pagination.total)} von{' '}
            {pagination.total} Sammlungen
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
