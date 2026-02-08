'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  Trash2,
  Settings,
  Filter,
  Calendar,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotifications, useMarkRead, useNotificationDelete, useUnreadCount } from '@/hooks/use-notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import {
  NotificationType,
  Notification,
  NotificationFilter,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notifications/types'
import { groupNotificationsByDate, formatGermanDate } from '@/lib/notifications/utils'
import { cn } from '@/lib/utils'

// All notification types for filter (aligned with backend)
const ALL_NOTIFICATION_TYPES: NotificationType[] = [
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
]

// Date filter options
const DATE_FILTERS = [
  { value: 'all', label: 'Alle Zeit' },
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>()
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleteAll, setIsDeleteAll] = useState(false)

  const { notifications, isLoading, hasMore, loadMore, totalCount, refetch } = useNotifications(
    filter,
    typeFilter
  )
  const { refetch: refetchUnread } = useUnreadCount()
  const { markAllRead } = useMarkRead(() => {
    refetch()
    refetchUnread()
  })
  const { deleteNotification, isLoading: isDeleting } = useNotificationDelete(() => {
    refetch()
    setSelectedIds(new Set())
  })

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(notifications)
  }, [notifications])

  // Handle notification click (navigate)
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (notification.action_url) {
        router.push(notification.action_url)
      }
    },
    [router]
  )

  // Handle mark as read
  const handleMarkRead = useCallback(() => {
    refetchUnread()
    refetch()
  }, [refetch, refetchUnread])

  // Handle mark all as read
  const handleMarkAllRead = useCallback(async () => {
    await markAllRead()
  }, [markAllRead])

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Select all visible
  const selectAllVisible = useCallback(() => {
    const allIds = notifications.map((n) => n.id)
    setSelectedIds(new Set(allIds))
  }, [notifications])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    const promises = Array.from(selectedIds).map((id) => deleteNotification(id))
    await Promise.all(promises)
    setShowDeleteConfirm(false)
  }, [selectedIds, deleteNotification])

  // Handle delete all (all filtered notifications)
  const handleDeleteAll = useCallback(async () => {
    // In a real implementation, you'd have a bulk delete API endpoint
    // For now, we'll delete all visible notifications one by one
    const promises = notifications.map((n) => deleteNotification(n.id))
    await Promise.all(promises)
    setShowDeleteConfirm(false)
    setIsDeleteAll(false)
  }, [notifications, deleteNotification])

  // Open delete confirmation
  const openDeleteConfirm = useCallback((all: boolean = false) => {
    setIsDeleteAll(all)
    setShowDeleteConfirm(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Benachrichtigungen</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} Benachrichtigungen insgesamt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/einstellungen/notifications">
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isLoading || notifications.every((n) => n.read)}
          >
            <Check className="h-4 w-4 mr-2" />
            Alle als gelesen markieren
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Filter Tabs */}
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as NotificationFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="unread">Ungelesen</TabsTrigger>
                <TabsTrigger value="read">Gelesen</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Type Filter */}
            <Select
              value={typeFilter || 'all'}
              onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : (v as NotificationType))}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Typ filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {ALL_NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {NOTIFICATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((df) => (
                  <SelectItem key={df.value} value={df.value}>
                    {df.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={selectedIds.size === notifications.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllVisible()
                    } else {
                      clearSelection()
                    }
                  }}
                />
                <span>{selectedIds.size} ausgewählt</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteConfirm(false)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Wird geladen...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Keine Benachrichtigungen</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'unread'
                  ? 'Du hast keine ungelesenen Benachrichtigungen.'
                  : filter === 'read'
                  ? 'Du hast keine gelesenen Benachrichtigungen.'
                  : 'Hier werden deine Benachrichtigungen angezeigt.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {groupedNotifications.map((group) => (
                  <div key={group.label}>
                    {/* Date Header */}
                    <div className="sticky top-0 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm z-10">
                      {group.label}
                    </div>

                    {/* Notifications in this group */}
                    <div className="divide-y">
                      {group.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors"
                        >
                          {/* Checkbox for selection */}
                          <div className="pt-2">
                            <Checkbox
                              checked={selectedIds.has(notification.id)}
                              onCheckedChange={() => toggleSelection(notification.id)}
                            />
                          </div>

                          {/* Notification Item */}
                          <div className="flex-1">
                            <NotificationItem
                              notification={notification}
                              onClick={() => handleNotificationClick(notification)}
                              onMarkRead={handleMarkRead}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      )}
                      Mehr laden
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benachrichtigungen löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {isDeleteAll
                ? 'Möchtest du wirklich alle angezeigten Benachrichtigungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                : `Möchtest du wirklich ${selectedIds.size} Benachrichtigung${
                    selectedIds.size === 1 ? '' : 'en'
                  } löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={isDeleteAll ? handleDeleteAll : handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
