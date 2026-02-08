// Settings Account API - Epic E13
// GET /api/settings/account - Get account settings (regional settings)
// PUT /api/settings/account - Update account settings

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Supported values
const SUPPORTED_LANGUAGES = ['de', 'en'];
const SUPPORTED_TIMEZONES = ['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Singapore'];
const SUPPORTED_DATE_FORMATS = ['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];
const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'];

// Validation schema for account settings
const accountSettingsSchema = z.object({
  language: z.enum(['de', 'en']).optional(),
  timezone: z.string().optional(),
  date_format: z.enum(['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']).optional(),
  currency: z.enum(['EUR', 'USD', 'GBP']).optional(),
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

    // Fetch user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Einstellungen' },
        { status: 500 }
      );
    }

    // Fetch profile for plan info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, created_at, plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Fehler beim Laden des Profils' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email: profile.email,
      created_at: profile.created_at,
      plan_tier: profile.plan || 'free',
      settings: settings || {
        language: 'de',
        timezone: 'Europe/Berlin',
        date_format: 'DD.MM.YYYY',
        currency: 'EUR',
      },
    });
  } catch (error) {
    console.error('Error in account GET:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const validated = accountSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validated.error.issues },
        { status: 400 }
      );
    }

    // Ensure user_settings row exists
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_settings')
        .update({
          ...validated.data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...validated.data,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error updating settings:', result.error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Einstellungen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: result.data,
      message: 'Einstellungen erfolgreich aktualisiert'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in account PUT:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
