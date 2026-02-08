// PUT /api/export/templates/[id] - Update template
// DELETE /api/export/templates/[id] - Delete template

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  UpdateTemplateRequestSchema,
} from '@/lib/export/validation';
import { getUserPlanTier } from '@/lib/export/plan-gating';

// PUT - Update template
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

    const { id: templateId } = await params;

    // 2. Check if template exists and belongs to user
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('export_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template nicht gefunden', code: 'TEMPLATE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validation = UpdateTemplateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params_validated = validation.data;

    // 4. Check if making template public (Enterprise only)
    if (params_validated.isPublic !== undefined && params_validated.isPublic !== existingTemplate.is_public) {
      const planTier = await getUserPlanTier(supabase, user.id);
      if (params_validated.isPublic && planTier !== 'enterprise') {
        return NextResponse.json(
          { error: 'Oeffentliche Templates sind eine Enterprise-Funktion', code: 'PLAN_REQUIRED' },
          { status: 403 }
        );
      }
    }

    // 5. Build update object (only include provided fields)
    const updateData: any = {};
    if (params_validated.name !== undefined) updateData.name = params_validated.name;
    if (params_validated.description !== undefined) updateData.description = params_validated.description;
    if (params_validated.format !== undefined) updateData.format = params_validated.format;
    if (params_validated.columns !== undefined) updateData.column_selection = params_validated.columns;
    if (params_validated.defaultFilters !== undefined) updateData.default_filters = params_validated.defaultFilters;
    if (params_validated.formatOptions !== undefined) updateData.format_options = params_validated.formatOptions;
    if (params_validated.isPublic !== undefined) updateData.is_public = params_validated.isPublic;

    // 6. Update template
    const { data: template, error } = await supabase
      .from('export_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Templates', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error) {
    console.error('Error in update template:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
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

    const { id: templateId } = await params;

    // 2. Check if template is used by scheduled exports
    const { count: scheduledCount, error: countError } = await supabase
      .from('scheduled_exports')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId)
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error checking scheduled exports:', countError);
    }

    if (scheduledCount && scheduledCount > 0) {
      return NextResponse.json(
        { error: 'Template wird von geplanten Exporten verwendet. Bitte loeschen Sie diese zuerst.', code: 'TEMPLATE_IN_USE' },
        { status: 409 }
      );
    }

    // 3. Delete template
    const { error } = await supabase
      .from('export_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json(
        { error: 'Fehler beim Loeschen des Templates', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template erfolgreich geloescht',
    });

  } catch (error) {
    console.error('Error in delete template:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
