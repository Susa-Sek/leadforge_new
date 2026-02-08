/**
 * Collection Detail Page
 *
 * Displays a single collection with:
 * - Header with back link, title, meta (location, date, credits)
 * - CollectionStats (result count, rating, contact statistics)
 * - LeadResultsTable (reused from E5)
 * - SmartFilter (reused from E5)
 * - Export button (CSV/Excel)
 * - Delete action with confirmation
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Coins,
  Users,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Contact,
} from 'lucide-react'
import { LeadResultsTable } from '@/components/search/lead-results-table'
import { SmartFilter, SmartFilterState, DEFAULT_FILTER_STATE } from '@/components/search/smart-filter'
import { CollectionDetailResponse, CollectionStats as CollectionStatsType } from '@/lib/collections/types'
import { SearchResultLead } from '@/lib/search/types'
import { PlanTier } from '@/components/search/lead-table-columns'
import { cn } from '@/lib/utils'
import { useUser } from '@/components/providers/user-provider'
import { ImportDialog } from '@/components/crm/import-dialog'

// Collection stats component
function CollectionStats({ stats, isLoading }: { stats: CollectionStatsType; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded" />
              <div className="h-4 bg-muted rounded mt-2 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: 'Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Durchschnitt',
      value: stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : 'N/A',
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    {
      label: 'Bewertungen',
      value: stats.totalReviews.toLocaleString('de-DE'),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Kontaktdaten',
      value: `${stats.withEmail} / ${stats.withPhone}`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={cn('p-2 rounded-lg', item.bgColor)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Calculate stats from leads
function calculateStats(leads: SearchResultLead[]): CollectionStatsType {
  const totalLeads = leads.length

  if (totalLeads === 0) {
    return {
      totalLeads: 0,
      averageRating: null,
      totalReviews: 0,
      withWebsite: 0,
      withEmail: 0,
      withPhone: 0,
      withSocialMedia: 0,
    }
  }

  const ratings = leads.filter((l) => l.rating != null).map((l) => l.rating!)
  const averageRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null

  const totalReviews = leads.reduce((sum, l) => sum + (l.reviewsCount || 0), 0)

  const withWebsite = leads.filter((l) => l.website).length
  const withEmail = leads.filter((l) => l.email).length
  const withPhone = leads.filter((l) => l.phone).length
  const withSocialMedia = leads.filter(
    (l) => l.socialLinks && Object.values(l.socialLinks).some(Boolean)
  ).length

  return {
    totalLeads,
    averageRating,
    totalReviews,
    withWebsite,
    withEmail,
    withPhone,
    withSocialMedia,
  }
}

// Filter leads based on smart filter state
function filterLeads(leads: SearchResultLead[], filters: SmartFilterState): SearchResultLead[] {
  return leads.filter((lead) => {
    // Website filter
    if (filters.hasWebsite === 'yes' && !lead.website) return false
    if (filters.hasWebsite === 'no' && lead.website) return false

    // Email filter
    if (filters.hasEmail === 'yes' && !lead.email) return false
    if (filters.hasEmail === 'no' && lead.email) return false

    // Phone filter
    if (filters.hasPhone === 'yes' && !lead.phone) return false
    if (filters.hasPhone === 'no' && lead.phone) return false

    // Rating filter
    if (lead.rating != null) {
      if (lead.rating < filters.rating.min || lead.rating > filters.rating.max) return false
    }

    // Reviews count filter
    if (lead.reviewsCount != null) {
      if (lead.reviewsCount < filters.reviewsCount.min || lead.reviewsCount > filters.reviewsCount.max) return false
    }

    return true
  })
}

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, planConfig } = useUser()

  const collectionId = params.id as string

  // State
  const [collection, setCollection] = useState<CollectionDetailResponse['collection'] | null>(null)
  const [leads, setLeads] = useState<SearchResultLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<SearchResultLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [filters, setFilters] = useState<SmartFilterState>(DEFAULT_FILTER_STATE)

  // Determine plan tier
  const planTier: PlanTier = useMemo(() => {
    if (!planConfig) return 'free'
    const planName = planConfig.planName.toLowerCase()
    if (planName.includes('enterprise')) return 'enterprise'
    if (planName.includes('pro')) return 'pro'
    return 'free'
  }, [planConfig])

  // Fetch collection data
  const fetchCollection = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/collections/${collectionId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sammlung nicht gefunden')
        }
        throw new Error('Fehler beim Laden der Sammlung')
      }

      const data: CollectionDetailResponse = await response.json()
      setCollection(data.collection)
      setLeads(data.leads)
      setFilteredLeads(data.leads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [collectionId])

  // Delete collection
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Fehler beim Löschen')
      }

      toast({
        title: 'Sammlung gelöscht',
        description: 'Die Sammlung wurde erfolgreich entfernt.',
      })

      router.push('/dashboard/sammlungen')
    } catch (err) {
      toast({
        title: 'Fehler',
        description: 'Die Sammlung konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SmartFilterState) => {
    setFilters(newFilters)
    setFilteredLeads(filterLeads(leads, newFilters))
  }, [leads])

  // Calculate stats
  const stats = useMemo(() => calculateStats(filteredLeads), [filteredLeads])

  // Fetch on mount
  useEffect(() => {
    fetchCollection()
  }, [fetchCollection])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Error state
  if (error || !collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {error || 'Sammlung nicht gefunden'}
        </h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Die angeforderte Sammlung konnte nicht geladen werden.
        </p>
        <div className="flex gap-2">
          <Button onClick={fetchCollection} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
          <Button asChild>
            <Link href="/dashboard/sammlungen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const formattedDate = format(new Date(collection.created_at), 'dd.MM.yyyy', {
    locale: de,
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/sammlungen">Sammlungen</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{collection.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/dashboard/sammlungen">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pl-10">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {collection.query_params.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" />
              {Math.ceil(collection.query_params.max_results / 10)} Credits
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {planTier !== 'free' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
            >
              <Contact className="mr-2 h-4 w-4" />
              Zu Kontakten hinzufügen
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CollectionStats stats={stats} isLoading={isLoading} />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <SmartFilter
            userPlan={planTier}
            onFilterChange={handleFilterChange}
            variant="sidebar"
          />
        </div>

        {/* Mobile Filter */}
        <div className="lg:hidden">
          <SmartFilter
            userPlan={planTier}
            onFilterChange={handleFilterChange}
            variant="drawer"
          />
        </div>

        {/* Leads Table */}
        <div className="flex-1 min-w-0">
          <LeadResultsTable
            leads={filteredLeads}
            planTier={planTier}
            searchId={collectionId}
            totalCount={filteredLeads.length}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Import Dialog */}
      {planTier !== 'free' && (
        <ImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          collectionId={collectionId}
          leads={filteredLeads}
          onSuccess={() => {
            toast({
              title: 'Import erfolgreich',
              description: 'Die ausgewählten Leads wurden zu deinen Kontakten hinzugefügt.',
            })
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Sammlung löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Sammlung &quot;{collection.name}&quot; wirklich löschen?
              <br /><br />
              Diese Aktion kann nicht rückgängig gemacht werden. Alle {collection.result_count} Leads in dieser Sammlung werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
