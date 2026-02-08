'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { Download, Eye, Shield, User, Coins, Megaphone, Flag, Settings, Ban, UserCheck, Trash2, Crown } from 'lucide-react'
import type { AuditLog, AuditAction } from '@/lib/admin/types'
import { AUDIT_ACTION_LABELS } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

interface AuditLogTableProps {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onExport: () => Promise<void>
  admins: { id: string; email: string; name: string | null }[]
  selectedAdmin: string | 'all'
  onAdminChange: (adminId: string | 'all') => void
  selectedAction: string | 'all'
  onActionChange: (action: string | 'all') => void
}

const actionIcons: Record<string, typeof Shield> = {
  user_suspend: Ban,
  user_unsuspend: UserCheck,
  user_delete: Trash2,
  credit_adjust: Coins,
  announcement_create: Megaphone,
  announcement_update: Megaphone,
  announcement_delete: Megaphone,
  report_resolve: Flag,
  report_dismiss: Flag,
  plan_change: Crown,
  settings_update: Settings,
}

const actionColors: Record<string, string> = {
  user_suspend: 'bg-red-500',
  user_unsuspend: 'bg-green-500',
  user_delete: 'bg-red-600',
  credit_adjust: 'bg-yellow-500',
  announcement_create: 'bg-blue-500',
  announcement_update: 'bg-blue-400',
  announcement_delete: 'bg-red-400',
  report_resolve: 'bg-green-400',
  report_dismiss: 'bg-gray-500',
  plan_change: 'bg-purple-500',
  settings_update: 'bg-slate-500',
}

export function AuditLogTable({
  logs,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  onPageChange,
  onExport,
  admins,
  selectedAdmin,
  onAdminChange,
  selectedAction,
  onActionChange,
}: AuditLogTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)

  const columns: ColumnDef<AuditLog>[] = React.useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Zeitpunkt',
        cell: ({ row }) => {
          const date = row.getValue('created_at') as string
          return (
            <span className="text-sm font-mono">
              {format(new Date(date), 'dd.MM.yyyy HH:mm:ss')}
            </span>
          )
        },
      },
      {
        accessorKey: 'admin_email',
        header: 'Admin',
        cell: ({ row }) => {
          const email = row.getValue('admin_email') as string
          return (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-sm">{email}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'action',
        header: 'Aktion',
        cell: ({ row }) => {
          const action = row.getValue('action') as AuditAction
          const Icon = actionIcons[action] || Shield
          return (
            <div className="flex items-center gap-2">
              <div className={cn('h-6 w-6 rounded-full flex items-center justify-center', actionColors[action] || 'bg-slate-500')}>
                <Icon className="h-3 w-3 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
                {AUDIT_ACTION_LABELS[action] || action}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: 'target_type',
        header: 'Ziel',
        cell: ({ row }) => {
          const targetType = row.getValue('target_type') as string
          const targetId = row.original.target_id
          return (
            <div className="text-sm">
              <span className="text-muted-foreground">{targetType}:</span>{' '}
              <span className="font-mono text-xs">{targetId.substring(0, 8)}...</span>
            </div>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const log = row.original
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLog(log)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: totalPages,
  })

  const actionOptions = Object.entries(AUDIT_ACTION_LABELS)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px] ml-auto" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedAdmin} onValueChange={onAdminChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Admin filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Admins</SelectItem>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.name || admin.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={onActionChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Aktion filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Aktionen</SelectItem>
            {actionOptions.map(([action, label]) => (
              <SelectItem key={action} value={action}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="ml-auto" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Keine Audit-Logs gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Zeige {(page - 1) * limit + 1} bis {Math.min(page * limit, total)} von{' '}
          {total} Einträgen
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Zurück
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {page} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Weiter
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Audit-Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Zeitpunkt</p>
                  <p className="font-mono">
                    {format(new Date(selectedLog.created_at), 'dd.MM.yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admin</p>
                  <p>{selectedLog.admin_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aktion</p>
                  <Badge>
                    {AUDIT_ACTION_LABELS[selectedLog.action as AuditAction] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Ziel</p>
                  <p>{selectedLog.target_type}: {selectedLog.target_id}</p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-muted-foreground">IP-Adresse</p>
                    <p className="font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Details:</p>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
