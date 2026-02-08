// Notification API Functions
// Aligned with backend API routes

import {
  Notification,
  NotificationPreference,
  NotificationPreferences,
  NotificationType,
  NotificationsResponse,
  NotificationFilter,
} from './types'

// Base API path
const API_BASE = '/api/notifications'

// Error helper
class NotificationAPIError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'NotificationAPIError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new NotificationAPIError(error.error || `HTTP ${response.status}`, response.status)
  }
  return response.json()
}

// Fetch notifications with pagination and filters
export async function fetchNotifications({
  page = 1,
  limit = 20,
  filter = 'all' as NotificationFilter,
  type,
  dateFrom,
  dateTo,
}: {
  page?: number
  limit?: number
  filter?: NotificationFilter
  type?: NotificationType
  dateFrom?: string
  dateTo?: string
}): Promise<NotificationsResponse> {
  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('limit', limit.toString())
  if (filter !== 'all') params.set('filter', filter)
  if (type) params.set('type', type)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const result = await handleResponse<{
    notifications: Notification[]
    pagination: { page: number; limit: number; total: number; total_pages: number }
  }>(response)

  return {
    notifications: result.notifications,
    totalCount: result.pagination.total,
    hasMore: result.pagination.page < result.pagination.total_pages,
  }
}

// Fetch unread count
export async function fetchUnreadCount(): Promise<number> {
  const response = await fetch(`${API_BASE}/unread-count`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await handleResponse<{ count: number }>(response)
  return data.count
}

// Mark single notification as read
export async function markAsRead(id: string): Promise<Notification> {
  const response = await fetch(`${API_BASE}/${id}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  return handleResponse<Notification>(response)
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/mark-all-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  return handleResponse<{ count: number }>(response)
}

// Delete a notification
export async function deleteNotification(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new NotificationAPIError(error.error || `HTTP ${response.status}`, response.status)
  }
}

// Fetch notification preferences (returns array of per-type preferences)
export async function fetchNotificationPreferences(): Promise<NotificationPreference[] | null> {
  const response = await fetch(`${API_BASE}/preferences`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 404) {
    return null
  }

  return handleResponse<NotificationPreference[]>(response)
}

// Initialize default notification preferences
export async function createNotificationPreferences(): Promise<NotificationPreference[]> {
  const response = await fetch(`${API_BASE}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  return handleResponse<NotificationPreference[]>(response)
}

// Update all notification preferences
export async function updateNotificationPreferences(
  preferences: NotificationPreference[]
): Promise<NotificationPreference[]> {
  const response = await fetch(`${API_BASE}/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences }),
  })

  return handleResponse<NotificationPreference[]>(response)
}

// Update single notification preference
export async function updateSinglePreference(
  preference: NotificationPreference
): Promise<NotificationPreference> {
  const response = await fetch(`${API_BASE}/preferences/${preference.type}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      in_app: preference.in_app,
      email: preference.email,
      push: preference.push,
      quiet_hours_start: preference.quiet_hours_start,
      quiet_hours_end: preference.quiet_hours_end,
    }),
  })

  return handleResponse<NotificationPreference>(response)
}

// Bulk operations
export async function bulkMarkAsRead(ids: string[]): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/bulk/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })

  return handleResponse<{ count: number }>(response)
}

export async function bulkDelete(ids: string[]): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/bulk/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })

  return handleResponse<{ count: number }>(response)
}

// Dismiss all notifications (mark as read without navigating)
export async function dismissAll(): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/dismiss-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  return handleResponse<{ count: number }>(response)
}
