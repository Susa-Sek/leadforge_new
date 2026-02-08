'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useDeals, useDeleteDeal, useDealStages } from '@/hooks/use-crm';
import type { Deal, DealFilters } from '@/lib/crm/types';

interface DealListProps {
  filters?: DealFilters;
}

export function DealList({ filters = {} }: DealListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const { deals, total, isLoading, mutate } = useDeals(filters);
  const { trigger: deleteDeal, isMutating: isDeleting } = useDeleteDeal();
  const { stages } = useDealStages();

  const handleDelete = async () => {
    if (!dealToDelete) return;
    try {
      await deleteDeal(dealToDelete.id as any);
      toast.success('Deal gelöscht');
      mutate();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteConfirmOpen(false);
      setDealToDelete(null);
    }
  };

  const confirmDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteConfirmOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageBadge = (deal: Deal) => {
    const stage = stages.find((s) => s.id === deal.stage_id);
    return (
      <Badge
        variant="secondary"
        style={{
          backgroundColor: stage?.color || '#6B7280',
          color: '#fff',
        }}
      >
        {stage?.name || 'Unbekannt'}
      </Badge>
    );
  };

  const columns: ColumnDef<Deal>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Titel
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/dashboard/deals/${row.original.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {row.getValue('title')}
        </Link>
      ),
    },
    {
      accessorKey: 'stage_id',
      header: 'Stage',
      cell: ({ row }) => getStageBadge(row.original),
    },
    {
      accessorKey: 'contact',
      header: 'Kontakt',
      cell: ({ row }) => {
        const contact = row.original.contact;
        return contact ? (
          <Link
            href={`/dashboard/kontakte/${contact.id}`}
            className="text-sm hover:text-primary transition-colors"
          >
            {contact.name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'value',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Wert
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => formatCurrency(row.getValue('value')),
    },
    {
      accessorKey: 'probability',
      header: 'Wahrscheinlichkeit',
      cell: ({ row }) => {
        const prob = row.getValue('probability') as number | null;
        return prob !== null ? (
          <div className="w-24">
            <div className="flex justify-between text-xs mb-1">
              <span>{prob}%</span>
            </div>
            <Progress value={prob} className="h-1.5" />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'expected_close_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Closing
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('expected_close_date') as string | null;
        return date ? (
          <span className="text-sm">
            {format(new Date(date), 'dd.MM.yyyy', { locale: de })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/deals/${deal.id}`}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/deals/${deal.id}/bearbeiten`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => confirmDelete(deal)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: deals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Deals gefunden</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Keine Ergebnisse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deal löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{dealToDelete?.title}&quot; wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
