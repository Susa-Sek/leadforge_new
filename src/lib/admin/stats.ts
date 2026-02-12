/**
 * Admin Statistics Queries
 *
 * Provides aggregated statistics for the admin dashboard
 */

import { createServiceClient } from '@/lib/supabase/service';
import { unstable_cache } from 'next/cache';

export interface DashboardStats {
  users: {
    total: number;
    new_this_period: number;
    active_today: number;
    suspended: number;
    admins: number;
  };
  subscriptions: {
    total_active: number;
    free_tier: number;
    trialing: number;
    past_due: number;
  };
  credits: {
    total_issued: number;
    total_used: number;
    purchased_this_period: number;
  };
  searches: {
    total_this_period: number;
    completed: number;
    failed: number;
  };
  reports: {
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
  };
  period: {
    from: string;
    to: string;
  };
}

export interface RevenueStats {
  total_revenue: number;
  refunds: number;
  new_subscriptions: number;
  cancellations: number;
  by_plan: Record<string, number>;
  mrr_estimate: number;
  period: {
    from: string;
    to: string;
  };
}

export interface ActivityStats {
  daily_active_users: Array<{
    date: string;
    count: number;
  }>;
  daily_searches: Array<{
    date: string;
    count: number;
  }>;
  top_pages: Array<{
    path: string;
    views: number;
  }>;
  period: {
    from: string;
    to: string;
  };
}

/**
 * Get dashboard statistics using the database function
 */
export async function getDashboardStats(
  from?: Date,
  to?: Date
): Promise<DashboardStats> {
  // Use service client to bypass RLS
  const supabase = createServiceClient();

  const fromIso = from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toIso = to?.toISOString() || new Date().toISOString();

  const { data, error } = await supabase.rpc('get_admin_stats', {
    p_from_date: fromIso,
    p_to_date: toIso,
  });

  if (error) {
    console.error('Error fetching admin stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }

  return data as DashboardStats;
}

/**
 * Get revenue statistics
 */
export async function getRevenueStats(
  from?: Date,
  to?: Date
): Promise<RevenueStats> {
  // Use service client to bypass RLS
  const supabase = createServiceClient();

  const fromIso = from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toIso = to?.toISOString() || new Date().toISOString();

  const { data, error } = await supabase.rpc('get_revenue_stats', {
    p_from_date: fromIso,
    p_to_date: toIso,
  });

  if (error) {
    console.error('Error fetching revenue stats:', error);
    throw new Error('Failed to fetch revenue statistics');
  }

  return data as RevenueStats;
}

/**
 * Get activity statistics (daily active users, searches, etc.)
 */
export async function getActivityStats(
  from?: Date,
  to?: Date
): Promise<ActivityStats> {
  // Use service client to bypass RLS
  const supabase = createServiceClient();

  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to || new Date();

  // Daily active users (users who logged in or performed actions)
  const { data: dailyActiveData, error: dauError } = await supabase.rpc('get_daily_active_users', {
    p_from_date: fromDate.toISOString(),
    p_to_date: toDate.toISOString(),
  });

  if (dauError) {
    console.error('Error fetching daily active users:', dauError);
  }

  // Daily searches
  const { data: dailySearches, error: searchError } = await supabase
    .from('search_queries')
    .select('created_at')
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString());

  if (searchError) {
    console.error('Error fetching daily searches:', searchError);
  }

  // Aggregate searches by day
  const searchesByDay = new Map<string, number>();
  dailySearches?.forEach((search) => {
    const date = new Date(search.created_at).toISOString().split('T')[0];
    searchesByDay.set(date, (searchesByDay.get(date) || 0) + 1);
  });

  // Format response
  const dailySearchesFormatted = Array.from(searchesByDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    daily_active_users: dailyActiveData || [],
    daily_searches: dailySearchesFormatted,
    top_pages: [], // Would need analytics integration
    period: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
  };
}

/**
 * Get top users by various metrics
 */
export async function getTopUsers(
  metric: 'credits_used' | 'searches' | 'logins' | 'revenue' = 'credits_used',
  limit: number = 10
): Promise<Array<{
  id: string;
  email: string;
  full_name: string;
  metric_value: number;
}>> {
  // Use service client to bypass RLS
  const supabase = createServiceClient();

  let query;

  switch (metric) {
    case 'credits_used':
      query = supabase
        .from('profiles')
        .select('id, email, full_name, credits')
        .order('credits', { ascending: true })
        .limit(limit);
      break;

    case 'searches':
      // Get users with most searches - fetch all and group in JS (Supabase JS doesn't support GROUP BY)
      const { data: searchQueries } = await supabase
        .from('search_queries')
        .select('user_id');

      if (!searchQueries || searchQueries.length === 0) return [];

      // Group by user_id in JavaScript
      const searchCounts = searchQueries.reduce((acc, sq) => {
        acc[sq.user_id] = (acc[sq.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to array and sort by count
      const sortedUsers = Object.entries(searchCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // Get user details
      const userIds = sortedUsers.map((s) => s.user_id);
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      return users?.map((u) => ({
        ...u,
        metric_value: sortedUsers.find((s) => s.user_id === u.id)?.count || 0,
      })) || [];

    case 'logins':
      // Sort by last activity (would need auth logs)
      query = supabase
        .from('profiles')
        .select('id, email, full_name, updated_at')
        .order('updated_at', { ascending: false })
        .limit(limit);
      break;

    case 'revenue':
      // Get users with highest revenue
      const { data: revenueData } = await supabase
        .from('stripe_invoices')
        .select('customer_id, amount')
        .eq('status', 'paid')
        .order('amount', { ascending: false })
        .limit(limit);

      if (!revenueData) return [];

      // Get user details from customer IDs
      const { data: customers } = await supabase
        .from('user_subscriptions')
        .select('user_id, customer_id')
        .in('customer_id', revenueData.map((r) => r.customer_id));

      const userIdMap = new Map(customers?.map((c) => [c.customer_id, c.user_id]) || []);
      const userIdsFromRevenue = revenueData
        .map((r) => userIdMap.get(r.customer_id))
        .filter(Boolean) as string[];

      const { data: revenueUsers } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIdsFromRevenue);

      return revenueUsers?.map((u) => ({
        ...u,
        metric_value: revenueData.find(
          (r) => userIdMap.get(r.customer_id) === u.id
        )?.amount || 0,
      })) || [];

    default:
      return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching top users:', error);
    return [];
  }

  // Format based on metric
  return (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    metric_value:
      metric === 'credits_used'
        ? 1000 - (u.credits || 0) // Approximation: started with 30, now has X
        : metric === 'logins'
        ? new Date(u.updated_at).getTime()
        : 0,
  }));
}

/**
 * Get plan distribution
 */
export async function getPlanDistribution(): Promise<{
  free: number;
  starter: number;
  professional: number;
  enterprise: number;
}> {
  // Use service client to bypass RLS
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_plan_distribution');

  if (error) {
    console.error('Error fetching plan distribution:', error);
    return { free: 0, starter: 0, professional: 0, enterprise: 0 };
  }

  return data || { free: 0, starter: 0, professional: 0, enterprise: 0 };
}

/**
 * Cached version of dashboard stats (5 minute cache)
 */
export const getCachedDashboardStats = unstable_cache(
  async (from?: Date, to?: Date) => {
    return getDashboardStats(from, to);
  },
  ['admin-dashboard-stats'],
  { revalidate: 300, tags: ['admin-stats'] }
);

/**
 * Cached version of revenue stats (5 minute cache)
 */
export const getCachedRevenueStats = unstable_cache(
  async (from?: Date, to?: Date) => {
    return getRevenueStats(from, to);
  },
  ['admin-revenue-stats'],
  { revalidate: 300, tags: ['admin-revenue'] }
);

/**
 * Invalidate admin stats cache
 * Call this after significant data changes
 */
export async function invalidateAdminStats(): Promise<void> {
  // Next.js will automatically revalidate on next request
  // For immediate revalidation, use revalidateTag with profile
  const { revalidateTag } = await import('next/cache');
  revalidateTag('admin-stats', 'max');
  revalidateTag('admin-revenue', 'max');
}
