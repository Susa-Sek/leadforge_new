/**
 * Notifications System Barrel Export
 * src/lib/notifications/index.ts
 *
 * Central export for notification system components.
 *
 * Usage:
 *   import { createNotification, getUnreadCount } from '@/lib/notifications'
 *   import { NotificationType, NOTIFICATION_LIMITS } from '@/lib/notifications/validation'
 */

// ============================================
// SERVICE EXPORTS
// ============================================

export {
  // Core CRUD operations
  createNotification,
  createCustomNotification,
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,

  // Plan gating
  canCreateNotification,
  getMonthlyCount,
  getUserPlanTier,
  getPlanInfo,

  // Preferences
  getPreferences,
  updatePreference,
  updatePreferences,
  initializePreferences,

  // Bulk operations
  createBulkNotifications,

  // Realtime helpers
  getUserNotificationChannel,
  parseRealtimePayload,
} from './service'

// ============================================
// VALIDATION EXPORTS
// ============================================

export {
  // Enums and constants
  NotificationType,
  NOTIFICATION_TYPES,
  NOTIFICATION_LIMITS,

  // Zod schemas
  notificationTypeSchema,
  notificationDataSchema,
  createNotificationSchema,
  createNotificationServiceSchema,
  listNotificationsQuerySchema,
  notificationIdSchema,
  notificationPreferenceSchema,
  updatePreferencesSchema,
  updateSinglePreferenceSchema,

  // Helper functions
  getDefaultPreferences,
  generateNotificationContent,
  isCriticalNotification,
  isCreditNotification,
  isSubscriptionNotification,
  getRecommendedChannels,
} from './validation'

// ============================================
// TYPE EXPORTS
// ============================================

export type {
  NotificationTypeValue,
  CreateNotificationInput,
  CreateNotificationServiceInput,
  ListNotificationsQuery,
  NotificationIdParam,
  NotificationPreference,
  UpdatePreferencesInput,
  UpdateSinglePreferenceInput,
  PlanTier,
} from './validation'

export type {
  Notification,
  PaginatedNotifications,
  NotificationPlanInfo,
} from './service'

// ============================================
// INTEGRATION EXPORTS
// ============================================

export {
  // Search notifications
  notifySearchComplete,
  notifySearchFailed,

  // Export notifications
  notifyExportComplete,
  notifyExportFailed,

  // Credit notifications
  notifyLowCredits,
  notifyCreditsDepleted,
  notifyCreditPurchaseSuccess,
  checkAndNotifyCredits,

  // Deal notifications
  notifyDealAssigned,
  notifyDealDeadlineApproaching,

  // Subscription notifications
  notifySubscriptionExpiring,
  notifySubscriptionExpired,

  // System notifications
  notifySystemMaintenance,
  notifySystemAnnouncement,
  notifyAllUsers,
} from './integrations'
