// POST /api/export/deals
// Export deals to CSV or Excel (Pro+ feature)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ExportDealsRequestSchema,
} from '@/lib/export/validation';
import {
  csvGenerator,
  excelGenerator,
  getColumnsForExportType,
  filterColumns,
  shouldUseAsync,
  calculateExpirationDate,
} from '@/lib/export/engine';
import {
  validateExportRequest,
  getUserPlanTier,
  checkRateLimit,
} from '@/lib/export/plan-gating';
import {
  uploadExportFile,
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
    const validation = ExportDealsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params = validation.data;

    // 5. Build query to get data
    let query = supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(name, company, email, phone)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (params.filters?.stages && params.filters.stages.length > 0) {
      query = query.in('stage', params.filters.stages);
    }

    if (params.filters?.status && params.filters.status.length > 0) {
      const statusConditions = params.filters.status.map(status => {
        if (status === 'open') return { is_won: null, is_closed: false };
        if (status === 'won') return { is_won: true, is_closed: true };
        if (status === 'lost') return { is_won: false, is_closed: true };
        return {};
      });

      // Apply status filter (simplified - would need custom logic for complex cases)
      if (params.filters.status.includes('open')) {
        query = query.is('is_won', null);
      } else if (params.filters.status.includes('won') && !params.filters.status.includes('lost')) {
        query = query.eq('is_won', true);
      } else if (params.filters.status.includes('lost') && !params.filters.status.includes('won')) {
        query = query.eq('is_won', false);
      }
    }

    if (params.filters?.valueMin !== undefined) {
      query = query.gte('value', params.filters.valueMin);
    }

    if (params.filters?.valueMax !== undefined) {
      query = query.lte('value', params.filters.valueMax);
    }

    if (params.filters?.dateFrom) {
      query = query.gte('created_at', params.filters.dateFrom);
    }

    if (params.filters?.dateTo) {
      query = query.lte('created_at', params.filters.dateTo);
    }

    // 6. Get total count (build separate count query)
    let countQuery = supabase.from('deals').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    if (params.filters?.valueMin !== undefined) {
      countQuery = countQuery.gte('value', params.filters.valueMin);
    }
    if (params.filters?.valueMax !== undefined) {
      countQuery = countQuery.lte('value', params.filters.valueMax);
    }
    if (params.filters?.dateFrom) {
      countQuery = countQuery.gte('created_at', params.filters.dateFrom);
    }
    if (params.filters?.dateTo) {
      countQuery = countQuery.lte('created_at', params.filters.dateTo);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting deals:', countError);
      return NextResponse.json(
        { error: 'Fehler beim Zaehlen der Deals', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const rowCount = count || 0;

    // 7. Validate against plan limits
    const planValidation = validateExportRequest(planTier, params.format, 'deals', rowCount);
    if (!planValidation.valid) {
      return NextResponse.json(
        { error: planValidation.error, code: planValidation.code },
        { status: 403 }
      );
    }

    // 8. Check if data exists
    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Keine Deals zum Exportieren gefunden. Passen Sie Ihre Filter an.', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // 9. Determine sync vs async
    const useAsync = params.async || shouldUseAsync(rowCount);

    // Get column definitions
    const allColumns = getColumnsForExportType('deals');
    const selectedColumns = filterColumns(allColumns, params.columns as string[]);

    // 10. ASYNC: Create export job
    if (useAsync) {
      const expiresAt = calculateExpirationDate(planTier);
      const fileName = generateDisplayFilename('deals', params.format);

      const { data: exportLog, error: insertError } = await supabase
        .from('export_logs')
        .insert({
          user_id: user.id,
          export_type: 'deals',
          status: 'pending',
          format: params.format,
          file_name: fileName,
          row_count: rowCount,
          column_selection: params.columns,
          filters_applied: params.filters || {},
          template_id: params.templateId || null,
          source_type: 'deals',
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

      return NextResponse.json({
        success: true,
        exportId: exportLog.id,
        status: 'pending',
        estimatedSeconds: Math.ceil(rowCount * 0.01) + 2,
        checkStatusUrl: `/api/export/status/${exportLog.id}`,
      });
    }

    // 11. SYNC: Generate and return file immediately
    const { data: deals, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (fetchError) {
      console.error('Error fetching deals:', fetchError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Deals', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Format data for export
    const formattedData = deals.map(deal => {
      const data: Record<string, any> = {
        ...deal,
        stage: deal.stage?.name || deal.stage,
        contact_name: deal.contact?.name || '',
        contact_company: deal.contact?.company || '',
        contact_email: deal.contact?.email || '',
        contact_phone: deal.contact?.phone || '',
        status: deal.is_won === null ? 'Offen' : deal.is_won === true ? 'Gewonnen' : 'Verloren',
      };

      // Add computed columns
      if (params.columns.includes('days_in_pipeline') && deal.created_at) {
        const created = new Date(deal.created_at);
        const now = new Date();
        data.days_in_pipeline = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (params.columns.includes('weighted_value') && deal.value && deal.probability) {
        data.weighted_value = deal.value * (deal.probability / 100);
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
        { sheetName: 'Deals', includeSummary: true }
      );
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    const fileName = generateDisplayFilename('deals', params.format);

    // Log the export
    const expiresAt = calculateExpirationDate(planTier);
    const { data: exportLog } = await supabase
      .from('export_logs')
      .insert({
        user_id: user.id,
        export_type: 'deals',
        status: 'completed',
        format: params.format,
        file_name: fileName,
        file_size_bytes: fileBuffer.length,
        row_count: rowCount,
        column_selection: params.columns,
        filters_applied: params.filters || {},
        template_id: params.templateId || null,
        source_type: 'deals',
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Upload to storage
    if (exportLog) {
      await uploadExportFile(user.id, exportLog.id, params.format, fileBuffer);
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
    console.error('Error in deals export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
