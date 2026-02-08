/**
 * Notification Validation Schemas
 * src/lib/notifications/validation.ts
 *
 * Zod validation schemas for notification system.
 * Used by API routes and service functions.
 */

import { z } from 'zod';

// ============================================
// NOTIFICATION TYPE ENUM (14 types)
// ============================================
export const NotificationType = {
  SEARCH_COMPLETE: 'search_complete',
  SEARCH_FAILED: 'search_failed',
  EXPORT_COMPLETE: 'export_complete',
  EXPORT_FAILED: 'export_failed',
  LOW_CREDITS: 'low_credits',
  CREDITS_DEPLETED: 'credits_depleted',
  CREDIT_PURCHASE_SUCCESS: 'credit_purchase_success',
  DEAL_STATUS_CHANGE: 'deal_status_change',
  DEAL_ASSIGNED: 'deal_assigned',
  DEAL_DEADLINE_APPROACHING: 'deal_deadline_approaching',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NOTIFICATION_TYPES = Object.values(NotificationType);

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Notification type enum validation
 */
export const notificationTypeSchema = z.enum([
  'search_complete',
  'search_failed',
  'export_complete',
  'export_failed',
  'low_credits',
  'credits_depleted',
  'credit_purchase_success',
  'deal_status_change',
  'deal_assigned',
  'deal_deadline_approaching',
  'system_maintenance',
  'system_announcement',
  'subscription_expiring',
  'subscription_expired',
]);

/**
 * Base notification data schema
 */
export const notificationDataSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Create notification request schema
 */
export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: notificationDataSchema.optional(),
  action_url: z.string().url().max(500).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * Create notification schema for service (internal use)
 * User ID is passed separately
 */
export const createNotificationServiceSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: notificationDataSchema.optional(),
  action_url: z.string().url().max(500).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type CreateNotificationServiceInput = z.infer<
  typeof createNotificationServiceSchema
>;

/**
 * List notifications query schema
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  filter: z.enum(['all', 'read', 'unread']).default('all'),
  sort_by: z.enum(['date', 'type']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

/**
 * Notification ID param schema
 */
export const notificationIdSchema = z.object({
  id: z.string().uuid(),
});

export type NotificationIdParam = z.infer<typeof notificationIdSchema>;

/**
 * Notification preference schema
 */
export const notificationPreferenceSchema = z.object({
  type: notificationTypeSchema,
  in_app: z.boolean().default(true),
  email: z.boolean().default(false),
  push: z.boolean().default(false),
  quiet_hours_start: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
});

export type NotificationPreference = z.infer<
  typeof notificationPreferenceSchema
>;

/**
 * Update preferences request schema
 */
export const updatePreferencesSchema = z.object({
  preferences: z.array(notificationPreferenceSchema).min(1),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

/**
 * Update single preference schema
 */
export const updateSinglePreferenceSchema = z.object({
  type: notificationTypeSchema,
  in_app: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
});

export type UpdateSinglePreferenceInput = z.infer<
  typeof updateSinglePreferenceSchema
>;

// ============================================
// NOTIFICATION LIMITS BY PLAN
// ============================================

export const NOTIFICATION_LIMITS = {
  free: {
    maxNotifications: 100,
    retentionDays: 30,
    canDisableTypes: false,
    channels: ['in_app'],
  },
  pro: {
    maxNotifications: 1000,
    retentionDays: 90,
    canDisableTypes: true,
    channels: ['in_app', 'email'],
  },
  enterprise: {
    maxNotifications: 10000,
    retentionDays: 365,
    canDisableTypes: true,
    channels: ['in_app', 'email', 'push'],
  },
} as const;

export type PlanTier = keyof typeof NOTIFICATION_LIMITS;

// ============================================
// NOTIFICATION MESSAGES (German)
// ============================================

export const NOTIFICATION_MESSAGES: Record<
  NotificationTypeValue,
  { title: string; message: (data: Record<string, unknown>) => string }
> = {
  search_complete: {
    title: 'Suche abgeschlossen',
    message: (data) =>
      `Ihre Suche nach "${data.query || 'Leads'}" ist abgeschlossen. ${data.result_count || 0} Ergebnisse gefunden.`,
  },
  search_failed: {
    title: 'Suche fehlgeschlagen',
    message: (data) =>
      `Die Suche nach "${data.query || 'Leads'}" konnte nicht abgeschlossen werden. ${data.error || 'Bitte versuchen Sie es erneut.'}`,
  },
  export_complete: {
    title: 'Export abgeschlossen',
    message: (data) =>
      `Ihr Export mit ${data.row_count || 0} Zeilen ist fertig und kann heruntergeladen werden.`,
  },
  export_failed: {
    title: 'Export fehlgeschlagen',
    message: (data) =>
      `Der Export konnte nicht erstellt werden. ${data.error || 'Bitte versuchen Sie es erneut.'}`,
  },
  low_credits: {
    title: 'Guthaben niedrig',
    message: (data) =>
      `Ihr Guthaben ist fast aufgebraucht. Noch ${data.remaining || 0} Credits übrig. Jetzt aufladen?`,
  },
  credits_depleted: {
    title: 'Kein Guthaben mehr',
    message: () =>
      'Ihr Guthaben ist aufgebraucht. Bitte laden Sie Credits auf, um weiterhin Suchanfragen zu stellen.',
  },
  credit_purchase_success: {
    title: 'Credits erfolgreich gekauft',
    message: (data) =>
      `Sie haben erfolgreich ${data.amount || 0} Credits erworben. Viel Erfolg bei der Lead-Suche!`,
  },
  deal_status_change: {
    title: 'Deal-Status geändert',
    message: (data) =>
      `"${data.deal_name || 'Deal'}" wurde in "${data.new_status || 'neuen Status'}" verschoben.`,
  },
  deal_assigned: {
    title: 'Deal zugewiesen',
    message: (data) =>
      `Ihnen wurde der Deal "${data.deal_name || 'Deal'}" zugewiesen.`,
  },
  deal_deadline_approaching: {
    title: 'Deal-Deadline naht',
    message: (data) =>
      `"${data.deal_name || 'Deal'}" läuft in weniger als 24 Stunden ab.`,
  },
  system_maintenance: {
    title: 'Wartungsarbeiten',
    message: (data) =>
      `Geplante Wartungsarbeiten am ${data.date || 'bald'}. Das System ist für kurze Zeit nicht verfügbar.`,
  },
  system_announcement: {
    title: 'Ankündigung',
    message: (data) =>
      (data.message as string) || 'Wichtige Informationen zu Ihrem Manyleads-Konto.',
  },
  subscription_expiring: {
    title: 'Abonnement läuft ab',
    message: (data) =>
      `Ihr Abonnement läuft am ${data.expiry_date || 'bald'} ab. Verlängern Sie jetzt, um keine Funktionen zu verlieren.`,
  },
  subscription_expired: {
    title: 'Abonnement abgelaufen',
    message: () =>
      'Ihr Abonnement ist abgelaufen. Erneuern Sie es, um alle Funktionen weiterhin nutzen zu können.',
  },
};

// ============================================
// DEFAULT PREFERENCES
// ============================================

export function getDefaultPreferences(): NotificationPreference[] {
  return NOTIFICATION_TYPES.map((type) => ({
    type,
    in_app: true,
    email: [
      'low_credits',
      'credits_depleted',
      'subscription_expiring',
      'subscription_expired',
    ].includes(type),
    push: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
  }));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate notification title and message from type and data
 */
export function generateNotificationContent(
  type: NotificationTypeValue,
  data: Record<string, unknown> = {}
): { title: string; message: string } {
  const template = NOTIFICATION_MESSAGES[type];
  return {
    title: template.title,
    message: template.message(data),
  };
}

/**
 * Check if notification type is critical (always sent)
 */
export function isCriticalNotification(type: NotificationTypeValue): boolean {
  return ['system_maintenance', 'system_announcement', 'subscription_expired'].includes(type);
}

/**
 * Check if notification type is credit-related
 */
export function isCreditNotification(type: NotificationTypeValue): boolean {
  return ['low_credits', 'credits_depleted', 'credit_purchase_success'].includes(type);
}

/**
 * Check if notification type is subscription-related
 */
export function isSubscriptionNotification(type: NotificationTypeValue): boolean {
  return ['subscription_expiring', 'subscription_expired'].includes(type);
}

/**
 * Get recommended channels for notification type
 */
export function getRecommendedChannels(
  type: NotificationTypeValue
): { in_app: boolean; email: boolean; push: boolean } {
  switch (type) {
    case 'low_credits':
    case 'credits_depleted':
    case 'subscription_expiring':
    case 'subscription_expired':
      return { in_app: true, email: true, push: false };
    case 'deal_deadline_approaching':
      return { in_app: true, email: true, push: true };
    case 'search_complete':
    case 'export_complete':
      return { in_app: true, email: false, push: false };
    case 'system_maintenance':
    case 'system_announcement':
      return { in_app: true, email: true, push: false };
    default:
      return { in_app: true, email: false, push: false };
  }
}
