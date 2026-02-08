/**
 * Rate Limiting for Admin API Routes
 * BUG-2 FIX: Implements 1000 req/min rate limiting for admin APIs
 *
 * Note: In-memory store works for single-instance deployments.
 * For multi-instance/production, replace with Redis (Upstash/etc).
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// Key: IP address + route pattern
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Cleanup function to prevent memory leaks
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup periodically
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
}

// Default: 1000 requests per minute (as per BUG-2 requirements)
const DEFAULT_ADMIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 1000,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  // Try to get IP from headers (works with Vercel, AWS, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback for local development
  return 'localhost';
}

/**
 * Check rate limit for a request
 * Returns: { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig = DEFAULT_ADMIN_RATE_LIMIT
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const ip = getClientIP(request);
  const url = new URL(request.url);
  // Use path without query params as the route identifier
  const route = url.pathname;
  const key = `${ip}:${route}`;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      limit: config.maxRequests,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  };
}

/**
 * Middleware helper to apply rate limiting to admin API routes
 * Returns NextResponse if rate limited, null if allowed
 *
 * Usage:
 * ```typescript
 * export async function GET(request: Request) {
 *   const rateLimitCheck = applyRateLimit(request);
 *   if (rateLimitCheck) return rateLimitCheck;
 *   // ... continue with handler
 * }
 * ```
 */
export function applyRateLimit(
  request: Request,
  config?: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(request, config);

  if (!result.allowed) {
    // Calculate retry after in seconds
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  return null;
}

/**
 * Higher rate limits for specific endpoints
 * More restrictive for destructive operations
 */
export const RATE_LIMITS = {
  // Standard admin API: 1000 req/min (BUG-2 requirement)
  STANDARD: DEFAULT_ADMIN_RATE_LIMIT,

  // Stricter for destructive operations (suspend, delete, etc.)
  STRICT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 req/min
  },

  // Very strict for credit adjustments (financial operations)
  FINANCIAL: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 50 req/min
  },

  // Lenient for read-only operations
  READONLY: {
    maxRequests: 2000,
    windowMs: 60 * 1000, // 2000 req/min
  },
};
