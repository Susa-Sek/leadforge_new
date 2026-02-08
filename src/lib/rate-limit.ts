// Rate Limiting Utilities for CRM APIs
// Implements sliding window rate limiting using Supabase

import { createClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  maxRequests: number;
  // Time window in seconds
  windowSeconds: number;
}

interface RateLimitResult {
  // Whether the request is allowed
  allowed: boolean;
  // Number of requests remaining in current window
  remaining: number;
  // Unix timestamp when the window resets
  resetTime: number;
  // Total requests in current window (including this one if allowed)
  totalRequests: number;
}

// Default rate limits for different API endpoints
export const RATE_LIMITS = {
  // Contact APIs - moderate usage
  contacts: { maxRequests: 100, windowSeconds: 60 }, // 100 requests per minute
  contactCreate: { maxRequests: 20, windowSeconds: 60 }, // 20 creations per minute

  // Deal APIs - moderate usage
  deals: { maxRequests: 100, windowSeconds: 60 },
  dealCreate: { maxRequests: 20, windowSeconds: 60 },

  // Pipeline - higher limit for drag-and-drop
  pipeline: { maxRequests: 200, windowSeconds: 60 },

  // Tags - lower limit
  tags: { maxRequests: 50, windowSeconds: 60 },

  // Interactions/Notes - moderate
  interactions: { maxRequests: 60, windowSeconds: 60 },

  // Export - strict limit (expensive operation)
  export: { maxRequests: 5, windowSeconds: 300 }, // 5 exports per 5 minutes

  // Import - strict limit
  import: { maxRequests: 3, windowSeconds: 300 },
} as const;

/**
 * Check rate limit for a user on a specific endpoint
 * Uses Supabase table for distributed rate limiting
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = await createClient();

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;
  const resetTime = now + config.windowSeconds;

  // Clean old entries and count current window
  const { data: requests, error: countError } = await supabase
    .from('rate_limit_logs')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', new Date(windowStart * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (countError) {
    console.error('Rate limit check error:', countError);
    // Fail open - allow request if we can't check
    return { allowed: true, remaining: config.maxRequests, resetTime, totalRequests: 0 };
  }

  const currentRequests = requests?.length || 0;
  const allowed = currentRequests < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentRequests - (allowed ? 1 : 0));

  if (allowed) {
    // Log this request
    await supabase.from('rate_limit_logs').insert({
      user_id: userId,
      endpoint,
      created_at: new Date().toISOString(),
    });
  }

  return {
    allowed,
    remaining,
    resetTime,
    totalRequests: currentRequests + (allowed ? 1 : 0),
  };
}

/**
 * Middleware-style rate limit check for API routes
 * Returns NextResponse if limit exceeded, null if allowed
 */
export async function rateLimitMiddleware(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ error: string; status: number; headers?: Record<string, string> } | null> {
  const result = await checkRateLimit(userId, endpoint, config);

  if (!result.allowed) {
    return {
      error: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds allowed.`,
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetTime),
        'Retry-After': String(config.windowSeconds),
      },
    };
  }

  return null;
}

/**
 * Get rate limit headers for successful requests
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
  };
}

/**
 * Cleanup old rate limit entries (should be called periodically)
 * Call this from a cron job or edge function
 */
export async function cleanupRateLimitEntries(olderThanHours: number = 24): Promise<void> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

  await supabase
    .from('rate_limit_logs')
    .delete()
    .lt('created_at', cutoff);
}
