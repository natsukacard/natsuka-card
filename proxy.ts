import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PASSWORD = process.env.SITE_PASSWORD || 'natsuka-beta-2025';
const COOKIE_NAME = 'site-access-token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip ALL middleware for webhooks - they use Stripe signature verification instead
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  if (
    pathname === '/' ||
    pathname === '/api/verify-password' ||
    pathname === '/confirm' ||
    pathname === '/confirm-success' ||
    pathname === '/reset-password' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password'
  ) {
    return await updateSession(request);
  }

  const accessCookie = request.cookies.get(COOKIE_NAME);

  if (!accessCookie || accessCookie.value !== PROTECTED_PASSWORD) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/verify-password|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
