// GET /api/export/history
// Get export history for the current user

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const exportType = searchParams.get('type');

    // 3. Build query
    let query = supabase
      .from('export_logs')
      .select(`
        id,
        export_type,
        status,
        format,
        file_name,
        file_size_bytes,
        row_count,
        created_at,
        expires_at,
        completed_at,
        template:template_id(name)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (exportType) {
      query = query.eq('export_type', exportType);
    }

    // 4. Execute query with pagination
    const { data: exports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching export history:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Export-History', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 5. Format response
    const formattedExports = exports?.map(exp => ({
      id: exp.id,
      exportType: exp.export_type,
      status: exp.status,
      format: exp.format,
      fileName: exp.file_name,
      fileSize: exp.file_size_bytes,
      rowCount: exp.row_count,
      createdAt: exp.created_at,
      expiresAt: exp.expires_at,
      completedAt: exp.completed_at,
      templateName: exp.template?.[0]?.name,
    })) || [];

    return NextResponse.json({
      exports: formattedExports,
      pagination: {
        limit,
        offset,
        hasMore: formattedExports.length === limit,
      },
    });

  } catch (error) {
    console.error('Error in export history:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
