'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Loader2, Search, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SearchStatus } from '@/lib/search/types'

interface ActiveSearch {
  id: string
  status: SearchStatus
  progress: number
  stepName: string
  leadsFound: number
  leadsExpected: number
}

interface ActiveSearchBannerProps {
  className?: string
}

export function ActiveSearchBanner({ className }: ActiveSearchBannerProps) {
  const [activeSearches, setActiveSearches] = useState<ActiveSearch[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // Load active searches from localStorage on mount
  useEffect(() => {
    const loadActiveSearches = () => {
      try {
        const stored = localStorage.getItem('activeSearches')
        if (stored) {
          const searches = JSON.parse(stored) as ActiveSearch[]
          // Filter out completed/failed searches older than 1 hour
          const active = searches.filter((s) => {
            const isTerminal = ['completed', 'failed', 'cancelled'].includes(s.status)
            return !isTerminal
          })
          setActiveSearches(active)
        }
      } catch {
        // Ignore parsing errors
      }
    }

    loadActiveSearches()

    // Listen for search updates from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeSearches') {
        loadActiveSearches()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Poll for updates
  useEffect(() => {
    if (activeSearches.length === 0) return

    const interval = setInterval(async () => {
      const updatedSearches = await Promise.all(
        activeSearches.map(async (search) => {
          try {
            const response = await fetch(`/api/search/status?searchId=${search.id}`)
            if (response.ok) {
              const data = await response.json()
              return {
                ...search,
                status: data.status,
                progress: data.progress.percent,
                stepName: data.progress.stepName,
                leadsFound: data.progress.leadsFound,
                leadsExpected: data.progress.leadsExpected,
              }
            }
          } catch {
            // Keep existing data on error
          }
          return search
        })
      )

      // Remove completed searches
      const stillActive = updatedSearches.filter(
        (s) => !['completed', 'failed', 'cancelled'].includes(s.status)
      )

      setActiveSearches(stillActive)
      localStorage.setItem('activeSearches', JSON.stringify(stillActive))
    }, 5000)

    return () => clearInterval(interval)
  }, [activeSearches])

  const dismissBanner = () => {
    setIsVisible(false)
  }

  const removeSearch = (searchId: string) => {
    const updated = activeSearches.filter((s) => s.id !== searchId)
    setActiveSearches(updated)
    localStorage.setItem('activeSearches', JSON.stringify(updated))
  }

  if (!isVisible || activeSearches.length === 0) {
    return null
  }

  // If single search, show compact banner
  if (activeSearches.length === 1) {
    const search = activeSearches[0]
    return (
      <Card className={cn(
        'fixed bottom-4 right-4 z-50 w-80 shadow-lg animate-slide-up',
        className
      )}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium text-sm">Suche läuft...</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                <Link href={`/dashboard/suche?searchId=${search.id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={dismissBanner}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{search.stepName}</span>
              <span className="text-muted-foreground">{search.progress}%</span>
            </div>
            <Progress value={search.progress} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{search.leadsFound} von {search.leadsExpected} Leads</span>
            <Link
              href={`/dashboard/suche?searchId=${search.id}`}
              className="text-primary hover:underline"
            >
              Details
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  // Multiple searches - show expanded view
  return (
    <Card className={cn(
      'fixed bottom-4 right-4 z-50 w-96 shadow-lg animate-slide-up',
      className
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {activeSearches.length} aktive Suchen
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={dismissBanner}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeSearches.map((search) => (
            <div
              key={search.id}
              className="rounded-lg border p-2 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs font-medium truncate max-w-[150px]">
                    {search.id.slice(0, 8)}...
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => removeSearch(search.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{search.stepName}</span>
                  <span className="text-muted-foreground">{search.progress}%</span>
                </div>
                <Progress value={search.progress} className="h-1" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{search.leadsFound} Leads</span>
                <Link
                  href={`/dashboard/suche?searchId=${search.id}`}
                  className="text-primary hover:underline"
                >
                  Öffnen
                </Link>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/dashboard/suche">Alle Suchen anzeigen</Link>
        </Button>
      </div>
    </Card>
  )
}

// Helper function to add a search to the banner (called from useSearch hook)
export function registerActiveSearch(search: ActiveSearch) {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem('activeSearches')
    const searches: ActiveSearch[] = stored ? JSON.parse(stored) : []

    // Check if already exists
    const exists = searches.some((s) => s.id === search.id)
    if (!exists) {
      searches.push(search)
      localStorage.setItem('activeSearches', JSON.stringify(searches))
    }
  } catch {
    // Ignore errors
  }
}
