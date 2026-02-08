'use client'

import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'
import {
  Notification,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notifications/types'
import {
  getNotificationIcon,
  getNotificationColorClasses,
} from '@/lib/notifications/utils'

interface NotificationToastProps {
  onNotification?: (notification: Notification) => void
}

/**
 * Component that listens for realtime notifications and displays toasts
 * Place this inside the DashboardShell to enable global toast notifications
 */
export function NotificationToast({ onNotification }: NotificationToastProps) {
  const { user } = useUser()

  // Handle new notification
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      const title = NOTIFICATION_TYPE_LABELS[notification.type]
      const Icon = getNotificationIcon(notification.type)
      const colorClasses = getNotificationColorClasses(notification.type)

      // Show toast with custom styling
      toast.custom(
        (t) => (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-background cursor-pointer min-w-[300px] max-w-[400px] ${colorClasses.border}`}
            onClick={() => {
              toast.dismiss(t)
              if (notification.action_url) {
                window.location.href = notification.action_url
              }
            }}
          >
            {/* Icon */}
            <div className={`rounded-full p-2 ${colorClasses.bg}`}>
              <Icon className={`h-4 w-4 ${colorClasses.icon}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{title}</p>
              {notification.title && (
                <p className="text-sm text-foreground mt-0.5">{notification.title}</p>
              )}
              {notification.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
              )}
            </div>
          </div>
        ),
        {
          duration: 5000,
        }
      )

      // Call optional callback
      onNotification?.(notification)
    },
    [onNotification]
  )

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return

    let channel: ReturnType<ReturnType<typeof import('@/lib/supabase/client').createClient>['channel']> | null = null

    const setupRealtime = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      channel = supabase.channel(`notifications:user_${user.id}`)

      channel
        .on(
          'broadcast',
          { event: 'new_notification' },
          (payload: { payload: Notification }) => {
            handleNewNotification(payload.payload)
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [user, handleNewNotification])

  // This component doesn't render anything visible
  return null
}

/**
 * Hook to manually show a notification toast
 */
export function useNotificationToast() {
  const showToast = useCallback((notification: Notification) => {
    const title = NOTIFICATION_TYPE_LABELS[notification.type]
    const Icon = getNotificationIcon(notification.type)
    const colorClasses = getNotificationColorClasses(notification.type)

    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-background cursor-pointer min-w-[300px] max-w-[400px] ${colorClasses.border}`}
          onClick={() => {
            toast.dismiss(t)
            if (notification.action_url) {
              window.location.href = notification.action_url
            }
          }}
        >
          <div className={`rounded-full p-2 ${colorClasses.bg}`}>
            <Icon className={`h-4 w-4 ${colorClasses.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{title}</p>
            {notification.title && (
              <p className="text-sm text-foreground mt-0.5">{notification.title}</p>
            )}
            {notification.message && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            )}
          </div>
        </div>
      ),
      { duration: 5000 }
    )
  }, [])

  return { showToast }
}
