import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // IMPORTANT: DO NOT REMOVE auth.getClaims()
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/confirm',
      '/legal/privacy',
      '/legal/terms',
      '/contact',
    ];

    const pathname = request.nextUrl.pathname;

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(route);
    });

    // Redirect unauthenticated users to login if accessing protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Optional: Redirect authenticated users away from auth pages
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return the response even if there's an error to avoid breaking the app
    return supabaseResponse;
  }
}
