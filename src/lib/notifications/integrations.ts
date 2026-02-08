/**
 * Notification Integrations
 * src/lib/notifications/integrations.ts
 *
 * Helper functions to trigger notifications from various system events.
 * These should be called from API routes and background jobs.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createNotification, createCustomNotification } from './service';
import type { NotificationTypeValue } from './validation';

// ============================================
// SEARCH NOTIFICATIONS
// ============================================

/**
 * Notify user when search completes
 */
export async function notifySearchComplete(
  supabase: SupabaseClient,
  userId: string,
  searchId: string,
  query: string,
  leadsFound: number
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'search_complete',
      {
        search_id: searchId,
        query: query,
        result_count: leadsFound,
      },
      `/dashboard/sammlungen/${searchId}`
    );
  } catch (error) {
    console.error('Error sending search_complete notification:', error);
  }
}

/**
 * Notify user when search fails
 */
export async function notifySearchFailed(
  supabase: SupabaseClient,
  userId: string,
  searchId: string,
  query: string,
  errorMessage: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'search_failed',
      {
        search_id: searchId,
        query: query,
        error: errorMessage,
      },
      `/dashboard/verlauf`
    );
  } catch (error) {
    console.error('Error sending search_failed notification:', error);
  }
}

// ============================================
// EXPORT NOTIFICATIONS
// ============================================

/**
 * Notify user when export completes
 */
export async function notifyExportComplete(
  supabase: SupabaseClient,
  userId: string,
  exportId: string,
  fileName: string,
  rowCount: number,
  format: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'export_complete',
      {
        export_id: exportId,
        file_name: fileName,
        row_count: rowCount,
        format: format,
      },
      `/api/export/download/${exportId}`
    );
  } catch (error) {
    console.error('Error sending export_complete notification:', error);
  }
}

/**
 * Notify user when export fails
 */
export async function notifyExportFailed(
  supabase: SupabaseClient,
  userId: string,
  exportId: string,
  fileName: string,
  errorMessage: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'export_failed',
      {
        export_id: exportId,
        file_name: fileName,
        error: errorMessage,
      },
      `/dashboard/einstellungen?tab=exporte`
    );
  } catch (error) {
    console.error('Error sending export_failed notification:', error);
  }
}

// ============================================
// CREDIT NOTIFICATIONS
// ============================================

/**
 * Notify user when credits are running low (< 10%)
 */
export async function notifyLowCredits(
  supabase: SupabaseClient,
  userId: string,
  remaining: number,
  percentage: number
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'low_credits',
      {
        remaining: remaining,
        percentage: percentage,
      },
      `/dashboard/einstellungen?tab=credits`
    );
  } catch (error) {
    console.error('Error sending low_credits notification:', error);
  }
}

/**
 * Notify user when credits are depleted
 */
export async function notifyCreditsDepleted(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'credits_depleted',
      {},
      `/dashboard/einstellungen?tab=credits`
    );
  } catch (error) {
    console.error('Error sending credits_depleted notification:', error);
  }
}

/**
 * Notify user when credits are successfully purchased
 */
export async function notifyCreditPurchaseSuccess(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  totalCredits: number
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'credit_purchase_success',
      {
        amount: amount,
        total_credits: totalCredits,
      },
      `/dashboard/einstellungen?tab=credits`
    );
  } catch (error) {
    console.error('Error sending credit_purchase_success notification:', error);
  }
}

/**
 * Check credits and send low/depleted notifications if needed
 */
export async function checkAndNotifyCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Get user's credit info
    const { data: creditData, error } = await supabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', userId)
      .single();

    if (error || !creditData) {
      console.error('Error fetching credits for notification check:', error);
      return;
    }

    const total = creditData.total_credits || 0;
    const used = creditData.used_credits || 0;
    const remaining = total - used;

    if (total === 0) {
      // Credits depleted
      await notifyCreditsDepleted(supabase, userId);
      return;
    }

    const percentage = (remaining / total) * 100;

    if (percentage <= 0) {
      // Credits depleted
      await notifyCreditsDepleted(supabase, userId);
    } else if (percentage <= 10) {
      // Low credits (< 10%)
      await notifyLowCredits(supabase, userId, remaining, percentage);
    }
  } catch (error) {
    console.error('Error in checkAndNotifyCredits:', error);
  }
}

// ============================================
// DEAL NOTIFICATIONS
// ============================================

/**
 * Notify user when a deal is assigned to them
 */
export async function notifyDealAssigned(
  supabase: SupabaseClient,
  userId: string,
  dealId: string,
  dealName: string,
  assignedBy?: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'deal_assigned',
      {
        deal_id: dealId,
        deal_name: dealName,
        assigned_by: assignedBy || 'System',
      },
      `/dashboard/deals/${dealId}`
    );
  } catch (error) {
    console.error('Error sending deal_assigned notification:', error);
  }
}

/**
 * Notify user when a deal deadline is approaching (< 24h)
 */
export async function notifyDealDeadlineApproaching(
  supabase: SupabaseClient,
  userId: string,
  dealId: string,
  dealName: string,
  hoursRemaining: number
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'deal_deadline_approaching',
      {
        deal_id: dealId,
        deal_name: dealName,
        hours_remaining: hoursRemaining,
      },
      `/dashboard/deals/${dealId}`
    );
  } catch (error) {
    console.error('Error sending deal_deadline_approaching notification:', error);
  }
}

// ============================================
// SUBSCRIPTION NOTIFICATIONS
// ============================================

/**
 * Notify user when subscription is expiring soon
 */
export async function notifySubscriptionExpiring(
  supabase: SupabaseClient,
  userId: string,
  expiryDate: string,
  daysRemaining: number
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'subscription_expiring',
      {
        expiry_date: expiryDate,
        days_remaining: daysRemaining,
      },
      `/dashboard/einstellungen?tab=abonnement`
    );
  } catch (error) {
    console.error('Error sending subscription_expiring notification:', error);
  }
}

/**
 * Notify user when subscription has expired
 */
export async function notifySubscriptionExpired(
  supabase: SupabaseClient,
  userId: string,
  expiryDate: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'subscription_expired',
      {
        expiry_date: expiryDate,
      },
      `/dashboard/einstellungen?tab=abonnement`
    );
  } catch (error) {
    console.error('Error sending subscription_expired notification:', error);
  }
}

// ============================================
// SYSTEM NOTIFICATIONS
// ============================================

/**
 * Send system maintenance notification
 */
export async function notifySystemMaintenance(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  duration: string,
  description?: string
): Promise<void> {
  try {
    await createNotification(
      supabase,
      userId,
      'system_maintenance',
      {
        date: date,
        duration: duration,
        description: description || 'Geplante Wartungsarbeiten',
      },
      null
    );
  } catch (error) {
    console.error('Error sending system_maintenance notification:', error);
  }
}

/**
 * Send system announcement
 */
export async function notifySystemAnnouncement(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  try {
    await createCustomNotification(
      supabase,
      userId,
      'system_announcement',
      title,
      message,
      {},
      actionUrl || null
    );
  } catch (error) {
    console.error('Error sending system_announcement notification:', error);
  }
}

// ============================================
// BULK NOTIFICATIONS
// ============================================

/**
 * Send notification to all users (for system announcements/maintenance)
 */
export async function notifyAllUsers(
  supabase: SupabaseClient,
  type: NotificationTypeValue,
  data: Record<string, unknown>,
  actionUrl?: string | null
): Promise<{ sent: number; failed: number }> {
  try {
    // Get all active users
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id');

    if (error || !users) {
      console.error('Error fetching users for bulk notification:', error);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send notification to each user
    for (const user of users) {
      try {
        const result = await createNotification(
          supabase,
          user.id,
          type,
          data,
          actionUrl
        );
        if (result.notification) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error('Error in notifyAllUsers:', error);
    return { sent: 0, failed: 0 };
  }
}
