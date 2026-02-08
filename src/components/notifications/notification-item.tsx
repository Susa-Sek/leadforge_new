'use client'

import { useState, useCallback } from 'react'
import { Notification } from '@/lib/notifications/types'
import {
  getNotificationIcon,
  getNotificationColorClasses,
  formatRelativeTime,
  getNotificationDisplayTitle,
  truncateText,
} from '@/lib/notifications/utils'
import { useMarkRead } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  onMarkRead?: () => void
  compact?: boolean
  showActions?: boolean
}

export function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  compact = false,
  showActions = false,
}: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read)
  const { markRead, isLoading: isMarkingRead } = useMarkRead(() => {
    setIsRead(true)
    onMarkRead?.()
  })

  const Icon = getNotificationIcon(notification.type)
  const colorClasses = getNotificationColorClasses(notification.type)
  const displayTitle = getNotificationDisplayTitle(notification)
  const relativeTime = formatRelativeTime(notification.created_at)

  // Handle click
  const handleClick = useCallback(async () => {
    // Mark as read if unread
    if (!isRead && !isMarkingRead) {
      try {
        await markRead(notification.id)
      } catch (error) {
        // Error handled in hook
      }
    }

    // Call onClick handler
    onClick?.()
  }, [isRead, isMarkingRead, markRead, notification.id, onClick])

  // Handle mark as read without navigating
  const handleMarkReadOnly = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isRead || isMarkingRead) return

      try {
        await markRead(notification.id)
      } catch (error) {
        // Error handled in hook
      }
    },
    [isRead, isMarkingRead, markRead, notification.id]
  )

  if (compact) {
    // Compact version for dropdown
    return (
      <button
        onClick={handleClick}
        className={cn(
          'w-full text-left px-4 py-3 transition-colors hover:bg-accent',
          !isRead && 'bg-accent/50'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 rounded-full p-2',
              colorClasses.bg
            )}
          >
            <Icon className={cn('h-4 w-4', colorClasses.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm leading-tight',
                !isRead && 'font-medium'
              )}
            >
              {displayTitle}
            </p>
            {notification.message && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {truncateText(notification.message, 80)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
          </div>

          {/* Unread indicator */}
          {!isRead && (
            <div className="flex-shrink-0 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
            </div>
          )}
        </div>
      </button>
    )
  }

  // Full version for notification history page
  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all',
        'hover:shadow-sm hover:border-border/80',
        !isRead && 'bg-accent/30 border-accent',
        isRead && 'bg-card'
      )}
    >
      {/* Icon */}
      <div className="relative flex-shrink-0">
        <div className={cn('rounded-full p-3', colorClasses.bg)}>
          <Icon className={cn('h-5 w-5', colorClasses.icon)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4
              className={cn(
                'text-sm leading-tight',
                !isRead && 'font-semibold'
              )}
            >
              {displayTitle}
            </h4>
            {notification.message && (
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
            )}
          </div>

          {/* Time */}
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {relativeTime}
          </span>
        </div>

        {/* Action hint */}
        {notification.action_url && (
          <p className="text-xs text-primary mt-2">
            Klicken zum Anzeigen
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Unread indicator */}
        {!isRead && (
          <button
            onClick={handleMarkReadOnly}
            disabled={isMarkingRead}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent transition-colors"
            title="Als gelesen markieren"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
          </button>
        )}

        {/* Additional actions could go here */}
        {showActions && (
          <div className="flex items-center gap-1">
            {/* Add more actions as needed */}
          </div>
        )}
      </div>
    </div>
  )
}
