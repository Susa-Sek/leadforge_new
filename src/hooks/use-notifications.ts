'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from './use-user'
import { toast } from 'sonner'
import {
  NotificationType,
  DeliveryMethod,
  Notification,
  NotificationPreference,
  NotificationPreferences,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notifications/types'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  createNotificationPreferences,
} from '@/lib/notifications/api'

// Types for hook returns
interface UseNotificationsReturn {
  notifications: Notification[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
  totalCount: number
}

interface UseUnreadCountReturn {
  unreadCount: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

interface UseMarkReadReturn {
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  isLoading: boolean
  error: string | null
}

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null
  savePreferences: () => Promise<void>
  updatePreference: (preference: NotificationPreference) => Promise<void>
  hasChanges: boolean
  changedPreferences: NotificationPreference[]
  toggleType: (type: NotificationType, channel: DeliveryMethod, enabled: boolean) => void
  setQuietHours: (type: NotificationType, start: string, end: string) => void
}

interface UseNotificationDeleteReturn {
  deleteNotification: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

// Constants
const POLL_INTERVAL = 30000 // 30 seconds
const PAGE_SIZE = 20

/**
 * Hook to fetch notifications with pagination
 */
export function useNotifications(
  filter: 'all' | 'unread' | 'read' = 'all',
  type?: NotificationType
): UseNotificationsReturn {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const loadNotifications = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchNotifications({
        page: pageNum,
        limit: PAGE_SIZE,
        filter,
        type,
      })

      if (append) {
        setNotifications((prev) => {
          const newNotifications = result.notifications.filter(
            (n) => !prev.some((p) => p.id === n.id)
          )
          return [...prev, ...newNotifications]
        })
      } else {
        setNotifications(result.notifications)
      }

      setHasMore(result.notifications.length === PAGE_SIZE)
      setTotalCount(result.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Benachrichtigungen')
    } finally {
      setIsLoading(false)
    }
  }, [user, filter, type])

  // Initial load
  useEffect(() => {
    if (user) {
      setPage(1)
      loadNotifications(1, false)
    }
  }, [user, filter, type, loadNotifications])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadNotifications(nextPage, true)
    }
  }, [isLoading, hasMore, page, loadNotifications])

  const refetch = useCallback(() => {
    setPage(1)
    loadNotifications(1, false)
  }, [loadNotifications])

  return {
    notifications,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
    totalCount,
  }
}

/**
 * Hook to get unread count with polling
 */
export function useUnreadCount(): UseUnreadCountReturn {
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCount = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const count = await fetchUnreadCount()
      setUnreadCount(count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Unread-Zahl')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Initial fetch
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  // Polling every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [user, fetchCount])

  return {
    unreadCount,
    isLoading,
    error,
    refetch: fetchCount,
  }
}

/**
 * Hook for Realtime notifications via Supabase Broadcast
 */
export function useNotificationRealtime(
  onNewNotification?: (notification: Notification) => void
) {
  const { user } = useUser()
  const channelRef = useRef<ReturnType<ReturnType<typeof import('@/lib/supabase/client').createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!user) return

    const setupRealtime = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const channel = supabase.channel(`notifications:user_${user.id}`)

      channel
        .on(
          'broadcast',
          { event: 'new_notification' },
          (payload: { payload: Notification }) => {
            const notification = payload.payload

            // Show toast
            const title = NOTIFICATION_TYPE_LABELS[notification.type] || 'Neue Benachrichtigung'
            toast.info(title, {
              description: notification.title,
              duration: 5000,
              action: notification.action_url
                ? {
                    label: 'Anzeigen',
                    onClick: () => {
                      window.location.href = notification.action_url!
                    },
                  }
                : undefined,
            })

            // Call custom handler
            onNewNotification?.(notification)
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    setupRealtime()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [user, onNewNotification])
}

/**
 * Hook to mark notifications as read
 */
export function useMarkRead(onSuccess?: () => void): UseMarkReadReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markRead = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await markAsRead(id)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Markieren als gelesen')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess])

  const markAllRead = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await markAllAsRead()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Markieren aller als gelesen')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess])

  return {
    markRead,
    markAllRead,
    isLoading,
    error,
  }
}

/**
 * Hook to delete notifications
 */
export function useNotificationDelete(onSuccess?: () => void): UseNotificationDeleteReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteNotificationFn = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await deleteNotification(id)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess])

  return {
    deleteNotification: deleteNotificationFn,
    isLoading,
    error,
  }
}

/**
 * Hook for notification preferences with local state management
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changedPreferences, setChangedPreferences] = useState<NotificationPreference[]>([])

  // Load preferences
  useEffect(() => {
    if (!user) return

    const loadPreferences = async () => {
      try {
        setIsLoading(true)
        let perType = await fetchNotificationPreferences()

        // Create default preferences if none exist
        if (!perType || perType.length === 0) {
          perType = await createNotificationPreferences()
        }

        // Build aggregate preferences object
        const aggregate: NotificationPreferences = {
          perType,
          in_app_enabled: perType.some((p) => p.in_app),
          email_enabled: perType.some((p) => p.email),
          push_enabled: perType.some((p) => p.push),
          quiet_hours_start: perType[0]?.quiet_hours_start || null,
          quiet_hours_end: perType[0]?.quiet_hours_end || null,
        }

        setPreferences(aggregate)
        setChangedPreferences([])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Einstellungen')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  // Check if there are changes
  const hasChanges = changedPreferences.length > 0

  // Toggle notification type channel
  const toggleType = useCallback((type: NotificationType, channel: DeliveryMethod, enabled: boolean) => {
    setPreferences((prev) => {
      if (!prev) return null

      // Update perType array
      const updatedPerType = prev.perType.map((p) =>
        p.type === type ? { ...p, [channel]: enabled } : p
      )

      // Track change
      const changedPref = updatedPerType.find((p) => p.type === type)
      if (changedPref) {
        setChangedPreferences((prevChanged) => {
          const filtered = prevChanged.filter((p) => p.type !== type)
          return [...filtered, changedPref]
        })
      }

      return {
        ...prev,
        perType: updatedPerType,
        [`${channel}_enabled`]: updatedPerType.some((p) => p[channel]),
      }
    })
  }, [])

  // Set quiet hours for all types
  const setQuietHours = useCallback((type: NotificationType, start: string, end: string) => {
    setPreferences((prev) => {
      if (!prev) return null

      // Update all preferences with new quiet hours
      const updatedPerType = prev.perType.map((p) => ({
        ...p,
        quiet_hours_start: start,
        quiet_hours_end: end,
      }))

      // Track all as changed
      setChangedPreferences(updatedPerType)

      return {
        ...prev,
        perType: updatedPerType,
        quiet_hours_start: start,
        quiet_hours_end: end,
      }
    })
  }, [])

  // Update single preference
  const updatePreference = useCallback(async (preference: NotificationPreference) => {
    try {
      setIsLoading(true)
      setError(null)

      // In a real implementation, call the API to update single preference
      // For now, just update local state
      setPreferences((prev) => {
        if (!prev) return null

        const updatedPerType = prev.perType.map((p) =>
          p.type === preference.type ? preference : p
        )

        return {
          ...prev,
          perType: updatedPerType,
        }
      })

      // Remove from changed preferences
      setChangedPreferences((prev) => prev.filter((p) => p.type !== preference.type))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save all changed preferences to server
  const savePreferences = useCallback(async () => {
    if (!preferences || changedPreferences.length === 0) return

    try {
      setIsLoading(true)
      setError(null)

      // Send all changed preferences to API
      const updated = await updateNotificationPreferences(changedPreferences)

      // Refresh preferences from server
      const aggregate: NotificationPreferences = {
        perType: updated,
        in_app_enabled: updated.some((p) => p.in_app),
        email_enabled: updated.some((p) => p.email),
        push_enabled: updated.some((p) => p.push),
        quiet_hours_start: updated[0]?.quiet_hours_start || null,
        quiet_hours_end: updated[0]?.quiet_hours_end || null,
      }

      setPreferences(aggregate)
      setChangedPreferences([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Einstellungen')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [preferences, changedPreferences])

  return {
    preferences,
    isLoading,
    error,
    savePreferences,
    updatePreference,
    hasChanges,
    changedPreferences,
    toggleType,
    setQuietHours,
  }
}
