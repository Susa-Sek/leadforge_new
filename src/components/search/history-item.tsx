/**
 * History Item Component
 *
 * Displays a single search history entry with:
 * - Search query info (industry, location)
 * - Result count, credits used, date
 * - Status indicator
 * - Actions: [Retry], [View Collection], [Details]
 */

'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SearchHistoryItem } from '@/lib/collections/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  MapPin,
  Users,
  Coins,
  Clock,
  RotateCcw,
  FolderOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hourglass,
} from 'lucide-react'

interface HistoryItemProps {
  search: SearchHistoryItem
  onRetry?: (id: string) => void
  isRetrying?: boolean
}

/**
 * HistoryItem Component
 *
 * @example
 * ```tsx
 * <HistoryItem
 *   search={searchItem}
 *   onRetry={(id) => handleRetry(id)}
 * />
 * ```
 */
export function HistoryItem({
  search,
  onRetry,
  isRetrying = false,
}: HistoryItemProps) {
  const formattedDate = format(new Date(search.created_at), 'dd.MM.yyyy, HH:mm', {
    locale: de,
  })

  const duration = search.duration_seconds
    ? formatDuration(search.duration_seconds)
    : null

  return (
    <Card className="hover:shadow-sm transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Search Info */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                getStatusBgColor(search.status)
              )}
            >
              <StatusIcon status={search.status} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">
                  {search.query_params.industry}
                </h3>
                <span className="text-muted-foreground">in</span>
                <span className="font-medium text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {search.query_params.location}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedDate}
                </span>
                {duration && (
                  <span className="flex items-center gap-1">
                    <span>Dauer: {duration}</span>
                  </span>
                )}
              </div>
              {/* Progress bar for running searches */}
              {search.status === 'running' && search.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Fortschritt</span>
                    <span>{search.progress}%</span>
                  </div>
                  <Progress value={search.progress} className="h-1.5" />
                </div>
              )}
            </div>
          </div>

          {/* Middle: Stats */}
          <div className="flex items-center gap-4 text-sm">
            {search.status === 'completed' && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{search.result_count}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{search.result_count} Leads gefunden</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{search.credits_used}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{search.credits_used} Credits verbraucht</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {search.status === 'failed' && search.error_message && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">Fehler</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{search.error_message}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <StatusBadge status={search.status} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Retry button for completed/failed searches */}
            {(search.status === 'completed' || search.status === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry?.(search.id)}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1" />
                )}
                Erneut suchen
              </Button>
            )}

            {/* View collection button for completed searches */}
            {search.status === 'completed' && search.collection_id && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/sammlungen/${search.collection_id}`}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Sammlung
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Status Badge Component
 */
function StatusBadge({
  status,
}: {
  status: 'pending' | 'running' | 'completed' | 'failed'
}) {
  const config = {
    pending: {
      label: 'Ausstehend',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    running: {
      label: 'Laufend',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      label: 'Abgeschlossen',
      className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      label: 'Fehlgeschlagen',
      className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="secondary" className={cn(className)}>
      {label}
    </Badge>
  )
}

/**
 * Status Icon Component
 */
function StatusIcon({
  status,
}: {
  status: 'pending' | 'running' | 'completed' | 'failed'
}) {
  const icons = {
    pending: Hourglass,
    running: Loader2,
    completed: CheckCircle2,
    failed: AlertCircle,
  }

  const Icon = icons[status]
  const className = cn(
    'h-5 w-5',
    status === 'running' && 'animate-spin',
    status === 'pending' && 'text-yellow-600',
    status === 'running' && 'text-blue-600',
    status === 'completed' && 'text-green-600',
    status === 'failed' && 'text-red-600'
  )

  return <Icon className={className} />
}

/**
 * Get background color based on status
 */
function getStatusBgColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-950/30'
    case 'running':
      return 'bg-blue-50 dark:bg-blue-950/30'
    case 'completed':
      return 'bg-green-50 dark:bg-green-950/30'
    case 'failed':
      return 'bg-red-50 dark:bg-red-950/30'
    default:
      return 'bg-muted'
  }
}

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export default HistoryItem
