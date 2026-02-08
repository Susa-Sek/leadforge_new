/**
 * Export Status Webhook
 *
 * POST /api/export/webhook
 *
 * Internal webhook for background export processors to notify
 * when async exports complete or fail.
 *
 * Body:
 * - exportId: string
 * - status: 'completed' | 'failed'
 * - filePath?: string (for completed)
 * - fileSize?: number (for completed)
 * - errorMessage?: string (for failed)
 *
 * @module ExportAPI
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyExportComplete, notifyExportFailed } from '@/lib/notifications/integrations';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate (only internal services or authenticated users)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      exportId,
      status,
      filePath,
      fileSize,
      errorMessage,
    } = body;

    if (!exportId || !status) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: exportId, status', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 3. Fetch export log
    const { data: exportLog, error: fetchError } = await supabase
      .from('export_logs')
      .select('*')
      .eq('id', exportId)
      .single();

    if (fetchError || !exportLog) {
      return NextResponse.json(
        { error: 'Export nicht gefunden', code: 'EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Verify user owns this export
    if (exportLog.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 5. Update export status and send notification
    if (status === 'completed') {
      // Update export log
      const { error: updateError } = await supabase
        .from('export_logs')
        .update({
          status: 'completed',
          file_path: filePath || exportLog.file_path,
          file_size_bytes: fileSize || exportLog.file_size_bytes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId);

      if (updateError) {
        console.error('Error updating export status:', updateError);
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren des Export-Status', code: 'UPDATE_FAILED' },
          { status: 500 }
        );
      }

      // Send completion notification
      await notifyExportComplete(
        supabase,
        user.id,
        exportId,
        exportLog.file_name,
        exportLog.row_count,
        exportLog.format
      );

      return NextResponse.json({
        success: true,
        message: 'Export als abgeschlossen markiert',
        exportId,
        status: 'completed',
      });
    }

    if (status === 'failed') {
      // Update export log
      const { error: updateError } = await supabase
        .from('export_logs')
        .update({
          status: 'failed',
          error_message: errorMessage || 'Export fehlgeschlagen',
        })
        .eq('id', exportId);

      if (updateError) {
        console.error('Error updating export status:', updateError);
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren des Export-Status', code: 'UPDATE_FAILED' },
          { status: 500 }
        );
      }

      // Send failure notification
      await notifyExportFailed(
        supabase,
        user.id,
        exportId,
        exportLog.file_name,
        errorMessage || 'Export fehlgeschlagen'
      );

      return NextResponse.json({
        success: true,
        message: 'Export als fehlgeschlagen markiert',
        exportId,
        status: 'failed',
      });
    }

    return NextResponse.json(
      { error: 'Ungueltiger Status', code: 'INVALID_STATUS' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in export webhook:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
