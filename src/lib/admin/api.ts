// Admin Dashboard API Functions - Epic E11
import type {
  AdminUser,
  AdminUserDetail,
  AdminStats,
  UserRegistrationChart,
  SearchesChart,
  RevenueChart,
  CreditAdjustment,
  CreditAdjustmentRequest,
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  Report,
  ReportStats,
  AuditLog,
  UserFilters,
  AuditLogFilters,
  ReportFilters,
  UserListResponse,
  AuditLogListResponse,
  ReportListResponse,
  AnnouncementListResponse,
  CreditAdjustmentListResponse,
} from './types';

// ==================== USERS ====================

export async function fetchAdminUsers(filters: UserFilters = {}): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.plan && filters.plan !== 'all') params.set('plan', filters.plan);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const response = await fetch(`/api/admin/users?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }
  return response.json();
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  const response = await fetch(`/api/admin/users/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }
  return response.json();
}

export async function suspendUser(id: string, reason?: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to suspend user');
  }
}

export async function unsuspendUser(id: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}/unsuspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unsuspend user');
  }
}

export async function changeUserPlan(id: string, plan: 'free' | 'pro' | 'enterprise'): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change plan');
  }
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
}

// ==================== STATS ====================

export async function fetchAdminStats(days: number = 30): Promise<AdminStats> {
  const response = await fetch(`/api/admin/stats?days=${days}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch stats');
  }
  return response.json();
}

export async function fetchUserRegistrationChart(days: number = 30): Promise<UserRegistrationChart> {
  const response = await fetch(`/api/admin/stats/registrations?days=${days}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch registration chart');
  }
  return response.json();
}

export async function fetchSearchesChart(days: number = 30): Promise<SearchesChart> {
  const response = await fetch(`/api/admin/stats/searches?days=${days}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch searches chart');
  }
  return response.json();
}

export async function fetchRevenueChart(days: number = 30): Promise<RevenueChart> {
  const response = await fetch(`/api/admin/stats/revenue?days=${days}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch revenue chart');
  }
  return response.json();
}

// ==================== CREDITS ====================

export async function fetchCreditAdjustments(
  userId?: string,
  page: number = 1,
  limit: number = 20
): Promise<CreditAdjustmentListResponse> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  const response = await fetch(`/api/admin/credits?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch credit adjustments');
  }
  return response.json();
}

export async function adjustCredits(data: CreditAdjustmentRequest): Promise<CreditAdjustment> {
  const response = await fetch('/api/admin/credits/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to adjust credits');
  }
  return response.json();
}

export async function searchUsersForCreditAdjustment(query: string): Promise<{ id: string; email: string; name: string | null }[]> {
  const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search users');
  }
  return response.json();
}

// ==================== ANNOUNCEMENTS ====================

export async function fetchAnnouncements(
  includeInactive: boolean = false
): Promise<AnnouncementListResponse> {
  const params = new URLSearchParams();
  if (includeInactive) params.set('include_inactive', 'true');

  const response = await fetch(`/api/admin/announcements?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch announcements');
  }
  return response.json();
}

export async function fetchAnnouncement(id: string): Promise<Announcement> {
  const response = await fetch(`/api/admin/announcements/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch announcement');
  }
  return response.json();
}

export async function createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create announcement');
  }
  return response.json();
}

export async function updateAnnouncement(id: string, data: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await fetch(`/api/admin/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update announcement');
  }
  return response.json();
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await fetch(`/api/admin/announcements/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete announcement');
  }
}

export async function toggleAnnouncementActive(id: string, isActive: boolean): Promise<void> {
  const response = await fetch(`/api/admin/announcements/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle announcement');
  }
}

// ==================== REPORTS ====================

export async function fetchReports(filters: ReportFilters = {}): Promise<ReportListResponse> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.reason && filters.reason !== 'all') params.set('reason', filters.reason);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/admin/reports?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }
  return response.json();
}

export async function fetchReportStats(): Promise<ReportStats> {
  const response = await fetch('/api/admin/reports/stats');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report stats');
  }
  return response.json();
}

export async function resolveReport(id: string, note?: string): Promise<void> {
  const response = await fetch(`/api/admin/reports/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to resolve report');
  }
}

export async function dismissReport(id: string, note?: string): Promise<void> {
  const response = await fetch(`/api/admin/reports/${id}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to dismiss report');
  }
}

// ==================== AUDIT LOGS ====================

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters.admin_id) params.set('admin_id', filters.admin_id);
  if (filters.action) params.set('action', filters.action);
  if (filters.target_type) params.set('target_type', filters.target_type);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch audit logs');
  }
  return response.json();
}

export async function exportAuditLogs(
  filters: AuditLogFilters = {}
): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.admin_id) params.set('admin_id', filters.admin_id);
  if (filters.action) params.set('action', filters.action);
  if (filters.target_type) params.set('target_type', filters.target_type);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);

  const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export audit logs');
  }
  return response.blob();
}

export async function fetchAdminList(): Promise<{ id: string; email: string; name: string | null }[]> {
  const response = await fetch('/api/admin/list');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch admin list');
  }
  return response.json();
}
