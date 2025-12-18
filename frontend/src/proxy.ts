import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy to forward API requests to the backend server
 *
 * In development: Proxies /api/* to http://localhost:BACKEND_PORT/api/*
 * In production: Can use NEXT_PUBLIC_API_URL for direct client calls (bypasses proxy)
 *
 * This follows Next.js 15+ best practices for API proxying
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle API, avatars, and chore-images requests
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/avatars/') ||
    pathname.startsWith('/chore-images/')
  ) {
    let backendUrl: string;

    if (process.env.NEXT_PUBLIC_API_URL) {
      // Production mode: Use explicitly configured backend URL
      backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${pathname}${request.nextUrl.search}`;
    } else {
      // Development mode: Proxy to backend using BACKEND_PORT
      const host = request.headers.get('host') || 'localhost:3000';
      const hostname = host.split(':')[0];
      const backendPort = process.env.BACKEND_PORT || '5000';
      backendUrl = `http://${hostname}:${backendPort}${pathname}${request.nextUrl.search}`;
    }

    // Rewrite the request to the backend
    return NextResponse.rewrite(new URL(backendUrl));
  }

  // Let all other requests pass through to Next.js routing
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/avatars/:path*',
    '/chore-images/:path*',
  ],
};
