/**
 * Export Progress Component
 *
 * Progress indicator for asynchronous exports with
 * status display and cancel functionality.
 *
 * @module ExportProgress
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { ExportStatus } from '@/lib/export/types';
import { formatDateTime } from '@/lib/export/types';

interface ExportProgressProps {
  /** Current export status */
  status: ExportStatus | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Total row count */
  rowCount: number;
  /** Processed rows */
  processedRows: number;
  /** Download URL when complete */
  downloadUrl: string | null;
  /** File name when complete */
  fileName: string | null;
  /** Error message if failed */
  errorMessage: string | null;
  /** Cancel callback */
  onCancel: () => void;
  /** Close callback */
  onClose: () => void;
  /** Download callback */
  onDownload: () => void;
  /** Optional className */
  className?: string;
}

/**
 * ExportProgress Component
 *
 * Displays export progress with visual feedback.
 */
export function ExportProgress({
  status,
  progress,
  rowCount,
  processedRows,
  downloadUrl,
  fileName,
  errorMessage,
  onCancel,
  onClose,
  onDownload,
  className = '',
}: ExportProgressProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Warteschlange',
          description: 'Export wartet auf Verarbeitung...',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500',
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Wird verarbeitet',
          description: `${processedRows.toLocaleString('de-DE')} von ${rowCount.toLocaleString('de-DE')} Zeilen`,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Abgeschlossen',
          description: fileName || 'Export erfolgreich erstellt',
          color: 'text-green-500',
          bgColor: 'bg-green-500',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Fehlgeschlagen',
          description: errorMessage || 'Export konnte nicht erstellt werden',
          color: 'text-destructive',
          bgColor: 'bg-destructive',
        };
      case 'cancelled':
        return {
          icon: X,
          label: 'Abgebrochen',
          description: 'Export wurde manuell abgebrochen',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          label: 'Abgelaufen',
          description: 'Download-Link ist nicht mehr gültig',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
      default:
        return {
          icon: Loader2,
          label: 'Unbekannt',
          description: 'Status wird ermittelt...',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isProcessing = status === 'processing';
  const isPending = status === 'pending';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed' || status === 'cancelled' || status === 'expired';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color} ${isProcessing ? 'animate-spin' : ''}`} />
            Export-Fortschritt
          </CardTitle>
          <Badge variant={isComplete ? 'default' : isFailed ? 'destructive' : 'secondary'}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(isPending || isProcessing) && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}%</span>
              <span>{config.description}</span>
            </div>
          </div>
        )}

        {/* Status Description */}
        {!isPending && !isProcessing && (
          <p className={`text-sm ${isFailed ? 'text-destructive' : 'text-muted-foreground'}`}>
            {config.description}
          </p>
        )}

        {/* Stats */}
        {rowCount > 0 && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-md bg-muted p-2">
              <span className="text-muted-foreground">Gesamt:</span>
              <p className="font-medium">{rowCount.toLocaleString('de-DE')} Zeilen</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <span className="text-muted-foreground">Verarbeitet:</span>
              <p className="font-medium">{processedRows.toLocaleString('de-DE')} Zeilen</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {(isPending || isProcessing) && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
          )}

          {isComplete && downloadUrl && (
            <Button size="sm" onClick={onDownload}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Herunterladen
            </Button>
          )}

          {isFailed && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Schließen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExportProgress;
