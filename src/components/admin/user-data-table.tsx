'use client'

import * as React from 'react'
import Link from 'next/link'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Ban, UserCheck, Crown, User, Building } from 'lucide-react'
import type { AdminUser } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

interface UserDataTableProps {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onSuspend: (id: string) => void
  onUnsuspend: (id: string) => void
}

const planColors = {
  free: 'bg-slate-500',
  pro: 'bg-blue-500',
  enterprise: 'bg-purple-500',
}

const planLabels = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const statusColors = {
  active: 'bg-green-500',
  suspended: 'bg-red-500',
  pending: 'bg-yellow-500',
}

const statusLabels = {
  active: 'Aktiv',
  suspended: 'Gesperrt',
  pending: 'Ausstehend',
}

export function UserDataTable({
  users,
  total,
  page,
  limit,
  totalPages,
  isLoading,
  onPageChange,
  onSuspend,
  onUnsuspend,
}: UserDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<AdminUser>[] = React.useMemo(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{user.full_name || 'Unbekannt'}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'plan',
        header: 'Tarif',
        cell: ({ row }) => {
          const plan = row.getValue('plan') as keyof typeof planColors
          return (
            <Badge className={cn(planColors[plan], 'text-white')}>
              {planLabels[plan]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'credits_balance',
        header: 'Credits',
        cell: ({ row }) => {
          const credits = row.getValue('credits_balance') as number
          return (
            <div className="flex items-center gap-1">
              <span className={cn(credits < 10 && 'text-red-500 font-medium')}>
                {credits}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusColors
          return (
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
              <span className="text-sm">{statusLabels[status]}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'last_login_at',
        header: 'Letzter Login',
        cell: ({ row }) => {
          const date = row.getValue('last_login_at') as string | null
          if (!date) return <span className="text-muted-foreground text-sm">Nie</span>
          return (
            <span className="text-sm">
              {new Date(date).toLocaleDateString('de-DE')}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Registriert',
        cell: ({ row }) => {
          const date = row.getValue('created_at') as string
          return (
            <span className="text-sm">
              {new Date(date).toLocaleDateString('de-DE')}
            </span>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Menü öffnen</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${user.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Details anzeigen
                  </Link>
                </DropdownMenuItem>
                {user.status === 'active' ? (
                  <DropdownMenuItem onClick={() => onSuspend(user.id)}>
                    <Ban className="mr-2 h-4 w-4" />
                    Sperren
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onUnsuspend(user.id)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Entsperren
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onSuspend, onUnsuspend]
  )

  const table = useReactTable({
    data: users,
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(7)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
                  Keine Nutzer gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Zeige {(page - 1) * limit + 1} bis {Math.min(page * limit, total)} von{' '}
          {total} Nutzern
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
    </div>
  )
}
