// Account Deletion API - Epic E13 US-30.5
// POST /api/settings/privacy/delete-account - Request account deletion (GDPR)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const deleteRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  confirmation: z.literal('DELETE'),
});

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

    // Validate request body
    const body = await request.json();
    const validated = deleteRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler. Bitte bestätigen Sie mit "DELETE".' },
        { status: 400 }
      );
    }

    const userId = user.id;
    const { reason } = validated.data;

    // Check if deletion is already requested
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Konto-Löschung bereits beantragt. Bitte kontaktieren Sie den Support.' },
        { status: 409 }
      );
    }

    // Calculate deletion date (30 days grace period per GDPR)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Create deletion request
    const { data: deletionRequest, error: insertError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        email: user.email,
        reason: reason || null,
        requested_at: new Date().toISOString(),
        scheduled_deletion_at: deletionDate.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating deletion request:', insertError);
      return NextResponse.json(
        { error: 'Fehler beim Beantragen der Konto-Löschung' },
        { status: 500 }
      );
    }

    // Update profile to mark pending deletion
    await supabase
      .from('profiles')
      .update({
        deletion_requested_at: new Date().toISOString(),
        pending_deletion_at: deletionDate.toISOString(),
      })
      .eq('id', userId);

    // TODO: Send confirmation email to user
    // TODO: Notify admin about deletion request

    return NextResponse.json({
      message: 'Konto-Löschung beantragt',
      scheduled_deletion_at: deletionDate.toISOString(),
      days_remaining: 30,
      can_cancel: true,
      request_id: deletionRequest.id,
    });
  } catch (error) {
    console.error('Error in account deletion request:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// Cancel deletion request
export async function DELETE() {
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

    const userId = user.id;

    // Find pending deletion request
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Keine ausstehende Konto-Löschung gefunden' },
        { status: 404 }
      );
    }

    // Cancel the deletion request
    await supabase
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', existingRequest.id);

    // Clear deletion flags from profile
    await supabase
      .from('profiles')
      .update({
        deletion_requested_at: null,
        pending_deletion_at: null,
      })
      .eq('id', userId);

    return NextResponse.json({
      message: 'Konto-Löschung erfolgreich storniert',
    });
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
