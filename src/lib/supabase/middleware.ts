import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard']
const adminRoutes = ['/admin', '/api/admin']
const authRoutes = ['/login', '/registrieren']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Unauthentifizierte User von geschützten Routen nach /login redirecten
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // BUG-1 FIX: Check suspended status for ALL authenticated users on protected routes
  if (user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .single()

    if (!error && profile?.is_suspended) {
      // User is suspended - redirect to suspended page
      const url = request.nextUrl.clone()
      url.pathname = '/konto-gesperrt'
      return NextResponse.redirect(url)
    }
  }

  // Admin route protection - check role for authenticated users
  if (user && adminRoutes.some((route) => pathname.startsWith(route))) {
    // Check if user has admin role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', user.id)
      .single()

    // BUG-1 FIX: Handle API routes differently (return 403 JSON, not redirect)
    const isAPIRoute = pathname.startsWith('/api/')

    if (error || !profile || profile.role !== 'admin') {
      // Non-admin user trying to access admin routes
      if (isAPIRoute) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }
      // For web routes, redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Check if admin user is suspended
    if (profile.is_suspended) {
      if (isAPIRoute) {
        return NextResponse.json(
          { error: 'Account suspended' },
          { status: 403 }
        )
      }
      const url = request.nextUrl.clone()
      url.pathname = '/login?error=suspended'
      return NextResponse.redirect(url)
    }
  }

  // Unauthentifizierte User von Admin-Routen nach /login redirecten
  if (!user && adminRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authentifizierte User von Auth-Seiten nach /dashboard redirecten
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
