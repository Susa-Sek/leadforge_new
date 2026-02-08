// DELETE /api/export/history/[id]
// Delete export from history and remove file

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteExportFile } from '@/lib/export/storage';

export async function DELETE(
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
    const { data: exportLog, error: fetchError } = await supabase
      .from('export_logs')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !exportLog) {
      return NextResponse.json(
        { error: 'Export nicht gefunden', code: 'EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Delete file from storage if exists
    if (exportLog.file_path) {
      const { success, error: deleteError } = await deleteExportFile(exportLog.file_path);
      if (!success) {
        console.warn('Could not delete export file:', deleteError);
        // Continue anyway - we still want to remove the log entry
      }
    }

    // 4. Delete export log entry
    const { error: deleteLogError } = await supabase
      .from('export_logs')
      .delete()
      .eq('id', exportId)
      .eq('user_id', user.id);

    if (deleteLogError) {
      console.error('Error deleting export log:', deleteLogError);
      return NextResponse.json(
        { error: 'Fehler beim Loeschen des Export-Eintrags', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Export erfolgreich aus der History geloescht',
      exportId: exportId,
    });

  } catch (error) {
    console.error('Error in delete export history:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
