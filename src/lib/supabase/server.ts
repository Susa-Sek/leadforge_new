import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Component or Route Handler.
            // This error is typically caused by an attempt to set a cookie from a Client Component.
            // Cookies can only be set by the server, not directly by the client.
            // To set a cookie from the client, you might need a server-side API route.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Component or Route Handler.
            // This error is typically caused by an attempt to set a cookie from a Client Component.
            // Cookies can only be set by the server, not directly by the client.
            // To remove a cookie from the client, you might need a server-side API route.
          }
        },
      },
    }
  )
}
