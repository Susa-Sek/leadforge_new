/**
 * Export History Table Component
 *
 * Table displaying past exports with status, download links,
 * and delete actions.
 *
 * @module ExportHistoryTable
 */

'use client';

import { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Trash2,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { ExportHistoryItem, ExportStatus, ExportType, ExportFormat } from '@/lib/export/types';
import { formatDate, formatFileSize } from '@/lib/export/types';
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
import { useExportHistory, useExportDownload } from '@/hooks/use-export';
import { toast } from 'sonner';

interface ExportHistoryTableProps {
  /** Optional limit for number of items */
  limit?: number;
  /** Optional filter by type */
  type?: ExportType;
  /** Optional filter by status */
  status?: ExportStatus;
  /** Optional className */
  className?: string;
}

/**
 * ExportHistoryTable Component
 *
 * Displays export history with actions.
 */
export function ExportHistoryTable({
  limit,
  type,
  status,
  className = '',
}: ExportHistoryTableProps) {
  const { history, isLoading, error, refresh, deleteExport } = useExportHistory({
    limit,
    type,
    status,
  });
  const { downloadExport, isDownloading } = useExportDownload();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDownload = async (item: ExportHistoryItem) => {
    if (item.status !== 'completed') {
      toast.error('Export nicht verfügbar', {
        description: 'Dieser Export ist noch nicht fertig oder fehlgeschlagen.',
      });
      return;
    }

    const success = await downloadExport(item.id, item.fileName);

    if (success) {
      toast.success('Download gestartet', {
        description: item.fileName,
      });
    } else {
      toast.error('Download fehlgeschlagen', {
        description: 'Bitte versuche es später erneut.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const success = await deleteExport(deleteId);

    if (success) {
      toast.success('Export gelöscht');
    } else {
      toast.error('Löschen fehlgeschlagen');
    }

    setDeleteId(null);
  };

  const getStatusBadge = (status: ExportStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Fertig
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Wartend
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Läuft
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Fehlgeschlagen
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Abgebrochen
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            Abgelaufen
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    return format === 'csv' ? (
      <FileText className="h-4 w-4 text-blue-500" />
    ) : (
      <FileSpreadsheet className="h-4 w-4 text-green-500" />
    );
  };

  const getTypeLabel = (type: ExportType) => {
    switch (type) {
      case 'contacts':
        return 'Kontakte';
      case 'deals':
        return 'Deals';
      case 'leads':
        return 'Leads';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-center">
        <p className="text-destructive">Fehler beim Laden der Export-History</p>
        <Button variant="outline" size="sm" onClick={() => refresh()} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-md bg-muted p-8 text-center">
        <p className="text-muted-foreground">Noch keine Exporte vorhanden</p>
        <p className="text-sm text-muted-foreground mt-1">
          Deine Exporte werden hier angezeigt, sobald du welche erstellst.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Zeilen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell>{getTypeLabel(item.exportType)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFormatIcon(item.format)}
                    <span className="uppercase">{item.format}</span>
                  </div>
                </TableCell>
                <TableCell>{item.rowCount.toLocaleString('de-DE')}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.status === 'completed' && (
                        <DropdownMenuItem
                          onClick={() => handleDownload(item)}
                          disabled={isDownloading}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Herunterladen
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteId(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Export-Datei
              wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ExportHistoryTable;
