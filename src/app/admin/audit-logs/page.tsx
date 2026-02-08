'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Download } from 'lucide-react'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { DateRange } from 'react-day-picker'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { useAuditLogs, useExportAuditLogs, useAdminList } from '@/hooks/use-admin'
import { toast } from 'sonner'

export default function AdminAuditLogsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')

  const { logs, total, page, limit, totalPages, isLoading, mutate } = useAuditLogs({
    admin_id: selectedAdmin === 'all' ? undefined : selectedAdmin,
    action: selectedAction === 'all' ? undefined : selectedAction,
    date_from: dateRange?.from?.toISOString(),
    date_to: dateRange?.to?.toISOString(),
    page: currentPage,
    limit: 50,
  })

  const { admins } = useAdminList()
  const { trigger: exportLogs } = useExportAuditLogs()

  const handleExport = async () => {
    try {
      const blob = await exportLogs({
        admin_id: selectedAdmin === 'all' ? undefined : selectedAdmin,
        action: selectedAction === 'all' ? undefined : selectedAction,
        date_from: dateRange?.from?.toISOString(),
        date_to: dateRange?.to?.toISOString(),
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Audit-Logs exportiert')
    } catch (error) {
      toast.error('Fehler beim Exportieren')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit-Logs</h1>
          <p className="text-muted-foreground">
            Nachvollziehbarkeit aller Admin-Aktionen
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Info Card */}
      <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Unveränderliche Aufzeichnungen
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Audit-Logs können nicht gelöscht oder bearbeitet werden. Sie dienen der
                vollständigen Nachvollziehbarkeit aller Admin-Aktionen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Aktions-Log
          </CardTitle>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportieren
          </button>
        </CardHeader>
        <CardContent>
          <AuditLogTable
            logs={logs}
            total={total}
            page={page}
            limit={limit}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
            onExport={handleExport}
            admins={admins}
            selectedAdmin={selectedAdmin}
            onAdminChange={(adminId) => {
              setSelectedAdmin(adminId)
              setCurrentPage(1)
            }}
            selectedAction={selectedAction}
            onActionChange={(action) => {
              setSelectedAction(action)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
