// Export Engine
// src/lib/export/engine.ts
// CSV and Excel generation with German format support

import * as XLSX from 'xlsx';
import {
  ExportType,
  ExportFormat,
  ContactColumn,
  DealColumn,
  LeadColumn,
  ContactFilters,
  DealFilters,
  LeadFilters,
} from './validation';

// ============================================
// CSV GENERATOR
// ============================================

export interface CSVColumn {
  key: string;
  label: string;
  format?: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
}

export class CSVGenerator {
  private BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  private SEPARATOR = ';'; // German CSV separator
  private LINE_END = '\r\n'; // Windows line ending for Excel

  /**
   * Escape a value for CSV output
   */
  private escapeValue(value: string): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains special chars
    if (str.includes(this.SEPARATOR) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Format a value based on its type (German format)
   */
  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'date':
        return this.formatGermanDate(value);
      case 'number':
        // German decimal comma
        return String(value).replace('.', ',');
      case 'currency':
        return this.formatGermanCurrency(value);
      case 'percentage':
        return `${value}%`;
      case 'boolean':
        return value ? 'Ja' : 'Nein';
      default:
        return String(value);
    }
  }

  /**
   * Format date in German format (DD.MM.YYYY)
   */
  formatGermanDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Format currency in German format (1.234,56)
   */
  formatGermanCurrency(value: number | null): string {
    if (value === null || value === undefined) return '';
    return value
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Generate CSV header row
   */
  generateHeader(columns: CSVColumn[]): string {
    return columns.map(col => this.escapeValue(col.label)).join(this.SEPARATOR);
  }

  /**
   * Generate a single CSV row
   */
  generateRow(data: Record<string, any>, columns: CSVColumn[]): string {
    return columns
      .map(col => {
        const value = data[col.key];
        return this.escapeValue(this.formatValue(value, col.format));
      })
      .join(this.SEPARATOR);
  }

  /**
   * Generate full CSV content
   */
  generate(columns: CSVColumn[], data: Record<string, any>[]): string {
    const header = this.generateHeader(columns);
    const rows = data.map(row => this.generateRow(row, columns));
    return this.BOM + [header, ...rows].join(this.LINE_END);
  }

  /**
   * Generate CSV as Buffer (for storage upload)
   */
  generateBuffer(columns: CSVColumn[], data: Record<string, any>[]): Buffer {
    const csv = this.generate(columns, data);
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Streaming generator for large datasets
   */
  *generateStream(columns: CSVColumn[], data: Record<string, any>[]): Generator<string> {
    yield this.BOM;
    yield this.generateHeader(columns);
    yield this.LINE_END;

    for (const row of data) {
      yield this.generateRow(row, columns);
      yield this.LINE_END;
    }
  }

  /**
   * Generate CSV in chunks for very large datasets
   */
  async *generateChunks(
    columns: CSVColumn[],
    fetchChunk: (offset: number, limit: number) => Promise<Record<string, any>[]>,
    chunkSize: number = 1000
  ): AsyncGenerator<string> {
    yield this.BOM;
    yield this.generateHeader(columns);
    yield this.LINE_END;

    let offset = 0;
    let hasMore = true;
    let isFirstChunk = true;

    while (hasMore) {
      const rows = await fetchChunk(offset, chunkSize);
      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of rows) {
        yield this.generateRow(row, columns);
        yield this.LINE_END;
      }

      offset += rows.length;
      isFirstChunk = false;

      // Small delay to prevent event loop blocking
      if (offset % 5000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
}

// ============================================
// EXCEL GENERATOR
// ============================================

export interface ExcelOptions {
  includeSummary?: boolean;
  includeInteractions?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
  sheetName?: string;
}

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
  format?: string;
}

export class ExcelGenerator {
  private PRIMARY_BLUE = '3B82F6';
  private DARK_BLUE = '1E40AF';
  private WHITE = 'FFFFFF';
  private LIGHT_GRAY = 'F9FAFB';
  private DARK_GRAY = '6B7280';

  /**
   * Generate Excel workbook from data
   */
  async generate(
    data: Record<string, any>[],
    columns: ExcelColumn[],
    options: ExcelOptions = {}
  ): Promise<Buffer> {
    const {
      includeSummary = false,
      freezeHeader = true,
      autoFilter = true,
      sheetName = 'Daten',
    } = options;

    // 1. Transform data for main sheet
    const worksheetData = data.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        obj[col.label] = this.formatValueForExcel(row[col.key], col.format);
      });
      return obj;
    });

    // 2. Create main worksheet
    const mainWorksheet = XLSX.utils.json_to_sheet(worksheetData);

    // 3. Apply formatting
    this.applyHeaderFormatting(mainWorksheet, columns);
    this.applyColumnWidths(mainWorksheet, columns);
    this.applyDataFormatting(mainWorksheet, columns, data.length);

    if (autoFilter) {
      this.applyAutoFilter(mainWorksheet, columns.length, data.length);
    }

    if (freezeHeader) {
      mainWorksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    }

    // 4. Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, sheetName);

    // 5. Optional: Summary sheet
    if (includeSummary) {
      const summarySheet = this.createSummarySheet(data, columns);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Zusammenfassung');
    }

    // 6. Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Format value for Excel output
   */
  private formatValueForExcel(value: any, format?: string): any {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'date':
        return new Date(value);
      case 'number':
      case 'currency':
        return Number(value);
      case 'boolean':
        return value ? 'Ja' : 'Nein';
      default:
        return String(value);
    }
  }

  /**
   * Apply header formatting (blue background, white text)
   */
  private applyHeaderFormatting(worksheet: XLSX.WorkSheet, columns: ExcelColumn[]): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellRef]) continue;

      worksheet[cellRef].s = {
        font: { bold: true, color: { rgb: this.WHITE }, sz: 11 },
        fill: { fgColor: { rgb: this.PRIMARY_BLUE }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: this.DARK_BLUE } },
        },
      };
    }
  }

  /**
   * Apply column widths
   */
  private applyColumnWidths(worksheet: XLSX.WorkSheet, columns: ExcelColumn[]): void {
    worksheet['!cols'] = columns.map(col => ({
      wch: col.width || Math.max(col.label.length + 2, 15),
    }));
  }

  /**
   * Apply alternating row colors to data
   */
  private applyDataFormatting(
    worksheet: XLSX.WorkSheet,
    columns: ExcelColumn[],
    rowCount: number
  ): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let R = 1; R <= rowCount; ++R) {
      // Alternating row colors
      const fillColor = R % 2 === 0 ? this.LIGHT_GRAY : this.WHITE;

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellRef]) continue;

        // Apply existing value styling
        if (!worksheet[cellRef].s) {
          worksheet[cellRef].s = {};
        }

        worksheet[cellRef].s.fill = {
          fgColor: { rgb: fillColor },
          patternType: 'solid',
        };

        worksheet[cellRef].s.font = {
          sz: 10,
          color: { rgb: '000000' },
        };

        worksheet[cellRef].s.border = {
          bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        };
      }
    }
  }

  /**
   * Apply auto-filter to header row
   */
  private applyAutoFilter(worksheet: XLSX.WorkSheet, colCount: number, rowCount: number): void {
    worksheet['!autofilter'] = {
      ref: `A1:${XLSX.utils.encode_col(colCount - 1)}${rowCount + 1}`,
    };
  }

  /**
   * Create summary sheet with statistics
   */
  private createSummarySheet(data: Record<string, any>[], columns: ExcelColumn[]): XLSX.WorkSheet {
    const stats = this.calculateStats(data, columns);

    const summaryData = [
      ['Export Zusammenfassung'],
      [],
      ['Gesamtanzahl:', stats.total],
      ['Exportiert am:', new Date().toLocaleString('de-DE')],
      [],
    ];

    // Add column-specific stats if available
    if (stats.withEmail !== undefined) {
      summaryData.push(['Mit E-Mail:', stats.withEmail]);
    }
    if (stats.withPhone !== undefined) {
      summaryData.push(['Mit Telefon:', stats.withPhone]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Title styling
    worksheet['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: this.PRIMARY_BLUE } },
    };

    // Column headers styling
    for (let i = 2; i < summaryData.length; i++) {
      const cellRef = `A${i + 1}`;
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, sz: 10 },
        };
      }
    }

    // Set column widths
    worksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];

    return worksheet;
  }

  /**
   * Calculate statistics for summary sheet
   */
  private calculateStats(
    data: Record<string, any>[],
    columns: ExcelColumn[]
  ): Record<string, any> {
    const stats: Record<string, any> = {
      total: data.length,
    };

    // Check if we have email/phone columns
    const hasEmailCol = columns.some(col => col.key.toLowerCase().includes('email'));
    const hasPhoneCol = columns.some(col => col.key.toLowerCase().includes('phone'));

    if (hasEmailCol) {
      const emailCol = columns.find(col => col.key.toLowerCase().includes('email'));
      if (emailCol) {
        stats.withEmail = data.filter(row => row[emailCol.key]).length;
      }
    }

    if (hasPhoneCol) {
      const phoneCol = columns.find(col => col.key.toLowerCase().includes('phone'));
      if (phoneCol) {
        stats.withPhone = data.filter(row => row[phoneCol.key]).length;
      }
    }

    return stats;
  }
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

export const CONTACT_COLUMNS: CSVColumn[] = [
  { key: 'id', label: 'ID', format: 'string' },
  { key: 'name', label: 'Name', format: 'string' },
  { key: 'company', label: 'Firma', format: 'string' },
  { key: 'email', label: 'E-Mail', format: 'string' },
  { key: 'phone', label: 'Telefon', format: 'string' },
  { key: 'address', label: 'Adresse', format: 'string' },
  { key: 'website', label: 'Website', format: 'string' },
  { key: 'tags', label: 'Tags', format: 'string' },
  { key: 'notes', label: 'Notizen', format: 'string' },
  { key: 'source', label: 'Quelle', format: 'string' },
  { key: 'created_at', label: 'Erstellt am', format: 'date' },
  { key: 'updated_at', label: 'Aktualisiert am', format: 'date' },
  { key: 'interaction_count', label: 'Anzahl Interaktionen', format: 'number' },
  { key: 'deal_count', label: 'Zugeordnete Deals', format: 'number' },
];

export const DEAL_COLUMNS: CSVColumn[] = [
  { key: 'id', label: 'Deal ID', format: 'string' },
  { key: 'title', label: 'Titel', format: 'string' },
  { key: 'description', label: 'Beschreibung', format: 'string' },
  { key: 'stage', label: 'Stage', format: 'string' },
  { key: 'value', label: 'Wert (EUR)', format: 'currency' },
  { key: 'probability', label: 'Wahrscheinlichkeit (%)', format: 'percentage' },
  { key: 'expected_close_date', label: 'Erwartetes Closing', format: 'date' },
  { key: 'actual_close_date', label: 'Tatsaechliches Closing', format: 'date' },
  { key: 'status', label: 'Status', format: 'string' },
  { key: 'close_reason', label: 'Abschlussgrund', format: 'string' },
  { key: 'contact_name', label: 'Kontakt Name', format: 'string' },
  { key: 'contact_company', label: 'Kontakt Firma', format: 'string' },
  { key: 'contact_email', label: 'Kontakt E-Mail', format: 'string' },
  { key: 'contact_phone', label: 'Kontakt Telefon', format: 'string' },
  { key: 'created_at', label: 'Erstellt am', format: 'date' },
  { key: 'days_in_pipeline', label: 'Tage in Pipeline', format: 'number' },
  { key: 'weighted_value', label: 'Gewichteter Wert', format: 'currency' },
];

export const LEAD_COLUMNS: CSVColumn[] = [
  { key: 'company_name', label: 'Firmenname', format: 'string' },
  { key: 'address', label: 'Adresse', format: 'string' },
  { key: 'phone', label: 'Telefon', format: 'string' },
  { key: 'email', label: 'E-Mail', format: 'string' },
  { key: 'website', label: 'Website', format: 'string' },
  { key: 'category', label: 'Branche', format: 'string' },
  { key: 'rating', label: 'Bewertung', format: 'number' },
  { key: 'reviews_count', label: 'Anzahl Bewertungen', format: 'number' },
  { key: 'linkedin', label: 'LinkedIn', format: 'string' },
  { key: 'xing', label: 'Xing', format: 'string' },
  { key: 'opening_hours', label: 'Oeffnungszeiten', format: 'string' },
  { key: 'place_id', label: 'Place ID', format: 'string' },
  { key: 'search_date', label: 'Suchdatum', format: 'date' },
  { key: 'search_query', label: 'Suchbegriff', format: 'string' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get column definitions for export type
 */
export function getColumnsForExportType(exportType: ExportType): CSVColumn[] {
  switch (exportType) {
    case 'contacts':
      return CONTACT_COLUMNS;
    case 'deals':
      return DEAL_COLUMNS;
    case 'leads':
      return LEAD_COLUMNS;
    default:
      return [];
  }
}

/**
 * Filter columns by selected keys
 */
export function filterColumns(
  allColumns: CSVColumn[],
  selectedKeys: string[]
): CSVColumn[] {
  return allColumns.filter(col => selectedKeys.includes(col.key));
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  exportType: ExportType,
  format: ExportFormat
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss

  const typeMap: Record<ExportType, string> = {
    contacts: 'kontakte',
    deals: 'deals',
    leads: 'leads',
  };

  const ext = format === 'csv' ? 'csv' : 'xlsx';

  return `manyleads_${typeMap[exportType]}_${dateStr}_${timeStr}.${ext}`;
}

/**
 * Estimate file size based on row count and columns
 */
export function estimateFileSize(
  rowCount: number,
  columnCount: number,
  format: ExportFormat
): number {
  if (format === 'csv') {
    // Rough estimate: 50 bytes per cell average
    return rowCount * columnCount * 50;
  } else {
    // Excel is more compact but has overhead
    return rowCount * columnCount * 30 + 5000;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================
// EXPORT INSTANCES
// ============================================

export const csvGenerator = new CSVGenerator();
export const excelGenerator = new ExcelGenerator();

// ============================================
// PROGRESS TRACKING
// ============================================

export interface ExportProgress {
  totalRows: number;
  processedRows: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function calculateProgress(
  totalRows: number,
  processedRows: number
): ExportProgress {
  return {
    totalRows,
    processedRows,
    percentage: Math.min(100, Math.round((processedRows / totalRows) * 100)),
    status: processedRows >= totalRows ? 'completed' : 'processing',
  };
}

/**
 * Estimate processing time in seconds based on row count
 */
export function estimateProcessingTime(
  rowCount: number,
  format: ExportFormat
): number {
  // Base time + time per row
  const baseTime = 2;
  const timePerRow = format === 'excel' ? 0.01 : 0.005;
  return Math.ceil(baseTime + rowCount * timePerRow);
}

/**
 * Determine if export should be async based on row count
 */
export function shouldUseAsync(rowCount: number): boolean {
  return rowCount > 1000;
}

/**
 * Calculate expiration date based on plan tier
 */
export function calculateExpirationDate(
  planTier: 'free' | 'pro' | 'enterprise'
): Date {
  const retentionDays = {
    free: 0,
    pro: 30,
    enterprise: 90,
  };

  const days = retentionDays[planTier] || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
