// POST /api/export/scheduled/[id]/toggle
// Toggle scheduled export active/inactive status

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateScheduledExport, getUserPlanTier } from '@/lib/export/plan-gating';

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

    // 2. Check plan (Enterprise only)
    const planTier = await getUserPlanTier(supabase, user.id);
    const planValidation = validateScheduledExport(planTier);
    if (!planValidation.valid) {
      return NextResponse.json(
        { error: planValidation.error, code: planValidation.code },
        { status: 403 }
      );
    }

    const { id: scheduledId } = await params;

    // 3. Fetch current scheduled export
    const { data: scheduledExport, error: fetchError } = await supabase
      .from('scheduled_exports')
      .select('*')
      .eq('id', scheduledId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !scheduledExport) {
      return NextResponse.json(
        { error: 'Geplanter Export nicht gefunden', code: 'SCHEDULED_EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Toggle status
    const newStatus = !scheduledExport.is_active;

    const { data: updatedExport, error } = await supabase
      .from('scheduled_exports')
      .update({
        is_active: newStatus,
      })
      .eq('id', scheduledId)
      .eq('user_id', user.id)
      .select(`
        *,
        template:template_id(name)
      `)
      .single();

    if (error) {
      console.error('Error toggling scheduled export:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aendern des Status', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 5. Format response
    const response = {
      success: true,
      scheduledExport: {
        id: updatedExport.id,
        name: updatedExport.name,
        templateId: updatedExport.template_id,
        templateName: updatedExport.template?.name,
        frequency: updatedExport.frequency,
        isActive: updatedExport.is_active,
        nextRunAt: updatedExport.next_run_at,
        lastRunAt: updatedExport.last_run_at,
      },
      message: newStatus ? 'Geplanter Export aktiviert' : 'Geplanter Export pausiert',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in toggle scheduled export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
