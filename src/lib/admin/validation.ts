/**
 * Admin Dashboard Validation Schemas
 * Uses Zod v4 for type-safe validation
 */

import { z } from 'zod';

// =====================================================
// ENUMS
// =====================================================

export const AdminActionType = {
  USER_SUSPEND: 'USER_SUSPEND',
  USER_UNSUSPEND: 'USER_UNSUSPEND',
  USER_PLAN_CHANGE: 'USER_PLAN_CHANGE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  CREDIT_ADJUSTMENT: 'CREDIT_ADJUSTMENT',
  ANNOUNCEMENT_CREATE: 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_UPDATE: 'ANNOUNCEMENT_UPDATE',
  ANNOUNCEMENT_DELETE: 'ANNOUNCEMENT_DELETE',
  REPORT_RESOLVE: 'REPORT_RESOLVE',
  REPORT_DISMISS: 'REPORT_DISMISS',
  USER_DELETE: 'USER_DELETE',
  SYSTEM_SETTING_CHANGE: 'SYSTEM_SETTING_CHANGE',
  REFUND_ISSUED: 'REFUND_ISSUED',
  FORCE_PASSWORD_RESET: 'FORCE_PASSWORD_RESET',
} as const;

export type AdminActionType = typeof AdminActionType[keyof typeof AdminActionType];

export const AnnouncementPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const AnnouncementType = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  MAINTENANCE: 'maintenance',
} as const;

export const AnnouncementStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const AnnouncementTarget = {
  ALL: 'all',
  FREE: 'free',
  PAID: 'paid',
  ADMINS: 'admins',
} as const;

export const ReportType = {
  SPAM: 'spam',
  ABUSE: 'abuse',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  FAKE_PROFILE: 'fake_profile',
  COPYRIGHT: 'copyright',
  OTHER: 'other',
} as const;

export const ReportStatus = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

/**
 * User suspension schema
 * BUG-11 FIX: Min length 10 characters required for reason
 */
export const suspendUserSchema = z.object({
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein').max(500, 'Grund zu lang (max. 500 Zeichen)'),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

/**
 * User update schema (for admin updates)
 */
export const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  is_suspended: z.boolean().optional(),
  credits: z.number().int().min(0).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Credit adjustment schema
 */
export const creditAdjustmentSchema = z.object({
  user_id: z.string().uuid('Ungültige User-ID'),
  amount: z.number().int().refine(val => val !== 0, {
    message: 'Betrag darf nicht 0 sein',
  }),
  reason: z.string().min(1, 'Grund ist erforderlich').max(500, 'Grund zu lang (max. 500 Zeichen)'),
});

export type CreditAdjustmentInput = z.infer<typeof creditAdjustmentSchema>;

/**
 * Announcement creation schema
 */
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel zu lang (max. 200 Zeichen)'),
  content: z.string().min(1, 'Inhalt ist erforderlich').max(5000, 'Inhalt zu lang (max. 5000 Zeichen)'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  type: z.enum(['info', 'warning', 'success', 'maintenance']).default('info'),
  target_audience: z.enum(['all', 'free', 'paid', 'admins']).default('all'),
  publish_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

/**
 * Announcement update schema
 */
export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  type: z.enum(['info', 'warning', 'success', 'maintenance']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  target_audience: z.enum(['all', 'free', 'paid', 'admins']).optional(),
  publish_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

/**
 * Report creation schema (for users)
 */
export const createReportSchema = z.object({
  reported_user_id: z.string().uuid('Ungültige User-ID'),
  type: z.enum(['spam', 'abuse', 'inappropriate_content', 'fake_profile', 'copyright', 'other']),
  description: z.string().max(2000, 'Beschreibung zu lang (max. 2000 Zeichen)').optional(),
  evidence: z.array(z.string().url('Ungültige URL')).max(5, 'Max. 5 Beweise erlaubt').optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Report resolution schema
 */
export const resolveReportSchema = z.object({
  resolution_note: z.string().max(1000, 'Notiz zu lang (max. 1000 Zeichen)').optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

/**
 * Report dismissal schema
 */
export const dismissReportSchema = z.object({
  reason: z.string().max(1000, 'Grund zu lang (max. 1000 Zeichen)').optional(),
});

export type DismissReportInput = z.infer<typeof dismissReportSchema>;

/**
 * Admin stats query schema
 */
export const adminStatsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type AdminStatsQueryInput = z.infer<typeof adminStatsQuerySchema>;

/**
 * User list query schema
 */
export const userListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
  is_suspended: z.enum(['true', 'false']).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  sort_by: z.enum(['created_at', 'last_sign_in', 'credits', 'email']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;

/**
 * Audit log query schema
 */
export const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  target_type: z.enum(['user', 'system', 'announcement', 'report', 'subscription', 'credit']).optional(),
  target_id: z.string().uuid().optional(),
  admin_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

/**
 * Credit transaction list query schema
 */
export const creditTransactionQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreditTransactionQueryInput = z.infer<typeof creditTransactionQuerySchema>;

/**
 * Report list query schema
 */
export const reportListQuerySchema = z.object({
  status: z.enum(['pending', 'investigating', 'resolved', 'dismissed']).optional(),
  type: z.enum(['spam', 'abuse', 'inappropriate_content', 'fake_profile', 'copyright', 'other']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportListQueryInput = z.infer<typeof reportListQuerySchema>;

/**
 * Export audit logs schema
 */
export const exportAuditLogsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export type ExportAuditLogsInput = z.infer<typeof exportAuditLogsSchema>;
