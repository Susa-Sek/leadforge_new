// Export System - Main exports
// src/lib/export/index.ts

// Validation & Types
export {
  // Schemas
  ExportContactsRequestSchema,
  ExportDealsRequestSchema,
  ExportLeadsRequestSchema,
  CreateTemplateRequestSchema,
  UpdateTemplateRequestSchema,
  CreateScheduledExportRequestSchema,
  UpdateScheduledExportRequestSchema,
  // Enums
  ExportTypeSchema,
  ExportFormatSchema,
  ExportStatusSchema,
  ScheduledFrequencySchema,
  DeliveryMethodSchema,
  ContactColumnSchema,
  DealColumnSchema,
  LeadColumnSchema,
  // Constants
  EXPORT_LIMITS,
  FEATURE_ACCESS,
  // Types
  type ExportType,
  type ExportFormat,
  type ExportStatus,
  type ScheduledFrequency,
  type DeliveryMethod,
  type ContactColumn,
  type DealColumn,
  type LeadColumn,
  type ContactFilters,
  type DealFilters,
  type LeadFilters,
  type ExportContactsRequest,
  type ExportDealsRequest,
  type ExportLeadsRequest,
  type CreateTemplateRequest,
  type UpdateTemplateRequest,
  type CreateScheduledExportRequest,
  type UpdateScheduledExportRequest,
  type ExportResponse,
  type ExportStatusResponse,
  type ExportHistoryItem,
  type TemplateResponse,
  type ScheduledExportResponse,
  type ExportErrorCode,
  type PlanTier,
} from './validation';

// Export Engine
export {
  // Generators
  csvGenerator,
  excelGenerator,
  CSVGenerator,
  ExcelGenerator,
  // Column definitions
  CONTACT_COLUMNS,
  DEAL_COLUMNS,
  LEAD_COLUMNS,
  // Functions
  getColumnsForExportType,
  filterColumns,
  generateExportFilename,
  estimateFileSize,
  formatFileSize,
  calculateProgress,
  estimateProcessingTime,
  shouldUseAsync,
  calculateExpirationDate,
  // Types
  type CSVColumn,
  type ExcelColumn,
  type ExcelOptions,
  type ExportProgress,
} from './engine';

// Plan Gating
export {
  // Validation
  validateExportRequest,
  validateTemplateLimit,
  validateScheduledExport,
  validateScheduledExportLimit,
  // Rate limiting
  checkRateLimit,
  type RateLimitResult,
  // Plan utilities
  getUserPlanTier,
  isProOrHigher,
  isEnterprise,
  getMaxRowsForPlan,
  getRetentionDaysForPlan,
  formatPlanLimits,
  isFeatureAvailable,
  getAvailableFeatures,
  getUpgradeMessage,
  // Types
  type ValidationResult,
} from './plan-gating';

// Storage
export {
  // Path generation
  generateFilePath,
  generateDisplayFilename,
  // File operations
  uploadExportFile,
  generateDownloadUrl,
  getPublicUrl,
  deleteExportFile,
  fileExists,
  getFileSize,
  // Bucket management
  createExportsBucket,
  // User operations
  listUserExportFiles,
  deleteUserExportFiles,
  // Validation
  validateFileOwnership,
} from './storage';
