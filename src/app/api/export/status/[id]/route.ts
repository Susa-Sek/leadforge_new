// GET /api/export/status/[id]
// Check export status and get download URL when complete

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDownloadUrl } from '@/lib/export/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: exportId } = await params;

    // 2. Fetch export log
    const { data: exportLog, error } = await supabase
      .from('export_logs')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (error || !exportLog) {
      return NextResponse.json(
        { error: 'Export nicht gefunden', code: 'EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Build response based on status
    const response: any = {
      exportId: exportLog.id,
      status: exportLog.status,
      exportType: exportLog.export_type,
      format: exportLog.format,
      rowCount: exportLog.row_count,
      processedRows: exportLog.processed_rows,
      createdAt: exportLog.created_at,
      fileName: exportLog.file_name,
    };

    // Calculate progress for processing state
    if (exportLog.status === 'processing' && exportLog.row_count > 0) {
      response.progress = Math.min(
        100,
        Math.round((exportLog.processed_rows / exportLog.row_count) * 100)
      );
    }

    // Add download URL for completed exports
    if (exportLog.status === 'completed') {
      // Check if expired
      const expiresAt = new Date(exportLog.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Export ist abgelaufen', code: 'EXPORT_EXPIRED', expiresAt: exportLog.expires_at },
          { status: 410 }
        );
      }

      // Generate signed download URL
      if (exportLog.file_path) {
        const { success, signedUrl, error: urlError } = await generateDownloadUrl(
          exportLog.file_path,
          3600 // 1 hour
        );

        if (success && signedUrl) {
          response.downloadUrl = signedUrl;
          response.fileSize = exportLog.file_size_bytes;
        }
      }

      response.completedAt = exportLog.completed_at;
      response.expiresAt = exportLog.expires_at;
    }

    // Add error message for failed exports
    if (exportLog.status === 'failed') {
      response.errorMessage = exportLog.error_message;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking export status:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
