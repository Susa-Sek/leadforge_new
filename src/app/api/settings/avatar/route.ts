// Settings Avatar API - Epic E13
// POST /api/settings/avatar - Upload avatar image

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ungültiges Dateiformat. Erlaubt: JPG, PNG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 2MB erlaubt' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.type === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('user-assets')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return NextResponse.json(
        { error: 'Fehler beim Hochladen des Avatars' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-assets')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Profils' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      avatar_url: publicUrl,
      message: 'Avatar erfolgreich hochgeladen'
    });
  } catch (error) {
    console.error('Error in avatar POST:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
