/**
 * Health Check API
 * GET /api/health - Test service client connection and environment
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    // Test service client connection
    const serviceClient = createServiceClient();

    // Test a simple query to verify service client works
    const { data, error } = await serviceClient
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK for this test
      console.error('[Health Check] Service client query error:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Service client query failed',
          error: error.message,
          serviceClient: 'error',
        },
        { status: 500 }
      );
    }

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    const allEnvVarsPresent = Object.values(envCheck).every((v) => v);

    return NextResponse.json({
      status: 'ok',
      message: 'Health check passed',
      serviceClient: 'connected',
      environment: allEnvVarsPresent ? 'configured' : 'missing_variables',
      envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
