/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs - List audit logs
 * POST /api/admin/audit-logs - Export audit logs
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { auditLogQuerySchema, exportAuditLogsSchema } from '@/lib/admin/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

// GET - List audit logs
export async function GET(request: Request) {
  // BUG-2 FIX: Apply rate limiting (readonly - 2000 req/min for GET)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.READONLY);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const supabase = await createClient();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = auditLogQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      action,
      target_type,
      target_id,
      admin_id,
      from,
      to,
      page,
      limit,
    } = validated.data;

    // Build query
    let dbQuery = supabase
      .from('admin_audit_logs')
      .select(
        `
        *,
        admin:profiles!admin_id(id, email, full_name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (action) {
      dbQuery = dbQuery.eq('action', action);
    }

    if (target_type) {
      dbQuery = dbQuery.eq('target_type', target_type);
    }

    if (target_id) {
      dbQuery = dbQuery.eq('target_id', target_id);
    }

    if (admin_id) {
      dbQuery = dbQuery.eq('admin_id', admin_id);
    }

    if (from) {
      dbQuery = dbQuery.gte('created_at', from);
    }

    if (to) {
      dbQuery = dbQuery.lte('created_at', to);
    }

    // Sorting
    dbQuery = dbQuery.order('created_at', { ascending: false });

    // Pagination
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;
    dbQuery = dbQuery.range(fromIndex, toIndex);

    const { data: logs, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Audit-Logs' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST - Export audit logs
export async function POST(request: Request) {
  // BUG-2 FIX: Apply rate limiting (standard - 1000 req/min for export)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STANDARD);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const supabase = await createClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = exportAuditLogsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { from, to, format } = validated.data;

    // Build query for export
    let dbQuery = supabase
      .from('admin_audit_logs')
      .select(
        `
        *,
        admin:profiles!admin_id(email, full_name)
      `
      )
      .order('created_at', { ascending: false });

    if (from) {
      dbQuery = dbQuery.gte('created_at', from);
    }

    if (to) {
      dbQuery = dbQuery.lte('created_at', to);
    }

    // Limit to 10000 records for export
    dbQuery = dbQuery.limit(10000);

    const { data: logs, error } = await dbQuery;

    if (error) {
      console.error('Error exporting audit logs:', error);
      return NextResponse.json(
        { error: 'Fehler beim Exportieren der Audit-Logs' },
        { status: 500 }
      );
    }

    // Format based on requested format
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address'];
      const rows = (logs || []).map((log: any) => [
        log.id,
        log.created_at,
        log.admin?.email || 'Unknown',
        log.action,
        log.target_type,
        log.target_id || '',
        JSON.stringify(log.details),
        log.ip_address || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      logs: logs || [],
      export_info: {
        total_records: logs?.length || 0,
        format,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error exporting audit logs:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
