// Export Plan Gating
// src/lib/export/plan-gating.ts
// Server-side plan validation for exports

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PlanTier,
  ExportType,
  ExportFormat,
  EXPORT_LIMITS,
  FEATURE_ACCESS,
} from './validation';

// ============================================
// PLAN VALIDATION
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate export request against plan limits
 */
export function validateExportRequest(
  planTier: PlanTier,
  format: ExportFormat,
  exportType: ExportType,
  rowCount: number
): ValidationResult {
  // 1. Check if any export is allowed
  if (!FEATURE_ACCESS[planTier].csv) {
    return {
      valid: false,
      error: 'Export ist eine Pro-Funktion. Bitte upgraden Sie Ihren Plan.',
      code: 'PLAN_REQUIRED',
    };
  }

  // 2. Format check (Excel is Enterprise only)
  if (format === 'excel' && !FEATURE_ACCESS[planTier].excel) {
    return {
      valid: false,
      error: 'Excel Export ist eine Enterprise-Funktion. Bitte upgraden Sie auf Enterprise.',
      code: 'PLAN_REQUIRED',
    };
  }

  // 3. Export type check
  if (exportType === 'deals' && !FEATURE_ACCESS[planTier].dealExport) {
    return {
      valid: false,
      error: 'Deal Export ist nicht verfuegbar. Bitte upgraden Sie Ihren Plan.',
      code: 'PLAN_REQUIRED',
    };
  }

  if (exportType === 'leads' && !FEATURE_ACCESS[planTier].bulkExport) {
    return {
      valid: false,
      error: 'Bulk Export ist eine Enterprise-Funktion. Bitte upgraden Sie auf Enterprise.',
      code: 'PLAN_REQUIRED',
    };
  }

  // 4. Row limit check
  const limits = EXPORT_LIMITS[planTier];
  if (rowCount > limits.maxRows) {
    return {
      valid: false,
      error: `Maximal ${limits.maxRows.toLocaleString('de-DE')} Zeilen fuer Ihren Plan erlaubt. Filtern Sie Ihre Daten oder upgraden Sie.`,
      code: 'LIMIT_EXCEEDED',
    };
  }

  return { valid: true };
}

/**
 * Validate template creation against plan limits
 */
export async function validateTemplateLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: PlanTier
): Promise<{ valid: boolean; currentCount: number; maxCount: number; error?: string }> {
  const limits = EXPORT_LIMITS[planTier];

  // Check if templates are available for plan
  if (!FEATURE_ACCESS[planTier].templates) {
    return {
      valid: false,
      currentCount: 0,
      maxCount: 0,
      error: 'Templates sind eine Pro-Funktion. Bitte upgraden Sie Ihren Plan.',
    };
  }

  // Get current template count
  const { count, error } = await supabase
    .from('export_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting templates:', error);
    return {
      valid: false,
      currentCount: 0,
      maxCount: limits.maxTemplates,
      error: 'Fehler beim Pruefen des Template-Limits.',
    };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.maxTemplates) {
    return {
      valid: false,
      currentCount,
      maxCount: limits.maxTemplates,
      error: `Sie haben das Limit von ${limits.maxTemplates} Templates erreicht. Loeschen Sie bestehende Templates oder upgraden Sie auf Enterprise fuer unbegrenzte Templates.`,
    };
  }

  return {
    valid: true,
    currentCount,
    maxCount: limits.maxTemplates,
  };
}

/**
 * Validate scheduled export creation (Enterprise only)
 */
export function validateScheduledExport(planTier: PlanTier): ValidationResult {
  if (!FEATURE_ACCESS[planTier].scheduledExports) {
    return {
      valid: false,
      error: 'Geplante Exporte sind eine Enterprise-Funktion. Bitte upgraden Sie auf Enterprise.',
      code: 'PLAN_REQUIRED',
    };
  }

  return { valid: true };
}

/**
 * Validate scheduled export limit
 */
export async function validateScheduledExportLimit(
  supabase: SupabaseClient,
  userId: string,
  planTier: PlanTier
): Promise<{ valid: boolean; currentCount: number; maxCount: number; error?: string }> {
  const limits = EXPORT_LIMITS[planTier];

  if (!FEATURE_ACCESS[planTier].scheduledExports) {
    return {
      valid: false,
      currentCount: 0,
      maxCount: 0,
      error: 'Geplante Exporte sind eine Enterprise-Funktion.',
    };
  }

  const { count, error } = await supabase
    .from('scheduled_exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting scheduled exports:', error);
    return {
      valid: false,
      currentCount: 0,
      maxCount: limits.maxScheduled,
      error: 'Fehler beim Pruefen des Limits.',
    };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.maxScheduled) {
    return {
      valid: false,
      currentCount,
      maxCount: limits.maxScheduled,
      error: `Sie haben das Limit von ${limits.maxScheduled} geplanten Exporten erreicht.`,
    };
  }

  return {
    valid: true,
    currentCount,
    maxCount: limits.maxScheduled,
  };
}

// ============================================
// RATE LIMITING
// ============================================

const RATE_LIMITS = {
  exportsPerMinute: 5,
  exportsPerHour: 50,
  maxConcurrent: 1, // Only one running export per user
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // Seconds to wait
  error?: string;
}

/**
 * Check rate limits for export requests
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  // 1. Check for running exports
  const { data: running, error: runningError } = await supabase
    .from('export_logs')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (runningError) {
    console.error('Error checking running exports:', runningError);
  }

  if (running && running.length >= RATE_LIMITS.maxConcurrent) {
    return {
      allowed: false,
      retryAfter: 60,
      error: 'Ein Export laeuft bereits. Bitte warten Sie, bis der aktuelle Export abgeschlossen ist.',
    };
  }

  // 2. Check per-minute limit
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: minuteCount, error: minuteError } = await supabase
    .from('export_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo);

  if (minuteError) {
    console.error('Error checking minute limit:', minuteError);
  }

  if (minuteCount && minuteCount >= RATE_LIMITS.exportsPerMinute) {
    return {
      allowed: false,
      retryAfter: 60,
      error: `Zu viele Export-Anfragen. Maximal ${RATE_LIMITS.exportsPerMinute} Exporte pro Minute erlaubt.`,
    };
  }

  // 3. Check per-hour limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourCount, error: hourError } = await supabase
    .from('export_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (hourError) {
    console.error('Error checking hour limit:', hourError);
  }

  if (hourCount && hourCount >= RATE_LIMITS.exportsPerHour) {
    return {
      allowed: false,
      retryAfter: 3600,
      error: `Stunden-Limit erreicht. Maximal ${RATE_LIMITS.exportsPerHour} Exporte pro Stunde erlaubt.`,
    };
  }

  return { allowed: true };
}

// ============================================
// PLAN UTILITIES
// ============================================

/**
 * Get user's plan tier from database
 */
export async function getUserPlanTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  try {
    const { data, error } = await supabase.rpc('get_user_plan', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting user plan:', error);
      return 'free';
    }

    const plan = (data || 'free') as PlanTier;
    return ['free', 'pro', 'enterprise'].includes(plan) ? plan : 'free';
  } catch (error) {
    console.error('Error in getUserPlanTier:', error);
    return 'free';
  }
}

/**
 * Check if user has Pro or higher plan
 */
export function isProOrHigher(planTier: PlanTier): boolean {
  return planTier === 'pro' || planTier === 'enterprise';
}

/**
 * Check if user has Enterprise plan
 */
export function isEnterprise(planTier: PlanTier): boolean {
  return planTier === 'enterprise';
}

/**
 * Get max rows for plan
 */
export function getMaxRowsForPlan(planTier: PlanTier): number {
  return EXPORT_LIMITS[planTier].maxRows;
}

/**
 * Get retention days for plan
 */
export function getRetentionDaysForPlan(planTier: PlanTier): number {
  return EXPORT_LIMITS[planTier].retentionDays;
}

/**
 * Format plan limits for display
 */
export function formatPlanLimits(planTier: PlanTier): string {
  const limits = EXPORT_LIMITS[planTier];

  if (planTier === 'free') {
    return 'Export nicht verfuegbar';
  }

  if (planTier === 'pro') {
    return `Max. ${limits.maxRows.toLocaleString('de-DE')} Zeilen, ${limits.maxTemplates} Templates, ${limits.retentionDays} Tage Aufbewahrung`;
  }

  return `Max. ${limits.maxRows.toLocaleString('de-DE')} Zeilen, Unbegrenzte Templates, ${limits.retentionDays} Tage Aufbewahrung`;
}

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Check if a specific feature is available for the plan
 */
export function isFeatureAvailable(
  planTier: PlanTier,
  feature: keyof typeof FEATURE_ACCESS['free']
): boolean {
  return FEATURE_ACCESS[planTier][feature] ?? false;
}

/**
 * Get all available features for a plan
 */
export function getAvailableFeatures(planTier: PlanTier): string[] {
  const features = FEATURE_ACCESS[planTier];
  return Object.entries(features)
    .filter(([, available]) => available)
    .map(([feature]) => feature);
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(
  currentPlan: PlanTier,
  requiredFeature: keyof typeof FEATURE_ACCESS['free']
): string {
  const requiredPlan = requiredFeature === 'csv' || requiredFeature === 'dealExport'
    ? 'pro'
    : 'enterprise';

  if (requiredPlan === 'pro') {
    return 'Diese Funktion ist mit Pro verfuegbar. Moechten Sie upgraden?';
  }

  return 'Diese Funktion ist mit Enterprise verfuegbar. Moechten Sie upgraden?';
}
