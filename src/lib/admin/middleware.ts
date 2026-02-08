/**
 * Admin Middleware & Authorization Helpers
 *
 * Provides functions to check admin privileges and enforce admin-only access
 */

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export interface AdminCheckResult {
  isAdmin: boolean;
  user: User | null;
  error?: string;
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data.role === 'admin';
}

/**
 * Check if current user is admin
 * Returns user object if admin, null otherwise
 */
export async function checkAdmin(): Promise<{ user: User | null; isAdmin: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, isAdmin: false, error: 'Nicht authentifiziert' };
  }

  // Check admin status
  const adminStatus = await isAdmin(user.id);

  if (!adminStatus) {
    return { user, isAdmin: false, error: 'Keine Admin-Berechtigung' };
  }

  return { user, isAdmin: true };
}

/**
 * Require admin access - throws if not admin
 * Returns user object for use in subsequent operations
 */
export async function requireAdmin(): Promise<User> {
  const { user, isAdmin, error } = await checkAdmin();

  if (!user) {
    throw new AdminAuthError(error || 'Nicht authentifiziert', 401);
  }

  if (!isAdmin) {
    throw new AdminAuthError(error || 'Keine Admin-Berechtigung', 403);
  }

  return user;
}

/**
 * Get current admin user (with full profile)
 */
export async function getCurrentAdmin(): Promise<{ user: User; profile: any }> {
  const supabase = await createClient();

  const user = await requireAdmin();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    throw new AdminAuthError('Profil nicht gefunden', 404);
  }

  return { user, profile };
}

/**
 * Custom error class for admin auth failures
 */
export class AdminAuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'AdminAuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Middleware helper for API routes
 * Returns NextResponse if not admin, null if admin
 *
 * Usage in API route:
 * ```typescript
 * export async function GET(request: Request) {
 *   const adminCheck = await requireAdminAPI();
 *   if (adminCheck.errorResponse) return adminCheck.errorResponse;
 *
 *   // Continue with admin-only logic
 *   const user = adminCheck.user;
 * }
 * ```
 */
import { NextResponse } from 'next/server';

export async function requireAdminAPI(): Promise<
  { errorResponse: NextResponse; user: null } | { errorResponse: null; user: User }
> {
  try {
    const user = await requireAdmin();
    return { errorResponse: null, user };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return {
        errorResponse: NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        ),
        user: null,
      };
    }

    return {
      errorResponse: NextResponse.json(
        { error: 'Interner Serverfehler' },
        { status: 500 }
      ),
      user: null,
    };
  }
}
