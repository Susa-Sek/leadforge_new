import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks/(.*) (Apify webhooks)
     * - api/stripe-webhook (Stripe webhooks)
     * - .well-known (Well-known URIs)
     * - sitemap.xml
     * - robots.txt
     * - public (public assets)
     * - logo.svg
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/apify|api/stripe-webhook|.well-known|sitemap.xml|robots.txt|public|logo.svg).*)',
    '/dashboard/:path*',
    '/login',
    '/registrieren',
    '/admin/:path*', // Added for admin route protection as per migration analysis
  ],
}
