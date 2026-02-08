// POST /api/export/contacts
// Export contacts to CSV or Excel (Pro+ feature)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ExportContactsRequestSchema,
  ContactColumn,
} from '@/lib/export/validation';
import {
  csvGenerator,
  excelGenerator,
  getColumnsForExportType,
  filterColumns,
  generateExportFilename,
  shouldUseAsync,
  calculateExpirationDate,
} from '@/lib/export/engine';
import {
  validateExportRequest,
  getUserPlanTier,
  checkRateLimit,
} from '@/lib/export/plan-gating';
import { notifyExportComplete, notifyExportFailed } from '@/lib/notifications/integrations';
import {
  uploadExportFile,
  generateDownloadUrl,
  generateDisplayFilename,
} from '@/lib/export/storage';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Get user plan
    const planTier = await getUserPlanTier(supabase, user.id);

    // 3. Check rate limits
    const rateLimit = await checkRateLimit(supabase, user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error, code: 'RATE_LIMIT_EXCEEDED', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = ExportContactsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params = validation.data;

    // 5. Build query to get data
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (params.filters?.tags && params.filters.tags.length > 0) {
      // Filter by tags - requires joining with contact_tag_assignments
      // For simplicity, we'll fetch contacts with their tags and filter in memory
    }

    if (params.filters?.hasEmail) {
      query = query.not('email', 'is', null);
    }

    if (params.filters?.hasPhone) {
      query = query.not('phone', 'is', null);
    }

    if (params.filters?.dateFrom) {
      query = query.gte('created_at', params.filters.dateFrom);
    }

    if (params.filters?.dateTo) {
      query = query.lte('created_at', params.filters.dateTo);
    }

    // 6. Get total count first (build separate count query)
    let countQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    if (params.filters?.hasEmail) {
      countQuery = countQuery.not('email', 'is', null);
    }
    if (params.filters?.hasPhone) {
      countQuery = countQuery.not('phone', 'is', null);
    }
    if (params.filters?.dateFrom) {
      countQuery = countQuery.gte('created_at', params.filters.dateFrom);
    }
    if (params.filters?.dateTo) {
      countQuery = countQuery.lte('created_at', params.filters.dateTo);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting contacts:', countError);
      return NextResponse.json(
        { error: 'Fehler beim Zaehlen der Kontakte', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const rowCount = count || 0;

    // 7. Validate against plan limits
    const planValidation = validateExportRequest(planTier, params.format, 'contacts', rowCount);
    if (!planValidation.valid) {
      return NextResponse.json(
        { error: planValidation.error, code: planValidation.code },
        { status: 403 }
      );
    }

    // 8. Check if data exists
    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Keine Kontakte zum Exportieren gefunden. Passen Sie Ihre Filter an.', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // 9. Determine sync vs async
    const useAsync = params.async || shouldUseAsync(rowCount);

    // Get column definitions
    const allColumns = getColumnsForExportType('contacts');
    const selectedColumns = filterColumns(allColumns, params.columns as string[]);

    // 10. ASYNC: Create export job and return immediately
    if (useAsync) {
      const expiresAt = calculateExpirationDate(planTier);
      const fileName = generateDisplayFilename('contacts', params.format);

      // Create export log entry
      const { data: exportLog, error: insertError } = await supabase
        .from('export_logs')
        .insert({
          user_id: user.id,
          export_type: 'contacts',
          status: 'pending',
          format: params.format,
          file_name: fileName,
          row_count: rowCount,
          column_selection: params.columns,
          filters_applied: params.filters || {},
          template_id: params.templateId || null,
          source_type: 'contacts',
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single();

      if (insertError || !exportLog) {
        console.error('Error creating export log:', insertError);
        return NextResponse.json(
          { error: 'Fehler beim Erstellen des Export-Jobs', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      // Return async response
      return NextResponse.json({
        success: true,
        exportId: exportLog.id,
        status: 'pending',
        estimatedSeconds: Math.ceil(rowCount * 0.01) + 2,
        checkStatusUrl: `/api/export/status/${exportLog.id}`,
      });
    }

    // 11. SYNC: Generate and return file immediately
    // Fetch all contacts
    const { data: contacts, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (fetchError) {
      console.error('Error fetching contacts:', fetchError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Kontakte', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Format data for export
    const formattedData = contacts.map(contact => {
      const data: Record<string, any> = { ...contact };

      // Add computed columns
      if (params.columns.includes('interaction_count')) {
        data.interaction_count = 0; // Would need to fetch from interactions table
      }
      if (params.columns.includes('deal_count')) {
        data.deal_count = 0; // Would need to fetch from deals table
      }

      return data;
    });

    // Generate file
    let fileBuffer: Buffer;
    let contentType: string;

    if (params.format === 'csv') {
      fileBuffer = csvGenerator.generateBuffer(selectedColumns, formattedData);
      contentType = 'text/csv; charset=utf-8';
    } else {
      fileBuffer = await excelGenerator.generate(
        formattedData,
        selectedColumns,
        { sheetName: 'Kontakte' }
      );
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    const fileName = generateDisplayFilename('contacts', params.format);

    // Log the export
    const expiresAt = calculateExpirationDate(planTier);
    const { data: exportLog } = await supabase
      .from('export_logs')
      .insert({
        user_id: user.id,
        export_type: 'contacts',
        status: 'completed',
        format: params.format,
        file_name: fileName,
        file_size_bytes: fileBuffer.length,
        row_count: rowCount,
        column_selection: params.columns,
        filters_applied: params.filters || {},
        template_id: params.templateId || null,
        source_type: 'contacts',
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Upload to storage (for history tracking)
    if (exportLog) {
      await uploadExportFile(user.id, exportLog.id, params.format, fileBuffer);

      // Send notification for completed export
      await notifyExportComplete(
        supabase,
        user.id,
        exportLog.id,
        fileName,
        rowCount,
        params.format
      );
    }

    // Return file directly (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in contacts export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
