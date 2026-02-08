// Settings Profile API - Epic E13
// GET /api/settings/profile - Get user profile settings
// PATCH /api/settings/profile - Update user profile settings

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  first_name: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein').max(100, 'Vorname zu lang').optional(),
  last_name: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein').max(100, 'Nachname zu lang').optional(),
  company_name: z.string().max(200, 'Firmenname zu lang').optional().nullable(),
  job_title: z.string().max(100, 'Jobtitel zu lang').optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Fetch profile with settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, company_name, job_title, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Fehler beim Laden des Profils' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in profile GET:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = profileUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validated.error.issues },
        { status: 400 }
      );
    }

    // Build update object with snake_case fields
    const updateData: Record<string, unknown> = {};
    if (validated.data.first_name !== undefined) updateData.first_name = validated.data.first_name;
    if (validated.data.last_name !== undefined) updateData.last_name = validated.data.last_name;
    if (validated.data.company_name !== undefined) updateData.company_name = validated.data.company_name;
    if (validated.data.job_title !== undefined) updateData.job_title = validated.data.job_title;

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Profils' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      message: 'Profil erfolgreich aktualisiert'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in profile PATCH:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
