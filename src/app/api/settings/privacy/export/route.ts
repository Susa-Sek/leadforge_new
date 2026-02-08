// GDPR Data Export API - Epic E13 US-30.5
// GET /api/settings/privacy/export - Export all user data (GDPR compliance)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Fetch all user data across tables
    const userId = user.id;

    // Parallel data fetching
    const [
      profileResult,
      settingsResult,
      searchHistoryResult,
      collectionsResult,
      contactsResult,
      dealsResult,
      creditsResult,
      notificationsResult,
    ] = await Promise.all([
      // Profile data
      supabase.from('profiles').select('*').eq('id', userId).single(),

      // User settings
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),

      // Search history
      supabase.from('search_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // Collections
      supabase.from('collections').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // CRM Contacts
      supabase.from('contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // CRM Deals
      supabase.from('deals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // Credit transactions
      supabase.from('credit_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

      // Notifications
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    ]);

    // Build comprehensive export object
    const exportData = {
      export_metadata: {
        user_id: userId,
        email: user.email,
        exported_at: new Date().toISOString(),
        version: '1.0',
        format: 'GDPR_EXPORT',
      },

      account_data: {
        profile: profileResult.data || null,
        settings: settingsResult.data || null,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },

      activity_data: {
        search_history: searchHistoryResult.data || [],
        collections: collectionsResult.data || [],
      },

      crm_data: {
        contacts: contactsResult.data || [],
        deals: dealsResult.data || [],
      },

      billing_data: {
        credit_transactions: creditsResult.data || [],
      },

      notification_data: {
        notifications: notificationsResult.data || [],
      },
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error in GDPR export:', error);
    return NextResponse.json(
      { error: 'Fehler beim Exportieren der Daten' },
      { status: 500 }
    );
  }
}
