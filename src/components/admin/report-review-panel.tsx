'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Flag, CheckCircle, XCircle, AlertTriangle, MessageSquare, User, ExternalLink } from 'lucide-react'
import type { Report, ReportStatus, ReportReason } from '@/lib/admin/types'
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

interface ReportReviewPanelProps {
  reports: Report[]
  stats: {
    pending: number
    resolved: number
    dismissed: number
    total: number
  } | null
  isLoading: boolean
  onResolve: (id: string, note?: string) => Promise<void>
  onDismiss: (id: string, note?: string) => Promise<void>
  filter: ReportStatus | 'all'
  onFilterChange: (filter: ReportStatus | 'all') => void
}

const statusColors = {
  pending: 'bg-yellow-500',
  resolved: 'bg-green-500',
  dismissed: 'bg-gray-500',
}

const reasonIcons: Record<ReportReason, typeof Flag> = {
  spam: Flag,
  inappropriate: AlertTriangle,
  fake: AlertTriangle,
  other: MessageSquare,
}

export function ReportReviewPanel({
  reports,
  stats,
  isLoading,
  onResolve,
  onDismiss,
  filter,
  onFilterChange,
}: ReportReviewPanelProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [note, setNote] = useState('')
  const [action, setAction] = useState<'resolve' | 'dismiss' | null>(null)

  const handleAction = async () => {
    if (!selectedReport || !action) return

    try {
      if (action === 'resolve') {
        await onResolve(selectedReport.id, note)
        toast.success('Meldung als gelöst markiert')
      } else {
        await onDismiss(selectedReport.id, note)
        toast.success('Meldung abgelehnt')
      }
      setSelectedReport(null)
      setNote('')
      setAction(null)
    } catch (error) {
      toast.error('Fehler beim Verarbeiten der Meldung')
    }
  }

  const openActionDialog = (report: Report, actionType: 'resolve' | 'dismiss') => {
    setSelectedReport(report)
    setAction(actionType)
    setNote('')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className={cn(filter === 'pending' && 'ring-2 ring-yellow-500')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Flag className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(filter === 'resolved' && 'ring-2 ring-green-500')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gelöst</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(filter === 'dismissed' && 'ring-2 ring-gray-500')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abgelehnt</p>
                  <p className="text-2xl font-bold">{stats.dismissed}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(value) => onFilterChange(value as ReportStatus | 'all')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="resolved">Gelöst</SelectItem>
            <SelectItem value="dismissed">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Meldungen</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {reports.length > 0 ? (
                reports.map((report) => {
                  const ReasonIcon = reasonIcons[report.reason]
                  return (
                    <div
                      key={report.id}
                      className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', statusColors[report.status])}>
                            <ReasonIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {REPORT_REASON_LABELS[report.reason]}
                              </span>
                              <Badge className={cn(statusColors[report.status], 'text-white text-xs')}>
                                {REPORT_STATUS_LABELS[report.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <User className="h-3 w-3" />
                              Gemeldet von: {report.reporter_email}
                            </div>
                            <p className="text-sm mt-2">{report.description || 'Keine Beschreibung'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <span>Ziel: {report.target_type} ({report.target_id})</span>
                              <span>•</span>
                              <span>{format(new Date(report.created_at), 'dd.MM.yyyy HH:mm')}</span>
                            </div>
                            {report.resolved_at && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {report.resolution_note && (
                                  <p>Hinweis: {report.resolution_note}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openActionDialog(report, 'resolve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Lösen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(report, 'dismiss')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Meldungen gefunden
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'resolve' ? 'Meldung als gelöst markieren' : 'Meldung ablehnen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Möchten Sie diese Meldung wirklich {action === 'resolve' ? 'als gelöst markieren' : 'ablehnen'}?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Optionaler Hinweis:</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Grund für die Entscheidung..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAction}
              variant={action === 'resolve' ? 'default' : 'outline'}
            >
              {action === 'resolve' ? 'Als gelöst markieren' : 'Ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
