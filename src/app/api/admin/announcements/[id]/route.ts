/**
 * Admin Announcement Detail API
 * PATCH /api/admin/announcements/[id] - Update announcement
 * DELETE /api/admin/announcements/[id] - Delete announcement
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdminAPI } from '@/lib/admin/middleware';
import { updateAnnouncementSchema } from '@/lib/admin/validation';
import { logAnnouncementUpdate, logAnnouncementDelete } from '@/lib/admin/audit';
import { applyRateLimit, RATE_LIMITS } from '@/lib/admin/rate-limit';

// PATCH - Update announcement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (strict - 100 req/min for updates)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const { id } = await params;

  console.log('[Admin Announcement Detail API] PATCH operation by:', admin.id);

  // Use service client to bypass RLS
  const supabase = createServiceClient();

  try {
    // Parse and validate body
    const body = await request.json();
    const validated = updateAnnouncementSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: validated.error.format() },
        { status: 400 }
      );
    }

    const updates = validated.data;

    // Get current announcement for comparison
    const { data: current, error: fetchError } = await supabase
      .from('system_announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: 'Ankündigung nicht gefunden' },
        { status: 404 }
      );
    }

    // Handle publish logic
    const updateData: Record<string, any> = { ...updates };

    if (updates.status === 'published' && current.status === 'draft') {
      updateData.published_by = admin.id;
      updateData.published_at = new Date().toISOString();
    }

    // Call update function
    const { data: success, error } = await supabase.rpc('update_announcement', {
      p_announcement_id: id,
      p_admin_id: admin.id,
      p_updates: updateData,
    });

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Ankündigung konnte nicht aktualisiert werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logAnnouncementUpdate(admin.id, id, updates);

    // Get updated announcement
    const { data: updated } = await supabase
      .from('system_announcements')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({ announcement: updated });
  } catch (err) {
    console.error('Error updating announcement:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE - Delete announcement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // BUG-2 FIX: Apply rate limiting (strict - 100 req/min for deletions)
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.STRICT);
  if (rateLimitResponse) return rateLimitResponse;

  // Check admin access
  const adminCheck = await requireAdminAPI();
  if (adminCheck.errorResponse) return adminCheck.errorResponse;

  const admin = adminCheck.user;
  const { id } = await params;

  console.log('[Admin Announcement Detail API] DELETE operation by:', admin.id);

  // Use service client to bypass RLS
  const supabase = createServiceClient();

  try {
    // Get announcement title for logging
    const { data: announcement } = await supabase
      .from('system_announcements')
      .select('title')
      .eq('id', id)
      .single();

    // Call delete function
    const { data: success, error } = await supabase.rpc('delete_announcement', {
      p_announcement_id: id,
      p_admin_id: admin.id,
    });

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen: ' + error.message },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Ankündigung konnte nicht gelöscht werden' },
        { status: 500 }
      );
    }

    // Log the action
    await logAnnouncementDelete(admin.id, id, announcement?.title || 'Unknown');

    return NextResponse.json({
      success: true,
      message: 'Ankündigung erfolgreich gelöscht',
    });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
