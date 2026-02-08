/**
 * Admin Audit Logging System
 *
 * Tracks all admin actions for accountability and compliance
 */

import { createClient } from '@/lib/supabase/server';
import { AdminActionType } from './validation';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  adminId: string;
  action: AdminActionType;
  targetType: 'user' | 'system' | 'announcement' | 'report' | 'subscription' | 'credit';
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the audit log
 */
export async function logAuditAction({
  adminId,
  action,
  targetType,
  targetId,
  details = {},
}: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('Failed to log audit action:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error logging audit action:', err);
    return { success: false, error: 'Failed to log audit action' };
  }
}

/**
 * Log user suspension
 */
export async function logUserSuspend(
  adminId: string,
  userId: string,
  reason: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'USER_SUSPEND',
    targetType: 'user',
    targetId: userId,
    details: { reason },
  });
}

/**
 * Log user unsuspension
 */
export async function logUserUnsuspend(adminId: string, userId: string): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'USER_UNSUSPEND',
    targetType: 'user',
    targetId: userId,
  });
}

/**
 * Log user plan change
 */
export async function logUserPlanChange(
  adminId: string,
  userId: string,
  oldPlan: string,
  newPlan: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'USER_PLAN_CHANGE',
    targetType: 'subscription',
    targetId: userId,
    details: { old_plan: oldPlan, new_plan: newPlan },
  });
}

/**
 * Log credit adjustment
 */
export async function logCreditAdjustment(
  adminId: string,
  userId: string,
  amount: number,
  reason: string,
  previousBalance: number,
  newBalance: number
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'CREDIT_ADJUSTMENT',
    targetType: 'credit',
    targetId: userId,
    details: {
      amount,
      reason,
      previous_balance: previousBalance,
      new_balance: newBalance,
    },
  });
}

/**
 * Log announcement creation
 */
export async function logAnnouncementCreate(
  adminId: string,
  announcementId: string,
  title: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'ANNOUNCEMENT_CREATE',
    targetType: 'announcement',
    targetId: announcementId,
    details: { title },
  });
}

/**
 * Log announcement update
 */
export async function logAnnouncementUpdate(
  adminId: string,
  announcementId: string,
  changes: Record<string, any>
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'ANNOUNCEMENT_UPDATE',
    targetType: 'announcement',
    targetId: announcementId,
    details: changes,
  });
}

/**
 * Log announcement deletion
 */
export async function logAnnouncementDelete(
  adminId: string,
  announcementId: string,
  title: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'ANNOUNCEMENT_DELETE',
    targetType: 'announcement',
    targetId: announcementId,
    details: { title },
  });
}

/**
 * Log report resolution
 */
export async function logReportResolve(
  adminId: string,
  reportId: string,
  note?: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'REPORT_RESOLVE',
    targetType: 'report',
    targetId: reportId,
    details: note ? { resolution_note: note } : {},
  });
}

/**
 * Log report dismissal
 */
export async function logReportDismiss(
  adminId: string,
  reportId: string,
  reason?: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'REPORT_DISMISS',
    targetType: 'report',
    targetId: reportId,
    details: reason ? { dismissal_reason: reason } : {},
  });
}

/**
 * Log user role change
 */
export async function logUserRoleChange(
  adminId: string,
  userId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'USER_ROLE_CHANGE',
    targetType: 'user',
    targetId: userId,
    details: { old_role: oldRole, new_role: newRole },
  });
}

/**
 * Log user deletion
 */
export async function logUserDelete(
  adminId: string,
  userId: string,
  email: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'USER_DELETE',
    targetType: 'user',
    targetId: userId,
    details: { email },
  });
}

/**
 * Log system setting change
 */
export async function logSystemSettingChange(
  adminId: string,
  setting: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'SYSTEM_SETTING_CHANGE',
    targetType: 'system',
    details: { setting, old_value: oldValue, new_value: newValue },
  });
}

/**
 * Log refund issued
 */
export async function logRefundIssued(
  adminId: string,
  userId: string,
  amount: number,
  invoiceId: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'REFUND_ISSUED',
    targetType: 'subscription',
    targetId: userId,
    details: { amount, invoice_id: invoiceId },
  });
}

/**
 * Log forced password reset
 */
export async function logForcePasswordReset(
  adminId: string,
  userId: string,
  email: string
): Promise<void> {
  await logAuditAction({
    adminId,
    action: 'FORCE_PASSWORD_RESET',
    targetType: 'user',
    targetId: userId,
    details: { email },
  });
}

/**
 * Wrapper for API routes - automatically logs after successful operation
 *
 * Usage:
 * ```typescript
 * const result = await withAudit(
 *   { adminId: user.id, action: 'USER_SUSPEND', targetType: 'user', targetId },
 *   async () => {
 *     // Your operation here
 *     return await suspendUser(targetId);
 *   }
 * );
 * ```
 */
export async function withAudit<T>(
  auditEntry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>,
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  await logAuditAction(auditEntry);
  return result;
}
