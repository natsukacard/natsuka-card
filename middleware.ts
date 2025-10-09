import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PASSWORD = process.env.SITE_PASSWORD || 'natsuka-beta-2025';
const COOKIE_NAME = 'site-access-token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/api/verify-password') {
    return await updateSession(request);
  }

  const accessCookie = request.cookies.get(COOKIE_NAME);

  if (!accessCookie || accessCookie.value !== PROTECTED_PASSWORD) {
    return NextResponse.redirect(new URL('/?protected=true', request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/verify-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
