/**
 * Export Button Component
 *
 * Main export trigger button with dropdown for format selection.
 * Features plan-gating with upgrade prompts for Free users.
 *
 * @module ExportButton
 */

'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PlanGate, PlanGateBadge } from '@/components/search/plan-gate';
import { ExportDialog } from './export-dialog';
import type { PlanTier } from '@/components/search/plan-gate';
import type { ExportType, ExportFormat } from '@/lib/export/types';
import { FEATURE_ACCESS, EXPORT_LIMITS } from '@/lib/export/types';

interface ExportButtonProps {
  /** Type of data to export */
  exportType: ExportType;
  /** User's subscription plan tier */
  planTier: PlanTier;
  /** Number of rows available for export */
  rowCount: number;
  /** Optional className */
  className?: string;
  /** Display variant */
  variant?: 'dropdown' | 'buttons' | 'minimal';
  /** Callback when export is triggered */
  onExport?: (format: ExportFormat, columns: string[]) => void;
}

/**
 * ExportButton Component
 *
 * Export button with plan-based feature gating.
 */
export function ExportButton({
  exportType,
  planTier,
  rowCount,
  className = '',
  variant = 'dropdown',
  onExport,
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check feature access
  const canExport = FEATURE_ACCESS[planTier].csv;
  const canExportExcel = FEATURE_ACCESS[planTier].excel;

  // Get row limit for plan
  const rowLimit = EXPORT_LIMITS[planTier].maxRows;
  const isNearLimit = rowCount > rowLimit * 0.9;

  // Free users see upgrade prompt
  if (!canExport) {
    return (
      <PlanGate requiredPlan="pro" featureName="Export-Funktion" variant="inline">
        <Button variant="outline" size="sm" disabled className={className}>
          <Download className="mr-2 h-4 w-4" />
          Exportieren
        </Button>
      </PlanGate>
    );
  }

  const handleExportClick = (format: ExportFormat) => {
    setIsDialogOpen(true);
  };

  const handleExport = async (format: ExportFormat, columns: string[]) => {
    setIsDialogOpen(false);

    if (onExport) {
      setIsExporting(format);

      try {
        await onExport(format, columns);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(null);
      }
    }
  };

  // Minimal variant - single button that opens dialog
  if (variant === 'minimal') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={isExporting !== null || rowCount === 0}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : showSuccess ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          CSV
        </Button>

        <ExportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          exportType={exportType}
          planTier={planTier}
          rowCount={rowCount}
          onExport={handleExport}
        />
      </>
    );
  }

  // Buttons variant - separate buttons side by side
  if (variant === 'buttons') {
    return (
      <>
        <div className={`flex gap-2 ${className}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            disabled={isExporting !== null || rowCount === 0}
          >
            {isExporting === 'csv' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            CSV
          </Button>

          {canExportExcel ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              disabled={isExporting !== null || rowCount === 0}
            >
              {isExporting === 'excel' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
          ) : (
            <PlanGate requiredPlan="enterprise" featureName="Excel Export" variant="inline">
              <Button variant="outline" size="sm" disabled>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </PlanGate>
          )}

          {isNearLimit && rowLimit > 0 && (
            <Badge variant="secondary" className="text-amber-500">
              Max {rowLimit.toLocaleString('de-DE')}
            </Badge>
          )}
        </div>

        <ExportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          exportType={exportType}
          planTier={planTier}
          rowCount={rowCount}
          onExport={handleExport}
        />
      </>
    );
  }

  // Dropdown variant (default) - menu with all options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting !== null || rowCount === 0}
            className={className}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : showSuccess ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportieren
            {rowCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({rowCount.toLocaleString('de-DE')})
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Format wählen</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>CSV Export</span>
              <span className="text-xs text-muted-foreground">
                Kompatibel mit Excel, Google Sheets
              </span>
            </div>
          </DropdownMenuItem>

          {canExportExcel ? (
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Excel Export (.xlsx)</span>
                <span className="text-xs text-muted-foreground">Mit Formatierung</span>
              </div>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <div className="flex items-center gap-2 opacity-50">
                <FileSpreadsheet className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="flex items-center gap-1">
                    Excel Export
                    <PlanGateBadge plan="enterprise" />
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">
              {rowCount.toLocaleString('de-DE')} Zeilen verfügbar
              {rowLimit > 0 && (
                <span className="block">
                  Limit: {rowLimit.toLocaleString('de-DE')} Zeilen
                </span>
              )}
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        exportType={exportType}
        planTier={planTier}
        rowCount={rowCount}
        onExport={handleExport}
      />
    </>
  );
}

export default ExportButton;
