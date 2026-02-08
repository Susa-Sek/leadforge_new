// POST /api/export/cancel/[id]
// Cancel a pending or processing export

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteExportFile } from '@/lib/export/storage';

export async function POST(
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

    // 3. Check if export can be cancelled
    if (exportLog.status === 'completed') {
      return NextResponse.json(
        { error: 'Abgeschlossene Exporte koennen nicht abgebrochen werden', code: 'ALREADY_COMPLETED' },
        { status: 400 }
      );
    }

    if (exportLog.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Export wurde bereits abgebrochen', code: 'ALREADY_CANCELLED' },
        { status: 400 }
      );
    }

    if (exportLog.status === 'failed') {
      return NextResponse.json(
        { error: 'Fehlgeschlagene Exporte koennen nicht abgebrochen werden', code: 'ALREADY_FAILED' },
        { status: 400 }
      );
    }

    if (exportLog.status === 'expired') {
      return NextResponse.json(
        { error: 'Abgelaufene Exporte koennen nicht abgebrochen werden', code: 'ALREADY_EXPIRED' },
        { status: 400 }
      );
    }

    // 4. Update status to cancelled
    const { error: updateError } = await supabase
      .from('export_logs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', exportId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error cancelling export:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Abbrechen des Exports', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 5. Delete file if it was uploaded (for completed exports that somehow made it)
    if (exportLog.file_path) {
      await deleteExportFile(exportLog.file_path);
    }

    return NextResponse.json({
      success: true,
      message: 'Export erfolgreich abgebrochen',
      exportId: exportId,
    });

  } catch (error) {
    console.error('Error in cancel export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
