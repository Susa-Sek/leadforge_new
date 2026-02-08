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
} from 'lucide-react';
import { toast } from 'sonner';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Checkbox } from '@/components/ui/checkbox';

import { useContacts, useDeleteContact } from '@/hooks/use-crm';
import type { Contact, ContactFilters } from '@/lib/crm/types';

interface ContactListProps {
  filters?: ContactFilters;
  onSelectionChange?: (selectedIds: string[]) => void;
  enableSelection?: boolean;
}

export function ContactList({ filters = {}, onSelectionChange, enableSelection }: ContactListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const { contacts, total, isLoading, mutate } = useContacts(filters);
  const { trigger: deleteContact, isMutating: isDeleting } = useDeleteContact();

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await deleteContact(contactToDelete.id as any);
      toast.success('Kontakt gelöscht');
      mutate();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteConfirmOpen(false);
      setContactToDelete(null);
    }
  };

  const confirmDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteConfirmOpen(true);
  };

  // Update parent when selection changes
  const handleRowSelectionChange = (updater: any) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(newSelection);

    const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id]);
    onSelectionChange?.(selectedIds);
  };

  const columns: ColumnDef<Contact>[] = [
    ...(enableSelection
      ? [
          {
            id: 'select',
            header: ({ table }: any) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Alle auswählen"
              />
            ),
            cell: ({ row }: any) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Zeile auswählen"
              />
            ),
            enableSorting: false,
            enableHiding: false,
          } as ColumnDef<Contact>,
        ]
      : []),
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Name
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
        const contact = row.original;
        const initials = contact.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/dashboard/kontakte/${contact.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {contact.name}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Firma
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: 'email',
      header: 'E-Mail',
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null;
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {email}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | null;
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {phone}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: tag.color, color: '#fff' }}
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/kontakte/${contact.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => confirmDelete(contact)}
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
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: enableSelection,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Kontakte gefunden</p>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
            <AlertDialogTitle>Kontakt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{contactToDelete?.name}&quot; wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
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
