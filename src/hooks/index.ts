// Hooks Barrel Export

export { useSearch } from './use-search'
export { useUser } from './use-user'
export { useToast } from './use-toast'
export { useCrm } from './use-crm'
export {
  usePlan,
  useInvoices,
  usePaymentMethods,
  type PlanType,
  type SubscriptionStatus,
  type SubscriptionData,
  type Invoice,
  type PaymentMethod,
} from './use-plan'

// Export system hooks
export {
  useExport,
  useExportStatus,
  useExportHistory,
  useExportTemplates,
  useScheduledExports,
  useExportDownload,
} from './use-export'

export type {
  ExportType,
  ExportFormat,
  ExportStatus,
  ExportHistoryItem,
  TemplateResponse,
  ScheduledExportResponse,
} from '@/lib/export/types'

// Export notification hooks
export {
  useNotifications,
  useUnreadCount,
  useNotificationRealtime,
  useMarkRead,
  useNotificationDelete,
  useNotificationPreferences,
} from './use-notifications'

// Export admin hooks
export {
  useAdminUsers,
  useAdminUser,
  useAdminStats,
  useAdminCredits,
  useAdminAnnouncements,
  useAdminAnnouncement,
  useAdminReports,
  useReportStats,
  useAuditLogs,
  useAdminList,
  useSuspendUser,
  useUnsuspendUser,
  useChangeUserPlan,
  useDeleteUser,
  useAdjustCredits,
  useSearchUsersForCreditAdjustment,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  useToggleAnnouncementActive,
  useResolveReport,
  useDismissReport,
  useExportAuditLogs,
  useUserRegistrationChart,
  useSearchesChart,
  useRevenueChart,
} from './use-admin'

// Re-export notification types from the types file
export type {
  NotificationType,
  DeliveryMethod,
  Notification,
  NotificationPreference,
  NotificationPreferences,
  NotificationFilter,
  PlanTier,
} from '@/lib/notifications/types'

// Export admin types
export type {
  AdminUser,
  AdminUserDetail,
  AdminStats,
  CreditAdjustment,
  Announcement,
  CreateAnnouncementRequest,
  Report,
  ReportStatus,
  ReportStats,
  AuditLog,
  UserFilters,
  AuditLogFilters,
  ReportFilters,
  AnnouncementType,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_COLORS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  AUDIT_ACTION_LABELS,
} from '@/lib/admin/types'

export {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATION_LIMITS,
  DELIVERY_METHOD_LABELS,
  PRIORITY_COLORS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
} from '@/lib/notifications/types'
