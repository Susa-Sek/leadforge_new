'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle,
  Search,
  Database,
  Users,
  Filter,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SEARCH_STEPS, type SearchResultLead, type SearchStatus } from '@/lib/search/types'

// Icon mapping
const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  Search,
  Database,
  Users,
  Filter,
  CheckCircle2,
}

interface SearchProgressProps {
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
  onCancel: () => void
  onReset: () => void
  className?: string
}

export function SearchProgress({
  searchId,
  status,
  progress,
  results,
  error,
  onCancel,
  onReset,
  className,
}: SearchProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const isActive = status !== null && !['completed', 'failed', 'cancelled'].includes(status)
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'
  const isCancelled = status === 'cancelled'

  // Timer for elapsed time
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive])

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get step status
  const getStepStatus = (stepNumber: number) => {
    if (progress.currentStep > stepNumber) return 'completed'
    if (progress.currentStep === stepNumber) return 'active'
    return 'pending'
  }

  // Get step icon based on status
  const StepIcon = ({ step, status: stepStatus }: { step: typeof SEARCH_STEPS[0]; status: string }) => {
    const IconComponent = stepIcons[step.icon] || Search

    if (stepStatus === 'completed') {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    }

    if (stepStatus === 'active') {
      if (isFailed) {
        return <AlertCircle className="h-5 w-5 text-destructive" />
      }
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />
    }

    return <IconComponent className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isComplete ? 'bg-emerald-500/10' : isFailed ? 'bg-destructive/10' : 'bg-primary/10'
            )}>
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isFailed ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
            <div>
              <CardTitle>
                {isComplete
                  ? 'Suche abgeschlossen'
                  : isFailed
                    ? 'Suche fehlgeschlagen'
                    : isCancelled
                      ? 'Suche abgebrochen'
                      : 'Suche läuft...'}
              </CardTitle>
              <CardDescription>
                {searchId ? `Such-ID: ${searchId.slice(0, 8)}...` : 'Initialisiere Suche...'}
              </CardDescription>
            </div>
          </div>

          {isActive && (
            <div className="text-right">
              <Badge variant="outline" className="font-mono">
                {formatTime(elapsedTime)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{progress.stepName || 'Warte auf Start...'}</span>
            <span className="text-muted-foreground">{progress.percent}%</span>
          </div>
          <Progress
            value={progress.percent}
            className={cn(
              'h-2',
              isFailed && 'bg-destructive/20'
            )}
          />
        </div>

        {/* Leads Found Counter */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Leads gefunden:</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">{progress.leadsFound}</span>
            <span className="text-sm text-muted-foreground"> / {progress.leadsExpected}</span>
          </div>
        </div>

        {/* Steps Visualization */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Fortschritt</h4>
          <div className="grid gap-2">
            {SEARCH_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(step.number)
              const isLast = index === SEARCH_STEPS.length - 1

              return (
                <div key={step.number} className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                    <StepIcon step={step} status={stepStatus} />
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 pt-1',
                    stepStatus === 'pending' && 'opacity-50'
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-sm font-medium',
                        stepStatus === 'active' && 'text-primary',
                        stepStatus === 'completed' && 'text-emerald-600 dark:text-emerald-400'
                      )}>
                        {step.name}
                      </span>
                      {stepStatus === 'completed' && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Results Preview (if completed) */}
        {isComplete && results && results.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Vorschau ({Math.min(results.length, 3)} von {results.length})</h4>
              <div className="space-y-2">
                {results.slice(0, 3).map((lead, index) => (
                  <div
                    key={lead.id || index}
                    className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground">{lead.address}</p>
                      </div>
                      {lead.rating && (
                        <Badge variant="secondary" className="text-xs">
                          {lead.rating.toFixed(1)}/5
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.email && <span>{lead.email}</span>}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {results.length > 3 && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/dashboard/sammlungen?searchId=${searchId}`}>
                    Alle {results.length} Ergebnisse anzeigen
                  </a>
                </Button>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isActive && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Suche abbrechen
            </Button>
          )}

          {(isComplete || isFailed || isCancelled) && (
            <Button variant="outline" className="flex-1" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Neue Suche
            </Button>
          )}

          {isComplete && results && results.length > 0 && (
            <Button className="flex-1" asChild>
              <a href={`/dashboard/sammlungen?searchId=${searchId}`}>
                Alle anzeigen
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
