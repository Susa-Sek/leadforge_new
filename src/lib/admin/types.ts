// Admin Dashboard Types - Epic E11

// ==================== USER TYPES ====================

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  credits_balance: number;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
  subscription_status?: string;
}

export interface AdminUserDetail extends AdminUser {
  profile: {
    company: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
  };
  subscription: {
    plan: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  credit_transactions: CreditTransaction[];
  activity: UserActivity[];
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'bonus' | 'usage' | 'refund' | 'adjustment';
  description: string;
  created_at: string;
  balance_after: number;
}

export interface UserActivity {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// ==================== STATS TYPES ====================

export interface AdminStats {
  activeUsers: number;
  activeUsersTrend: number; // percentage
  newRegistrations: number;
  newRegistrationsTrend: number;
  searchesToday: number;
  searchesTrend: number;
  revenue: number;
  revenueTrend: number;
  conversionRate: number;
  churnRate: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  [key: string]: string | number | undefined;
}

export interface UserRegistrationChart {
  data: ChartDataPoint[];
  total: number;
}

export interface SearchesChart {
  data: ChartDataPoint[];
  total: number;
}

export interface RevenueChart {
  data: ChartDataPoint[];
  total: number;
}

// ==================== CREDIT TYPES ====================

export interface CreditAdjustment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  amount: number;
  reason: string;
  admin_id: string;
  admin_email: string;
  created_at: string;
}

export interface CreditAdjustmentRequest {
  user_id: string;
  amount: number;
  reason: string;
}

// ==================== ANNOUNCEMENT TYPES ====================

export type AnnouncementType = 'info' | 'warning' | 'success' | 'maintenance';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  type: AnnouncementType;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface UpdateAnnouncementRequest extends CreateAnnouncementRequest {
  id: string;
}

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  info: 'Info',
  warning: 'Warnung',
  success: 'Erfolg',
  maintenance: 'Wartung',
};

export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
  maintenance: 'bg-orange-500',
};

// ==================== REPORT TYPES ====================

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'other';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_email: string;
  target_type: string;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface ReportStats {
  pending: number;
  resolved: number;
  dismissed: number;
  total: number;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  inappropriate: 'Unangemessen',
  fake: 'Falsch/Fake',
  other: 'Sonstiges',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Ausstehend',
  resolved: 'Gelöst',
  dismissed: 'Abgelehnt',
};

// ==================== AUDIT LOG TYPES ====================

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  | 'user_suspend'
  | 'user_unsuspend'
  | 'user_delete'
  | 'credit_adjust'
  | 'announcement_create'
  | 'announcement_update'
  | 'announcement_delete'
  | 'report_resolve'
  | 'report_dismiss'
  | 'plan_change'
  | 'settings_update';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  user_suspend: 'Nutzer gesperrt',
  user_unsuspend: 'Nutzer entsperrt',
  user_delete: 'Nutzer gelöscht',
  credit_adjust: 'Credits angepasst',
  announcement_create: 'Ankündigung erstellt',
  announcement_update: 'Ankündigung aktualisiert',
  announcement_delete: 'Ankündigung gelöscht',
  report_resolve: 'Meldung gelöst',
  report_dismiss: 'Meldung abgelehnt',
  plan_change: 'Tarif geändert',
  settings_update: 'Einstellungen aktualisiert',
};

// ==================== FILTER TYPES ====================

export interface UserFilters {
  search?: string;
  plan?: 'free' | 'pro' | 'enterprise' | 'all';
  status?: 'active' | 'suspended' | 'pending' | 'all';
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'last_login' | 'credits' | 'login_count';
  sort_order?: 'asc' | 'desc';
}

export interface AuditLogFilters {
  admin_id?: string;
  action?: string;
  target_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ReportFilters {
  status?: ReportStatus | 'all';
  reason?: ReportReason | 'all';
  page?: number;
  limit?: number;
}

// ==================== API RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListResponse extends PaginatedResponse<AdminUser> {}
export interface AuditLogListResponse extends PaginatedResponse<AuditLog> {}
export interface ReportListResponse extends PaginatedResponse<Report> {}
export interface AnnouncementListResponse extends PaginatedResponse<Announcement> {}
export interface CreditAdjustmentListResponse extends PaginatedResponse<CreditAdjustment> {}

// ==================== ADMIN NAVIGATION ====================

export interface AdminNavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { title: 'Übersicht', href: '/admin', icon: 'LayoutDashboard' },
  { title: 'Nutzer', href: '/admin/users', icon: 'Users' },
  { title: 'Credits', href: '/admin/credits', icon: 'Coins' },
  { title: 'Ankündigungen', href: '/admin/announcements', icon: 'Megaphone' },
  { title: 'Meldungen', href: '/admin/reports', icon: 'Flag' },
  { title: 'Audit-Logs', href: '/admin/audit-logs', icon: 'ClipboardList' },
];
