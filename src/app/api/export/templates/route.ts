// GET /api/export/templates - List templates
// POST /api/export/templates - Create template

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateTemplateRequestSchema,
} from '@/lib/export/validation';
import {
  validateTemplateLimit,
  getUserPlanTier,
} from '@/lib/export/plan-gating';

// GET - List templates
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
    const exportType = searchParams.get('type');

    // 3. Build query
    let query = supabase
      .from('export_templates')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (exportType) {
      query = query.eq('export_type', exportType);
    }

    // 4. Execute query
    const { data: templates, error } = await query
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Templates', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('Error in list templates:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST - Create template
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

    // 2. Get user plan
    const planTier = await getUserPlanTier(supabase, user.id);

    // 3. Check template limits
    const limitCheck = await validateTemplateLimit(supabase, user.id, planTier);
    if (!limitCheck.valid) {
      return NextResponse.json(
        { error: limitCheck.error, code: 'LIMIT_EXCEEDED' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = CreateTemplateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungueltige Anfrage', details: validation.error.issues, code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const params = validation.data;

    // 5. Check if public templates are allowed (Enterprise only)
    if (params.isPublic && planTier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Oeffentliche Templates sind eine Enterprise-Funktion', code: 'PLAN_REQUIRED' },
        { status: 403 }
      );
    }

    // 6. Create template
    const { data: template, error } = await supabase
      .from('export_templates')
      .insert({
        user_id: user.id,
        name: params.name,
        description: params.description,
        export_type: params.exportType,
        format: params.format,
        column_selection: params.columns,
        default_filters: params.defaultFilters,
        format_options: params.formatOptions,
        is_public: params.isPublic,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Templates', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in create template:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
