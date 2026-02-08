// Export System Validation Schemas
// src/lib/export/validation.ts

import { z } from 'zod';

// ============================================
// ENUM SCHEMAS
// ============================================

export const ExportTypeSchema = z.enum(['contacts', 'deals', 'leads']);
export const ExportFormatSchema = z.enum(['csv', 'excel']);
export const ExportStatusSchema = z.enum([
  'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
]);
export const ScheduledFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
export const DeliveryMethodSchema = z.enum(['attachment', 'link']);

// ============================================
// COLUMN DEFINITIONS
// ============================================

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

// ============================================
// REQUEST SCHEMAS
// ============================================

export const ContactFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const DealFiltersSchema = z.object({
  stages: z.array(z.string()).optional(),
  status: z.array(z.enum(['open', 'won', 'lost'])).optional(),
  valueMin: z.number().optional(),
  valueMax: z.number().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const LeadFiltersSchema = z.object({
  searchHistoryId: z.string().uuid().optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasWebsite: z.boolean().optional(),
});

export const ExportContactsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(ContactColumnSchema).min(1, 'Mindestens eine Spalte muss ausgewaehlt werden'),
  filters: ContactFiltersSchema.optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportDealsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(DealColumnSchema).min(1, 'Mindestens eine Spalte muss ausgewaehlt werden'),
  filters: DealFiltersSchema.optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
});

export const ExportLeadsRequestSchema = z.object({
  format: ExportFormatSchema,
  columns: z.array(LeadColumnSchema).min(1, 'Mindestens eine Spalte muss ausgewaehlt werden'),
  filters: LeadFiltersSchema.optional(),
  selectedIds: z.array(z.string()).optional(),
  templateId: z.string().uuid().optional(),
  async: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional(),
});

export const FormatOptionsSchema = z.object({
  includeSummary: z.boolean().optional(),
  includeInteractions: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
  emailRecipients: z.array(z.string().email()).optional(),
});

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen haben'),
  description: z.string().max(500, 'Beschreibung darf maximal 500 Zeichen haben').optional(),
  exportType: ExportTypeSchema,
  format: ExportFormatSchema,
  columns: z.array(z.string()).min(1, 'Mindestens eine Spalte muss ausgewaehlt werden'),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: FormatOptionsSchema.optional(),
  isPublic: z.boolean().optional().default(false),
});

export const UpdateTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  format: ExportFormatSchema.optional(),
  columns: z.array(z.string()).min(1).optional(),
  defaultFilters: z.record(z.any()).optional(),
  formatOptions: FormatOptionsSchema.optional(),
  isPublic: z.boolean().optional(),
});

export const CreateScheduledExportRequestSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name darf maximal 100 Zeichen haben'),
  templateId: z.string().uuid(),
  frequency: ScheduledFrequencySchema,
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ungueltiges Zeitformat (HH:MM erwartet)'),
  timezone: z.string().default('Europe/Berlin'),
  emailRecipients: z.array(z.string().email('Ungueltige E-Mail-Adresse')).min(1, 'Mindestens ein Empfaenger erforderlich'),
  deliveryMethod: DeliveryMethodSchema,
});

export const UpdateScheduledExportRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  frequency: ScheduledFrequencySchema.optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezone: z.string().optional(),
  emailRecipients: z.array(z.string().email()).min(1).optional(),
  deliveryMethod: DeliveryMethodSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// RESPONSE SCHEMAS
// ============================================

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
  fileSize: z.number().nullable(),
  rowCount: z.number().nullable(),
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

// ============================================
// TYPE EXPORTS
// ============================================

export type ExportType = z.infer<typeof ExportTypeSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type ExportStatus = z.infer<typeof ExportStatusSchema>;
export type ScheduledFrequency = z.infer<typeof ScheduledFrequencySchema>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;
export type ContactColumn = z.infer<typeof ContactColumnSchema>;
export type DealColumn = z.infer<typeof DealColumnSchema>;
export type LeadColumn = z.infer<typeof LeadColumnSchema>;

export type ContactFilters = z.infer<typeof ContactFiltersSchema>;
export type DealFilters = z.infer<typeof DealFiltersSchema>;
export type LeadFilters = z.infer<typeof LeadFiltersSchema>;

export type ExportContactsRequest = z.infer<typeof ExportContactsRequestSchema>;
export type ExportDealsRequest = z.infer<typeof ExportDealsRequestSchema>;
export type ExportLeadsRequest = z.infer<typeof ExportLeadsRequestSchema>;
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;
export type CreateScheduledExportRequest = z.infer<typeof CreateScheduledExportRequestSchema>;
export type UpdateScheduledExportRequest = z.infer<typeof UpdateScheduledExportRequestSchema>;

export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ExportStatusResponse = z.infer<typeof ExportStatusResponseSchema>;
export type ExportHistoryItem = z.infer<typeof ExportHistoryItemSchema>;
export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type ScheduledExportResponse = z.infer<typeof ScheduledExportResponseSchema>;
export type ExportErrorCode = z.infer<typeof ExportErrorCodeSchema>;

// ============================================
// PLAN GATING CONSTANTS
// ============================================

export const EXPORT_LIMITS = {
  free: { maxRows: 0, maxTemplates: 0, maxScheduled: 0, retentionDays: 0 },
  pro: { maxRows: 1000, maxTemplates: 3, maxScheduled: 0, retentionDays: 30 },
  enterprise: { maxRows: 10000, maxTemplates: Infinity, maxScheduled: 10, retentionDays: 90 },
} as const;

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
} as const;

export type PlanTier = 'free' | 'pro' | 'enterprise';
