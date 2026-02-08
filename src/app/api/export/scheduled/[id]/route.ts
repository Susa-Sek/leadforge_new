// PUT /api/export/scheduled/[id] - Update scheduled export
// DELETE /api/export/scheduled/[id] - Delete scheduled export

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  UpdateScheduledExportRequestSchema,
} from '@/lib/export/validation';
import { validateScheduledExport, getUserPlanTier } from '@/lib/export/plan-gating';

// PUT - Update scheduled export
export async function PUT(
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

    // 3. Check if scheduled export exists and belongs to user
    const { data: existingExport, error: fetchError } = await supabase
      .from('scheduled_exports')
      .select('*')
      .eq('id', scheduledId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingExport) {
      return NextResponse.json(
        { error: 'Geplanter Export nicht gefunden', code: 'SCHEDULED_EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = UpdateScheduledExportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params_validated = validation.data;

    // 5. Validate frequency-specific fields
    if (params_validated.frequency === 'weekly' && params_validated.dayOfWeek === undefined && !existingExport.day_of_week) {
      return NextResponse.json(
        { error: 'Tag der Woche ist fuer woechentliche Exporte erforderlich', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    if (params_validated.frequency === 'monthly' && params_validated.dayOfMonth === undefined && !existingExport.day_of_month) {
      return NextResponse.json(
        { error: 'Tag des Monats ist fuer monatliche Exporte erforderlich', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 6. Build update object
    const updateData: any = {};
    if (params_validated.name !== undefined) updateData.name = params_validated.name;
    if (params_validated.frequency !== undefined) updateData.frequency = params_validated.frequency;
    if (params_validated.dayOfWeek !== undefined) updateData.day_of_week = params_validated.dayOfWeek;
    if (params_validated.dayOfMonth !== undefined) updateData.day_of_month = params_validated.dayOfMonth;
    if (params_validated.timeOfDay !== undefined) updateData.time_of_day = params_validated.timeOfDay;
    if (params_validated.timezone !== undefined) updateData.timezone = params_validated.timezone;
    if (params_validated.emailRecipients !== undefined) updateData.email_recipients = params_validated.emailRecipients;
    if (params_validated.deliveryMethod !== undefined) updateData.delivery_method = params_validated.deliveryMethod;
    if (params_validated.isActive !== undefined) {
      updateData.is_active = params_validated.isActive;
      // If reactivating, next_run_at will be recalculated by trigger
    }

    // 7. Update scheduled export
    const { data: scheduledExport, error } = await supabase
      .from('scheduled_exports')
      .update(updateData)
      .eq('id', scheduledId)
      .eq('user_id', user.id)
      .select(`
        *,
        template:template_id(name)
      `)
      .single();

    if (error) {
      console.error('Error updating scheduled export:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des geplanten Exports', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 8. Format response
    const response = {
      success: true,
      scheduledExport: {
        id: scheduledExport.id,
        name: scheduledExport.name,
        templateId: scheduledExport.template_id,
        templateName: scheduledExport.template?.name,
        frequency: scheduledExport.frequency,
        dayOfWeek: scheduledExport.day_of_week,
        dayOfMonth: scheduledExport.day_of_month,
        timeOfDay: scheduledExport.time_of_day,
        timezone: scheduledExport.timezone,
        isActive: scheduledExport.is_active,
        nextRunAt: scheduledExport.next_run_at,
        emailRecipients: scheduledExport.email_recipients,
        deliveryMethod: scheduledExport.delivery_method,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in update scheduled export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE - Delete scheduled export
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

    // 3. Check if scheduled export exists
    const { data: existingExport, error: fetchError } = await supabase
      .from('scheduled_exports')
      .select('id')
      .eq('id', scheduledId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingExport) {
      return NextResponse.json(
        { error: 'Geplanter Export nicht gefunden', code: 'SCHEDULED_EXPORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Delete scheduled export
    const { error } = await supabase
      .from('scheduled_exports')
      .delete()
      .eq('id', scheduledId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scheduled export:', error);
      return NextResponse.json(
        { error: 'Fehler beim Loeschen des geplanten Exports', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Geplanter Export erfolgreich geloescht',
    });

  } catch (error) {
    console.error('Error in delete scheduled export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
