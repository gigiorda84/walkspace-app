import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Get token from cookie or we'll rely on client-side check
  // Since we're using localStorage for tokens, we'll let the client-side handle auth
  // This middleware can be enhanced later with cookie-based auth

  if (!isPublicRoute && pathname === '/') {
    return NextResponse.redirect(new URL('/tours', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
