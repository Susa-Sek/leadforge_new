// POST /api/export/bulk
// Bulk export from search results or collections (Enterprise feature)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ExportLeadsRequestSchema,
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
    const validation = ExportLeadsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params = validation.data;

    // 5. Determine source (search results or collection)
    const sourceType = body.source || 'search_results'; // 'search_results' or 'collection'
    const collectionId = body.collectionId;

    let query;

    if (sourceType === 'collection' && collectionId) {
      // Export from collection
      query = supabase
        .from('collection_items')
        .select(`
          *,
          search_result:search_results(*)
        `)
        .eq('collection_id', collectionId)
        .eq('user_id', user.id);
    } else {
      // Export from search results (default)
      query = supabase
        .from('search_results')
        .select('*')
        .eq('user_id', user.id);

      // Filter by search history ID
      if (params.filters?.searchHistoryId) {
        query = query.eq('search_id', params.filters.searchHistoryId);
      }

      // Filter for specific IDs (selected leads)
      if (params.selectedIds && params.selectedIds.length > 0) {
        query = query.in('id', params.selectedIds);
      }

      // Apply filters
      if (params.filters?.hasEmail) {
        query = query.not('email', 'is', null);
      }

      if (params.filters?.hasPhone) {
        query = query.not('phone', 'is', null);
      }

      if (params.filters?.hasWebsite) {
        query = query.not('website', 'is', null);
      }
    }

    // 6. Get total count
    // Build separate count query to avoid type issues
    let countQuery = sourceType === 'collection' && collectionId
      ? supabase.from('collection_items').select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)
      : supabase.from('search_results').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Apply same filters to count query
    if (sourceType !== 'collection' || !collectionId) {
      if (params.filters?.searchHistoryId) {
        countQuery = countQuery.eq('search_id', params.filters.searchHistoryId);
      }
      if (params.selectedIds && params.selectedIds.length > 0) {
        countQuery = countQuery.in('id', params.selectedIds);
      }
      if (params.filters?.hasEmail) {
        countQuery = countQuery.not('email', 'is', null);
      }
      if (params.filters?.hasPhone) {
        countQuery = countQuery.not('phone', 'is', null);
      }
      if (params.filters?.hasWebsite) {
        countQuery = countQuery.not('website', 'is', null);
      }
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting leads:', countError);
      return NextResponse.json(
        { error: 'Fehler beim Zaehlen der Leads', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const rowCount = count || 0;

    // 7. Validate against plan limits (bulk export = Enterprise)
    const planValidation = validateExportRequest(planTier, params.format, 'leads', rowCount);
    if (!planValidation.valid) {
      return NextResponse.json(
        { error: planValidation.error, code: planValidation.code },
        { status: 403 }
      );
    }

    // 8. Check if data exists
    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Keine Daten zum Exportieren gefunden. Passen Sie Ihre Filter an.', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // 9. Determine sync vs async
    const useAsync = params.async || shouldUseAsync(rowCount);

    // Get column definitions
    const allColumns = getColumnsForExportType('leads');
    const selectedColumns = filterColumns(allColumns, params.columns as string[]);

    // 10. ASYNC: Create export job
    if (useAsync) {
      const expiresAt = calculateExpirationDate(planTier);
      const fileName = generateDisplayFilename('leads', params.format);

      const { data: exportLog, error: insertError } = await supabase
        .from('export_logs')
        .insert({
          user_id: user.id,
          export_type: 'leads',
          status: 'pending',
          format: params.format,
          file_name: fileName,
          row_count: rowCount,
          column_selection: params.columns,
          filters_applied: params.filters || {},
          template_id: params.templateId || null,
          source_type: sourceType,
          source_query: params.filters?.searchHistoryId || null,
          source_collection_id: collectionId || null,
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
    const { data: leads, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Leads', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // Format data for export
    let formattedData: Record<string, any>[];

    if (sourceType === 'collection') {
      // Extract search_result from collection items
      formattedData = leads.map((item: any) => ({
        ...item.search_result,
        search_date: item.created_at,
        added_to_collection_at: item.created_at,
      }));
    } else {
      formattedData = leads.map(lead => ({
        ...lead,
        search_date: lead.created_at,
      }));
    }

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
        { sheetName: 'Leads' }
      );
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    const fileName = generateDisplayFilename('leads', params.format);

    // Log the export
    const expiresAt = calculateExpirationDate(planTier);
    const { data: exportLog } = await supabase
      .from('export_logs')
      .insert({
        user_id: user.id,
        export_type: 'leads',
        status: 'completed',
        format: params.format,
        file_name: fileName,
        file_size_bytes: fileBuffer.length,
        row_count: rowCount,
        column_selection: params.columns,
        filters_applied: params.filters || {},
        template_id: params.templateId || null,
        source_type: sourceType,
        source_query: params.filters?.searchHistoryId || null,
        source_collection_id: collectionId || null,
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
    console.error('Error in bulk export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
