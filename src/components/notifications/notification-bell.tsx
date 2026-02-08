'use client'

import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useUnreadCount,
  useNotificationRealtime,
  useMarkRead,
} from '@/hooks/use-notifications'
import { NotificationDropdown } from './notification-dropdown'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  onNavigate?: (url: string) => void
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const { unreadCount, refetch: refetchUnread } = useUnreadCount()
  const { markAllRead } = useMarkRead(() => {
    refetchUnread()
  })

  // Handle new realtime notification
  const handleNewNotification = useCallback(() => {
    setHasNewNotification(true)
    refetchUnread()

    // Remove pulse animation after 3 seconds
    setTimeout(() => {
      setHasNewNotification(false)
    }, 3000)
  }, [refetchUnread])

  // Subscribe to realtime notifications
  useNotificationRealtime(handleNewNotification)

  // Format unread count for display ("99+" if >99)
  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? unreadCount.toString() : null

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
    } catch (error) {
      // Error handled in hook
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative',
            hasNewNotification && 'animate-pulse'
          )}
          aria-label={`${unreadCount} ungelesene Benachrichtigungen`}
        >
          <Bell className="h-5 w-5" />

          {/* Unread counter badge */}
          {displayCount && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
              {displayCount}
            </span>
          )}

          {/* Pulse indicator for new notifications */}
          {hasNewNotification && !displayCount && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-ping" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0"
        sideOffset={8}
      >
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onMarkAllRead={handleMarkAllRead}
          onNavigate={onNavigate}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
