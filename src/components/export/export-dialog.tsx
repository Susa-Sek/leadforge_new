/**
 * Export Dialog Component
 *
 * Main export configuration dialog with column selection,
 * format options, and template management.
 *
 * @module ExportDialog
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, Save, X, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanGateBadge } from '@/components/search/plan-gate';
import { ColumnSelector } from './column-selector';
import { TemplateSelector } from './template-selector';
import { SaveTemplateDialog } from './save-template-dialog';

import type { PlanTier } from '@/components/search/plan-gate';
import type { ExportType, ExportFormat, ColumnDefinition } from '@/lib/export/types';
import {
  getColumnsForType,
  getDefaultColumnsForType,
  generateExportFilename,
  EXPORT_LIMITS,
  FEATURE_ACCESS,
} from '@/lib/export/types';
import { useExportTemplates } from '@/hooks/use-export';

interface ExportDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Type of data to export */
  exportType: ExportType;
  /** User's subscription plan tier */
  planTier: PlanTier;
  /** Number of rows available for export */
  rowCount: number;
  /** Export callback */
  onExport: (format: ExportFormat, columns: string[]) => void;
  /** Optional pre-selected columns */
  preSelectedColumns?: string[];
  /** Optional initial format */
  initialFormat?: ExportFormat;
}

/**
 * ExportDialog Component
 *
 * Main export configuration dialog.
 */
export function ExportDialog({
  isOpen,
  onClose,
  exportType,
  planTier,
  rowCount,
  onExport,
  preSelectedColumns,
  initialFormat = 'csv',
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { templates } = useExportTemplates();

  // Get columns for this export type
  const availableColumns = getColumnsForType(exportType);
  const defaultColumns = preSelectedColumns || getDefaultColumnsForType(exportType);

  // Check plan access
  const canExportExcel = FEATURE_ACCESS[planTier].excel;
  const maxRows = EXPORT_LIMITS[planTier].maxRows;
  const isOverLimit = rowCount > maxRows && maxRows > 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormat(initialFormat);
      setSelectedColumns(defaultColumns);
      setIsExporting(false);
    }
  }, [isOpen, initialFormat, defaultColumns]);

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    // Only select columns available for user's plan
    const allowedColumns = availableColumns
      .filter((col) => {
        if (col.planRequired === 'free') return true;
        if (col.planRequired === 'pro') return planTier !== 'free';
        if (col.planRequired === 'enterprise') return planTier === 'enterprise';
        return true;
      })
      .map((col) => col.key);
    setSelectedColumns(allowedColumns);
  };

  const handleSelectNone = () => {
    setSelectedColumns([]);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormat(template.format);
      setSelectedColumns(template.columns);
    }
  };

  const handleExport = () => {
    if (selectedColumns.length === 0 || isOverLimit) return;

    setIsExporting(true);

    // Small delay to show loading state
    setTimeout(() => {
      onExport(format, selectedColumns);
    }, 100);
  };

  // Calculate estimated file size (rough estimate)
  const estimatedFileSize = () => {
    const avgRowSize = format === 'csv' ? 200 : 250; // bytes per row estimate
    const size = rowCount * selectedColumns.length * (avgRowSize / 10);
    if (size < 1024) return `${size.toFixed(0)} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get export type label
  const getExportTypeLabel = () => {
    switch (exportType) {
      case 'contacts':
        return 'Kontakte';
      case 'deals':
        return 'Deals';
      case 'leads':
        return 'Leads';
      default:
        return 'Daten';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {getExportTypeLabel()} exportieren
            </DialogTitle>
            <DialogDescription>
              Konfiguriere den Export und wähle die gewünschten Spalten aus.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Template Selector */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Template</Label>
                    {planTier !== 'free' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSaveTemplateOpen(true)}
                        className="h-7 text-xs"
                      >
                        <Save className="mr-1 h-3 w-3" />
                        Als Template speichern
                      </Button>
                    )}
                  </div>
                  <TemplateSelector
                    templates={templates}
                    selectedId={undefined}
                    onSelect={handleTemplateSelect}
                    exportType={exportType}
                  />
                </div>
              )}

              {/* Format Selection */}
              <div className="space-y-3">
                <Label>Format</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(value) => setFormat(value as ExportFormat)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="csv"
                      id="csv"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="csv"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <FileText className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium">CSV</span>
                      <span className="text-xs text-muted-foreground">
                        Kompatibel mit allen Tools
                      </span>
                    </Label>
                  </div>

                  <div className={!canExportExcel ? 'relative' : ''}>
                    <RadioGroupItem
                      value="excel"
                      id="excel"
                      className="peer sr-only"
                      disabled={!canExportExcel}
                    />
                    <Label
                      htmlFor="excel"
                      className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${
                        !canExportExcel ? 'opacity-50' : ''
                      }`}
                    >
                      <FileSpreadsheet className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium flex items-center gap-1">
                        Excel
                        {!canExportExcel && <PlanGateBadge plan="enterprise" />}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Mit Formatierung
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Column Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Spalten auswählen</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 text-xs"
                    >
                      Alle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectNone}
                      className="h-7 text-xs"
                    >
                      Keine
                    </Button>
                  </div>
                </div>

                <ColumnSelector
                  columns={availableColumns}
                  selectedColumns={selectedColumns}
                  onToggle={handleColumnToggle}
                  planTier={planTier}
                />
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dateiname:</span>
                  <span className="font-mono text-xs">
                    {generateExportFilename(exportType, format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zeilen:</span>
                  <span>
                    {rowCount.toLocaleString('de-DE')}
                    {isOverLimit && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Limit überschritten
                      </Badge>
                    )}
                    {!isOverLimit && maxRows > 0 && (
                      <span className="text-muted-foreground ml-1">
                        / {maxRows.toLocaleString('de-DE')} max
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spalten:</span>
                  <span>{selectedColumns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Geschätzte Dateigröße:
                  </span>
                  <span>{estimatedFileSize()}</span>
                </div>
              </div>

              {isOverLimit && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Export-Limit überschritten</p>
                  <p>
                    Dein Plan erlaubt maximal {maxRows.toLocaleString('de-DE')} Zeilen.
                    {' '}
                    {planTier === 'pro' ? (
                      <>
                        Upgrade auf Enterprise für bis zu 10.000 Zeilen.
                      </>
                    ) : (
                      <>
                        Filtere deine Daten oder upgrade deinen Plan.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>

            {templates.length === 0 && planTier !== 'free' && (
              <Button
                variant="outline"
                onClick={() => setIsSaveTemplateOpen(true)}
                disabled={selectedColumns.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Als Template speichern
              </Button>
            )}

            <Button
              onClick={handleExport}
              disabled={
                selectedColumns.length === 0 ||
                isOverLimit ||
                isExporting
              }
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird exportiert...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export starten
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        exportType={exportType}
        format={format}
        columns={selectedColumns}
        planTier={planTier}
      />
    </>
  );
}

export default ExportDialog;
