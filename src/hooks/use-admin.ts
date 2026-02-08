// Admin Dashboard Hooks - Epic E11
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
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
} from '@/lib/admin/types';
import * as api from '@/lib/admin/api';

// ==================== USERS ====================

export function useAdminUsers(filters: UserFilters = {}) {
  const key = ['admin-users', filters];
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.fetchAdminUsers(filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

export function useAdminUser(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['admin-user', id] : null,
    () => (id ? api.fetchAdminUser(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useSuspendUser() {
  return useSWRMutation(
    'admin-users',
    async (_, { arg }: { arg: { id: string; reason?: string } }) => {
      return api.suspendUser(arg.id, arg.reason);
    }
  );
}

export function useUnsuspendUser() {
  return useSWRMutation(
    'admin-users',
    async (_, { arg }: { arg: string }) => {
      return api.unsuspendUser(arg);
    }
  );
}

export function useChangeUserPlan() {
  return useSWRMutation(
    'admin-users',
    async (_, { arg }: { arg: { id: string; plan: 'free' | 'pro' | 'enterprise' } }) => {
      return api.changeUserPlan(arg.id, arg.plan);
    }
  );
}

export function useDeleteUser() {
  return useSWRMutation(
    'admin-users',
    async (_, { arg }: { arg: string }) => {
      return api.deleteUser(arg);
    }
  );
}

// ==================== STATS ====================

export function useAdminStats(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-stats', days],
    () => api.fetchAdminStats(days),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUserRegistrationChart(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    ['admin-registrations-chart', days],
    () => api.fetchUserRegistrationChart(days),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    chartData: data,
    isLoading,
    error,
  };
}

export function useSearchesChart(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    ['admin-searches-chart', days],
    () => api.fetchSearchesChart(days),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    chartData: data,
    isLoading,
    error,
  };
}

export function useRevenueChart(days: number = 30) {
  const { data, error, isLoading } = useSWR(
    ['admin-revenue-chart', days],
    () => api.fetchRevenueChart(days),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    chartData: data,
    isLoading,
    error,
  };
}

// ==================== CREDITS ====================

export function useAdminCredits(userId?: string, page: number = 1, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-credits', userId, page, limit],
    () => api.fetchCreditAdjustments(userId, page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    adjustments: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

export function useAdjustCredits() {
  return useSWRMutation(
    'admin-credits',
    async (_, { arg }: { arg: CreditAdjustmentRequest }) => {
      return api.adjustCredits(arg);
    }
  );
}

export function useSearchUsersForCreditAdjustment(query: string) {
  const { data, error, isLoading } = useSWR(
    query ? ['admin-users-search', query] : null,
    () => api.searchUsersForCreditAdjustment(query),
    {
      revalidateOnFocus: false,
      dedupingInterval: 500,
    }
  );

  return {
    users: data ?? [],
    isLoading,
    error,
  };
}

// ==================== ANNOUNCEMENTS ====================

export function useAdminAnnouncements(includeInactive: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-announcements', includeInactive],
    () => api.fetchAnnouncements(includeInactive),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    announcements: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useAdminAnnouncement(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['admin-announcement', id] : null,
    () => (id ? api.fetchAnnouncement(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    announcement: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateAnnouncement() {
  return useSWRMutation(
    'admin-announcements',
    async (_, { arg }: { arg: CreateAnnouncementRequest }) => {
      return api.createAnnouncement(arg);
    }
  );
}

export function useUpdateAnnouncement() {
  return useSWRMutation(
    'admin-announcements',
    async (_, { arg }: { arg: { id: string; data: CreateAnnouncementRequest } }) => {
      return api.updateAnnouncement(arg.id, arg.data);
    }
  );
}

export function useDeleteAnnouncement() {
  return useSWRMutation(
    'admin-announcements',
    async (_, { arg }: { arg: string }) => {
      return api.deleteAnnouncement(arg);
    }
  );
}

export function useToggleAnnouncementActive() {
  return useSWRMutation(
    'admin-announcements',
    async (_, { arg }: { arg: { id: string; isActive: boolean } }) => {
      return api.toggleAnnouncementActive(arg.id, arg.isActive);
    }
  );
}

// ==================== REPORTS ====================

export function useAdminReports(filters: ReportFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-reports', filters],
    () => api.fetchReports(filters),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    reports: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

export function useReportStats() {
  const { data, error, isLoading } = useSWR(
    'admin-reports-stats',
    api.fetchReportStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
  };
}

export function useResolveReport() {
  return useSWRMutation(
    'admin-reports',
    async (_, { arg }: { arg: { id: string; note?: string } }) => {
      return api.resolveReport(arg.id, arg.note);
    }
  );
}

export function useDismissReport() {
  return useSWRMutation(
    'admin-reports',
    async (_, { arg }: { arg: { id: string; note?: string } }) => {
      return api.dismissReport(arg.id, arg.note);
    }
  );
}

// ==================== AUDIT LOGS ====================

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin-audit-logs', filters],
    () => api.fetchAuditLogs(filters),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    logs: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

export function useExportAuditLogs() {
  return useSWRMutation(
    'admin-audit-logs',
    async (_, { arg }: { arg: AuditLogFilters }) => {
      return api.exportAuditLogs(arg);
    }
  );
}

export function useAdminList() {
  const { data, error, isLoading } = useSWR(
    'admin-list',
    api.fetchAdminList,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    admins: data ?? [],
    isLoading,
    error,
  };
}
