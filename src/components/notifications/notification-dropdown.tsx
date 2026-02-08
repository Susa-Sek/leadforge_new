'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Check, Settings, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications, useMarkRead, useUnreadCount } from '@/hooks/use-notifications'
import { NotificationItem } from './notification-item'
import { cn } from '@/lib/utils'

interface NotificationDropdownProps {
  onClose: () => void
  onMarkAllRead: () => Promise<void>
  onNavigate?: (url: string) => void
}

const MAX_DISPLAY_COUNT = 5

export function NotificationDropdown({
  onClose,
  onMarkAllRead,
  onNavigate,
}: NotificationDropdownProps) {
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const { notifications, isLoading, totalCount } = useNotifications('all')
  const { refetch: refetchUnread } = useUnreadCount()

  // Take only the first 5 notifications
  const displayedNotifications = notifications.slice(0, MAX_DISPLAY_COUNT)
  const hasMore = notifications.length > MAX_DISPLAY_COUNT

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true)
    try {
      await onMarkAllRead()
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: { id: string; action_url: string | null; read: boolean }) => {
      // Close dropdown
      onClose()

      // Navigate if action_url exists
      if (notification.action_url) {
        if (onNavigate) {
          onNavigate(notification.action_url)
        } else {
          window.location.href = notification.action_url
        }
      }
    },
    [onClose, onNavigate]
  )

  // Handle mark as read from child component
  const handleMarkRead = useCallback(() => {
    refetchUnread()
  }, [refetchUnread])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
        <div className="flex items-center gap-1">
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {isMarkingAllRead ? 'Wird markiert...' : 'Alle als gelesen markieren'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
            onClick={onClose}
          >
            <Link href="/dashboard/einstellungen/notifications">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Wird geladen...
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Keine Benachrichtigungen</p>
          </div>
        ) : (
          <div className="divide-y">
            {displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkRead={handleMarkRead}
                compact
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              asChild
              onClick={onClose}
            >
              <Link href="/dashboard/notifications">
                {hasMore ? `Alle ${totalCount} anzeigen` : 'Alle anzeigen'}
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
