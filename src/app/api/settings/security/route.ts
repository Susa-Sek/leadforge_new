// Settings Security API - Epic E13
// GET /api/settings/security - Get security settings
// POST /api/settings/password - Change password

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Password validation schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  new_password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
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

    // Fetch profile for 2FA status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Sicherheitseinstellungen' },
        { status: 500 }
      );
    }

    // Check if user has password (OAuth users might not have one)
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(user.id);

    return NextResponse.json({
      has_password: true, // Assume true for now, OAuth users can set password
      two_factor_enabled: profile?.two_factor_enabled || false,
      // Sessions not implemented in this version
      sessions: [],
    });
  } catch (error) {
    console.error('Error in security GET:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const validated = passwordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { current_password, new_password } = validated.data;

    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Aktuelles Passwort ist falsch' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Ändern des Passworts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in password POST:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
