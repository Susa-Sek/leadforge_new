// Notification System Types
// Aligned with backend implementation in validation.ts

// Notification types from backend (14 types)
export type NotificationType =
  | 'search_complete'
  | 'search_failed'
  | 'export_complete'
  | 'export_failed'
  | 'low_credits'
  | 'credits_depleted'
  | 'credit_purchase_success'
  | 'deal_status_change'
  | 'deal_assigned'
  | 'deal_deadline_approaching'
  | 'system_maintenance'
  | 'system_announcement'
  | 'subscription_expiring'
  | 'subscription_expired'

export type DeliveryMethod = 'in_app' | 'email' | 'push'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type PlanTier = 'free' | 'pro' | 'enterprise'

// Database notification row (aligned with service.ts)
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown>
  read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
  expires_at: string | null
}

// Notification preference from backend (per-type row)
export interface NotificationPreference {
  id?: string
  user_id?: string
  type: NotificationType
  in_app: boolean
  email: boolean
  push: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  created_at?: string
  updated_at?: string
}

// Frontend aggregate preferences (computed from preference rows)
export interface NotificationPreferences {
  // Per-type preferences (array of rows)
  perType: NotificationPreference[]

  // Global delivery settings (derived from first preference row or defaults)
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean

  // Quiet hours
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

// API Response types
export interface NotificationsResponse {
  notifications: Notification[]
  totalCount: number
  hasMore: boolean
}

export interface UnreadCountResponse {
  count: number
}

// UI Helper types
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  search_complete: 'Suche abgeschlossen',
  search_failed: 'Suche fehlgeschlagen',
  export_complete: 'Export abgeschlossen',
  export_failed: 'Export fehlgeschlagen',
  low_credits: 'Guthaben niedrig',
  credits_depleted: 'Guthaben aufgebraucht',
  credit_purchase_success: 'Credits gekauft',
  deal_status_change: 'Deal-Status geändert',
  deal_assigned: 'Deal zugewiesen',
  deal_deadline_approaching: 'Deal-Deadline naht',
  system_maintenance: 'Wartungsarbeiten',
  system_announcement: 'Ankündigung',
  subscription_expiring: 'Abonnement läuft ab',
  subscription_expired: 'Abonnement abgelaufen',
}

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  search_complete: 'Wenn eine Unternehmenssuche abgeschlossen ist',
  search_failed: 'Wenn eine Suche fehlgeschlagen ist',
  export_complete: 'Wenn ein Datenexport fertiggestellt wurde',
  export_failed: 'Wenn ein Export fehlgeschlagen ist',
  low_credits: 'Wenn dein Guthaben fast aufgebraucht ist',
  credits_depleted: 'Wenn dein Guthaben aufgebraucht ist',
  credit_purchase_success: 'Bestätigung erfolgreicher Guthabenkäufe',
  deal_status_change: 'Wenn sich der Status eines Deals ändert',
  deal_assigned: 'Wenn dir ein Deal zugewiesen wird',
  deal_deadline_approaching: 'Wenn ein Deal in weniger als 24 Stunden abläuft',
  system_maintenance: 'Hinweise zu geplanten Wartungsarbeiten',
  system_announcement: 'Wichtige Ankündigungen zum System',
  subscription_expiring: 'Erinnerung wenn dein Abonnement bald abläuft',
  subscription_expired: 'Hinweis wenn das Abonnement abgelaufen ist',
}

// Icon mapping for notification types (Lucide icon names)
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  search_complete: 'Search',
  search_failed: 'SearchX',
  export_complete: 'Download',
  export_failed: 'AlertCircle',
  low_credits: 'Coins',
  credits_depleted: 'Coins',
  credit_purchase_success: 'CreditCard',
  deal_status_change: 'GitBranch',
  deal_assigned: 'UserPlus',
  deal_deadline_approaching: 'Clock',
  system_maintenance: 'Wrench',
  system_announcement: 'Megaphone',
  subscription_expiring: 'CalendarClock',
  subscription_expired: 'AlertTriangle',
}

// Color mapping for notification types (Tailwind color names)
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  search_complete: 'blue',
  search_failed: 'orange',
  export_complete: 'green',
  export_failed: 'red',
  low_credits: 'amber',
  credits_depleted: 'red',
  credit_purchase_success: 'emerald',
  deal_status_change: 'indigo',
  deal_assigned: 'purple',
  deal_deadline_approaching: 'orange',
  system_maintenance: 'gray',
  system_announcement: 'blue',
  subscription_expiring: 'yellow',
  subscription_expired: 'red',
}

// Priority colors
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-slate-400',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

// Delivery method labels
export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  in_app: 'In-App',
  email: 'E-Mail',
  push: 'Push',
}

// Plan limits (aligned with backend)
export const NOTIFICATION_LIMITS = {
  free: {
    maxNotifications: 100,
    retentionDays: 30,
    canDisableTypes: false,
    channels: ['in_app'] as DeliveryMethod[],
    inApp: 100,
    email: 0,
    push: 0,
  },
  pro: {
    maxNotifications: 1000,
    retentionDays: 90,
    canDisableTypes: true,
    channels: ['in_app', 'email'] as DeliveryMethod[],
    inApp: 1000,
    email: 1000,
    push: 0,
  },
  enterprise: {
    maxNotifications: 10000,
    retentionDays: 365,
    canDisableTypes: true,
    channels: ['in_app', 'email', 'push'] as DeliveryMethod[],
    inApp: Infinity,
    email: Infinity,
    push: Infinity,
  },
}

// Filter options for UI
export type NotificationFilter = 'all' | 'unread' | 'read'

// Category groupings for settings page
export const NOTIFICATION_CATEGORIES = {
  search_export: ['search_complete', 'search_failed', 'export_complete', 'export_failed'] as NotificationType[],
  credits: ['low_credits', 'credits_depleted', 'credit_purchase_success'] as NotificationType[],
  crm: ['deal_status_change', 'deal_assigned', 'deal_deadline_approaching'] as NotificationType[],
  system: ['system_maintenance', 'system_announcement'] as NotificationType[],
  subscription: ['subscription_expiring', 'subscription_expired'] as NotificationType[],
}

export const NOTIFICATION_CATEGORY_LABELS: Record<keyof typeof NOTIFICATION_CATEGORIES, string> = {
  search_export: 'Suche & Export',
  credits: 'Guthaben',
  crm: 'CRM & Deals',
  system: 'System',
  subscription: 'Abonnement',
}

export interface NotificationFilterOptions {
  filter?: NotificationFilter
  type?: NotificationType
  dateFrom?: string
  dateTo?: string
}
