'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  SearchParams,
  StartSearchResponse,
  SearchStatusResponse,
  SearchStatus,
  SearchResultLead,
} from '@/lib/search/types'

interface UseSearchReturn {
  // State
  searchId: string | null
  status: SearchStatus | null
  progress: {
    percent: number
    currentStep: number
    stepName: string
    leadsFound: number
    leadsExpected: number
  }
  results: SearchResultLead[] | null
  error: string | null
  isLoading: boolean
  creditsCost: number
  creditsRemaining: number

  // Actions
  startSearch: (params: SearchParams) => Promise<void>
  cancelSearch: () => Promise<void>
  reset: () => void

  // Meta
  canCancel: boolean
  isComplete: boolean
  isFailed: boolean
}

// Poll interval in milliseconds
const POLL_INTERVAL = 3000
const MAX_POLLING_DURATION = 5 * 60 * 1000 // 5 minutes

export function useSearch(): UseSearchReturn {
  const [searchId, setSearchId] = useState<string | null>(null)
  const [status, setStatus] = useState<SearchStatus | null>(null)
  const [progress, setProgress] = useState({
    percent: 0,
    currentStep: 0,
    stepName: '',
    leadsFound: 0,
    leadsExpected: 0,
  })
  const [results, setResults] = useState<SearchResultLead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [creditsCost, setCreditsCost] = useState(0)
  const [creditsRemaining, setCreditsRemaining] = useState(0)

  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())
  const pollingStartTimeRef = useRef<number>(0)
  const supabase = createClient()

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe()
      realtimeChannelRef.current = null
    }
  }, [])

  // Reset function
  const reset = useCallback(() => {
    cleanup()
    setSearchId(null)
    setStatus(null)
    setProgress({
      percent: 0,
      currentStep: 0,
      stepName: '',
      leadsFound: 0,
      leadsExpected: 0,
    })
    setResults(null)
    setError(null)
    setIsLoading(false)
    setCreditsCost(0)
    setCreditsRemaining(0)
  }, [cleanup])

  // Fetch search status from API
  const fetchSearchStatus = useCallback(async (id: string): Promise<SearchStatusResponse | null> => {
    try {
      const response = await fetch(`/api/search/status?searchId=${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      console.error('Error fetching search status:', err)
      return null
    }
  }, [])

  // Update state from status response
  const updateFromStatus = useCallback((statusResponse: SearchStatusResponse) => {
    setStatus(statusResponse.status)
    setProgress({
      percent: statusResponse.progress.percent,
      currentStep: statusResponse.progress.currentStep,
      stepName: statusResponse.progress.stepName,
      leadsFound: statusResponse.progress.leadsFound,
      leadsExpected: statusResponse.progress.leadsExpected,
    })

    if (statusResponse.results?.leads) {
      setResults(statusResponse.results.leads)
    }

    if (statusResponse.error) {
      setError(statusResponse.error.message)
    }

    lastUpdateRef.current = Date.now()
  }, [])

  // Setup Supabase Realtime subscription
  const setupRealtime = useCallback((id: string) => {
    const channel = supabase
      .channel(`search-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'search_history',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          const newData = payload.new as {
            status: SearchStatus
            progress_percent: number
            leads_found: number
            results_json?: SearchResultLead[]
          }

          lastUpdateRef.current = Date.now()

          // Map status to progress step
          const statusToStep: Record<SearchStatus, number> = {
            pending: 1,
            validating: 1,
            searching: 2,
            extracting: 3,
            enriching: 4,
            deduplicating: 5,
            completed: 6,
            failed: 6,
            cancelled: 6,
          }

          const stepNames: Record<SearchStatus, string> = {
            pending: 'Warte auf Start...',
            validating: 'Validierung',
            searching: 'Suche gestartet',
            extracting: 'Daten extrahieren',
            enriching: 'Kontakte angereichern',
            deduplicating: 'Duplikate entfernen',
            completed: 'Ergebnisse bereit',
            failed: 'Fehler aufgetreten',
            cancelled: 'Suche abgebrochen',
          }

          setStatus(newData.status)
          setProgress({
            percent: newData.progress_percent,
            currentStep: statusToStep[newData.status] || 0,
            stepName: stepNames[newData.status] || 'Unbekannt',
            leadsFound: newData.leads_found || 0,
            leadsExpected: progress.leadsExpected,
          })

          if (newData.results_json) {
            setResults(newData.results_json)
          }

          // Stop tracking if completed or failed
          if (newData.status === 'completed' || newData.status === 'failed' || newData.status === 'cancelled') {
            cleanup()
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel
  }, [supabase, cleanup, progress.leadsExpected])

  // Start polling as fallback
  const startPolling = useCallback((id: string) => {
    pollingStartTimeRef.current = Date.now()

    pollIntervalRef.current = setInterval(async () => {
      // Check if we've been polling too long
      if (Date.now() - pollingStartTimeRef.current > MAX_POLLING_DURATION) {
        cleanup()
        setError('Die Suche hat zu lange gedauert. Bitte überprüfe den Verlauf.')
        return
      }

      // Only poll if realtime hasn't updated recently (15 seconds)
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current
      if (timeSinceLastUpdate > 15000) {
        const statusResponse = await fetchSearchStatus(id)
        if (statusResponse) {
          updateFromStatus(statusResponse)

          // Stop polling if complete
          if (['completed', 'failed', 'cancelled'].includes(statusResponse.status)) {
            cleanup()
          }
        }
      }
    }, POLL_INTERVAL)
  }, [cleanup, fetchSearchStatus, updateFromStatus])

  // Start search function
  const startSearch = useCallback(async (params: SearchParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: params.branche,
          locationQuery: params.standort,
          maxResults: params.maxResults,
          includeDecisionMakers: false,
          forceNewSearch: false,
        }),
      })

      const data: StartSearchResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Suche konnte nicht gestartet werden')
      }

      // Handle cached results
      if (data.status === 'cached') {
        setStatus('completed')
        setProgress({
          percent: 100,
          currentStep: 6,
          stepName: 'Ergebnisse bereit (aus Cache)',
          leadsFound: params.maxResults,
          leadsExpected: params.maxResults,
        })
        setIsLoading(false)
        return
      }

      // Set search ID and start tracking
      if (data.searchId) {
        setSearchId(data.searchId)
        setCreditsCost(data.creditsCost || 0)
        setCreditsRemaining(data.creditsRemaining || 0)
        setProgress(prev => ({ ...prev, leadsExpected: params.maxResults }))

        // Setup realtime and polling
        setupRealtime(data.searchId)
        startPolling(data.searchId)

        // Update URL with search ID
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('searchId', data.searchId)
          window.history.replaceState({}, '', url.toString())
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [setupRealtime, startPolling])

  // Cancel search function
  const cancelSearch = useCallback(async () => {
    if (!searchId) return

    try {
      // Call cancel API if available
      await fetch(`/api/search/cancel?searchId=${searchId}`, { method: 'POST' })
    } catch (err) {
      console.error('Error cancelling search:', err)
    } finally {
      cleanup()
      setStatus('cancelled')
    }
  }, [searchId, cleanup])

  // Check for existing search in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const existingSearchId = urlParams.get('searchId')

      if (existingSearchId) {
        setSearchId(existingSearchId)
        setIsLoading(true)

        // Fetch current status
        fetchSearchStatus(existingSearchId).then((statusResponse) => {
          if (statusResponse) {
            updateFromStatus(statusResponse)

            // Continue tracking if not complete
            if (!['completed', 'failed', 'cancelled'].includes(statusResponse.status)) {
              setupRealtime(existingSearchId)
              startPolling(existingSearchId)
            }
          }
          setIsLoading(false)
        })
      }
    }

    // Cleanup on unmount
    return cleanup
  }, [cleanup, fetchSearchStatus, setupRealtime, startPolling, updateFromStatus])

  // Determine derived states
  const canCancel = status !== null && !['completed', 'failed', 'cancelled'].includes(status)
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  return {
    searchId,
    status,
    progress,
    results,
    error,
    isLoading,
    creditsCost,
    creditsRemaining,
    startSearch,
    cancelSearch,
    reset,
    canCancel,
    isComplete,
    isFailed,
  }
}
