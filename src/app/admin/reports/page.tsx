'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flag } from 'lucide-react'
import { ReportReviewPanel } from '@/components/admin/report-review-panel'
import { useAdminReports, useReportStats, useResolveReport, useDismissReport } from '@/hooks/use-admin'
import { toast } from 'sonner'
import type { ReportStatus } from '@/lib/admin/types'

export default function AdminReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending')
  const [currentPage, setCurrentPage] = useState(1)

  const { reports, total, page, limit, totalPages, isLoading, mutate } = useAdminReports({
    status: filter,
    page: currentPage,
    limit: 20,
  })

  const { stats } = useReportStats()
  const { trigger: resolveReport } = useResolveReport()
  const { trigger: dismissReport } = useDismissReport()

  const handleResolve = async (id: string, note?: string) => {
    try {
      await resolveReport({ id, note })
      toast.success('Meldung als gelöst markiert')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Lösen der Meldung')
      throw error
    }
  }

  const handleDismiss = async (id: string, note?: string) => {
    try {
      await dismissReport({ id, note })
      toast.success('Meldung abgelehnt')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Ablehnen der Meldung')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meldungen</h1>
        <p className="text-muted-foreground">
          Nutzermeldungen überprüfen und verwalten
        </p>
      </div>

      <ReportReviewPanel
        reports={reports}
        stats={stats ?? null}
        isLoading={isLoading}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
        filter={filter}
        onFilterChange={(newFilter) => {
          setFilter(newFilter)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}
