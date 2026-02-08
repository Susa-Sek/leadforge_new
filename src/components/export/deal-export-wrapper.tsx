/**
 * Deal Export Wrapper Component
 *
 * Client component wrapper for deal export functionality.
 *
 * @module DealExportWrapper
 */

'use client';

import { useState } from 'react';
import { ExportButton } from './export-button';
import { ExportProgress } from './export-progress';
import { useExport, useExportStatus, useExportDownload } from '@/hooks/use-export';
import { toast } from 'sonner';
import type { PlanTier } from '@/components/search/plan-gate';
import type { ExportFormat } from '@/lib/export/types';

interface DealExportWrapperProps {
  /** User's subscription plan tier */
  planTier: PlanTier;
  /** Total number of deals */
  totalCount: number;
}

/**
 * DealExportWrapper Component
 *
 * Wraps export functionality for deals.
 */
export function DealExportWrapper({
  planTier,
  totalCount,
}: DealExportWrapperProps) {
  const [exportId, setExportId] = useState<string | null>(null);

  const { startExport, isLoading: isStarting } = useExport();
  const {
    status,
    progress,
    rowCount,
    processedRows,
    downloadUrl,
    fileName,
    errorMessage,
    isComplete,
    isFailed,
    isPending: isProcessing,
    cancelExport,
  } = useExportStatus(exportId);
  const { downloadExport, isDownloading } = useExportDownload();

  const handleExport = async (format: ExportFormat, columns: string[]) => {
    const result = await startExport('deals', {
      format,
      columns: columns as any,
      filters: {},
      async: totalCount > 1000,
    });

    if (result) {
      if (result.status === 'completed') {
        // Synchronous export - trigger download immediately
        const success = await downloadExport(result.exportId, result.fileName);
        if (success) {
          toast.success('Export erfolgreich', {
            description: `${result.rowCount.toLocaleString('de-DE')} Zeilen exportiert`,
          });
        }
      } else {
        // Asynchronous export - show progress
        setExportId(result.exportId);
        toast.info('Export wird vorbereitet', {
          description: 'Du erhältst eine Benachrichtigung, wenn der Export fertig ist.',
        });
      }
    } else {
      toast.error('Export fehlgeschlagen');
    }
  };

  const handleDownload = async () => {
    if (exportId) {
      const success = await downloadExport(exportId, fileName || undefined);
      if (success) {
        toast.success('Download gestartet');
      } else {
        toast.error('Download fehlgeschlagen');
      }
    }
  };

  const handleClose = () => {
    setExportId(null);
  };

  const showProgress = exportId && (isProcessing || isComplete || isFailed);

  return (
    <div className="space-y-4">
      <ExportButton
        exportType="deals"
        planTier={planTier}
        rowCount={totalCount}
        variant="dropdown"
        onExport={handleExport}
      />

      {showProgress && (
        <ExportProgress
          status={status}
          progress={progress}
          rowCount={rowCount}
          processedRows={processedRows}
          downloadUrl={downloadUrl}
          fileName={fileName}
          errorMessage={errorMessage}
          onCancel={cancelExport}
          onClose={handleClose}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default DealExportWrapper;
