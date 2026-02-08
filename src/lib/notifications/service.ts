/**
 * Notification Service
 * src/lib/notifications/service.ts
 *
 * Core service functions for the notification system.
 * Handles creation, retrieval, updates, and plan-gating.
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type NotificationTypeValue,
  type CreateNotificationServiceInput,
  type ListNotificationsQuery,
  type NotificationPreference,
  type PlanTier,
  NOTIFICATION_LIMITS,
  generateNotificationContent,
} from './validation';

// ============================================
// TYPES
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
  updated_at?: string;
  expires_at: string | null;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface NotificationPlanInfo {
  plan_tier: PlanTier;
  max_notifications: number;
  monthly_count: number;
  remaining: number;
  has_reached_limit: boolean;
  retention_days: number;
}

// ============================================
// NOTIFICATION CREATION
// ============================================

/**
 * Create a new notification for a user
 * Respects plan limits and broadcasts via realtime
 */
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationTypeValue,
  data: Record<string, unknown> = {},
  actionUrl?: string | null
): Promise<{ notification: Notification | null; error: string | null }> {
  try {
    // Check plan limits before creating
    const canCreate = await canCreateNotification(supabase, userId);
    if (!canCreate) {
      return {
        notification: null,
        error: 'Monatliches Benachrichtigungslimit erreicht',
      };
    }

    // Generate title and message from template
    const { title, message } = generateNotificationContent(type, data);

    // Call the database function to create notification
    const { data: notificationId, error: createError } = await supabase.rpc(
      'create_notification',
      {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data,
        p_action_url: actionUrl || null,
        p_expires_at: null,
      }
    );

    if (createError) {
      console.error('Error creating notification:', createError);
      return {
        notification: null,
        error: 'Fehler beim Erstellen der Benachrichtigung',
      };
    }

    if (!notificationId) {
      // Notification was dropped due to plan limits
      return {
        notification: null,
        error: 'Benachrichtigung aufgrund von Plan-Limits nicht erstellt',
      };
    }

    // Fetch the created notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return {
        notification: null,
        error: 'Benachrichtigung erstellt, aber konnte nicht geladen werden',
      };
    }

    return { notification: notification as Notification, error: null };
  } catch (error) {
    console.error('Unexpected error in createNotification:', error);
    return {
      notification: null,
      error: 'Unerwarteter Fehler beim Erstellen der Benachrichtigung',
    };
  }
}

/**
 * Create a notification with custom title and message
 * For system notifications that need custom content
 */
export async function createCustomNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationTypeValue,
  title: string,
  message: string,
  data: Record<string, unknown> = {},
  actionUrl?: string | null
): Promise<{ notification: Notification | null; error: string | null }> {
  try {
    // Check plan limits
    const canCreate = await canCreateNotification(supabase, userId);
    if (!canCreate) {
      return {
        notification: null,
        error: 'Monatliches Benachrichtigungslimit erreicht',
      };
    }

    // Call the database function
    const { data: notificationId, error: createError } = await supabase.rpc(
      'create_notification',
      {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data,
        p_action_url: actionUrl || null,
        p_expires_at: null,
      }
    );

    if (createError) {
      console.error('Error creating custom notification:', createError);
      return {
        notification: null,
        error: 'Fehler beim Erstellen der Benachrichtigung',
      };
    }

    if (!notificationId) {
      return {
        notification: null,
        error: 'Benachrichtigung aufgrund von Plan-Limits nicht erstellt',
      };
    }

    // Fetch the created notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return {
        notification: null,
        error: 'Benachrichtigung erstellt, aber konnte nicht geladen werden',
      };
    }

    return { notification: notification as Notification, error: null };
  } catch (error) {
    console.error('Unexpected error in createCustomNotification:', error);
    return {
      notification: null,
      error: 'Unerwarteter Fehler beim Erstellen der Benachrichtigung',
    };
  }
}

// ============================================
// NOTIFICATION RETRIEVAL
// ============================================

/**
 * Get paginated list of notifications for a user
 */
export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  options: ListNotificationsQuery
): Promise<{ data: PaginatedNotifications | null; error: string | null }> {
  try {
    const { page, limit, filter, sort_by, sort_order } = options;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('expires_at', null)
      .or('expires_at.gt.now()');

    // Apply filter
    if (filter === 'read') {
      query = query.eq('read', true);
    } else if (filter === 'unread') {
      query = query.eq('read', false);
    }

    // Apply sorting
    const sortColumn = sort_by === 'type' ? 'type' : 'created_at';
    query = query.order(sortColumn, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error: 'Fehler beim Laden der Benachrichtigungen' };
    }

    const total = count || 0;

    return {
      data: {
        notifications: (data || []) as Notification[],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error in getNotifications:', error);
    return { data: null, error: 'Unerwarteter Fehler beim Laden' };
  }
}

/**
 * Get unread notification count for badge display
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number; error: string | null }> {
  try {
    const { data: count, error } = await supabase.rpc('get_unread_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting unread count:', error);
      return { count: 0, error: 'Fehler beim Laden der Anzahl' };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error in getUnreadCount:', error);
    return { count: 0, error: 'Unerwarteter Fehler' };
  }
}

/**
 * Get a single notification by ID
 */
export async function getNotification(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<{ notification: Notification | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { notification: null, error: 'Benachrichtigung nicht gefunden' };
      }
      console.error('Error fetching notification:', error);
      return { notification: null, error: 'Fehler beim Laden' };
    }

    return { notification: data as Notification, error: null };
  } catch (error) {
    console.error('Unexpected error in getNotification:', error);
    return { notification: null, error: 'Unerwarteter Fehler' };
  }
}

// ============================================
// NOTIFICATION UPDATES
// ============================================

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: updated, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Fehler beim Markieren als gelesen' };
    }

    return { success: updated || false, error: null };
  } catch (error) {
    console.error('Unexpected error in markAsRead:', error);
    return { success: false, error: 'Unerwarteter Fehler' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number; error: string | null }> {
  try {
    const { data: count, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error marking all as read:', error);
      return { count: 0, error: 'Fehler beim Markieren aller als gelesen' };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error in markAllAsRead:', error);
    return { count: 0, error: 'Unerwarteter Fehler' };
  }
}

// ============================================
// NOTIFICATION DELETION
// ============================================

/**
 * Delete a single notification
 */
export async function deleteNotification(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Fehler beim Löschen' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteNotification:', error);
    return { success: false, error: 'Unerwarteter Fehler' };
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)
      .select('id');

    if (error) {
      console.error('Error deleting read notifications:', error);
      return { count: 0, error: 'Fehler beim Löschen' };
    }

    return { count: (data || []).length, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteReadNotifications:', error);
    return { count: 0, error: 'Unerwarteter Fehler' };
  }
}

// ============================================
// PLAN GATING
// ============================================

/**
 * Check if user can create more notifications
 */
export async function canCreateNotification(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const planInfo = await getPlanInfo(supabase, userId);
    return !planInfo.has_reached_limit;
  } catch (error) {
    console.error('Error checking canCreateNotification:', error);
    return false;
  }
}

/**
 * Get monthly notification count for a user
 */
export async function getMonthlyCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data: count, error } = await supabase.rpc('get_monthly_notification_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting monthly count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error in getMonthlyCount:', error);
    return 0;
  }
}

/**
 * Get user's plan tier
 */
export async function getUserPlanTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan_tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return 'free';
    }

    const tier = data.plan_tier;
    if (tier === 'pro' || tier === 'enterprise') {
      return tier;
    }

    return 'free';
  } catch (error) {
    console.error('Error getting user plan tier:', error);
    return 'free';
  }
}

/**
 * Get comprehensive plan info for notifications
 */
export async function getPlanInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPlanInfo> {
  try {
    const planTier = await getUserPlanTier(supabase, userId);
    const monthlyCount = await getMonthlyCount(supabase, userId);
    const limits = NOTIFICATION_LIMITS[planTier];

    return {
      plan_tier: planTier,
      max_notifications: limits.maxNotifications,
      monthly_count: monthlyCount,
      remaining: Math.max(0, limits.maxNotifications - monthlyCount),
      has_reached_limit: monthlyCount >= limits.maxNotifications,
      retention_days: limits.retentionDays,
    };
  } catch (error) {
    console.error('Error getting plan info:', error);
    return {
      plan_tier: 'free',
      max_notifications: NOTIFICATION_LIMITS.free.maxNotifications,
      monthly_count: 0,
      remaining: NOTIFICATION_LIMITS.free.maxNotifications,
      has_reached_limit: false,
      retention_days: NOTIFICATION_LIMITS.free.retentionDays,
    };
  }
}

// ============================================
// PREFERENCES
// ============================================

/**
 * Get user's notification preferences
 */
export async function getPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<{ preferences: NotificationPreference[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching preferences:', error);
      return { preferences: [], error: 'Fehler beim Laden der Einstellungen' };
    }

    return { preferences: (data || []) as NotificationPreference[], error: null };
  } catch (error) {
    console.error('Unexpected error in getPreferences:', error);
    return { preferences: [], error: 'Unerwarteter Fehler' };
  }
}

/**
 * Update a single preference
 */
export async function updatePreference(
  supabase: SupabaseClient,
  userId: string,
  preference: NotificationPreference
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get user's plan to check permissions
    const planTier = await getUserPlanTier(supabase, userId);
    const limits = NOTIFICATION_LIMITS[planTier];

    // Free users cannot disable notification types
    if (!limits.canDisableTypes && !preference.in_app) {
      return {
        success: false,
        error: 'Kostenlose Benutzer können keine Benachrichtigungen deaktivieren',
      };
    }

    // Free users cannot use email/push
    if (planTier === 'free' && (preference.email || preference.push)) {
      return {
        success: false,
        error: 'E-Mail- und Push-Benachrichtigungen sind Pro-Funktionen',
      };
    }

    // Pro users cannot use push
    if (planTier === 'pro' && preference.push) {
      return {
        success: false,
        error: 'Push-Benachrichtigungen sind eine Enterprise-Funktion',
      };
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        type: preference.type,
        in_app: preference.in_app,
        email: preference.email,
        push: preference.push,
        quiet_hours_start: preference.quiet_hours_start,
        quiet_hours_end: preference.quiet_hours_end,
      });

    if (error) {
      console.error('Error updating preference:', error);
      return { success: false, error: 'Fehler beim Speichern' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in updatePreference:', error);
    return { success: false, error: 'Unerwarteter Fehler' };
  }
}

/**
 * Update multiple preferences at once
 */
export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: NotificationPreference[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Validate each preference against plan
    for (const pref of preferences) {
      const result = await updatePreference(supabase, userId, pref);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in updatePreferences:', error);
    return { success: false, error: 'Unerwarteter Fehler' };
  }
}

/**
 * Initialize default preferences for a new user
 */
export async function initializePreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.rpc('initialize_notification_preferences', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error initializing preferences:', error);
      return { success: false, error: 'Fehler beim Initialisieren' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in initializePreferences:', error);
    return { success: false, error: 'Unerwarteter Fehler' };
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Create notifications for multiple users (for system announcements)
 */
export async function createBulkNotifications(
  supabase: SupabaseClient,
  userIds: string[],
  type: NotificationTypeValue,
  data: Record<string, unknown> = {},
  actionUrl?: string | null
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  for (const userId of userIds) {
    const result = await createNotification(supabase, userId, type, data, actionUrl);
    if (result.error) {
      errors.push(`User ${userId}: ${result.error}`);
    } else if (result.notification) {
      created++;
    }
  }

  return { created, errors };
}

// ============================================
// REALTIME SUBSCRIPTION HELPERS
// ============================================

/**
 * Get the channel name for a user's notifications
 */
export function getUserNotificationChannel(userId: string): string {
  return `notifications:user_${userId}`;
}

/**
 * Parse realtime notification payload
 */
export function parseRealtimePayload(payload: unknown): {
  valid: boolean;
  notification?: Notification;
} {
  try {
    if (!payload || typeof payload !== 'object') {
      return { valid: false };
    }

    const p = payload as Record<string, unknown>;

    if (p.event !== 'new_notification' || !p.payload) {
      return { valid: false };
    }

    const notificationPayload = p.payload as Record<string, unknown>;

    // Basic validation
    if (!notificationPayload.id || !notificationPayload.type) {
      return { valid: false };
    }

    return {
      valid: true,
      notification: {
        id: notificationPayload.id as string,
        user_id: '', // Will be set by context
        type: notificationPayload.type as NotificationTypeValue,
        title: (notificationPayload.title as string) || '',
        message: (notificationPayload.message as string) || '',
        data: (notificationPayload.data as Record<string, unknown>) || {},
        read: false,
        read_at: null,
        action_url: (notificationPayload.action_url as string) || null,
        created_at: (notificationPayload.created_at as string) || new Date().toISOString(),
        expires_at: null,
      },
    };
  } catch {
    return { valid: false };
  }
}
