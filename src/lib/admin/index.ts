/**
 * Admin Dashboard Library
 *
 * Centralized exports for all admin-related functionality
 */

// Middleware & Auth
export {
  isAdmin,
  checkAdmin,
  requireAdmin,
  getCurrentAdmin,
  requireAdminAPI,
  AdminAuthError,
} from './middleware';

// Audit Logging
export {
  logAuditAction,
  logUserSuspend,
  logUserUnsuspend,
  logUserPlanChange,
  logCreditAdjustment,
  logAnnouncementCreate,
  logAnnouncementUpdate,
  logAnnouncementDelete,
  logReportResolve,
  logReportDismiss,
  logUserRoleChange,
  logUserDelete,
  logSystemSettingChange,
  logRefundIssued,
  logForcePasswordReset,
  withAudit,
} from './audit';

// Statistics
export {
  getDashboardStats,
  getRevenueStats,
  getActivityStats,
  getTopUsers,
  getPlanDistribution,
  getCachedDashboardStats,
  getCachedRevenueStats,
  invalidateAdminStats,
} from './stats';

// Validation Schemas
export {
  // Enums
  AdminActionType,
  AnnouncementPriority,
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementTarget,
  ReportType,
  ReportStatus,
  // Schemas
  suspendUserSchema,
  updateUserSchema,
  creditAdjustmentSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  createReportSchema,
  resolveReportSchema,
  dismissReportSchema,
  adminStatsQuerySchema,
  userListQuerySchema,
  auditLogQuerySchema,
  creditTransactionQuerySchema,
  reportListQuerySchema,
  exportAuditLogsSchema,
  // Types
  type SuspendUserInput,
  type UpdateUserInput,
  type CreditAdjustmentInput,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
  type CreateReportInput,
  type ResolveReportInput,
  type DismissReportInput,
  type AdminStatsQueryInput,
  type UserListQueryInput,
  type AuditLogQueryInput,
  type CreditTransactionQueryInput,
  type ReportListQueryInput,
  type ExportAuditLogsInput,
} from './validation';
