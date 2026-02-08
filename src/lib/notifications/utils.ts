// Notification Utility Functions

import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_COLORS,
} from './types'
import {
  Search,
  Download,
  AlertCircle,
  Coins,
  CreditCard,
  GitBranch,
  UserPlus,
  Clock,
  Wrench,
  Megaphone,
  CalendarClock,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react'

// Icon mapping from string to Lucide component
const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Search,
  Download,
  AlertCircle,
  Coins,
  CreditCard,
  GitBranch,
  UserPlus,
  Clock,
  Wrench,
  Megaphone,
  CalendarClock,
  AlertTriangle,
}

/**
 * Get Lucide icon component for notification type
 */
export function getNotificationIcon(type: NotificationType): LucideIcon {
  const iconName = NOTIFICATION_TYPE_ICONS[type]
  return ICON_COMPONENTS[iconName] || AlertCircle
}

/**
 * Get color class for notification type
 */
export function getNotificationColor(type: NotificationType): string {
  return NOTIFICATION_TYPE_COLORS[type] || 'gray'
}

/**
 * Get Tailwind color classes for notification type
 */
export function getNotificationColorClasses(type: NotificationType): {
  bg: string
  text: string
  border: string
  icon: string
} {
  const color = getNotificationColor(type)

  const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-500 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-500 dark:text-orange-400',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: 'text-indigo-500 dark:text-indigo-400',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-950/20',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-800',
      icon: 'text-gray-500 dark:text-gray-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-500 dark:text-emerald-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: 'text-rose-500 dark:text-rose-400',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500 dark:text-yellow-400',
    },
  }

  return colorMap[color] || colorMap.gray
}

/**
 * Format relative time in German
 * Examples: "vor 5 Min", "vor 2 Std", "heute", "gestern", "12.02.2026"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  // Less than 1 minute
  if (diffSec < 60) {
    return 'gerade eben'
  }

  // Less than 1 hour
  if (diffMin < 60) {
    return `vor ${diffMin} Min`
  }

  // Less than 24 hours
  if (diffHour < 24) {
    return `vor ${diffHour} Std`
  }

  // Same day (but more than 24 hours ago - shouldn't happen normally)
  if (diffDay === 0) {
    return 'heute'
  }

  // Yesterday
  if (diffDay === 1) {
    return 'gestern'
  }

  // Within last 7 days
  if (diffDay < 7) {
    return `vor ${diffDay} Tagen`
  }

  // Older - return formatted date
  return formatGermanDate(date)
}

/**
 * Format date in German format: "12.02.2026"
 */
export function formatGermanDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Format full date and time in German
 */
export function formatGermanDateTime(dateString: string): string {
  const date = new Date(dateString)
  const dateStr = formatGermanDate(date)
  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} um ${timeStr} Uhr`
}

/**
 * Get notification title with type label
 */
export function getNotificationDisplayTitle(notification: Notification): string {
  if (notification.title) {
    return notification.title
  }
  return NOTIFICATION_TYPE_LABELS[notification.type] || 'Benachrichtigung'
}

/**
 * Check if notification is actionable (has action_url)
 */
export function isActionable(notification: Notification): boolean {
  return !!notification.action_url
}

/**
 * Group notifications by date for the list view
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): { label: string; notifications: Notification[] }[] {
  const groups: Record<string, Notification[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    date.setHours(0, 0, 0, 0)

    let label: string
    if (date.getTime() === today.getTime()) {
      label = 'Heute'
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Gestern'
    } else {
      label = formatGermanDate(date)
    }

    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(notification)
  })

  return Object.entries(groups).map(([label, items]) => ({
    label,
    notifications: items,
  }))
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
