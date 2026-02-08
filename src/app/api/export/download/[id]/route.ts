// GET /api/export/download/[id]
// Get signed download URL for completed export

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
      .eq('status', 'completed')
      .single();

    if (error || !exportLog) {
      return NextResponse.json(
        { error: 'Export nicht gefunden oder nicht abgeschlossen', code: 'EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Check if export has expired
    const expiresAt = new Date(exportLog.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Export ist abgelaufen. Bitte fuehren Sie den Export erneut durch.', code: 'EXPORT_EXPIRED' },
        { status: 410 }
      );
    }

    // 4. Check if file exists
    if (!exportLog.file_path) {
      return NextResponse.json(
        { error: 'Export-Datei nicht gefunden', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 5. Generate fresh signed URL
    const { success, signedUrl, error: urlError } = await generateDownloadUrl(
      exportLog.file_path,
      3600 // 1 hour validity
    );

    if (!success || !signedUrl) {
      return NextResponse.json(
        { error: urlError || 'Fehler beim Erstellen der Download-URL', code: 'STORAGE_ERROR' },
        { status: 500 }
      );
    }

    // 6. Return download URL
    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      fileName: exportLog.file_name,
      fileSize: exportLog.file_size_bytes,
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
