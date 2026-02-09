import { createServerClient } from '@supabase/ssr'

/**
 * Create a Supabase client with service role privileges.
 * This client bypasses RLS policies and should ONLY be used for admin operations.
 */
export const createServiceClient = async (cookieStore?: ReturnType<typeof import('next/headers').cookies>) => {
  const cookies = cookieStore || (await import('next/headers')).cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value
        },
      },
    }
  )
}