/**
 * Export System Types
 *
 * Type definitions for the export system including
 * export requests, templates, scheduled exports, and status tracking.
 *
 * @module ExportTypes
 */

import { z } from 'zod';

// Enums
export const ExportTypeSchema = z.enum(['contacts', 'deals', 'leads']);
export const ExportFormatSchema = z.enum(['csv', 'excel']);
export const ExportStatusSchema = z.enum([
  'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
]);
export const ScheduledFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
export const DeliveryMethodSchema = z.enum(['attachment', 'link']);

// Column Definitions
export const ContactColumnSchema = z.enum([
  'id', 'name', 'company', 'email', 'phone', 'address',
  'website', 'tags', 'notes', 'source', 'created_at',
  'updated_at', 'interaction_count', 'deal_count'
]);

export const DealColumnSchema = z.enum([
  'id', 'title', 'description', 'stage', 'value', 'probability',
  'expected_close', 'actual_close', 'status', 'close_reason',
  'contact_name', 'contact_company', 'contact_email', 'contact_phone',
  'created_at', 'days_in_pipeline', 'weighted_value'
]);

export const LeadColumnSchema = z.enum([
  'company_name', 'address', 'phone', 'email', 'website',
  'category', 'rating', 'reviews_count', 'linkedin', 'xing',
  'opening_hours', 'place_id', 'search_date', 'search_query'
]);

// Request Schemas
export const ExportContactsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(ContactColumnSchema).min(1),
  filters: z.object({
    tags: z.array(z.string()).optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportDealsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(DealColumnSchema).min(1),
  filters: z.object({
    stages: z.array(z.string()).optional(),
    status: z.array(z.enum(['open', 'won', 'lost'])).optional(),
    valueMin: z.number().optional(),
    valueMax: z.number().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportLeadsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(LeadColumnSchema).min(1),
  filters: z.object({
    searchHistoryId: z.string().uuid().optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    hasWebsite: z.boolean().optional(),
  }).optional(),
  selectedIds: z.array(z.string()).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional(),
});

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  exportType: ExportTypeSchema,
  format: ExportFormatSchema,
  columns: z.array(z.string()).min(1),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: z.object({
    includeSummary: z.boolean().optional(),
    includeInteractions: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
    emailRecipients: z.array(z.string().email()).optional(),
  }).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const CreateScheduledExportRequestSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.string().uuid(),
  frequency: ScheduledFrequencySchema,
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timezone: z.string().default('Europe/Berlin'),
  emailRecipients: z.array(z.string().email()).min(1),
  deliveryMethod: DeliveryMethodSchema,
});

// Response Schemas
export const ExportResponseSchema = z.union([
  // Synchron
  z.object({
    success: z.literal(true),
    exportId: z.string().uuid(),
    status: z.literal('completed'),
    downloadUrl: z.string().url(),
    fileName: z.string(),
    fileSize: z.number(),
    rowCount: z.number(),
    expiresAt: z.string().datetime(),
  }),
  // Asynchron
  z.object({
    success: z.literal(true),
    exportId: z.string().uuid(),
    status: z.enum(['pending', 'processing']),
    estimatedSeconds: z.number(),
    checkStatusUrl: z.string().url(),
  }),
]);

export const ExportStatusResponseSchema = z.object({
  exportId: z.string().uuid(),
  status: ExportStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  rowCount: z.number().optional(),
  processedRows: z.number().optional(),
  downloadUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export const ExportHistoryItemSchema = z.object({
  id: z.string().uuid(),
  exportType: ExportTypeSchema,
  status: ExportStatusSchema,
  format: ExportFormatSchema,
  fileName: z.string(),
  fileSize: z.number(),
  rowCount: z.number(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  templateName: z.string().optional(),
});

export const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  exportType: ExportTypeSchema,
  format: ExportFormatSchema,
  columns: z.array(z.string()),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: z.record(z.any()).optional(),
  isPublic: z.boolean(),
  usageCount: z.number(),
  lastUsedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const ScheduledExportResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  templateId: z.string().uuid(),
  templateName: z.string(),
  frequency: ScheduledFrequencySchema,
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  timeOfDay: z.string(),
  timezone: z.string(),
  isActive: z.boolean(),
  lastRunAt: z.string().datetime().optional(),
  nextRunAt: z.string().datetime().optional(),
  runCount: z.number(),
  successCount: z.number(),
  failCount: z.number(),
  emailRecipients: z.array(z.string()),
  deliveryMethod: DeliveryMethodSchema,
});

export const ExportErrorCodeSchema = z.enum([
  'INVALID_FORMAT',
  'INVALID_COLUMNS',
  'INVALID_FILTERS',
  'UNAUTHORIZED',
  'PLAN_REQUIRED',
  'LIMIT_EXCEEDED',
  'TEMPLATE_NOT_FOUND',
  'EXPORT_NOT_FOUND',
  'EXPORT_ALREADY_RUNNING',
  'RATE_LIMIT_EXCEEDED',
  'EXPORT_FAILED',
  'STORAGE_ERROR',
]);

// Type Exports
export type ExportType = z.infer<typeof ExportTypeSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportStatus = z.infer<typeof ExportStatusSchema>;
export type ScheduledFrequency = z.infer<typeof ScheduledFrequencySchema>;
export type ExportContactsRequest = z.infer<typeof ExportContactsRequestSchema>;
export type ExportDealsRequest = z.infer<typeof ExportDealsRequestSchema>;
export type ExportLeadsRequest = z.infer<typeof ExportLeadsRequestSchema>;
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;
export type CreateScheduledExportRequest = z.infer<typeof CreateScheduledExportRequestSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ExportStatusResponse = z.infer<typeof ExportStatusResponseSchema>;
export type ExportHistoryItem = z.infer<typeof ExportHistoryItemSchema>;
export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type ScheduledExportResponse = z.infer<typeof ScheduledExportResponseSchema>;
export type ExportErrorCode = z.infer<typeof ExportErrorCodeSchema>;

// Column Definitions for UI
export interface ColumnDefinition {
  key: string;
  label: string;
  description?: string;
  planRequired: 'free' | 'pro' | 'enterprise';
}

// Contact Columns
export const CONTACT_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', description: 'Interne UUID', planRequired: 'pro' },
  { key: 'name', label: 'Name', planRequired: 'pro' },
  { key: 'company', label: 'Firma', planRequired: 'pro' },
  { key: 'email', label: 'E-Mail', planRequired: 'pro' },
  { key: 'phone', label: 'Telefon', planRequired: 'pro' },
  { key: 'address', label: 'Adresse', planRequired: 'pro' },
  { key: 'website', label: 'Website', planRequired: 'pro' },
  { key: 'tags', label: 'Tags', planRequired: 'pro' },
  { key: 'notes', label: 'Notizen', planRequired: 'pro' },
  { key: 'source', label: 'Quelle', planRequired: 'pro' },
  { key: 'created_at', label: 'Erstellt am', planRequired: 'pro' },
  { key: 'updated_at', label: 'Zuletzt bearbeitet', planRequired: 'enterprise' },
  { key: 'interaction_count', label: 'Anzahl Interaktionen', planRequired: 'enterprise' },
  { key: 'deal_count', label: 'Zugeordnete Deals', planRequired: 'enterprise' },
];

// Deal Columns
export const DEAL_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'Deal ID', planRequired: 'pro' },
  { key: 'title', label: 'Titel', planRequired: 'pro' },
  { key: 'description', label: 'Beschreibung', planRequired: 'pro' },
  { key: 'stage', label: 'Stage', planRequired: 'pro' },
  { key: 'value', label: 'Wert (€)', planRequired: 'pro' },
  { key: 'probability', label: 'Wahrscheinlichkeit (%)', planRequired: 'pro' },
  { key: 'expected_close', label: 'Erwartetes Closing', planRequired: 'pro' },
  { key: 'actual_close', label: 'Tatsächliches Closing', planRequired: 'pro' },
  { key: 'status', label: 'Status', planRequired: 'pro' },
  { key: 'close_reason', label: 'Abschlussgrund', planRequired: 'pro' },
  { key: 'contact_name', label: 'Kontakt Name', planRequired: 'pro' },
  { key: 'contact_company', label: 'Kontakt Firma', planRequired: 'pro' },
  { key: 'contact_email', label: 'Kontakt E-Mail', planRequired: 'pro' },
  { key: 'contact_phone', label: 'Kontakt Telefon', planRequired: 'pro' },
  { key: 'created_at', label: 'Erstellt am', planRequired: 'pro' },
  { key: 'days_in_pipeline', label: 'Tage in Pipeline', planRequired: 'enterprise' },
  { key: 'weighted_value', label: 'Gewichteter Wert', planRequired: 'enterprise' },
];

// Lead Columns
export const LEAD_COLUMNS: ColumnDefinition[] = [
  { key: 'company_name', label: 'Firmenname', planRequired: 'pro' },
  { key: 'address', label: 'Adresse', planRequired: 'pro' },
  { key: 'phone', label: 'Telefon', planRequired: 'pro' },
  { key: 'email', label: 'E-Mail', planRequired: 'pro' },
  { key: 'website', label: 'Website', planRequired: 'pro' },
  { key: 'category', label: 'Branche', planRequired: 'enterprise' },
  { key: 'rating', label: 'Bewertung', planRequired: 'enterprise' },
  { key: 'reviews_count', label: 'Anzahl Bewertungen', planRequired: 'enterprise' },
  { key: 'linkedin', label: 'LinkedIn', planRequired: 'enterprise' },
  { key: 'xing', label: 'Xing', planRequired: 'enterprise' },
  { key: 'opening_hours', label: 'Öffnungszeiten', planRequired: 'enterprise' },
  { key: 'place_id', label: 'Place ID', planRequired: 'enterprise' },
  { key: 'search_date', label: 'Suchdatum', planRequired: 'enterprise' },
  { key: 'search_query', label: 'Suchquery', planRequired: 'enterprise' },
];

// Default column selections
export const DEFAULT_CONTACT_COLUMNS = ['name', 'company', 'email', 'phone'];
export const DEFAULT_DEAL_COLUMNS = ['title', 'stage', 'value', 'probability', 'contact_name'];
export const DEFAULT_LEAD_COLUMNS = ['company_name', 'address', 'phone', 'email', 'website'];

// Export limits by plan
export const EXPORT_LIMITS = {
  free: { maxRows: 0, maxTemplates: 0, maxScheduled: 0, retentionDays: 0 },
  pro: { maxRows: 1000, maxTemplates: 3, maxScheduled: 0, retentionDays: 30 },
  enterprise: { maxRows: 10000, maxTemplates: Infinity, maxScheduled: 10, retentionDays: 90 },
};

// Feature access by plan
export const FEATURE_ACCESS = {
  free: {
    csv: false,
    excel: false,
    dealExport: false,
    bulkExport: false,
    scheduledExports: false,
    templates: false,
    templateSharing: false,
    gdprExport: false,
  },
  pro: {
    csv: true,
    excel: false,
    dealExport: true,
    bulkExport: false,
    scheduledExports: false,
    templates: true,
    templateSharing: false,
    gdprExport: false,
  },
  enterprise: {
    csv: true,
    excel: true,
    dealExport: true,
    bulkExport: true,
    scheduledExports: true,
    templates: true,
    templateSharing: true,
    gdprExport: true,
  },
};

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format date (German)
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

// Format date time (German)
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get columns for export type
export function getColumnsForType(type: ExportType): ColumnDefinition[] {
  switch (type) {
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

// Get default columns for export type
export function getDefaultColumnsForType(type: ExportType): string[] {
  switch (type) {
    case 'contacts':
      return DEFAULT_CONTACT_COLUMNS;
    case 'deals':
      return DEFAULT_DEAL_COLUMNS;
    case 'leads':
      return DEFAULT_LEAD_COLUMNS;
    default:
      return [];
  }
}

// Generate filename
export function generateExportFilename(
  exportType: ExportType,
  format: ExportFormat
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');

  const typeMap = {
    contacts: 'kontakte',
    deals: 'deals',
    leads: 'leads',
  };

  const ext = format === 'csv' ? 'csv' : 'xlsx';

  return `manyleads_${typeMap[exportType]}_${dateStr}_${timeStr}.${ext}`;
}
