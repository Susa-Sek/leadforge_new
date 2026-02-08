// GET /api/export/scheduled - List scheduled exports
// POST /api/export/scheduled - Create scheduled export (Enterprise only)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateScheduledExportRequestSchema,
} from '@/lib/export/validation';
import {
  validateScheduledExport,
  validateScheduledExportLimit,
  getUserPlanTier,
} from '@/lib/export/plan-gating';

// GET - List scheduled exports
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

    // 2. Check plan (Enterprise only)
    const planTier = await getUserPlanTier(supabase, user.id);
    const validation = validateScheduledExport(planTier);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: 403 }
      );
    }

    // 3. Fetch scheduled exports with template info
    const { data: scheduledExports, error } = await supabase
      .from('scheduled_exports')
      .select(`
        *,
        template:template_id(name)
      `)
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching scheduled exports:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der geplanten Exporte', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 4. Format response
    const formattedExports = scheduledExports?.map(exp => ({
      id: exp.id,
      name: exp.name,
      templateId: exp.template_id,
      templateName: exp.template?.name,
      frequency: exp.frequency,
      dayOfWeek: exp.day_of_week,
      dayOfMonth: exp.day_of_month,
      timeOfDay: exp.time_of_day,
      timezone: exp.timezone,
      isActive: exp.is_active,
      lastRunAt: exp.last_run_at,
      nextRunAt: exp.next_run_at,
      runCount: exp.run_count,
      successCount: exp.success_count,
      failCount: exp.fail_count,
      emailRecipients: exp.email_recipients,
      deliveryMethod: exp.delivery_method,
      createdAt: exp.created_at,
    })) || [];

    return NextResponse.json({ scheduledExports: formattedExports });

  } catch (error) {
    console.error('Error in list scheduled exports:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST - Create scheduled export
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

    // 2. Check plan (Enterprise only)
    const planTier = await getUserPlanTier(supabase, user.id);
    const validation = validateScheduledExport(planTier);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: 403 }
      );
    }

    // 3. Check scheduled export limits
    const limitCheck = await validateScheduledExportLimit(supabase, user.id, planTier);
    if (!limitCheck.valid) {
      return NextResponse.json(
        { error: limitCheck.error, code: 'LIMIT_EXCEEDED' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const schemaValidation = CreateScheduledExportRequestSchema.safeParse(body);

    if (!schemaValidation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: schemaValidation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params = schemaValidation.data;

    // 5. Validate template exists and belongs to user
    const { data: template, error: templateError } = await supabase
      .from('export_templates')
      .select('*')
      .eq('id', params.templateId)
      .eq('user_id', user.id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template nicht gefunden', code: 'TEMPLATE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 6. Validate frequency-specific fields
    if (params.frequency === 'weekly' && params.dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'Tag der Woche ist fuer woechentliche Exporte erforderlich', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    if (params.frequency === 'monthly' && params.dayOfMonth === undefined) {
      return NextResponse.json(
        { error: 'Tag des Monats ist fuer monatliche Exporte erforderlich', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 7. Create scheduled export (next_run_at is calculated by trigger)
    const { data: scheduledExport, error } = await supabase
      .from('scheduled_exports')
      .insert({
        user_id: user.id,
        template_id: params.templateId,
        name: params.name,
        frequency: params.frequency,
        day_of_week: params.dayOfWeek,
        day_of_month: params.dayOfMonth,
        time_of_day: params.timeOfDay,
        timezone: params.timezone,
        is_active: true,
        email_recipients: params.emailRecipients,
        delivery_method: params.deliveryMethod,
      })
      .select(`
        *,
        template:template_id(name)
      `)
      .single();

    if (error) {
      console.error('Error creating scheduled export:', error);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des geplanten Exports', code: 'DATABASE_ERROR' },
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
        createdAt: scheduledExport.created_at,
      },
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error in create scheduled export:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
